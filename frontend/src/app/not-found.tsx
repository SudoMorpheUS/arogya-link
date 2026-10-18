import Link from "next/link";
import { CubeMark } from "@/components/TowerLoader";

export default function NotFound() {
  return (
    <main className="loader-screen" style={{ minHeight: "100dvh", padding: 16, textAlign: "center" }}>
      <CubeMark size={56} />
      <h1>Page not found</h1>
      <p className="muted">That page doesn&apos;t exist, or you don&apos;t have access to it.</p>
      <Link className="btn" href="/dashboard">
        Back to dashboard
      </Link>
    </main>
  );
}
