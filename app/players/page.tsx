"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import "./players.css";

type PlayerResult = {
  account_id: number;
  personaname: string;
  avatar: string;
  matches_played_last_30d: number;
};

export default function PlayersPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlayerResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // debounced search — waits 300ms after user stops typing
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/players/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
        setShowDropdown(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [query]);

  function handleSelect(accountId: number) {
    setShowDropdown(false);
    router.push(`/players/${accountId}`);
  }

  function handleSearch() {
    const trimmed = query.trim();
    if (!trimmed) return;
    // if it looks like a numeric Steam ID, go directly
    if (/^\d+$/.test(trimmed)) {
      router.push(`/players/${trimmed}`);
    } else if (results.length > 0) {
      // otherwise navigate to first result
      handleSelect(results[0].account_id);
    }
  }

  return (
    <main className="players-search-page">
      <h1>Player Lookup</h1>
      <p className="search-subtitle">
        Search by Steam username or enter a Steam ID
      </p>
      <div className="search-wrapper" ref={containerRef}>
        <div className="search-box">
          <input
            className="search-input"
            type="text"
            placeholder="Username or Steam ID..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            onFocus={() => results.length > 0 && setShowDropdown(true)}
            autoComplete="off"
          />
          <button className="search-btn" onClick={handleSearch}>
            {loading ? "..." : "Search"}
          </button>
        </div>

        {showDropdown && results.length > 0 && (
          <div className="search-dropdown">
            {results.map((player) => (
              <div
                key={player.account_id}
                className="search-result"
                onClick={() => handleSelect(player.account_id)}
              >
                {player.avatar && (
                  <img
                    src={player.avatar}
                    alt={player.personaname}
                    className="result-avatar"
                  />
                )}
                <div className="result-info">
                  <div className="result-name">{player.personaname}</div>
                  <div className="result-sub">
                    {player.matches_played_last_30d > 0
                      ? `${player.matches_played_last_30d} matches last 30 days`
                      : "No recent matches"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showDropdown && results.length === 0 && !loading && query.length >= 2 && (
          <div className="search-dropdown">
            <div className="search-no-results">
              No players found for "{query}"
              <p className="search-no-results-hint">
                Try searching by Steam ID instead, or this player may not be tracked yet.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}