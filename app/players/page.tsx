"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import "./players.css";

export default function PlayersPage() {
  const [steamId, setSteamId] = useState("");
  const router = useRouter();

  function handleSearch() {
    const trimmed = steamId.trim();
    if (!trimmed) return;
    router.push(`/players/${trimmed}`);
  }

  return (
    <main className="players-search-page">
      <h1>Player Lookup</h1>
      <p className="search-subtitle">Enter your Steam ID to view match history</p>
      <div className="search-box">
        <input
          className="search-input"
          type="text"
          placeholder="Steam ID (e.g. 76561198000000000)"
          value={steamId}
          onChange={(e) => setSteamId(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <button className="search-btn" onClick={handleSearch}>
          Search
        </button>
      </div>
    </main>
  );
}