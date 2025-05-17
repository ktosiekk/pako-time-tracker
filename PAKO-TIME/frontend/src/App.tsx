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
  const inputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
        <form onSubmit={handleLogin} style={{ background: "#fff", padding: 16, borderRadius: 8, boxShadow: "0 2px 8px #0001", minWidth: 320, display: "flex", alignItems: "center", gap: 8, justifyContent: "center", width: 340 }}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Zaloguj się"
            value={userId}
            onChange={e => setUserId(e.target.value)}
            style={{ padding: 10, fontSize: 17, borderRadius: 8, border: "1px solid #ccc", width: 240, textAlign: "center" }}
            autoFocus
            disabled={loading}
          />
          <button type="submit" style={{ padding: 10, fontSize: 17, borderRadius: 8, background: "#1976d2", color: "#fff", border: 0, minWidth: 90 }} disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        {error && <div style={{ color: "#c00", marginLeft: 12, alignSelf: "center" }}>{error}</div>}
      </div>
      {user && !tracking && (
        <>
          <h2 style={{ textAlign: "center", marginBottom: 32 }}>Witaj, {user.name} {user.surname} ({user.id})</h2>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <CategorySelector user={user} onSelect={async (cat, sub) => {
              await fetch(`${process.env.REACT_APP_API_URL}/api/tracking/start`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: user.id, category_id: cat.id, subcategory_id: sub.id })
              });
              setTracking({ cat, sub });
              // After choosing subcategory, log out and reset state
              setTracking(null);
              setUser(null);
              setUserId("");
              setError("");
              tableRef.current?.refresh();
              // Focus the input after logout
              setTimeout(() => { inputRef.current?.focus(); }, 0);
            }} />
            <button
              style={{ marginTop: 24, padding: 12, fontSize: 16, borderRadius: 8, background: "#c62828", color: "#fff", border: 0, width: 200, fontWeight: 600, boxShadow: "0 2px 8px #0002", cursor: "pointer" }}
              onClick={async () => {
                await fetch(`${process.env.REACT_APP_API_URL}/api/tracking/stop`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ user_id: user.id })
                });
                setTracking(null);
                setUser(null);
                setUserId("");
                setError("");
                tableRef.current?.refresh();
                // Focus the input after logout
                setTimeout(() => { inputRef.current?.focus(); }, 0);
              }}
            >Zakończ pracę</button>
          </div>
        </>
      )}
      <LiveTrackingTable ref={tableRef} />
    </div>
  );
}

export default App;
