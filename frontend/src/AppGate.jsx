import { useEffect, useRef, useState } from "react";

// Render's free tier spins down after ~15 min idle;  user sees an "waking up" state instead
// of the app silently failing its first real request.

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";
const POLL_INTERVAL_MS = 3000;
const SLOW_WARNING_MS = 8000; // show the "cold start" copy after this long
const FAILED_WARNING_ATTEMPTS = 20; // ~60s of retrying before showing the error copy

async function pingHealth() {
  const res = await fetch(`${BASE_URL}/health`, { cache: "no-store" });
  if (!res.ok) throw new Error(`health check failed (${res.status})`);
}

export default function AppGate({ children }) {
  const [ready, setReady] = useState(false);
  const [slow, setSlow] = useState(false);
  const [failed, setFailed] = useState(false);
  const attemptRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const startedAt = Date.now();

    const slowTimer = setTimeout(() => {
      if (!cancelled) setSlow(true);
    }, SLOW_WARNING_MS);

    async function attempt() {
      attemptRef.current += 1;
      try {
        await pingHealth();
        if (!cancelled) setReady(true);
        return;
      } catch {
        if (cancelled) return;
        if (attemptRef.current >= FAILED_WARNING_ATTEMPTS) setFailed(true);
        // Keep retrying indefinitely — a cold Render instance can take
        // 30-60s, occasionally longer under load.
        setTimeout(attempt, POLL_INTERVAL_MS);
      }
    }

    attempt();

    return () => {
      cancelled = true;
      clearTimeout(slowTimer);
    };
  }, []);

  if (ready) return children;

  return (
    <div className="app-gate">
      <div className="app-gate-card">
        <span className="app-gate-mark">▲</span>
        <p className="mono-label">
          {slow ? "Waking up the server…" : "Connecting…"}
        </p>
        {slow && (
          <p className="app-gate-copy">
            The backend sleeps after a few minutes of inactivity on the free
            tier. First load can take up to a minute — hang tight.
          </p>
        )}
        {failed && (
          <p className="app-gate-copy app-gate-error">
            Still not responding. Check your connection, or the backend may
            be down.
          </p>
        )}
      </div>
    </div>
  );
}