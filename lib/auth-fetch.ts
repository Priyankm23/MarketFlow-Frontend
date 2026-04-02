import { useAuthStore } from "./auth-store";
import { API_BASE_URL } from "@/lib/config";

const INVALID_OR_EXPIRED_TOKEN_PATTERN = /invalid or expired token|jwt expired|token expired|unauthorized/i;

let refreshPromise: Promise<string | null> | null = null;

type AuthRequestInit = RequestInit & {
  skipAuthRefresh?: boolean;
};

const isBrowser = () => typeof window !== "undefined";

const readAuthErrorMessage = async (response: Response) => {
  const payload = await response
    .clone()
    .json()
    .catch(() => ({}));
  return payload?.message || payload?.error || payload?.statusMessage || "";
};

const forceLogout = async () => {
  if (!isBrowser()) return;

  localStorage.removeItem("accessToken");

  const authStore = useAuthStore.getState();
  authStore.setUser(null);

  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
};

const requestAccessTokenRefresh = async (): Promise<string | null> => {
  if (!isBrowser()) return null;

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json().catch(() => ({}));
  const accessToken = payload?.data?.accessToken;

  if (!accessToken || typeof accessToken !== "string") {
    return null;
  }

  localStorage.setItem("accessToken", accessToken);
  return accessToken;
};

const refreshAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = requestAccessTokenRefresh().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
};

export async function authFetch(
  input: RequestInfo | URL,
  init: AuthRequestInit = {},
): Promise<Response> {
  if (!isBrowser()) {
    const { skipAuthRefresh: _skipAuthRefresh, ...serverInit } = init;
    return fetch(input, serverInit);
  }

  const { skipAuthRefresh = false, ...requestInit } = init;

  const token = localStorage.getItem("accessToken");
  const headers = new Headers(requestInit.headers ?? {});

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Automatically set Content-Type for JSON payloads if not already set
  if (
    requestInit.body &&
    typeof requestInit.body === "string" &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(input, {
    ...requestInit,
    credentials: requestInit.credentials ?? "include",
    headers,
  });

  if (skipAuthRefresh || response.status !== 401) {
    return response;
  }

  const errorMessage = await readAuthErrorMessage(response);
  if (!INVALID_OR_EXPIRED_TOKEN_PATTERN.test(errorMessage)) {
    return response;
  }

  const refreshedToken = await refreshAccessToken();
  if (!refreshedToken) {
    await forceLogout();
    return response;
  }

  const retryHeaders = new Headers(requestInit.headers ?? {});
  retryHeaders.set("Authorization", `Bearer ${refreshedToken}`);

  const retriedResponse = await fetch(input, {
    ...requestInit,
    credentials: requestInit.credentials ?? "include",
    headers: retryHeaders,
  });

  if (retriedResponse.status === 401) {
    await forceLogout();
  }

  return retriedResponse;
}
