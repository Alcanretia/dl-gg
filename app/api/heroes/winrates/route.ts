import { NextResponse } from "next/server";

// Cache for each skill rating
const cache = new Map<string, { data: any; expires: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const minBadge = searchParams.get("minBadge") ?? "0";

  const cacheKey = `hero-winrates-${minBadge}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() < cached.expires) {
    return NextResponse.json(cached.data);
  }

  try {
    const [statsRes, heroesRes] = await Promise.all([
      fetch(
        `https://api.deadlock-api.com/v1/analytics/hero-stats${minBadge !== "0" ? `?min_average_badge=${minBadge}` : ""}`,
        { next: { revalidate: 300 } }
      ),
      fetch(
        `https://api.deadlock-api.com/v1/assets/heroes`,
        { next: { revalidate: 3600 } }
      ),
    ]);

    if (!statsRes.ok) throw new Error(`Stats error: ${statsRes.status}`);
    if (!heroesRes.ok) throw new Error(`Heroes error: ${heroesRes.status}`);

    const stats = await statsRes.json();
    const heroesMeta = await heroesRes.json();

    const totalMatches = stats.reduce((s: number, h: any) => s + h.matches, 0);

    const simplified = stats.map((hero: any) => {
      const meta = heroesMeta.find((h: any) => h.id === hero.hero_id);
      return {
        id: hero.hero_id,
        name: meta?.name ?? `Hero ${hero.hero_id}`,
        icon: meta?.images?.icon_image_small ?? null,
        winRate: hero.wins / hero.matches,
        pickRate: hero.matches / totalMatches,
        matches: hero.matches,
      };
    });

    cache.set(cacheKey, { data: simplified, expires: Date.now() + CACHE_TTL_MS });
    return NextResponse.json(simplified);
  } catch (err) {
    console.error("Failed to fetch hero winrates:", err);
    return NextResponse.json({ error: "Failed to fetch hero data" }, { status: 502 });
  }
}