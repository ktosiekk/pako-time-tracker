import React, { useState, useRef } from "react";
import "./App.css";
import CategorySelector from "./CategorySelector";
import LiveTrackingTable from "./LiveTrackingTable";

function App() {
  const [userId, setUserId] = useState("");
  const [error, setError] = useState("");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState<any>(null);
  const tableRef = useRef<any>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        setError("Invalid server response");
        setLoading(false);
        return;
      }
      if (!res.ok) {
        setError(data.detail || "Invalid user ID");
        setLoading(false);
        return;
      }
      setUser(data);
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f6fa" }}>
        <form onSubmit={handleLogin} style={{ background: "#fff", padding: 32, borderRadius: 12, boxShadow: "0 2px 16px #0001", minWidth: 320 }}>
          <h1 style={{ textAlign: "center", marginBottom: 24 }}>PAKO TIME TRACKER</h1>
          <input
            type="text"
            placeholder="Enter User ID (e.g. PAK001)"
            value={userId}
            onChange={e => setUserId(e.target.value)}
            style={{ width: "100%", padding: 10, fontSize: 16, borderRadius: 6, border: "1px solid #ccc", marginBottom: 12 }}
            autoFocus
            disabled={loading}
            onKeyDown={e => { if (e.key === "Enter") handleLogin(e as any); }}
          />
          {error && <div style={{ color: "#c00", marginBottom: 8 }}>{error}</div>}
          <button type="submit" style={{ width: "100%", padding: 10, fontSize: 16, borderRadius: 6, background: "#1976d2", color: "#fff", border: 0 }} disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ padding: 32 }}>
      {!tracking ? (
        <>
          <h2>Welcome, {user.name} {user.surname} ({user.id})</h2>
          <CategorySelector user={user} onSelect={async (cat, sub) => {
            await fetch(`${process.env.REACT_APP_API_URL}/api/tracking/start`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ user_id: user.id, category_id: cat.id, subcategory_id: sub.id })
            });
            setTracking({ cat, sub });
            tableRef.current?.refresh();
          }} />
          <button
            style={{ marginTop: 24, padding: 12, fontSize: 16, borderRadius: 8, background: "#c62828", color: "#fff", border: 0, width: 200, fontWeight: 600, boxShadow: "0 2px 8px #0002", cursor: "pointer" }}
            onClick={async () => {
              await fetch(`${process.env.REACT_APP_API_URL}/api/tracking/start`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: user.id, category_id: null, subcategory_id: null })
              });
              setTracking(null);
              tableRef.current?.refresh();
            }}
          >Zakończ pracę</button>
        </>
      ) : (
        <>
          <h2>Tracking: {tracking.cat.name} / {tracking.sub.name}</h2>
        </>
      )}
      <LiveTrackingTable ref={tableRef} />
    </div>
  );
}

export default App;
