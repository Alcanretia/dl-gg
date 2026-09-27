"use client";

import { useState } from "react";

type Match = {
  match_id: number;
  hero_id: number;
  player_kills: number;
  player_deaths: number;
  player_assists: number;
  last_hits: number;
  net_worth: number;
  match_duration_s: number;
  match_result: number;
  player_team: number;
  start_time: number;
};

type HeroMap = Record<number, any>;

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDate(unixTimestamp: number) {
  return new Date(unixTimestamp * 1000).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function MatchRow({ match, heroMap }: { match: Match; heroMap: HeroMap }) {
  const [expanded, setExpanded] = useState(false);
  const hero = heroMap[match.hero_id];
  const won = match.match_result === match.player_team;

  return (
    <>
      {/* desktop row — full columns */}
      <tr
        className={`match-row ${won ? "win" : "loss"} desktop-row`}
        onClick={() => setExpanded(!expanded)}>
        <td>
          <div className="match-hero">
            {hero?.images?.icon_image_small && (
              <img
                src={hero.images.icon_image_small}
                alt={hero.name}
                className="match-hero-icon"
              />
            )}
            <span>{hero?.name ?? `Hero ${match.hero_id}`}</span>
          </div>
        </td>
        <td>
          <span className={`result-badge ${won ? "win" : "loss"}`}>
            {won ? "WIN" : "LOSS"}
          </span>
        </td>
        <td className="kda">
          {match.player_kills ?? "?"}/{match.player_deaths ?? "?"}/
          {match.player_assists ?? "?"}
        </td>
        <td>{match.last_hits}</td>
        <td>{match.net_worth?.toLocaleString() ?? "—"}</td>
        <td>
          {match.match_duration_s
            ? formatDuration(match.match_duration_s)
            : "—"}
        </td>
        <td className="match-date">{formatDate(match.start_time)}</td>
      </tr>

      {/* mobile row — condensed, expandable */}
      <tr
        className={`match-row ${won ? "win" : "loss"} mobile-row`}
        onClick={() => setExpanded(!expanded)}>
        <td colSpan={7}>
          <div className="mobile-match-summary">
            {hero?.images?.icon_image_small && (
              <img
                src={hero.images.icon_image_small}
                alt={hero.name}
                className="match-hero-icon"
              />
            )}
            <span className={`result-badge ${won ? "win" : "loss"}`}>
              {won ? "WIN" : "LOSS"}
            </span>
            <span className="kda">
              {match.player_kills}/{match.player_deaths}/{match.player_assists}
            </span>
            <span className="mobile-expand-hint">{expanded ? "▲" : "▼"}</span>
          </div>

          {expanded && (
            <div className="mobile-match-details">
              <div className="mobile-detail-row">
                <span className="mobile-detail-label">Hero</span>
                <span>{hero?.name ?? `Hero ${match.hero_id}`}</span>
              </div>
              <div className="mobile-detail-row">
                <span className="mobile-detail-label">Last Hits</span>
                <span>{match.last_hits}</span>
              </div>
              <div className="mobile-detail-row">
                <span className="mobile-detail-label">Net Worth</span>
                <span>{match.net_worth?.toLocaleString() ?? "—"}</span>
              </div>
              <div className="mobile-detail-row">
                <span className="mobile-detail-label">Duration</span>
                <span>
                  {match.match_duration_s
                    ? formatDuration(match.match_duration_s)
                    : "—"}
                </span>
              </div>
              <div className="mobile-detail-row">
                <span className="mobile-detail-label">Date</span>
                <span>{formatDate(match.start_time)}</span>
              </div>
            </div>
          )}
        </td>
      </tr>
    </>
  );
}

export default function MatchTable({
  history,
  heroMap,
}: {
  history: Match[];
  heroMap: HeroMap;
}) {
  return (
    <table className="match-table">
      <thead>
        <tr>
          <th>Hero</th>
          <th>Result</th>
          <th>KDA</th>
          <th>Last Hits</th>
          <th>Net Worth</th>
          <th>Duration</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        {history.map((match) => (
          <MatchRow key={match.match_id} match={match} heroMap={heroMap} />
        ))}
      </tbody>
    </table>
  );
}
