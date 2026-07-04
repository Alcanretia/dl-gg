import Link from "next/link";

export default function HomePage() {
  return (
    <main className="home-page">
      <div className="home-hero">
        <h1>
          DL<span>GG</span>
        </h1>
        <p className="home-subtitle">
          Hero win rates, item builds, and player stats for Deadlock
        </p>
        <div className="home-actions">
          <Link href="/heroes" className="home-btn primary">
            View Hero Stats
          </Link>
          <Link href="/players" className="home-btn secondary">
            Look Up Player
          </Link>
        </div>
      </div>
    </main>
  );
}