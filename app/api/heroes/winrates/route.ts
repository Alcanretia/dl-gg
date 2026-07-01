import { NextResponse } from "next/server";

let cache: { data: any; expires: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function GET() {
  if (cache && Date.now() < cache.expires) {
    return NextResponse.json(cache.data);
  }

  try {
    const [statsRes, heroesRes] = await Promise.all([
      fetch("https://api.deadlock-api.com/v1/analytics/hero-stats"),
      fetch("https://api.deadlock-api.com/v1/assets/heroes"),
    ]);

    if (!statsRes.ok)
      throw new Error(`Stats upstream error: ${statsRes.status}`);
    if (!heroesRes.ok)
      throw new Error(`Heroes upstream error: ${heroesRes.status}`);

    const stats = await statsRes.json();
    const heroesMeta = await heroesRes.json();

    // log debug here

    const totalMatchesAllHeroes = stats.reduce(
      (sum: number, h: any) => sum + h.matches,
      0,
    );

    const simplified = stats.map((hero: any) => {
      const meta = heroesMeta.find((h: any) => h.id === hero.hero_id);
      return {
        id: hero.hero_id,
        name: meta?.name ?? `Hero ${hero.hero_id}`,
        icon: meta?.images?.icon_image_small ?? null,
        winRate: hero.wins / hero.matches,
        pickRate: hero.matches / totalMatchesAllHeroes,
        matches: hero.matches,
      };
    });

    cache = { data: simplified, expires: Date.now() + CACHE_TTL_MS };
    return NextResponse.json(simplified);
  } catch (err) {
    console.error("Failed to fetch hero data:", err);
    return NextResponse.json(
      { error: "Failed to fetch hero data" },
      { status: 502 },
    );
  }
}
