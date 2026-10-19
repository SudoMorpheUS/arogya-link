"use client";

import { TriangleAlert, Home, RefreshCw } from "lucide-react";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="loader-screen" style={{ minHeight: "100dvh", padding: 16, textAlign: "center" }} role="alert">
      <TriangleAlert size={36} strokeWidth={1.75} aria-hidden="true" style={{ color: "var(--maroon-700)" }} />
      <h1 style={{ marginTop: 12 }}>Something went wrong</h1>
      <p className="muted" style={{ maxWidth: 450, margin: "8px auto 20px" }}>
        The request could not be completed. Your data is safe and unchanged.
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <button className="btn btn--secondary" onClick={reset}>
          <RefreshCw size={16} />
          Try again
        </button>
        <a href="/" className="btn">
          <Home size={16} />
          Return to Home
        </a>
      </div>
    </main>
  );
}

