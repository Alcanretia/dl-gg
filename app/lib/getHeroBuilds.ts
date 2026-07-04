const TIER_COSTS: Record<number, number> = {
  1: 800,
  2: 1600,
  3: 3200,
  4: 6400,
};

export type BuildItem = {
  id: number;
  name: string;
  image: string;
  type: string;
  tier: number;
  cost: number;
  winRate: number;
  matches: number;
  avgBuyTimeRelative: number; // 0-100, % through game
};

export type BuildData = {
  byTier: Record<number, BuildItem[]>; // 1,2,3,4
};

export async function getHeroBuilds(heroId: string): Promise<BuildData> {
  const [itemStatsRes, itemMetaRes] = await Promise.all([
    fetch(
      `https://api.deadlock-api.com/v1/analytics/item-stats?hero_id=${heroId}`,
      { next: { revalidate: 300 } }, // cache for 5 minutes
    ),
    fetch(
      `https://api.deadlock-api.com/v1/assets/items`,
      { next: { revalidate: 3600 } }, // cache for 1 hour — item metadata rarely changes
    ),
  ]);

  const itemStats = await itemStatsRes.json();
  const itemMeta = await itemMetaRes.json();

  // build a lookup map: item id → metadata (faster than .find() in a loop)
  const metaMap = new Map<number, any>();
  for (const item of itemMeta) {
    metaMap.set(item.id, item);
  }

  // merge stats + meta, filter out items with no metadata or not shopable
  const items: BuildItem[] = itemStats
    .map((stat: any) => {
      const meta = metaMap.get(stat.item_id);
      if (!meta || !meta.shopable || !meta.item_tier) return null;

      return {
        id: stat.item_id,
        name: meta.name,
        image: meta.shop_image_webp ?? meta.shop_image ?? "",
        type: meta.item_slot_type ?? "unknown",
        tier: meta.item_tier,
        cost: meta.cost ?? TIER_COSTS[meta.item_tier] ?? 0,
        winRate: stat.wins / stat.matches,
        matches: stat.matches,
        avgBuyTimeRelative: stat.avg_buy_time_relative ?? 0,
      };
    })
    .filter(Boolean);

  // group by tier, sort each tier by matches descending (most popular first)
  const byTier: Record<number, BuildItem[]> = { 1: [], 2: [], 3: [], 4: [] };
  for (const item of items) {
    if (byTier[item.tier]) {
      byTier[item.tier].push(item);
    }
  }
  for (const tier of [1, 2, 3, 4]) {
    byTier[tier].sort((a, b) => b.matches - a.matches);
  }

  return { byTier };
}
