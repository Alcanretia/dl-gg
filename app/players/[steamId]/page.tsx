import "./playerPage.css";
import MatchTable from "./MatchTable";
import { parseRank } from "@/app/lib/ranks";
import Link from "next/link";

type HeroLite = {
  id: number;
  name: string;
  images: { icon_image_small?: string };
};

// The full heroes response is ~2.5MB, over Next's 2MB fetch-cache limit,
// so we cache a trimmed copy in memory ourselves.
let heroCache: { data: Map<number, HeroLite>; expires: number } | null = null;

async function getHeroLiteMap(): Promise<Map<number, HeroLite>> {
  if (heroCache && heroCache.expires > Date.now()) return heroCache.data;

  const res = await fetch("https://api.deadlock-api.com/v1/assets/heroes", {
    cache: "no-store", // skip Next's cache; we handle caching here
  });

  // if upstream fails, fall back to stale data rather than breaking the page
  if (!res.ok) return heroCache?.data ?? new Map();

  const heroes = await res.json();
  const map = new Map<number, HeroLite>();
  for (const hero of heroes) {
    map.set(hero.id, {
      id: hero.id,
      name: hero.name,
      images: { icon_image_small: hero.images?.icon_image_small },
    });
  }

  heroCache = { data: map, expires: Date.now() + 60 * 60 * 1000 };
  return map;
}

async function getPlayerData(steamId: string) {
  const [historyRes, allHeroes, profileRes, rankRes] = await Promise.all([
    fetch(`https://api.deadlock-api.com/v1/players/${steamId}/match-history`, {
      next: { revalidate: 120 },
    }),
    getHeroLiteMap(),
    fetch(
      `https://api.deadlock-api.com/v1/players/steam?account_ids=${steamId}`,
      { next: { revalidate: 300 } },
    ),
    fetch(`https://api.deadlock-api.com/v1/players/${steamId}/rank`, {
      next: { revalidate: 300 },
    }),
  ]);

  if (!historyRes.ok) return null;

  const history = (await historyRes.json()).filter(
    (m: any) =>
      m.match_id != null && m.hero_id != null && m.match_duration_s != null,
  );

  // only send the heroes this player actually used to the client
  const usedIds = new Set<number>(history.map((m: any) => m.hero_id));
  const heroMap = new Map<number, HeroLite>();
  for (const id of usedIds) {
    const hero = allHeroes.get(id);
    if (hero) heroMap.set(id, hero);
  }

  const profileArr = profileRes.ok ? await profileRes.json() : [];
  const profile = profileArr[0] ?? null;
  const rankData = rankRes.ok ? await rankRes.json() : null;
  const rank = parseRank(rankData);

  return { history, heroMap, profile, rank };
}

function calcSummaryStats(history: any[]) {
  const total = history.length;

  // avoid NaN everywhere when there are no matches
  if (total === 0) {
    return {
      total: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      avgKills: "0.0",
      avgDeaths: "0.0",
      avgAssists: "0.0",
      mostPlayedId: -1,
      mostPlayedCount: 0,
    };
  }

  const wins = history.filter((m) => m.match_result === m.player_team).length;

  // find most played hero
  const heroCounts: Record<number, number> = {};
  for (const m of history) {
    heroCounts[m.hero_id] = (heroCounts[m.hero_id] ?? 0) + 1;
  }
  const mostPlayedId = Number(
    Object.entries(heroCounts).sort((a, b) => b[1] - a[1])[0]?.[0],
  );

  const totalKills = history.reduce((s, m) => s + m.player_kills, 0);
  const totalDeaths = history.reduce((s, m) => s + m.player_deaths, 0);
  const totalAssists = history.reduce((s, m) => s + m.player_assists, 0);

  return {
    total,
    wins,
    losses: total - wins,
    winRate: (wins / total) * 100,
    avgKills: (totalKills / total).toFixed(1),
    avgDeaths: (totalDeaths / total).toFixed(1),
    avgAssists: (totalAssists / total).toFixed(1),
    mostPlayedId,
    mostPlayedCount: heroCounts[mostPlayedId] ?? 0,
  };
}

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ steamId: string }>;
}) {
  const { steamId } = await params;
  const data = await getPlayerData(steamId);

  if (!data) {
    return (
      <main className="player-page">
        <Link href="/players" className="back-link">
          ← Back to Search
        </Link>
        <p className="error-text">Player not found or API error.</p>
      </main>
    );
  }

  const { history, heroMap, profile, rank } = data;
  const stats = calcSummaryStats(history);
  const mostPlayedHero = heroMap.get(stats.mostPlayedId);

  return (
    <main className="player-page">
      <Link href="/players" className="back-link">
        ← Back to Search
      </Link>

      <div className="player-header">
        <div className="player-profile">
          {profile?.avatarmedium && (
            <img
              src={profile.avatarmedium}
              alt={profile.personaname}
              className="player-avatar"
            />
          )}
          <div>
            <h1 className="player-title">
              {profile?.personaname ?? `Player ${steamId}`}
            </h1>
            <div className="player-rank-row">
              {rank ? (
                <>
                  <img
                    src={rank.badge}
                    alt={rank.name}
                    className="player-rank-badge"
                  />
                  <span className="player-rank-name">{rank.name}</span>
                </>
              ) : (
                <span className="player-rank-name">Unranked</span>
              )}
            </div>
            <p className="player-subtitle">{stats.total} recent matches</p>
            {profile?.profileurl && (
              <a
                href={profile.profileurl}
                target="_blank"
                rel="noopener noreferrer"
                className="steam-link">
                View Steam Profile ↗
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-label">Win Rate</div>
          <div
            className="summary-value"
            style={{ color: stats.winRate >= 50 ? "#7ed321" : "#e74c3c" }}>
            {stats.winRate.toFixed(1)}%
          </div>
          <div className="summary-sub">
            {stats.wins}W — {stats.losses}L
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-label">Avg KDA</div>
          <div className="summary-value">
            {stats.avgKills}/{stats.avgDeaths}/{stats.avgAssists}
          </div>
          <div className="summary-sub">
            {(
              (Number(stats.avgKills) + Number(stats.avgAssists)) /
              Math.max(Number(stats.avgDeaths), 1)
            ).toFixed(2)}{" "}
            KDA ratio
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-label">Most Played</div>
          {mostPlayedHero ? (
            <div className="summary-hero">
              <img
                src={mostPlayedHero.images?.icon_image_small}
                alt={mostPlayedHero.name}
                className="summary-hero-icon"
              />
              <div className="summary-value">{mostPlayedHero.name}</div>
            </div>
          ) : (
            <div className="summary-value">—</div>
          )}
          <div className="summary-sub">{stats.mostPlayedCount} matches</div>
        </div>
      </div>

      {/* Match History Table */}
      <h2 className="section-title">Recent Matches</h2>
      <MatchTable history={history} heroMap={Object.fromEntries(heroMap)} />
    </main>
  );
}