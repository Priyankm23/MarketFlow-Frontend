import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, UserRole, CartItem, Notification } from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

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
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

interface UIStore {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  toastMessage: { message: string; type: "success" | "error" | "info" } | null;
  showToast: (message: string, type: "success" | "error" | "info") => void;
  clearToast: () => void;
}

interface NotificationStore {
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  unreadCount: number;
}

// Auth Store
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
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

          // Assuming backend returns { status: "success", data: { user, accessToken } }
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

            // Optionally store the token
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
    }),
    {
      name: "auth-storage",
    },
  ),
);

// Cart Store
export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.productId === item.productId);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: i.quantity + item.quantity }
              : i,
          ),
        };
      }
      return { items: [...state.items, item] };
    }),
  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((i) => i.productId !== productId),
    })),
  updateQuantity: (productId, quantity) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId ? { ...i, quantity } : i,
      ),
    })),
  clearCart: () => set({ items: [] }),
  getTotalPrice: () => {
    const items = get().items;
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  },
  getTotalItems: () => {
    const items = get().items;
    return items.reduce((total, item) => total + item.quantity, 0);
  },
}));

// UI Store
export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  mobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  toastMessage: null,
  showToast: (message, type) => set({ toastMessage: { message, type } }),
  clearToast: () => set({ toastMessage: null }),
}));

// Notification Store
export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: notification.read
        ? state.unreadCount
        : state.unreadCount + 1,
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
    })),
  unreadCount: 0,
}));
