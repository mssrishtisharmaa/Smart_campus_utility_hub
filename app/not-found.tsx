import Link from "next/link";
export default function NotFound() {
  return (
    <main className="empty-state">
      <h1>That page isn’t on the map.</h1>
      <p>Return to your weather workspace.</p>
      <Link className="btn" href="/dashboard">
        Open dashboard
      </Link>
    </main>
  );
}
