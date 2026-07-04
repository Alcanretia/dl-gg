import { NextResponse } from "next/server";

const cache = new Map<string, { data: any; expires: number }>();
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 min — player data changes more often

export async function GET(
  request: Request,
  { params }: { params: Promise<{ steamId: string }> }
) {
  const { steamId } = await params;
  const cached = cache.get(steamId);
  if (cached && Date.now() < cached.expires) {
    return NextResponse.json(cached.data);
  }

  try {
    const [historyRes, heroMetaRes] = await Promise.all([
      fetch(`https://api.deadlock-api.com/v1/players/${steamId}/match-history`),
      fetch(`https://api.deadlock-api.com/v1/assets/heroes`),
    ]);

    if (!historyRes.ok) throw new Error(`History error: ${historyRes.status}`);

    const history = await historyRes.json();
    const heroMeta = await heroMetaRes.json();

    // log shape so we can fix field names
    console.log("match keys:", JSON.stringify(Object.keys(history[0] ?? {})));
    console.log("first match:", JSON.stringify(history[0], null, 2));

    const heroMap = new Map<number, any>();
    for (const hero of heroMeta) {
      heroMap.set(hero.id, hero);
    }

    const data = { history, heroMap: Object.fromEntries(heroMap) };
    cache.set(steamId, { data, expires: Date.now() + CACHE_TTL_MS });
    return NextResponse.json(data);
  } catch (err) {
    console.error("Failed to fetch player data:", err);
    return NextResponse.json({ error: "Failed to fetch player data" }, { status: 502 });
  }
}