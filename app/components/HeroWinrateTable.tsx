"use client";

import "./heroWinrateTable.css";
import { useEffect, useState } from "react";
import Link from "next/link";

type Hero = {
  id: string;
  name: string;
  icon: string | null;
  winRate: number;
  pickRate: number;
  matches: number;
};

type SortKey = "winRate" | "pickRate" | "matches" | "name";

export default function HeroWinrateTable() {
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("winRate");
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    fetch("/api/heroes/winrates")
      .then((res) => res.json())
      .then((data) => {
        setHeroes(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortAsc(!sortAsc); // clicking same column flips direction
    } else {
      setSortKey(key);
      setSortAsc(false); // new column defaults to descending (highest first)
    }
  }

  const sortedHeroes = [...heroes].sort((a, b) => {
    const dir = sortAsc ? 1 : -1;
    if (sortKey === "name") return a.name.localeCompare(b.name) * dir;
    return (a[sortKey] - b[sortKey]) * dir;
  });

  if (loading) return <p className="status-text">Loading...</p>;

  const columns: { key: SortKey; label: string }[] = [
    { key: "name", label: "Hero" },
    { key: "winRate", label: "Win Rate" },
    { key: "pickRate", label: "Pick Rate" },
    { key: "matches", label: "Matches" },
  ];

  return (
    <table className="hero-table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key} onClick={() => handleSort(col.key)}>
              {col.label}
              {sortKey === col.key && (sortAsc ? " ▲" : " ▼")}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sortedHeroes.map((h) => (
          <tr key={h.id} className="clickable-row">
            <td>
              <Link href={`/heroes/${h.id}`}>
                <div className="hero-name-cell">
                  {h.icon && (
                    <img src={h.icon} alt={h.name} className="hero-icon" />
                  )}
                  {h.name}
                </div>
              </Link>
            </td>
            <td>{(h.winRate * 100).toFixed(1)}%</td>
            <td>{(h.pickRate * 100).toFixed(1)}%</td>
            <td>{h.matches.toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
