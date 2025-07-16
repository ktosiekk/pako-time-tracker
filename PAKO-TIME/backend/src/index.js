const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { Pool } = require('pg');
const { Parser } = require('json2csv');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Purge rows older than 10 days every night at 03:00 UTC
function schedulePurgeOldTracking() {
  const now = new Date();
  const next3am = new Date(now);
  next3am.setUTCHours(3, 0, 0, 0);
  if (next3am < now) next3am.setUTCDate(next3am.getUTCDate() + 1);
  const msUntil3am = next3am - now;
  setTimeout(() => {
    setInterval(async () => {
      try {
        await pool.query("DELETE FROM tracking WHERE start_time < NOW() - INTERVAL '10 days'");
        console.log('Purged tracking records older than 10 days');
      } catch (err) {
        console.error('Error purging old tracking records:', err);
      }
    }, 24 * 60 * 60 * 1000);
    // Run once at first 3am
    pool.query("DELETE FROM tracking WHERE start_time < NOW() - INTERVAL '10 days'")
      .then(() => console.log('Purged tracking records older than 10 days'))
      .catch(err => console.error('Error purging old tracking records:', err));
  }, msUntil3am);
}
schedulePurgeOldTracking();

// Clear tracking table every day at 02:00 am, but archive to tracking_archive first
const scheduleClearTrackingTable = () => {
  const now = new Date();
  const next2am = new Date(now);
  next2am.setHours(2, 0, 0, 0);
  if (next2am < now) next2am.setDate(next2am.getDate() + 1);
  const msUntil2am = next2am - now;
  setTimeout(() => {
    setInterval(async () => {
      try {
        // Create archive table if not exists
        await pool.query(`CREATE TABLE IF NOT EXISTS tracking_archive AS TABLE tracking WITH NO DATA`);
        // Copy all tracking rows to archive
        await pool.query(`INSERT INTO tracking_archive SELECT * FROM tracking`);
        // Delete all from tracking
        await pool.query(`DELETE FROM tracking`);
        console.log('Tracking table cleared and archived at 02:00');
        io.emit('tracking_update');
      } catch (err) {
        console.error('Error archiving/clearing tracking table:', err);
      }
    }, 24 * 60 * 60 * 1000);
    // Run once at first 2am
    (async () => {
      try {
        await pool.query(`CREATE TABLE IF NOT EXISTS tracking_archive AS TABLE tracking WITH NO DATA`);
        await pool.query(`INSERT INTO tracking_archive SELECT * FROM tracking`);
        await pool.query(`DELETE FROM tracking`);
        console.log('Tracking table cleared and archived at 02:00');
        io.emit('tracking_update');
      } catch (err) {
        console.error('Error archiving/clearing tracking table:', err);
      }
    })();
  }, msUntil2am);
};
scheduleClearTrackingTable();

// --- Authentication endpoint ---
app.post('/api/auth/login', async (req, res) => {
  const { user_id, scanner_id } = req.body;
  if (!user_id || !scanner_id) return res.status(400).json({ detail: 'User ID and Skanner ID required' });
  try {
    // Check if scanner is already assigned to an active user
    const activeScanner = await pool.query('SELECT * FROM tracking WHERE scanner_id = $1 AND active = TRUE', [scanner_id]);
    if (activeScanner.rows.length > 0) {
      // If the scanner is assigned to a different user, block login
      if (activeScanner.rows[0].user_id !== user_id) {
        return res.status(409).json({ detail: 'Skaner juz przypisany' });
      }
      // If the scanner is assigned to the same user, allow login
    }
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [user_id]);
    if (result.rows.length === 0) return res.status(401).json({ detail: 'Invalid user_id' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ detail: 'Server error' });
  }
});

// Get all categories
app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ detail: 'Server error' });
  }
});

// Get subcategories for a category
app.get('/api/categories/:id/subcategories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM subcategories WHERE category_id = $1 ORDER BY id', [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ detail: 'Server error' });
  }
});

// Start tracking (pause previous, start new or resume paused)
app.post('/api/tracking/start', async (req, res) => {
  const { user_id, category_id, subcategory_id, scanner_id } = req.body;
  if (!user_id || !category_id || !subcategory_id || !scanner_id) return res.status(400).json({ detail: 'Missing fields' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Pause previous active
    await client.query('UPDATE tracking SET active = FALSE, end_time = NOW() WHERE user_id = $1 AND active = TRUE', [user_id]);
    // Check if scanner is already assigned to an active user
    const activeScanner = await client.query('SELECT * FROM tracking WHERE scanner_id = $1 AND active = TRUE', [scanner_id]);
    if (activeScanner.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ detail: 'Skaner juz przypisany' });
    }
    // Try to resume a paused session for this user/category/subcategory/scanner
    const resumeResult = await client.query(
      `SELECT id FROM tracking WHERE user_id = $1 AND category_id = $2 AND subcategory_id = $3 AND scanner_id = $4 AND active = FALSE AND end_time IS NOT NULL ORDER BY end_time DESC LIMIT 1`,
      [user_id, category_id, subcategory_id, scanner_id]
    );
    if (resumeResult.rows.length > 0) {
      // Resume only if all match (user, category, subcategory, scanner)
      // Instead of resuming, start a new row for this period (timer continues)
      await client.query(
        'INSERT INTO tracking (user_id, category_id, subcategory_id, start_time, active, scanner_id) VALUES ($1, $2, $3, NOW(), TRUE, $4)',
        [user_id, category_id, subcategory_id, scanner_id]
      );
    } else {
      // Start new (timer resets)
      await client.query(
        'INSERT INTO tracking (user_id, category_id, subcategory_id, start_time, active, scanner_id) VALUES ($1, $2, $3, NOW(), TRUE, $4)',
        [user_id, category_id, subcategory_id, scanner_id]
      );
    }
    await client.query('COMMIT');
    io.emit('tracking_update'); // Notify all clients
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ detail: 'Server error' });
  } finally {
    client.release();
  }
});

// Stop current tracking for a user
app.post('/api/tracking/stop', async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ detail: 'User ID required' });
  try {
    await pool.query('UPDATE tracking SET active = FALSE, end_time = NOW() WHERE user_id = $1 AND active = TRUE', [user_id]);
    io.emit('tracking_update');
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ detail: 'Server error' });
  }
});

// Get live tracking data
app.get('/api/tracking/live', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.id, t.user_id, u.name, u.surname, c.name as category, s.name as subcategory, t.start_time, t.end_time, t.active, t.scanner_id
      FROM tracking t
      JOIN users u ON t.user_id = u.id
      JOIN categories c ON t.category_id = c.id
      JOIN subcategories s ON t.subcategory_id = s.id
      WHERE t.start_time > NOW() - INTERVAL '10 days'
      ORDER BY t.active DESC, t.start_time DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ detail: 'Server error' });
  }
});

// Report endpoint
app.get('/api/report', async (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) return res.status(400).json({ detail: 'Missing from/to' });
  try {
    const result = await pool.query(`
      SELECT t.user_id, u.name, u.surname, c.name as category, s.name as subcategory,
        TO_CHAR(t.start_time, 'HH24:MI') as start_time,
        TO_CHAR(t.end_time, 'HH24:MI') as end_time,
        EXTRACT(EPOCH FROM (t.end_time - t.start_time)) as total_seconds
      FROM tracking t
      JOIN users u ON t.user_id = u.id
      JOIN categories c ON t.category_id = c.id
      JOIN subcategories s ON t.subcategory_id = s.id
      WHERE t.start_time >= $1 AND t.start_time <= $2
        AND t.end_time IS NOT NULL AND t.end_time >= $1 AND t.end_time <= $2
      ORDER BY t.user_id, c.name, s.name, t.start_time
    `, [from, to]);
    // CSV
    const parser = new Parser({ fields: ["user_id", "name", "surname", "category", "subcategory", "start_time", "end_time", "time"] });
    let csv = parser.parse(result.rows);
    // Add UTF-8 BOM for Excel compatibility
    csv = '\uFEFF' + csv;
    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.attachment('report.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ detail: 'Server error' });
  }
});

server.listen(3001, () => {
  console.log('Backend API listening on port 3001');
});
