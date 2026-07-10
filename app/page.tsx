import Link from "next/link";
import "./home.css";

export default function HomePage() {
  return (
    <main className="home-page">
      <div className="home-hero">
        <div className="home-badge">Deadlock Stats Tracker</div>
        <h1 className="home-title">
          DL<span>GG</span>
        </h1>
        <p className="home-description">
          Explore hero win rates, tier rankings, optimal item builds,
          and full player match history — all powered by live match data.
        </p>
        <div className="home-actions">
          <Link href="/heroes" className="home-btn primary">
            <span className="btn-icon">⚔</span>
            <div className="btn-text">
              <div className="btn-label">Hero Stats</div>
              <div className="btn-sub">Win rates, tier list & builds</div>
            </div>
          </Link>
          <Link href="/players" className="home-btn secondary">
            <span className="btn-icon">◎</span>
            <div className="btn-text">
              <div className="btn-label">Player Lookup</div>
              <div className="btn-sub">Match history & performance</div>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}