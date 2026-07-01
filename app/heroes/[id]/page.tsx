import { getHeroBuilds } from "@/app/lib/getHeroBuilds";
import BuildsDisplay from "./buildsDisplay";
import "./heroPage.css";

export default async function HeroPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { byTier } = await getHeroBuilds(id);

  return (
    <main className="hero-page">
      <a href="/heroes" className="back-link">← Back to Heroes</a>
      <h1>Hero {id} — Popular Builds</h1>
      <p className="page-subtitle">
        Most picked items per tier, sorted by popularity
      </p>
      <BuildsDisplay byTier={byTier} />
    </main>
  );
}