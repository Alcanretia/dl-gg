import "./playerPage.css";
import MatchTable from "./MatchTable";

const TIER_NAMES = [
  "Initiate",  // 1
  "Seeker",    // 2
  "Acolyte",   // 3
  "Sentinel",  // 4
  "Mystic",    // 5
  "Ritualist", // 6
  "Emissary",  // 7
  "Oracle",    // 8
  "Phantom",   // 9
  "Ascendant", // 10
  "Eternus",   // 11
];

function parseRank(data: any) {
  let tier = Number(data?.rank ?? 0);
  let subrank = Number(data?.subrank ?? 0);

  // fallback: decode the combined badge value (e.g. 91 = tier 9, subrank 1)
  if ((!tier || !subrank) && data?.badge) {
    tier = Math.floor(data.badge / 10);
    subrank = data.badge % 10;
  }

  const valid =
    Number.isInteger(tier) && tier >= 1 && tier <= TIER_NAMES.length &&
    Number.isInteger(subrank) && subrank >= 1 && subrank <= 6;
  if (!valid) return null;

  return {
    tier,
    subrank,
    name: `${TIER_NAMES[tier - 1]} ${subrank}`,
    badge: `https://assets.deadlock-api.com/images/ranks/rank${tier}/badge_lg_subrank${subrank}.webp`,
  };
}


async function getPlayerData(steamId: string) {
  const [historyRes, heroMetaRes, profileRes, rankRes] = await Promise.all([
    fetch(`https://api.deadlock-api.com/v1/players/${steamId}/match-history`, {
      next: { revalidate: 120 },
    }),
    fetch(`https://api.deadlock-api.com/v1/assets/heroes`, {
      next: { revalidate: 3600 },
    }),
    fetch(
      `https://api.deadlock-api.com/v1/players/steam?account_ids=${steamId}`,
      { next: { revalidate: 300 } },
    ),
    fetch(
      `https://api.deadlock-api.com/v1/players/${steamId}/rank`,
      { next: { revalidate: 300 } }
    ),
  ]);

  if (!historyRes.ok) return null;

  const history = (await historyRes.json()).filter(
    (m: any) => m.match_id != null && m.hero_id != null && m.match_duration_s != null
  );
  const heroMeta = await heroMetaRes.json();
  const profileArr = profileRes.ok ? await profileRes.json() : [];
  const profile = profileArr[0] ?? null;
  const rankData = rankRes.ok ? await rankRes.json() : null;
  const rank = parseRank(rankData);

  const heroMap = new Map<number, any>();
  for (const hero of heroMeta) heroMap.set(hero.id, hero);

  return { history, heroMap, profile, rank };
}

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

function calcSummaryStats(history: any[]) {
  const total = history.length;
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
    winRate: total > 0 ? (wins / total) * 100 : 0,
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
        <a href="/players" className="back-link">
          ← Back to Search
        </a>
        <p className="error-text">Player not found or API error.</p>
      </main>
    );
  }

  const { history, heroMap, profile, rank } = data;
  const stats = calcSummaryStats(history);
  const mostPlayedHero = heroMap.get(stats.mostPlayedId);

  return (
    <main className="player-page">
      <a href="/players" className="back-link">
        ← Back to Search
      </a>

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
                  <img src={rank.badge} alt={rank.name} className="player-rank-badge" />
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
                className="steam-link"
              >
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
