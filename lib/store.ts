import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, UserRole, CartItem, Notification, Product } from "./types";
import { API_BASE_URL } from "@/lib/config";

const toApiV1BaseUrl = (baseUrl: string) => {
  const trimmed = baseUrl.replace(/\/+$/, "");
  return trimmed.endsWith("/api/v1") ? trimmed : `${trimmed}/api/v1`;
};

const CART_API_BASE_URL = toApiV1BaseUrl(API_BASE_URL);

const warnCustomerOnlyCart = () => {
  console.warn("Cart is available only for customers. Log in as user.");
  useUIStore.getState().showToast("Log in as user", "info");
};

type ApiCartItem = {
  productId: string;
  quantity: number;
  price?: number;
  stock?: number;
  name?: string;
  vendorId?: string;
  vendorName?: string;
  imageUrl?: string | null;
  imagUrl?: string | null;
};

type ApiCartPayload = {
  items?: ApiCartItem[];
  totalAmount?: number;
};

type ApiCartResponse = {
  status?: string;
  data?: ApiCartPayload;
  items?: ApiCartItem[];
  totalAmount?: number;
};

const getAccessToken = () => {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem("accessToken");
};

const getCartItemsFromPayload = (payload: ApiCartResponse): ApiCartItem[] => {
  if (Array.isArray(payload?.data?.items)) {
    return payload.data.items;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  return [];
};

const toStoreCartItem = (
  item: ApiCartItem,
  fallback?: CartItem,
): CartItem | null => {
  if (!item?.productId) {
    return null;
  }

  const safeQuantity = Math.max(
    1,
    Number(item.quantity || fallback?.quantity || 1),
  );
  const safePrice = Number(item.price ?? fallback?.price ?? 0);
  const fallbackProduct = fallback?.product;

  const product: Product = {
    id: item.productId,
    name: item.name || fallbackProduct?.name || "Product",
    description: fallbackProduct?.description || "",
    price: safePrice,
    images: [
      item.imageUrl ||
        item.imagUrl ||
        fallbackProduct?.images?.[0] ||
        "/placeholder-product-1.jpg",
    ],
    category: fallbackProduct?.category || "General",
    subcategory: fallbackProduct?.subcategory || "General",
    stock: Number(item.stock ?? fallbackProduct?.stock ?? 0),
    vendorId: item.vendorId || fallbackProduct?.vendorId || "",
    vendorName: item.vendorName || fallbackProduct?.vendorName || "Vendor",
    rating: fallbackProduct?.rating || 0,
    reviewCount: fallbackProduct?.reviewCount || 0,
    createdAt: fallbackProduct?.createdAt || new Date().toISOString(),
    updatedAt: fallbackProduct?.updatedAt || new Date().toISOString(),
    featured: fallbackProduct?.featured || false,
  };

  return {
    productId: item.productId,
    quantity: safeQuantity,
    price: safePrice,
    product,
  };
};

const mergeCartItemsFromApi = (
  apiItems: ApiCartItem[],
  currentItems: CartItem[],
): CartItem[] => {
  const fallbackMap = new Map(
    currentItems.map((item) => [item.productId, item]),
  );

  return apiItems
    .map((item) => toStoreCartItem(item, fallbackMap.get(item.productId)))
    .filter((item): item is CartItem => Boolean(item));
};

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
  isLoading: boolean;
  fetchCart: () => Promise<void>;
  addItem: (item: CartItem) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
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
  isLoading: false,
  fetchCart: async () => {
    const user = useAuthStore.getState().user;

    if (!user || user.role !== "customer") {
      set({ items: [], isLoading: false });
      return;
    }

    set({ isLoading: true });

    try {
      const accessToken = getAccessToken();
      const response = await fetch(`${CART_API_BASE_URL}/cart`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });

      if (!response.ok) {
        return;
      }

      const payload: ApiCartResponse = await response.json().catch(() => ({}));
      const apiItems = getCartItemsFromPayload(payload);
      const currentItems = get().items;
      set({ items: mergeCartItemsFromApi(apiItems, currentItems) });
    } catch {
      // Keep existing local state when network call fails.
    } finally {
      set({ isLoading: false });
    }
  },
  addItem: async (item) => {
    const user = useAuthStore.getState().user;

    if (!user || user.role !== "customer") {
      warnCustomerOnlyCart();
      return;
    }

    try {
      const accessToken = getAccessToken();
      const response = await fetch(`${CART_API_BASE_URL}/cart/items`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          userId: user.id,
          productId: item.productId,
          quantity: item.quantity,
        }),
      });

      if (response.ok) {
        const payload: ApiCartResponse = await response
          .json()
          .catch(() => ({}));
        const apiItems = getCartItemsFromPayload(payload);
        const currentItems = get().items;
        set({ items: mergeCartItemsFromApi(apiItems, currentItems) });
        return;
      }
    } catch {
      // Fallback to local update below.
    }

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
    });
  },
  removeItem: async (productId) => {
    const user = useAuthStore.getState().user;

    if (user && user.role === "customer") {
      try {
        const accessToken = getAccessToken();
        const response = await fetch(
          `${CART_API_BASE_URL}/cart/items/${productId}`,
          {
            method: "DELETE",
            credentials: "include",
            headers: {
              ...(accessToken
                ? { Authorization: `Bearer ${accessToken}` }
                : {}),
            },
          },
        );

        if (response.ok) {
          if (response.status !== 204) {
            const payload: ApiCartResponse = await response
              .json()
              .catch(() => ({}));
            const apiItems = getCartItemsFromPayload(payload);
            const currentItems = get().items;
            set({ items: mergeCartItemsFromApi(apiItems, currentItems) });
            return;
          }

          set((state) => ({
            items: state.items.filter((i) => i.productId !== productId),
          }));
          return;
        }
      } catch {
        // Fallback to local update below.
      }
    }

    set((state) => ({
      items: state.items.filter((i) => i.productId !== productId),
    }));
  },
  updateQuantity: async (productId, quantity) => {
    if (quantity < 1) {
      await get().removeItem(productId);
      return;
    }

    const user = useAuthStore.getState().user;
    const currentItem = get().items.find((i) => i.productId === productId);

    if (user && user.role === "customer") {
      try {
        const accessToken = getAccessToken();
        const patchResponse = await fetch(
          `${CART_API_BASE_URL}/cart/items/${productId}`,
          {
            method: "PATCH",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              ...(accessToken
                ? { Authorization: `Bearer ${accessToken}` }
                : {}),
            },
            body: JSON.stringify({ quantity }),
          },
        );

        if (patchResponse.ok) {
          const payload: ApiCartResponse = await patchResponse
            .json()
            .catch(() => ({}));
          const apiItems = getCartItemsFromPayload(payload);
          const currentItems = get().items;
          set({ items: mergeCartItemsFromApi(apiItems, currentItems) });
          return;
        }

        const delta = quantity - (currentItem?.quantity || 0);
        if (delta > 0) {
          const addResponse = await fetch(`${CART_API_BASE_URL}/cart/items`, {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              ...(accessToken
                ? { Authorization: `Bearer ${accessToken}` }
                : {}),
            },
            body: JSON.stringify({
              userId: user.id,
              productId,
              quantity: delta,
            }),
          });

          if (addResponse.ok) {
            const payload: ApiCartResponse = await addResponse
              .json()
              .catch(() => ({}));
            const apiItems = getCartItemsFromPayload(payload);
            const currentItems = get().items;
            set({ items: mergeCartItemsFromApi(apiItems, currentItems) });
            return;
          }
        }
      } catch {
        // Fallback to local update below.
      }
    }

    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId ? { ...i, quantity } : i,
      ),
    }));
  },
  clearCart: async () => {
    const user = useAuthStore.getState().user;

    if (user && user.role === "customer") {
      try {
        const accessToken = getAccessToken();
        await fetch(`${CART_API_BASE_URL}/cart`, {
          method: "DELETE",
          credentials: "include",
          headers: {
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
        });
      } catch {
        // Ignore errors and clear local cache.
      }
    }

    set({ items: [] });
  },
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
