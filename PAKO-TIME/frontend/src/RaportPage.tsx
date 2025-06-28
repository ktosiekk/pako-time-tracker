import React, { useState, useEffect } from "react";

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function RaportPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCounts, setActiveCounts] = useState<{ [cat: string]: number }>({});

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/categories`).then(res => res.json()).then(setCategories);
    fetch(`${process.env.REACT_APP_API_URL}/api/tracking/live`).then(res => res.json()).then(rows => {
      const counts: { [cat: string]: number } = {};
      for (const row of rows) {
        if (row.active) {
          counts[row.category] = (counts[row.category] || 0) + 1;
        }
      }
      setActiveCounts(counts);
    });
  }, []);

  const handleGenerate = async () => {
    setError("");
    if (!date) {
      setError("Wybierz datę");
      return;
    }
    setDownloading(true);
    try {
      const from = `${date}T00:00:00`;
      const to = `${date}T23:59:59`;
      const url = `${process.env.REACT_APP_API_URL}/api/report?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Błąd pobierania raportu");
      let text = await res.text();
      if (text.includes('total_seconds')) {
        const lines = text.split('\n');
        const header = lines[0].replace('total_seconds', 'time');
        const data = lines.slice(1).map(line => {
          const parts = line.split(',');
          if (parts.length < 8) return line;
          let seconds = Number(parts[7]);
          if (!Number.isFinite(seconds) || isNaN(seconds) || parts[7].trim() === "") seconds = 0;
          parts[7] = formatDuration(seconds);
          return parts.join(',');
        });
        text = [header, ...data].join('\n');
      }
      const blob = new Blob([text], { type: 'text/csv' });
      const a = document.createElement("a");
      a.href = window.URL.createObjectURL(blob);
      a.download = `raport_${date}.csv`;
      a.click();
    } catch (e) {
      setError("Błąd generowania raportu");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", background: "#fff", padding: 32, borderRadius: 16, boxShadow: "0 2px 12px #0002" }}>
      <h2>Generuj raport dzienny</h2>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        {categories.map(cat => (
          <div key={cat.id} style={{ position: "relative", padding: 16, fontSize: 18, borderRadius: 8, border: "1px solid #1976d2", background: "#f8faff", minWidth: 120, textAlign: "center" }}>
            {cat.name}
            {activeCounts[cat.name] > 0 && (
              <span style={{
                position: "absolute",
                right: 8,
                bottom: 8,
                background: "#1976d2",
                color: "#fff",
                borderRadius: "50%",
                fontSize: 13,
                minWidth: 22,
                minHeight: 22,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 6px"
              }}>{activeCounts[cat.name]}</span>
            )}
          </div>
        ))}
      </div>
      <div style={{ margin: "24px 0" }}>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ fontSize: 18, padding: 10, borderRadius: 8, border: "1px solid #1976d2" }} />
      </div>
      <button onClick={handleGenerate}
        style={{ padding: 12, fontSize: 17, borderRadius: 8, background: "#1976d2", color: "#fff", border: 0, minWidth: 120, marginRight: 12 }}
        disabled={downloading}
      >{downloading ? "Generowanie..." : "Pobierz CSV"}</button>
      {error && <div style={{ color: "#c00", marginTop: 18 }}>{error}</div>}
    </div>
  );
}

export default RaportPage;
