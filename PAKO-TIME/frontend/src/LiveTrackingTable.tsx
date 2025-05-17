import React, { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { socket } from "./socket";

interface TrackingRow {
  id: number;
  user_id: string;
  name: string;
  surname: string;
  category: string;
  subcategory: string;
  start_time: string;
  end_time: string | null;
  active: boolean;
}

const LiveTrackingTable = forwardRef(function LiveTrackingTable(props, ref) {
  const [rows, setRows] = useState<TrackingRow[]>([]);
  const [filter, setFilter] = useState("");

  const fetchRows = () => {
    fetch(`${process.env.REACT_APP_API_URL}/api/tracking/live`)
      .then(res => res.json())
      .then(setRows);
  };

  useImperativeHandle(ref, () => ({
    refresh: fetchRows
  }));

  useEffect(() => {
    fetchRows();
    socket.on("tracking_update", fetchRows);
    return () => { socket.off("tracking_update", fetchRows); };
  }, []);

  const filtered = rows.filter(row =>
    Object.values(row).some(val =>
      String(val).toLowerCase().includes(filter.toLowerCase())
    )
  );

  return (
    <div style={{ marginTop: 32, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <input
        type="text"
        placeholder="Filter..."
        value={filter}
        onChange={e => setFilter(e.target.value)}
        style={{ marginBottom: 20, padding: 10, width: 240, borderRadius: 8, border: "1px solid #1976d2", fontSize: 16 }}
      />
      <div style={{ overflowX: "auto", background: "#fff", borderRadius: 12, boxShadow: "0 2px 16px #0001", padding: 24, minWidth: 700 }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 17, textAlign: "center" }}>
          <thead>
            <tr style={{ background: "#1976d2", color: "#fff" }}>
              <th style={{ padding: "12px 16px", borderTopLeftRadius: 8 }}>User ID</th>
              <th style={{ padding: "12px 16px" }}>Name</th>
              <th style={{ padding: "12px 16px" }}>Surname</th>
              <th style={{ padding: "12px 16px" }}>Category</th>
              <th style={{ padding: "12px 16px" }}>Sub-Category</th>
              <th style={{ padding: "12px 16px", borderTopRightRadius: 8 }}>Time Spent</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 32, color: "#888" }}>No records found.</td>
              </tr>
            ) : (
              filtered.map(row => (
                <tr key={row.id} style={{ background: row.active ? "#e3f2fd" : "#f9f9f9" }}>
                  <td style={{ padding: "10px 12px", fontWeight: 500 }}>{row.user_id}</td>
                  <td style={{ padding: "10px 12px" }}>{row.name}</td>
                  <td style={{ padding: "10px 12px" }}>{row.surname}</td>
                  <td style={{ padding: "10px 12px" }}>{row.category}</td>
                  <td style={{ padding: "10px 12px" }}>{row.subcategory}</td>
                  <td style={{ padding: "10px 12px", color: row.active ? "#1976d2" : undefined, fontWeight: row.active ? 600 : undefined }}>{row.active ? <LiveCounter start={row.start_time} /> : <Duration start={row.start_time} end={row.end_time} />}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});

export default LiveTrackingTable;

function LiveCounter({ start }: { start: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);
  const seconds = Math.floor((now - new Date(start).getTime()) / 1000);
  return <span>{formatDuration(seconds)}</span>;
}

function Duration({ start, end }: { start: string; end: string | null }) {
  const seconds = end ? Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 1000) : 0;
  return <span>{formatDuration(seconds)}</span>;
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
