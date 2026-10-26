"use client";

import "./heroWinrateTable.css";
import { useEffect, useState } from "react";
import Link from "next/link";
import Spinner from "./spinner";

type Hero = {
  id: string;
  name: string;
  icon: string | null;
  winRate: number;
  pickRate: number;
  matches: number;
  tier?: string;
  score?: number;
};

const RANKS = [
  { label: "All Ranks",   minBadge: 0   },
  { label: "Seeker+",     minBadge: 21  },
  { label: "Acolyte+",    minBadge: 31  },
  { label: "Sentinel+",   minBadge: 41  },
  { label: "Mystic+",     minBadge: 51  },
  { label: "Ritualist+",  minBadge: 61  },
  { label: "Emissary+",   minBadge: 71  },
  { label: "Oracle+",     minBadge: 81  },
  { label: "Phantom+",    minBadge: 91  },
  { label: "Ascendant+",  minBadge: 101 },
  { label: "Eternus",     minBadge: 111 },
];

const TIER_COLORS: Record<string, string> = {
  S: "#f0c419",
  A: "#7ed321",
  B: "#4a90d9",
  C: "#aaaaaa",
  D: "#e67e22",
  F: "#e74c3c",
};

function calcTierZScore(heroes: Hero[]): Hero[] {
  if (heroes.length === 0) return heroes;

  // step 1 — smoothed win rate for each hero
  const adjusted = heroes.map((h) => ({
    ...h,
    adjustedWR: (h.winRate * h.matches + 1) / (h.matches + 2),
  }));

  // step 2 — averages
  const avgWR =
    adjusted.reduce((s, h) => s + h.adjustedWR, 0) / adjusted.length;
  const avgPR = adjusted.reduce((s, h) => s + h.pickRate, 0) / adjusted.length;

  // step 3 — standard deviations
  const stdWR = Math.sqrt(
    adjusted.reduce((s, h) => s + Math.pow(h.adjustedWR - avgWR, 2), 0) /
      adjusted.length,
  );
  const stdPR = Math.sqrt(
    adjusted.reduce((s, h) => s + Math.pow(h.pickRate - avgPR, 2), 0) /
      adjusted.length,
  );

  // step 4 — score and assign tier
  return adjusted.map((h) => {
    const wrZ = stdWR > 0 ? (h.adjustedWR - avgWR) / stdWR : 0;
    const prZ = stdPR > 0 ? (h.pickRate - avgPR) / stdPR : 0;
    const score = wrZ * 0.7 + prZ * 0.3;

    const tier =
      score >= 2.0
        ? "S"
        : score >= 1.0
          ? "A"
          : score >= 0.0
            ? "B"
            : score >= -1.0
              ? "C"
              : score >= -2.0
                ? "D"
                : "F";

    return { ...h, score, tier };
  });
}

function calcTierFixedThreshold(heroes: Hero[]): Hero[] {
  if (heroes.length === 0) return heroes;

  // step 1 — smoothed win rate
  const adjusted = heroes.map((h) => ({
    ...h,
    adjustedWR: (h.winRate * h.matches + 1) / (h.matches + 2),
  }));

  // step 2 — averages
  const avgWR =
    adjusted.reduce((s, h) => s + h.adjustedWR, 0) / adjusted.length;
  const avgPR = adjusted.reduce((s, h) => s + h.pickRate, 0) / adjusted.length;

  // step 3 — standard deviations
  const stdWR = Math.sqrt(
    adjusted.reduce((s, h) => s + Math.pow(h.adjustedWR - avgWR, 2), 0) /
      adjusted.length,
  );
  const stdPR = Math.sqrt(
    adjusted.reduce((s, h) => s + Math.pow(h.pickRate - avgPR, 2), 0) /
      adjusted.length,
  );

  // step 4 — compute scores
  const scored = adjusted.map((h) => {
    const wrZ = stdWR > 0 ? (h.adjustedWR - avgWR) / stdWR : 0;
    const prZ = stdPR > 0 ? (h.pickRate - avgPR) / stdPR : 0;
    return { ...h, score: wrZ * 0.7 + prZ * 0.3 };
  });

  // step 5 — percentile-based tier assignment
  const sortedScores = [...scored].map((h) => h.score).sort((a, b) => a - b);
  const total = sortedScores.length;

  function percentileCutoff(pct: number): number {
    return sortedScores[Math.floor(pct * total)] ?? sortedScores[total - 1];
  }

  // tiers: S=top 5%, A=next 15%, B=next 30%, C=next 30%, D=next 15%, F=bottom 5%
  const cutoffs = {
    S: percentileCutoff(0.95),
    A: percentileCutoff(0.8),
    B: percentileCutoff(0.5),
    C: percentileCutoff(0.2),
    D: percentileCutoff(0.05),
  };

  return scored.map((h) => ({
    ...h,
    tier:
      h.score >= cutoffs.S
        ? "S"
        : h.score >= cutoffs.A
          ? "A"
          : h.score >= cutoffs.B
            ? "B"
            : h.score >= cutoffs.C
              ? "C"
              : h.score >= cutoffs.D
                ? "D"
                : "F",
  }));
}

type SortKey = "winRate" | "pickRate" | "matches" | "name" | "score";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "name", label: "Hero" },
  { key: "score", label: "Tier" },
  { key: "winRate", label: "Win Rate" },
  { key: "pickRate", label: "Pick Rate" },
  { key: "matches", label: "Matches" },
];

export default function HeroWinrateTable() {
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortAsc, setSortAsc] = useState(false);
  const [search, setSearch] = useState("");
  const [minBadge, setMinBadge] = useState(0);

  useEffect(() => {
    let cancelled = false; // set to true when this request becomes stale
    setLoading(true);
    setError(false);

    fetch(`/api/heroes/winrates${minBadge > 0 ? `?minBadge=${minBadge}` : ""}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setHeroes(calcTierFixedThreshold(data));
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true; // cleanup runs when minBadge changes
    };
  }, [minBadge]);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  }

  const sortedHeroes = [...heroes].sort((a, b) => {
    const dir = sortAsc ? 1 : -1;
    if (sortKey === "name") return a.name.localeCompare(b.name) * dir;
    return ((a[sortKey] as number) - (b[sortKey] as number)) * dir;
  });

  const filteredHeroes = sortedHeroes.filter((h) =>
    h.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="hero-table-wrapper">
      {/* Controls stay mounted while loading so the dropdown never disappears */}
      <div className="table-controls">
        <select
          className="rank-filter"
          value={minBadge}
          onChange={(e) => setMinBadge(Number(e.target.value))}>
          {RANKS.map((r) => (
            <option key={r.minBadge} value={r.minBadge}>
              {r.label}
            </option>
          ))}
        </select>

        <input
          className="hero-search-bar"
          type="text"
          placeholder="Search hero..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && heroes.length === 0 ? (
        <Spinner label="Loading tier list..." />
      ) : error ? (
        <p className="status-text">
          Failed to load hero data. Try another rank or refresh the page.
        </p>
      ) : (
        <table
          className="hero-table"
          style={{
            opacity: loading ? 0.5 : 1,
            pointerEvents: loading ? "none" : "auto",
            transition: "opacity 0.15s",
          }}>
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th key={col.key} onClick={() => handleSort(col.key)}>
                  {col.label}
                  {sortKey === col.key && (sortAsc ? " ▲" : " ▼")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredHeroes.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="no-results">
                  No heroes found matching &quot;{search}&quot;
                </td>
              </tr>
            ) : (
              filteredHeroes.map((h) => (
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
                  <td>
                    <span
                      className="tier-badge"
                      style={{ color: TIER_COLORS[h.tier ?? "F"] }}>
                      {h.tier ?? "F"}
                    </span>
                  </td>
                  <td>{(h.winRate * 100).toFixed(1)}%</td>
                  <td>{(h.pickRate * 100).toFixed(1)}%</td>
                  <td>{h.matches.toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}