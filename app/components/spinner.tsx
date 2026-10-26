import "./spinner.css";

export default function Spinner({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="spinner-wrap" role="status" aria-live="polite">
      <div className="spinner" />
      <span className="spinner-label">{label}</span>
    </div>
  );
}