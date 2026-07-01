import { NextResponse } from "next/server";

const cache = new Map<string, { data: any; expires: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: heroId } = await params;
  const cached = cache.get(heroId);
  if (cached && Date.now() < cached.expires) {
    return NextResponse.json(cached.data);
  }

  try {
    const [itemStatsRes, itemMetaRes] = await Promise.all([
      fetch(`https://api.deadlock-api.com/v1/analytics/item-stats?hero_id=${heroId}`),
      fetch(`https://api.deadlock-api.com/v1/assets/items`),
    ]);

    if (!itemStatsRes.ok) throw new Error(`Item stats error: ${itemStatsRes.status}`);
    if (!itemMetaRes.ok) throw new Error(`Item meta error: ${itemMetaRes.status}`);

    const itemStats = await itemStatsRes.json();
    const itemMeta = await itemMetaRes.json();

    // debug: log shape of first entries so we can fix field names
    console.log("itemStats[0]:", JSON.stringify(Object.keys(itemStats[0] ?? {})));
    console.log("itemMeta[0]:", JSON.stringify(Object.keys(itemMeta[0] ?? {})));

    cache.set(heroId, { data: { itemStats, itemMeta }, expires: Date.now() + CACHE_TTL_MS });
    return NextResponse.json({ itemStats, itemMeta });
  } catch (err) {
    console.error("Failed to fetch build data:", err);
    return NextResponse.json({ error: "Failed to fetch build data" }, { status: 502 });
  }
}