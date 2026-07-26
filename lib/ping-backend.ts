import { API_BASE_URL } from "./config";

let isPinged = false;

/**
 * Immediately pings the backend server on Render to awaken free-tier cold starts.
 * This runs asynchronously in the background without blocking UI rendering.
 */
export function pingBackend() {
  if (typeof window === "undefined" || isPinged) return;
  isPinged = true;

  const healthEndpoint = `${API_BASE_URL}/health`;
  const baseEndpoint = API_BASE_URL;

  // Fire-and-forget immediate GET requests to wake up Render instance
  fetch(healthEndpoint, { method: "GET", cache: "no-store" })
    .catch(() => {
      return fetch(baseEndpoint, { method: "GET", cache: "no-store" });
    })
    .catch(() => {
      // Ignore errors silently as this is a background warming ping
    });
}
