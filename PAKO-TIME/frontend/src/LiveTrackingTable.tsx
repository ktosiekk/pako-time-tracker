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
  scanner_id?: string;
}

const LiveTrackingTable = forwardRef(function LiveTrackingTable(props, ref) {
  const [rows, setRows] = useState<TrackingRow[]>([]);
  const [filter, setFilter] = useState("");

  const fetchRows = () => {
    fetch(`${process.env.REACT_APP_API_URL}/api/tracking/live`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setRows(data);
        } else {
          setRows([]);
        }
      });
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

  // Group rows by user_id, category, subcategory
  type GroupedRow = TrackingRow & { totalSeconds: number, active: boolean, activeStart: string | null };
  const groupedObj: { [key: string]: GroupedRow } = {};
  for (const row of filtered) {
    const key = `${row.user_id}|${row.category}|${row.subcategory}|${row.scanner_id}`;
    if (!groupedObj[key]) {
      groupedObj[key] = {
        ...row,
        totalSeconds: 0,
        active: false,
        activeStart: null,
      };
    }
    // Add duration for this row
    if (row.active) {
      groupedObj[key].active = true;
      groupedObj[key].activeStart = row.start_time;
      groupedObj[key].id = row.id; // Use latest id for key
    }
    const start = new Date(row.start_time).getTime();
    const end = row.end_time ? new Date(row.end_time).getTime() : (row.active ? Date.now() : start);
    groupedObj[key].totalSeconds += Math.max(0, Math.floor((end - start) / 1000));
  }
  const grouped = Object.values(groupedObj);

  return (
    <div style={{ marginTop: 32, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <input
        type="text"
        placeholder="Filter..."
        value={filter}
        onChange={e => setFilter(e.target.value)}
        style={{ marginBottom: 20, padding: 10, width: 300, borderRadius: 8, border: "1px solid #1976d2", fontSize: 16, boxShadow: "0 1px 4px #1976d233" }}
      />
      <div style={{
        overflowX: "auto",
        background: "#fff",
        borderRadius: 18,
        boxShadow: "0 4px 24px #0002",
        padding: 32,
        minWidth: 900,
        maxWidth: 1600,
        border: "1px solid #e3e3e3"
      }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 18, textAlign: "center", letterSpacing: 0.2, color: "#222" }}>
          <thead>
            <tr style={{ background: "linear-gradient(90deg,#1976d2 60%,#2196f3 100%)", color: "#fff" }}>
              <th style={{ padding: "14px 18px", borderTopLeftRadius: 10, fontWeight: 700, letterSpacing: 1 }}>User ID</th>
              <th style={{ padding: "14px 18px", fontWeight: 700 }}>Skanner ID</th>
              <th style={{ padding: "14px 18px", fontWeight: 700 }}>Imię</th>
              <th style={{ padding: "14px 18px", fontWeight: 700 }}>Nazwisko</th>
              <th style={{ padding: "14px 18px", fontWeight: 700 }}>Kategoria</th>
              <th style={{ padding: "14px 18px", fontWeight: 700 }}>Pod-Kategoria</th>
              <th style={{ padding: "14px 18px", minWidth: 100, fontWeight: 700 }}>Czas rozpoczęcia</th>
              <th style={{ padding: "14px 18px", minWidth: 100, fontWeight: 700 }}>Czas zakończenia</th>
              <th style={{ padding: "14px 18px", minWidth: 80, borderTopRightRadius: 10, fontWeight: 700 }}>Czas</th>
            </tr>
          </thead>
          <tbody>
            {grouped.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: 40, color: "#888", fontSize: 18 }}>No records found.</td>
              </tr>
            ) : (
              grouped.map((row: any) => (
                <tr key={row.id} style={{ background: row.active ? "#e3f2fd" : "#f9f9f9", transition: "background 0.3s" }}>
                  <td style={{ padding: "12px 14px", fontWeight: 600 }}>{row.user_id}</td>
                  <td style={{ padding: "12px 14px" }}>{row.scanner_id || ""}</td>
                  <td style={{ padding: "12px 14px" }}>{row.name}</td>
                  <td style={{ padding: "12px 14px" }}>{row.surname}</td>
                  <td style={{ padding: "12px 14px" }}>{row.category}</td>
                  <td style={{ padding: "12px 14px" }}>{row.subcategory}</td>
                  <td style={{ padding: "12px 14px" }}>{formatTime(row.activeStart || row.start_time)}</td>
                  <td style={{ padding: "12px 14px" }}>{row.active ? "" : formatTime(row.end_time)}</td>
                  <td style={{ padding: "12px 14px", color: row.active ? "#1976d2" : undefined, fontWeight: row.active ? 700 : 500, fontSize: 17 }}>{row.active ? <LiveCounterAccum start={row.activeStart} baseSeconds={row.totalSeconds - Math.floor((Date.now() - new Date(row.activeStart).getTime()) / 1000)} /> : formatDuration(row.totalSeconds)}</td>
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

function LiveCounterAccum({ start, baseSeconds }: { start: string, baseSeconds: number }) {
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);
  const seconds = baseSeconds + Math.floor((now - new Date(start).getTime()) / 1000);
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

function formatTime(dateString: string | null | undefined) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const h = date.getHours().toString().padStart(2, "0");
  const m = date.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}
