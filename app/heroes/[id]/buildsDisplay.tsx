"use client";

import { useState } from "react";
import { BuildItem } from "@/app/lib/getHeroBuilds";
import BuildTimingChart from "./BuildTimingChart";

type SortKey = "matches" | "winRate" | "score";

const TIER_LABELS: Record<number, string> = {
  1: "800 Souls",
  2: "1,600 Souls",
  3: "3,200 Souls",
  4: "6,400 Souls",
};

const TIER_SLOTS: Record<number, number> = {
  1: 8,
  2: 8,
  3: 16,
  4: 16,
};

const TYPE_COLORS: Record<string, string> = {
  weapon: "#f5a623",
  vitality: "#7ed321",
  spirit: "#9b59b6",
};

function calcScore(item: BuildItem, maxMatchesInTier: number): number {
  // wilson score: smooths out low sample sizes
  const wilsonWR = (item.winRate * item.matches + 1) / (item.matches + 2);
  // normalized pick rate: 0-1 relative to most picked item in same tier
  const normalizedPick =
    maxMatchesInTier > 0 ? item.matches / maxMatchesInTier : 0;
  return wilsonWR * 0.6 + normalizedPick * 0.4;
}

function ItemCard({ item }: { item: BuildItem }) {
  const winPct = (item.winRate * 100).toFixed(1);
  const color = TYPE_COLORS[item.type] ?? "#aaa";

  return (
    <div className="item-card" style={{ borderTop: `3px solid ${color}` }}>
      {item.image && (
        <img src={item.image} alt={item.name} className="item-icon" />
      )}
      <div className="item-name">{item.name}</div>
      <div className="item-stat">{winPct}% WR</div>
      <div className="item-stat">{item.matches.toLocaleString()} picks</div>
      <div className="item-timing">
        Avg buy: {item.avgBuyTimeRelative.toFixed(0)}% into game
      </div>
    </div>
  );
}

function TierRow({
  tier,
  items,
  sortKey,
  filterType,
}: {
  tier: number;
  items: BuildItem[];
  sortKey: SortKey;
  filterType: string;
}) {
  const slotCount = TIER_SLOTS[tier];

  const filtered =
    filterType === "all" ? items : items.filter((i) => i.type === filterType);

  const maxMatches = Math.max(...items.map((i) => i.matches), 1);

  const sorted = [...filtered]
    .sort((a, b) => {
      if (sortKey === "score")
        return calcScore(b, maxMatches) - calcScore(a, maxMatches);
      return b[sortKey] - a[sortKey];
    })
    .slice(0, slotCount);

  if (sorted.length === 0) {
    return (
      <div className="tier-row">
        <div className="tier-label">
          <span className="tier-cost">{TIER_LABELS[tier]}</span>
          <span className="tier-count">Tier {tier}</span>
        </div>
        <p style={{ color: "#666", padding: "0.5rem" }}>No items found.</p>
      </div>
    );
  }

  return (
    <div className="tier-row">
      <div className="tier-label">
        <span className="tier-cost">{TIER_LABELS[tier]}</span>
        <span className="tier-count">Tier {tier}</span>
      </div>
      <div className="tier-items">
        {sorted.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

export default function BuildsDisplay({
  byTier,
}: {
  byTier: Record<number, BuildItem[]>;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [filterType, setFilterType] = useState<string>("all");

  return (
    <div>
      <BuildTimingChart byTier={byTier} />
      <div className="sort-controls">
        <span className="sort-label">Sort by:</span>
        <button
          className={`sort-btn ${sortKey === "score" ? "active" : ""}`}
          onClick={() => setSortKey("score")}>
          Best Overall ★
        </button>
        <button
          className={`sort-btn ${sortKey === "matches" ? "active" : ""}`}
          onClick={() => setSortKey("matches")}>
          Pick Rate
        </button>
        <button
          className={`sort-btn ${sortKey === "winRate" ? "active" : ""}`}
          onClick={() => setSortKey("winRate")}>
          Win Rate
        </button>

        <span className="sort-label" style={{ marginLeft: "1rem" }}>
          Type:
        </span>
        <select
          className="type-filter"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}>
          <option value="all">All</option>
          <option value="weapon">Weapon</option>
          <option value="vitality">Vitality</option>
          <option value="spirit">Spirit</option>
        </select>
      </div>
      <div className="tiers">
        {[1, 2, 3, 4].map((tier) => (
          <TierRow
            key={tier}
            tier={tier}
            items={byTier[tier]}
            sortKey={sortKey}
            filterType={filterType}
          />
        ))}
      </div>
    </div>
  );
}
