import LeaderboardTable from "./LeaderboardTable";
import "./leaderboard.css";

export default function LeaderboardPage() {
  return (
    <main className="leaderboard-page">
      <h1 className="leaderboard-title">Leaderboard</h1>
      <p className="leaderboard-subtitle">
        Top ranked players by region · Updated every hour
      </p>
      <LeaderboardTable />
    </main>
  );
}