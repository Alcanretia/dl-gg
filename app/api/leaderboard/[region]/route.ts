import { NextResponse } from "next/server";

const cache = new Map<string, { data: any; expires: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour — matches Valve's update rate

const VALID_REGIONS = ["Europe", "Asia", "NAmerica", "SAmerica", "Oceania"];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ region: string }> }
) {
  const { region } = await params;

  if (!VALID_REGIONS.includes(region)) {
    return NextResponse.json({ error: "Invalid region" }, { status: 400 });
  }

  const cached = cache.get(region);
  if (cached && Date.now() < cached.expires) {
    return NextResponse.json(cached.data);
  }

  try {
    const [leaderboardRes, heroMetaRes] = await Promise.all([
      fetch(`https://api.deadlock-api.com/v1/leaderboard/${region}`),
      fetch(`https://api.deadlock-api.com/v1/assets/heroes`,
        { next: { revalidate: 3600 } }
      ),
    ]);

    if (!leaderboardRes.ok) throw new Error(`Leaderboard error: ${leaderboardRes.status}`);

    const leaderboard = await leaderboardRes.json();
    const heroMeta = await heroMetaRes.json();

    const heroMap = new Map<number, any>();
    for (const hero of heroMeta) heroMap.set(hero.id, hero);

    // collect all account IDs to batch fetch steam profiles
    const allAccountIds = leaderboard.entries
      .flatMap((e: any) => e.possible_account_ids)
      .filter(Boolean)
      .slice(0, 1000); // API limit

    // batch fetch steam profiles
    const profileRes = await fetch(
      `https://api.deadlock-api.com/v1/players/steam?account_ids=${allAccountIds.join(",")}`
    );
    const profiles = profileRes.ok ? await profileRes.json() : [];

    const profileMap = new Map<number, any>();
    for (const p of profiles) profileMap.set(p.account_id, p);
    const firstProfile = profiles[0];
    console.log("full profile:", JSON.stringify(firstProfile, null, 2));


    const entries = leaderboard.entries.map((entry: any, i: number) => {
      const accountId = entry.possible_account_ids?.[0] ?? null;
      const profile = accountId ? profileMap.get(accountId) : null;
      const topHeroes = (entry.top_hero_ids ?? [])
        .slice(0, 3)
        .map((id: number) => {
          const hero = heroMap.get(id);
          return hero ? {
            id,
            name: hero.name,
            icon: hero.images?.icon_image_small ?? null,
          } : null;
        })
        .filter(Boolean);

      return {
        position: i + 1,
        accountId,
        name: profile?.personaname ?? entry.account_name ?? "Unknown",
        avatar: profile?.avatar ?? null,
        topHeroes,
      };
    });

    const data = { region, entries };
    cache.set(region, { data, expires: Date.now() + CACHE_TTL_MS });
    return NextResponse.json(data);
  } catch (err) {
    console.error("Leaderboard fetch failed:", err);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 502 });
  }
}