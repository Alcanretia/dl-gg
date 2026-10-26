export const TIER_NAMES = [
  "Initiate", "Seeker", "Acolyte", "Sentinel", "Mystic", "Ritualist",
  "Emissary", "Oracle", "Phantom", "Ascendant", "Eternus",
];

export function rankBadgeUrl(tier: number, subrank: number) {
  return `https://api.deadlock-api.com/v1/assets/ranks/${tier}/${subrank}/image?format=webp`;
}

export function parseRank(data: any) {
  let tier = Number(data?.rank ?? 0);
  let subrank = Number(data?.subrank ?? 0);

  // fallback: combined badge value (e.g. 91 = tier 9, subrank 1)
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
    badge: rankBadgeUrl(tier, subrank),
  };
}