import { API_BASE_URL } from "./config";

export type WakeStatus = "idle" | "syncing" | "awake" | "timeout";
type StatusListener = (status: WakeStatus) => void;

let currentStatus: WakeStatus = "idle";
const listeners = new Set<StatusListener>();
let isRunning = false;

function notify() {
  listeners.forEach((fn) => fn(currentStatus));
}

/** Subscribe to backend wake-up status changes. Returns an unsubscribe fn. */
export function subscribeToWakeStatus(fn: StatusListener): () => void {
  listeners.add(fn);
  // Immediately deliver current status to new subscriber
  fn(currentStatus);
  return () => listeners.delete(fn);
}

export function getWakeStatus(): WakeStatus {
  return currentStatus;
}

/** Try a single ping against /health, then fallback to base URL. */
async function tryPing(): Promise<boolean> {
  const ping = async (url: string): Promise<boolean> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    try {
      const res = await fetch(url, {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      });
      return res.ok || res.status < 500;
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
    }
  };

  const healthy = await ping(`${API_BASE_URL}/health`);
  if (healthy) return true;
  return ping(API_BASE_URL);
}

/**
 * Pings the Render backend every 5 s until it responds (max ~2 min / 24 attempts).
 * Notifies all subscribers whenever the status changes.
 * Safe to call multiple times — only one polling loop runs at a time.
 */
export function pingBackend() {
  if (typeof window === "undefined") return;
  if (isRunning || currentStatus === "awake") return;

  isRunning = true;
  currentStatus = "syncing";
  notify();

  const MAX_ATTEMPTS = 12;   // 12 × 10 s = 2 min
  const INTERVAL_MS  = 10_000;
  let attempts = 0;

  async function attempt() {
    attempts++;
    const alive = await tryPing();

    if (alive) {
      currentStatus = "awake";
      isRunning = false;
      notify();
      return;
    }

    if (attempts >= MAX_ATTEMPTS) {
      currentStatus = "timeout";
      isRunning = false;
      notify();
      return;
    }

    // Not awake yet — retry after INTERVAL_MS
    setTimeout(attempt, INTERVAL_MS);
  }

  attempt();
}
