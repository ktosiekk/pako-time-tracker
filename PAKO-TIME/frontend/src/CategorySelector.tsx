import React, { useState, useEffect } from "react";

interface Category {
  id: number;
  name: string;
}

interface Subcategory {
  id: number;
  name: string;
  category_id: number;
}

export default function CategorySelector({ user, onSelect }: { user: any; onSelect: (cat: Category, sub: Subcategory) => void }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeCounts, setActiveCounts] = useState<{ [catId: number]: number }>({});

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/categories`)
      .then(res => res.json())
      .then(setCategories);
  }, []);

  // Fetch active jobs per category, update on mount and when returning to category selection
  useEffect(() => {
    if (!selectedCat) {
      fetch(`${process.env.REACT_APP_API_URL}/api/tracking/live`)
        .then(res => res.json())
        .then((rows) => {
          const counts: { [catId: number]: number } = {};
          for (const row of rows) {
            if (row.active) {
              // Find category by name (row.category)
              const cat = categories.find(c => c.name === row.category);
              if (cat) {
                counts[cat.id] = (counts[cat.id] || 0) + 1;
              }
            }
          }
          setActiveCounts(counts);
        });
    }
  }, [selectedCat, categories]);

  useEffect(() => {
    if (selectedCat) {
      fetch(`${process.env.REACT_APP_API_URL}/api/categories/${selectedCat.id}/subcategories`)
        .then(res => res.json())
        .then(setSubcategories);
    }
  }, [selectedCat]);

  if (!selectedCat) {
    return (
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", margin: "32px 0" }}>
        {categories.map(cat => (
          <button key={cat.id} style={{ position: "relative", padding: 20, fontSize: 18, borderRadius: 8, border: "1px solid #1976d2", background: "#fff", cursor: "pointer" }} onClick={() => setSelectedCat(cat)}>
            {cat.name}
            {activeCounts[cat.id] > 0 && (
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
              }}>{activeCounts[cat.id]}</span>
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "32px 0" }}>
      <h3>{selectedCat.name} - Select Subcategory</h3>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {subcategories.map(sub => (
          <button key={sub.id} style={{ padding: 16, fontSize: 16, borderRadius: 8, border: "1px solid #1976d2", background: "#f0f7ff", cursor: "pointer" }}
            onClick={() => onSelect(selectedCat, sub)} disabled={loading}>
            {sub.name}
          </button>
        ))}
      </div>
      <button style={{ marginTop: 24 }} onClick={() => setSelectedCat(null)}>Powrót do kategorii</button>
    </div>
  );
}
