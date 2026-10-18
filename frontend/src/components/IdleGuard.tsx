"use client";

import { Lock } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const IDLE_MS = 2 * 60 * 1000;

/** Blurs the screen after a period of inactivity so patient data isn't left visible on a shared display. */
export function IdleGuard() {
  const [locked, setLocked] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const arm = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setLocked(true), IDLE_MS);
    };
    const onActivity = () => {
      if (!document.querySelector(".idle-lock")) arm();
    };
    const events = ["pointerdown", "pointermove", "keydown", "scroll", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true, capture: true }));
    arm();
    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity, { capture: true }));
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    if (locked) button.current?.focus();
  }, [locked]);

  if (!locked) return null;
  return (
    <div className="idle-lock" role="dialog" aria-modal="true" aria-labelledby="idle-title">
      <div className="card stack-sm" style={{ maxWidth: 420, textAlign: "center", justifyItems: "center" }}>
        <Lock size={28} strokeWidth={1.75} aria-hidden="true" style={{ color: "var(--blue-600)" }} />
        <h2 id="idle-title">Screen hidden for privacy</h2>
        <p className="muted">You have been inactive for two minutes. Patient details are blurred until you continue.</p>
        <button
          ref={button}
          className="btn"
          onClick={() => {
            setLocked(false);
            timer.current = setTimeout(() => setLocked(true), IDLE_MS);
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
