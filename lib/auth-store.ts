import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, UserRole } from "./types";
import { API_BASE_URL } from "@/lib/config";

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (
    name: string,
    email: string,
    password: string,
    role?: UserRole,
  ) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  refreshSession: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Login failed");
          }

          const data = await response.json();

          if (data && data.data && data.data.user) {
            const loggedInUser: User = {
              id: data.data.user.id || Math.random().toString(36).substr(2, 9),
              email: data.data.user.email,
              name: data.data.user.name,
              role: data.data.user.role?.toLowerCase() || "customer",
              createdAt: data.data.user.createdAt || new Date().toISOString(),
              updatedAt: data.data.user.updatedAt || new Date().toISOString(),
            };
            set({ user: loggedInUser, isLoading: false });

            if (data.data.accessToken) {
              localStorage.setItem("accessToken", data.data.accessToken);
            }
            return loggedInUser;
          } else {
            throw new Error("Invalid response structure from server");
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      register: async (name, email, password, role = "customer") => {
        set({ isLoading: true });
        try {
          const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name,
              email,
              password,
              role: role.toUpperCase(),
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Registration failed");
          }

          const data = await response.json();

          if (data && data.data && data.data.user) {
            const registeredUser: User = {
              id: data.data.user.id || Math.random().toString(36).substr(2, 9),
              email: data.data.user.email,
              name: data.data.user.name,
              role: data.data.user.role?.toLowerCase() || role,
              createdAt: data.data.user.createdAt || new Date().toISOString(),
              updatedAt: data.data.user.updatedAt || new Date().toISOString(),
            };
            set({ user: registeredUser, isLoading: false });

            if (data.data.accessToken) {
              localStorage.setItem("accessToken", data.data.accessToken);
            }
          } else {
            throw new Error("Invalid response structure from server");
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      logout: async () => {
        const accessToken = localStorage.getItem("accessToken");

        try {
          await fetch(`${API_BASE_URL}/auth/logout`, {
            method: "POST",
            credentials: "include",
            headers: {
              ...(accessToken
                ? { Authorization: `Bearer ${accessToken}` }
                : {}),
            },
          });
        } catch {
          // Ignore network/API errors and still clear local auth state.
        } finally {
          localStorage.removeItem("accessToken");
          set({ user: null });
        }
      },
      setUser: (user) => set({ user }),
      refreshSession: async () => {
        try {
          // First attempt to refresh the access token using the refresh cookie
          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: "POST",
            credentials: "include",
          });

          if (!refreshRes.ok) {
            // If refresh fails, we can't restore the session
            return;
          }

          const refreshData = await refreshRes.json();
          const accessToken = refreshData?.data?.accessToken;

          if (accessToken) {
            localStorage.setItem("accessToken", accessToken);

            // Now that we have a fresh access token, fetch the user profile
            // We can call /auth/me or similar if available, or just use existing user if valid
            // For now, let's assume we need to re-fetch the profile to ensure accuracy
            // Note: Importing authFetch here might cause circular dependency if not careful
            // But useAuthStore is used by authFetch, so it should be fine.
            const { authFetch } = await import("./auth-fetch");
            const meRes = await authFetch(`${API_BASE_URL}/auth/me`);

            if (meRes.ok) {
              const meData = await meRes.json();
              const user = meData?.data?.user;
              if (user) {
                set({
                  user: {
                    ...user,
                    role: user.role?.toLowerCase() || "customer",
                  },
                });
              }
            }
          }
        } catch (error) {
          console.error("Session restoration failed:", error);
        }
      },
    }),
    {
      name: "auth-storage",
    },
  ),
);
