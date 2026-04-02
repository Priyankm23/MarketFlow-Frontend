import { create } from "zustand";
import { User, UserRole, CartItem, Notification, Product } from "./types";
import { API_BASE_URL } from "@/lib/config";
import { useAuthStore } from "./auth-store";
import { authFetch } from "./auth-fetch";

// Export useAuthStore from here for backward compatibility
export { useAuthStore };

const toApiV1BaseUrl = (baseUrl: string) => {
  const trimmed = baseUrl.replace(/\/+$/, "");
  return trimmed.endsWith("/api/v1") ? trimmed : `${trimmed}/api/v1`;
};

const CART_API_BASE_URL = toApiV1BaseUrl(API_BASE_URL);

const isCustomerRole = (role?: string) => {
  const normalized = role?.toLowerCase();
  return normalized === "customer" || normalized === "user";
};

const warnCustomerOnlyCart = () => {
  console.warn("Cart is available only for customers. Log in as user.");
  useUIStore.getState().showToast("Log in as user", "info");
};

type ApiCartItem = {
  productId: string;
  itemId?: string;
  quantity: number;
  price?: number;
  stock?: number;
  name?: string;
  vendorId?: string;
  vendorName?: string;
  imageUrl?: string | null;
  imagUrl?: string | null;
  product?: {
    id?: string;
    name?: string;
    price?: number;
    stock?: number;
    imageUrl?: string | null;
    vendorId?: string;
    vendorName?: string;
  } | null;
  item?: {
    id?: string;
    name?: string;
    price?: number;
    stock?: number;
    imageUrl?: string | null;
    vendorId?: string;
    vendorName?: string;
  } | null;
};

type ApiCartPayload = {
  items?: ApiCartItem[];
  cart?: {
    items?: ApiCartItem[];
  };
  totalAmount?: number;
};

type ApiCartResponse = {
  status?: string;
  data?: ApiCartPayload;
  items?: ApiCartItem[];
  cart?: {
    items?: ApiCartItem[];
  };
  totalAmount?: number;
};

type ApiItemResponse = {
  data?: {
    id?: string;
    name?: string;
    price?: number;
    stock?: number;
    imageUrl?: string | null;
    vendor?: {
      id?: string;
      businessName?: string;
    } | null;
    vendorId?: string;
    vendorName?: string;
  };
  item?: {
    id?: string;
    name?: string;
    price?: number;
    stock?: number;
    imageUrl?: string | null;
    vendor?: {
      id?: string;
      businessName?: string;
    } | null;
    vendorId?: string;
    vendorName?: string;
  };
};

const getCartItemProductId = (item: ApiCartItem): string =>
  item.productId || item.itemId || item.product?.id || item.item?.id || "";

const getCartItemsFromPayload = (payload: ApiCartResponse): ApiCartItem[] => {
  if (Array.isArray(payload?.data?.items)) {
    return payload.data.items;
  }

  if (Array.isArray(payload?.data?.cart?.items)) {
    return payload.data.cart.items;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (Array.isArray(payload?.cart?.items)) {
    return payload.cart.items;
  }

  return [];
};

const toStoreCartItem = (
  item: ApiCartItem,
  fallback?: CartItem,
): CartItem | null => {
  const resolvedProductId = getCartItemProductId(item);

  if (!resolvedProductId) {
    return null;
  }

  const safeQuantity = Math.max(
    1,
    Number(item.quantity || fallback?.quantity || 1),
  );
  const safePrice = Number(
    item.price ??
      item.product?.price ??
      item.item?.price ??
      fallback?.price ??
      0,
  );
  const fallbackProduct = fallback?.product;

  const product: Product = {
    id: resolvedProductId,
    name:
      item.name ||
      item.product?.name ||
      item.item?.name ||
      fallbackProduct?.name ||
      "Product",
    description: fallbackProduct?.description || "",
    price: safePrice,
    images: [
      item.imageUrl ||
        item.imagUrl ||
        item.product?.imageUrl ||
        item.item?.imageUrl ||
        fallbackProduct?.images?.[0] ||
        "/placeholder-product-1.jpg",
    ],
    category: fallbackProduct?.category || "General",
    subcategory: fallbackProduct?.subcategory || "General",
    stock: Number(
      item.stock ??
        item.product?.stock ??
        item.item?.stock ??
        fallbackProduct?.stock ??
        0,
    ),
    vendorId:
      item.vendorId ||
      item.product?.vendorId ||
      item.item?.vendorId ||
      fallbackProduct?.vendorId ||
      "",
    vendorName:
      item.vendorName ||
      item.product?.vendorName ||
      item.item?.vendorName ||
      fallbackProduct?.vendorName ||
      "Vendor",
    rating: fallbackProduct?.rating || 0,
    reviewCount: fallbackProduct?.reviewCount || 0,
    createdAt: fallbackProduct?.createdAt || new Date().toISOString(),
    updatedAt: fallbackProduct?.updatedAt || new Date().toISOString(),
    featured: fallbackProduct?.featured || false,
  };

  return {
    productId: resolvedProductId,
    quantity: safeQuantity,
    price: safePrice,
    product,
  };
};

const enrichCartItemsWithProducts = async (
  items: CartItem[],
): Promise<CartItem[]> => {
  const idsToFetch = Array.from(
    new Set(
      items
        .filter(
          (item) =>
            !item.product?.name ||
            item.product.name === "Product" ||
            item.price <= 0,
        )
        .map((item) => item.productId),
    ),
  );

  if (idsToFetch.length === 0) {
    return items;
  }

  const fetchedProducts = await Promise.all(
    idsToFetch.map(async (itemId) => {
      try {
        const response = await fetch(`${CART_API_BASE_URL}/items/${itemId}`);
        if (!response.ok) return null;

        const payload: ApiItemResponse = await response
          .json()
          .catch(() => ({}));
        const apiItem = payload.data || payload.item;
        if (!apiItem?.id) return null;

        const mapped: Product = {
          id: apiItem.id,
          name: apiItem.name || "Product",
          description: "",
          price: Number(apiItem.price || 0),
          images: [apiItem.imageUrl || "/placeholder-product-1.jpg"],
          category: "General",
          subcategory: "General",
          stock: Number(apiItem.stock || 0),
          vendorId: apiItem.vendor?.id || apiItem.vendorId || "",
          vendorName:
            apiItem.vendor?.businessName || apiItem.vendorName || "Vendor",
          rating: 0,
          reviewCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          featured: false,
        };

        return mapped;
      } catch {
        return null;
      }
    }),
  );

  const productMap = new Map(
    fetchedProducts
      .filter((item): item is Product => Boolean(item))
      .map((item) => [item.id, item]),
  );

  return items.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) return item;

    return {
      ...item,
      price: item.price > 0 ? item.price : product.price,
      product: {
        ...(item.product || product),
        ...product,
      },
    };
  });
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

// Cart Store
export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  isLoading: false,
  fetchCart: async () => {
    const user = useAuthStore.getState().user;

    if (!user || !isCustomerRole(user.role)) {
      set({ items: [], isLoading: false });
      return;
    }

    set({ isLoading: true });

    try {
      const response = await authFetch(
        `${CART_API_BASE_URL}/cart?userId=${user.id}`,
        {
          method: "GET",
        },
      );

      if (!response.ok) {
        return;
      }

      const payload: ApiCartResponse = await response.json().catch(() => ({}));
      const apiItems = getCartItemsFromPayload(payload);
      const currentItems = get().items;
      const mergedItems = mergeCartItemsFromApi(apiItems, currentItems);
      const enrichedItems = await enrichCartItemsWithProducts(mergedItems);
      set({ items: enrichedItems });
    } catch {
      // Keep existing local state when network call fails.
    } finally {
      set({ isLoading: false });
    }
  },
  addItem: async (item) => {
    const user = useAuthStore.getState().user;

    if (!user || !isCustomerRole(user.role)) {
      if (typeof window !== "undefined") {
        const returnUrl = window.location.pathname + window.location.search;
        // Preserve existing toast but redirect user to login so they can add after auth
        useUIStore
          .getState()
          .showToast("Please sign in to add items to your bag", "info");
        window.location.href = `/login?returnUrl=${encodeURIComponent(returnUrl)}`;
        return;
      }

      warnCustomerOnlyCart();
      return;
    }

    try {
      const response = await authFetch(`${CART_API_BASE_URL}/cart/items`, {
        method: "POST",
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

    if (user && isCustomerRole(user.role)) {
      try {
        const response = await authFetch(
          `${CART_API_BASE_URL}/cart/items/${productId}?userId=${user.id}`,
          {
            method: "DELETE",
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

    if (user && isCustomerRole(user.role)) {
      try {
        const patchResponse = await authFetch(
          `${CART_API_BASE_URL}/cart/items/${productId}?userId=${user.id}`,
          {
            method: "PATCH",
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
          const addResponse = await authFetch(
            `${CART_API_BASE_URL}/cart/items`,
            {
              method: "POST",
              body: JSON.stringify({
                userId: user.id,
                productId,
                quantity: delta,
              }),
            },
          );

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

    if (user && isCustomerRole(user.role)) {
      try {
        await authFetch(`${CART_API_BASE_URL}/cart?userId=${user.id}`, {
          method: "DELETE",
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
