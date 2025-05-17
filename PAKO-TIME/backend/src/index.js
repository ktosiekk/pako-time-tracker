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

// --- Authentication endpoint ---
app.post('/api/auth/login', async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ detail: 'User ID required' });
  try {
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

// Start tracking (pause previous, start new)
app.post('/api/tracking/start', async (req, res) => {
  const { user_id, category_id, subcategory_id } = req.body;
  if (!user_id || !category_id || !subcategory_id) return res.status(400).json({ detail: 'Missing fields' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Pause previous active
    await client.query('UPDATE tracking SET active = FALSE, end_time = NOW() WHERE user_id = $1 AND active = TRUE', [user_id]);
    // Start new
    await client.query(
      'INSERT INTO tracking (user_id, category_id, subcategory_id, start_time, active) VALUES ($1, $2, $3, NOW(), TRUE)',
      [user_id, category_id, subcategory_id]
    );
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

// Get live tracking data
app.get('/api/tracking/live', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.id, t.user_id, u.name, u.surname, c.name as category, s.name as subcategory, t.start_time, t.end_time, t.active
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
        SUM(EXTRACT(EPOCH FROM (COALESCE(t.end_time, NOW()) - t.start_time))) as total_seconds
      FROM tracking t
      JOIN users u ON t.user_id = u.id
      JOIN categories c ON t.category_id = c.id
      JOIN subcategories s ON t.subcategory_id = s.id
      WHERE t.start_time >= $1 AND t.start_time <= $2
      GROUP BY t.user_id, u.name, u.surname, c.name, s.name
      ORDER BY t.user_id, c.name, s.name
    `, [from, to]);
    const parser = new Parser({ fields: ["user_id", "name", "surname", "category", "subcategory", "total_seconds"] });
    const csv = parser.parse(result.rows);
    res.header('Content-Type', 'text/csv');
    res.attachment('report.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ detail: 'Server error' });
  }
});

server.listen(3001, () => {
  console.log('Backend API listening on port 3001');
});
