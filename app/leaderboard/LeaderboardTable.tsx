"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type LeaderboardEntry = {
  position: number;
  accountId: number | null;
  name: string;
  avatar: string | null;
  topHeroes: { id: number; name: string; icon: string | null }[];
};

const REGIONS = [
  { label: "Asia", value: "Asia" },
  { label: "Europe", value: "Europe" },
  { label: "N. America", value: "NAmerica" },
  { label: "S. America", value: "SAmerica" },
  { label: "Oceania", value: "Oceania" },
];

const POSITION_COLORS: Record<number, string> = {
  1: "#f0c419",
  2: "#aaa",
  3: "#cd7f32",
};

export default function LeaderboardTable() {
  const [region, setRegion] = useState("Asia");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetch(`/api/leaderboard/${region}`)
      .then((res) => res.json())
      .then((data) => {
        setEntries(data.entries ?? []);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [region]);

  return (
    <div>
      {/* region tabs */}
      <div className="region-tabs">
        {REGIONS.map((r) => (
          <button
            key={r.value}
            className={`region-tab ${region === r.value ? "active" : ""}`}
            onClick={() => setRegion(r.value)}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading && <p className="leaderboard-status">Loading...</p>}
      {error && <p className="leaderboard-status error">Failed to load leaderboard.</p>}

      {!loading && !error && (
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Player</th>
              <th className="heroes-col">Top Heroes</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.position} className="leaderboard-row">
                <td>
                  <span
                    className="position-number"
                    style={{ color: POSITION_COLORS[entry.position] ?? "#666" }}
                  >
                    {entry.position}
                  </span>
                </td>
                <td>
                  <div className="player-cell">
                    {entry.avatar && (
                      <img src={entry.avatar} alt={entry.name} className="leaderboard-avatar" />
                    )}
                    <div className="player-cell-info">
                      {entry.accountId ? (
                        <Link href={`/players/${entry.accountId}`} className="player-link">
                          {entry.name}
                        </Link>
                      ) : (
                        <span className="player-name">{entry.name}</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="heroes-col">
                  <div className="top-heroes">
                    {entry.topHeroes.map((hero) => (
                      <Link key={hero.id} href={`/heroes/${hero.id}`}>
                        <img
                          src={hero.icon ?? ""}
                          alt={hero.name}
                          className="hero-mini-icon"
                          title={hero.name}
                        />
                      </Link>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}