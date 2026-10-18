"use client";

import { TriangleAlert } from "lucide-react";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="loader-screen" style={{ minHeight: "100dvh", padding: 16, textAlign: "center" }} role="alert">
      <TriangleAlert size={32} strokeWidth={1.75} aria-hidden="true" style={{ color: "var(--maroon-700)" }} />
      <h1>Something went wrong</h1>
      <p className="muted">The request could not be completed. No data was changed.</p>
      <button className="btn" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
