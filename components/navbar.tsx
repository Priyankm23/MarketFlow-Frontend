"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  Bell,
  ChevronDown,
  Smartphone,
  Shirt,
  Home,
  Dumbbell,
  BookOpen,
  Sparkles,
  Utensils,
  Gamepad2,
} from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { useCartStore } from "@/lib/store";
import { authFetch } from "@/lib/auth-fetch";
import { API_BASE_URL } from "@/lib/config";

type NotificationOrderItem = {
  product?: {
    name?: string;
  };
};

type NotificationOrderEvent = {
  status?: string;
  note?: string;
  createdAt?: string;
};

type NotificationOrder = {
  id: string;
  status?: string;
  createdAt?: string;
  items?: NotificationOrderItem[];
  events?: NotificationOrderEvent[];
};

type NotificationOrdersResponse = {
  data?: NotificationOrder[];
  message?: string;
};

type SearchProduct = {
  id: string;
  name?: string;
  description?: string;
  imageUrl?: string | null;
  imageUrls?: string[] | null;
};

type SearchProductsResponse = {
  status?: string;
  data?: SearchProduct[];
  message?: string;
};

const normalizeOrderStatus = (status?: string) =>
  (status || "PENDING").trim().toUpperCase();

const isCancelledOrder = (status?: string) => {
  const normalized = normalizeOrderStatus(status);
  return normalized === "CANCELLED" || normalized === "CANCELED";
};

const formatOrderStatusLabel = (status?: string) =>
  normalizeOrderStatus(status).replaceAll("_", " ");

const getLatestOrderEvent = (order: NotificationOrder) => {
  if (!Array.isArray(order.events) || order.events.length === 0) {
    return null;
  }

  return [...order.events].sort((a, b) => {
    const aTime = new Date(a.createdAt || 0).getTime();
    const bTime = new Date(b.createdAt || 0).getTime();
    return bTime - aTime;
  })[0];
};

const getOrderActivityTime = (order: NotificationOrder) => {
  const latestEvent = getLatestOrderEvent(order);
  const latestEventTime = new Date(latestEvent?.createdAt || 0).getTime();
  const orderCreatedTime = new Date(order.createdAt || 0).getTime();
  return Math.max(
    Number.isFinite(latestEventTime) ? latestEventTime : 0,
    Number.isFinite(orderCreatedTime) ? orderCreatedTime : 0,
  );
};

const getOrderProductLabel = (order: NotificationOrder) => {
  const names = (order.items || [])
    .map((item) => item.product?.name?.trim())
    .filter((name): name is string => Boolean(name));

  if (names.length === 0) {
    return "Order item";
  }

  if (names.length <= 2) {
    return names.join(", ");
  }

  return `${names[0]}, ${names[1]} +${names.length - 2} more`;
};

const getLatestLogText = (order: NotificationOrder) => {
  const latestEvent = getLatestOrderEvent(order);
  if (latestEvent?.note?.trim()) {
    return latestEvent.note.trim();
  }

  if (latestEvent?.status) {
    return `Status: ${formatOrderStatusLabel(latestEvent.status)}`;
  }

  return `Status: ${formatOrderStatusLabel(order.status)}`;
};

const categories = [
  {
    name: "Electronics",
    icon: Smartphone,
    href: `/products?category=${encodeURIComponent("Electronics")}`,
  },
  {
    name: "Fashion",
    icon: Shirt,
    href: `/products?category=${encodeURIComponent("Fashion")}`,
  },
  {
    name: "Home",
    icon: Home,
    href: `/products?category=${encodeURIComponent("Home")}`,
  },
  {
    name: "Sports",
    icon: Dumbbell,
    href: `/products?category=${encodeURIComponent("Sports")}`,
  },
  {
    name: "Books",
    icon: BookOpen,
    href: `/products?category=${encodeURIComponent("Books")}`,
  },
  {
    name: "Beauty",
    icon: Sparkles,
    href: `/products?category=${encodeURIComponent("Beauty")}`,
  },
  {
    name: "Food",
    icon: Utensils,
    href: `/products?category=${encodeURIComponent("Food")}`,
  },
  {
    name: "Toys",
    icon: Gamepad2,
    href: `/products?category=${encodeURIComponent("Toys")}`,
  },
];

export function Navbar() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const fetchCart = useCartStore((state) => state.fetchCart);
  const cartItems = useCartStore((state) => state.items.length);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);
  const [orderNotifications, setOrderNotifications] = useState<
    NotificationOrder[]
  >([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [liveSearchResults, setLiveSearchResults] = useState<SearchProduct[]>(
    [],
  );
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const categoryPillsRef = React.useRef<HTMLDivElement | null>(null);
  const notificationsMenuRef = React.useRef<HTMLDivElement | null>(null);
  const searchFormRef = React.useRef<HTMLFormElement | null>(null);
  const activeSearchControllerRef = React.useRef<AbortController | null>(null);
  const latestSearchRequestIdRef = React.useRef(0);
  const router = useRouter();

  const bottomNavPills = [
    { label: "For You", href: "/products" },
    {
      label: "Electronics",
      href: `/products?category=${encodeURIComponent("Electronics")}`,
    },
    {
      label: "Fashion",
      href: `/products?category=${encodeURIComponent("Fashion")}`,
    },
    {
      label: "Home & Living",
      href: `/products?category=${encodeURIComponent("Home & Living")}`,
    },
    {
      label: "Sports",
      href: `/products?category=${encodeURIComponent("Sports")}`,
    },
    {
      label: "Books",
      href: `/products?category=${encodeURIComponent("Books")}`,
    },
    {
      label: "Beauty",
      href: `/products?category=${encodeURIComponent("Beauty")}`,
    },
    {
      label: "Food & Gourmet",
      href: `/products?category=${encodeURIComponent("Food & Gourmet")}`,
    },
    {
      label: "Toys & Games",
      href: `/products?category=${encodeURIComponent("Toys & Games")}`,
    },
    { label: "Trending Now", href: "/trending" },
    { label: "New Arrivals", href: "/new-arrivals" },
    { label: "Today's Deals", href: "/deals" },
  ];

  const isCustomerRole =
    !user ||
    user.role === "customer" ||
    String(user.role).toLowerCase() === "user";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      setShowSearchSuggestions(false);
      setMobileMenuOpen(false);
      router.push(`/products?search=${encodeURIComponent(q)}`);
    }
  };

  const handleSuggestionSelect = (productId: string) => {
    setShowSearchSuggestions(false);
    setMobileMenuOpen(false);
    router.push(`/products/${productId}`);
  };

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    const query = searchQuery.trim();

    if (query.length < 2) {
      setLiveSearchResults([]);
      setSearchError("");
      setSearchLoading(false);
      if (activeSearchControllerRef.current) {
        activeSearchControllerRef.current.abort();
      }
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      if (activeSearchControllerRef.current) {
        activeSearchControllerRef.current.abort();
      }

      const controller = new AbortController();
      activeSearchControllerRef.current = controller;
      const requestId = ++latestSearchRequestIdRef.current;

      setSearchLoading(true);
      setSearchError("");

      try {
        const endpoint = `${API_BASE_URL}/products/search?q=${encodeURIComponent(query)}&limit=6`;
        const response = await fetch(endpoint, { signal: controller.signal });
        const payload: SearchProductsResponse = await response
          .json()
          .catch(() => ({}));

        if (requestId !== latestSearchRequestIdRef.current) {
          return;
        }

        if (!response.ok || payload.status !== "success") {
          throw new Error(payload.message || "Unable to fetch products");
        }

        setLiveSearchResults(Array.isArray(payload.data) ? payload.data : []);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        setLiveSearchResults([]);
        setSearchError(
          error instanceof Error ? error.message : "Unable to fetch products",
        );
      } finally {
        if (requestId === latestSearchRequestIdRef.current) {
          setSearchLoading(false);
        }
      }
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchQuery]);

  React.useEffect(() => {
    return () => {
      if (activeSearchControllerRef.current) {
        activeSearchControllerRef.current.abort();
      }
    };
  }, []);

  React.useEffect(() => {
    void fetchCart();
  }, [fetchCart, user?.id, user?.role]);

  React.useEffect(() => {
    if (!notificationMenuOpen || !user || !isCustomerRole) {
      return;
    }

    const fetchOrderNotifications = async () => {
      setNotificationsLoading(true);
      setNotificationsError("");

      try {
        const endpoints = [
          `${API_BASE_URL}/orders/my-orders`,
          `${API_BASE_URL}/my-orders`,
        ];

        let loaded = false;
        let lastError = "Unable to load order updates.";

        for (const endpoint of endpoints) {
          const response = await authFetch(endpoint, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          });

          if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            lastError = payload?.message || lastError;
            continue;
          }

          const payload: NotificationOrdersResponse = await response
            .json()
            .catch(() => ({}));
          const orders = Array.isArray(payload?.data) ? payload.data : [];

          const activeOrders = orders
            .filter((order) => !isCancelledOrder(order.status))
            .sort((a, b) => getOrderActivityTime(b) - getOrderActivityTime(a));

          setOrderNotifications(activeOrders);
          loaded = true;
          break;
        }

        if (!loaded) {
          throw new Error(lastError);
        }
      } catch (error) {
        setOrderNotifications([]);
        setNotificationsError(
          error instanceof Error
            ? error.message
            : "Unable to load order updates.",
        );
      } finally {
        setNotificationsLoading(false);
      }
    };

    void fetchOrderNotifications();
  }, [notificationMenuOpen, user, isCustomerRole]);

  React.useEffect(() => {
    if (!notificationMenuOpen) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      if (
        notificationsMenuRef.current &&
        !notificationsMenuRef.current.contains(event.target as Node)
      ) {
        setNotificationMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [notificationMenuOpen]);

  React.useEffect(() => {
    if (!showSearchSuggestions) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      if (
        searchFormRef.current &&
        !searchFormRef.current.contains(event.target as Node)
      ) {
        setShowSearchSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showSearchSuggestions]);

  React.useEffect(() => {
    const container = categoryPillsRef.current;
    if (!container) {
      return;
    }

    const isReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (isReducedMotion) {
      return;
    }

    const groupSize = 3;
    const totalGroups = Math.ceil(bottomNavPills.length / groupSize);

    if (totalGroups <= 1) {
      return;
    }

    const groupStarts = Array.from(
      { length: totalGroups },
      (_, index) => index * groupSize,
    );
    // Example for 12 links: 0,3,6,9 then back 6,3.
    const mobileSequence =
      groupStarts.length > 1
        ? [...groupStarts, ...groupStarts.slice(1, -1).reverse()]
        : groupStarts;
    let sequenceCursor = 0;

    const scrollToPillIndex = (pillIndex: number) => {
      const isMobileViewport = window.matchMedia("(max-width: 767px)").matches;

      if (!isMobileViewport) {
        container.scrollTo({ left: 0, behavior: "smooth" });
        sequenceCursor = 0;
        return;
      }

      const linkElement = container.querySelector<HTMLAnchorElement>(
        `a[data-pill-index='${pillIndex}']`,
      );

      if (!linkElement) {
        return;
      }

      const containerLeft = container.getBoundingClientRect().left;
      const linkLeft = linkElement.getBoundingClientRect().left;
      const delta = linkLeft - containerLeft;

      container.scrollTo({
        left: container.scrollLeft + delta,
        behavior: "smooth",
      });
    };

    // Keep the first three links visible initially on mobile.
    scrollToPillIndex(0);

    const intervalId = window.setInterval(() => {
      sequenceCursor = (sequenceCursor + 1) % mobileSequence.length;
      scrollToPillIndex(mobileSequence[sequenceCursor]);
    }, 4800);

    const handleResize = () => {
      if (!window.matchMedia("(max-width: 767px)").matches) {
        container.scrollTo({ left: 0, behavior: "smooth" });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("resize", handleResize);
    };
  }, [bottomNavPills.length]);

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const getDashboardLink = () => {
    if (!user) return "/login";
    const role = String(user.role).toLowerCase();
    switch (role) {
      case "vendor":
        return "/vendor/dashboard";
      case "delivery":
      case "delivery_partner":
        return "/delivery/dashboard";
      case "admin":
        return "/admin/dashboard";
      default:
        return "/customer/dashboard";
    }
  };

  const logoHref = user?.role === "vendor" ? "/vendor/dashboard" : "/";
  const visibleOrderNotifications = orderNotifications.slice(0, 5);
  const hasMoreOrderNotifications = orderNotifications.length > 5;

  return (
    <nav
      id="main-nav"
      className="sticky top-0 z-50"
      style={{
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--border-default)",
      }}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 sm:h-[72px] gap-2 sm:gap-4">
          {/* Logo */}
          <Link
            href={logoHref}
            id="logo"
            className="flex items-center shrink-0"
            style={{ textDecoration: "none" }}
          >
            <Image
              src="/logo/logo.png"
              alt="Markivo"
              width={178}
              height={48}
              priority
              className="h-10 sm:h-12 w-auto"
            />
          </Link>

          {/* Category Dropdown */}
          <div className="relative hidden lg:block ml-4">
            <button
              id="category-menu-btn"
              onClick={() => setCategoryMenuOpen(!categoryMenuOpen)}
              onBlur={() => setTimeout(() => setCategoryMenuOpen(false), 200)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-[var(--brand-accent-soft)] transition-colors"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "16px",
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              <Menu className="w-5 h-5 text-[var(--brand-accent)]" />
              Categories
              <ChevronDown className="w-4 h-4 opacity-50" />
            </button>

            {categoryMenuOpen && (
              <div
                className="absolute left-0 mt-1 w-56 rounded-xl py-2 z-50 shadow-lg"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                  animation: "fadeInUp .15s ease",
                }}
              >
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <Link
                      key={cat.name}
                      href={cat.href}
                      className="flex items-center gap-3 px-4 py-2.5"
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "16px",
                        fontWeight: 500,
                        color: "var(--text-secondary)",
                        transition: "color .15s, background .15s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "var(--text-primary)";
                        e.currentTarget.style.background = "var(--bg-sunken)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "var(--text-secondary)";
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <Icon className="w-4 h-4" />
                      {cat.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Search Bar */}
          <form
            ref={searchFormRef}
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-xl mx-8"
          >
            <div className="w-full relative">
              <input
                id="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  setSearchQuery(nextValue);
                  setShowSearchSuggestions(nextValue.trim().length >= 2);
                }}
                onFocus={() => {
                  if (searchQuery.trim().length >= 2) {
                    setShowSearchSuggestions(true);
                  }
                }}
                placeholder="Search for products, brands, vendors..."
                className="w-full pl-11 pr-4 py-2.5 outline-none"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "16px",
                  fontWeight: 400,
                  background: "var(--bg-sunken)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "99px",
                  color: "var(--text-primary)",
                  transition: "border-color .2s",
                }}
              />
              <button
                type="submit"
                className="absolute left-4 top-1/2 -translate-y-1/2"
              >
                <Search
                  className="w-5 h-5"
                  style={{ color: "var(--text-muted)" }}
                />
              </button>

              {showSearchSuggestions && searchQuery.trim().length >= 2 && (
                <div
                  className="absolute left-0 right-0 mt-2 rounded-2xl overflow-hidden z-50"
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-default)",
                    boxShadow: "0 16px 34px rgba(0, 0, 0, 0.12)",
                  }}
                >
                  {searchLoading ? (
                    <div className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                      Searching products...
                    </div>
                  ) : searchError ? (
                    <div className="px-4 py-3 text-sm text-[var(--status-error)]">
                      {searchError}
                    </div>
                  ) : liveSearchResults.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                      No products matched your search.
                    </div>
                  ) : (
                    <div className="max-h-[360px] overflow-y-auto">
                      {liveSearchResults.map((product) => {
                        const previewImage =
                          product.imageUrl ||
                          (Array.isArray(product.imageUrls)
                            ? product.imageUrls[0]
                            : null) ||
                          "/placeholder-product-1.jpg";

                        return (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => handleSuggestionSelect(product.id)}
                            className="w-full px-3 py-2.5 flex items-start gap-3 text-left hover:bg-[var(--bg-sunken)] transition-colors border-b border-[var(--border-default)] last:border-b-0"
                          >
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-[var(--bg-sunken)]">
                              <Image
                                src={previewImage}
                                alt={product.name || "Product"}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                                {product.name || "Unnamed Product"}
                              </p>
                              <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">
                                {product.description ||
                                  "No description available"}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </form>

          {/* Right Actions */}
          <div className="ml-auto flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Notifications */}
            {user && isCustomerRole && (
              <div
                className="hidden sm:block relative"
                ref={notificationsMenuRef}
              >
                <button
                  id="notifications-btn"
                  onClick={() => setNotificationMenuOpen((prev) => !prev)}
                  className="inline-flex p-2 rounded-lg relative text-[var(--text-secondary)] hover:bg-[var(--bg-sunken)] hover:text-[var(--text-primary)]"
                >
                  <Bell className="w-5 h-5" />
                  {orderNotifications.length > 0 && (
                    <span
                      className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 text-[10px] rounded-full flex items-center justify-center font-bold"
                      style={{
                        background: "var(--brand-primary)",
                        color: "var(--text-inverse)",
                      }}
                    >
                      {orderNotifications.length > 9
                        ? "9+"
                        : orderNotifications.length}
                    </span>
                  )}
                </button>

                {notificationMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-[360px] max-w-[calc(100vw-2rem)] rounded-xl shadow-lg z-50 overflow-hidden"
                    style={{
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border-default)",
                      animation: "fadeInUp .15s ease",
                    }}
                  >
                    <div className="px-4 py-3 border-b border-[var(--border-default)]">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        Order Updates
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        Latest status logs for your active orders
                      </p>
                    </div>

                    {notificationsLoading ? (
                      <p className="px-4 py-4 text-sm text-[var(--text-secondary)]">
                        Loading updates...
                      </p>
                    ) : notificationsError ? (
                      <p className="px-4 py-4 text-sm text-[var(--status-error)]">
                        {notificationsError}
                      </p>
                    ) : visibleOrderNotifications.length === 0 ? (
                      <p className="px-4 py-4 text-sm text-[var(--text-secondary)]">
                        No active order updates right now.
                      </p>
                    ) : (
                      <div className="max-h-[360px] overflow-y-auto">
                        {visibleOrderNotifications.map((order) => (
                          <Link
                            key={order.id}
                            href={`/customer/orders/${order.id}`}
                            onClick={() => setNotificationMenuOpen(false)}
                            className="block px-4 py-3 border-b border-[var(--border-default)] hover:bg-[var(--bg-sunken)] transition-colors"
                          >
                            <p className="text-sm font-semibold text-[var(--text-primary)] line-clamp-1">
                              {getOrderProductLabel(order)}
                            </p>
                            <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">
                              {getLatestLogText(order)}
                            </p>
                            <p className="text-[10px] text-[var(--text-muted)] mt-1 uppercase tracking-wide">
                              {formatOrderStatusLabel(order.status)}
                            </p>
                          </Link>
                        ))}
                      </div>
                    )}

                    {hasMoreOrderNotifications && (
                      <div className="px-4 py-3 bg-[var(--bg-sunken)] border-t border-[var(--border-default)]">
                        <Link
                          href="/customer/orders"
                          onClick={() => setNotificationMenuOpen(false)}
                          className="text-sm font-semibold text-[var(--brand-primary)] hover:opacity-80"
                        >
                          More than 5 updates. Go to My Orders
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Cart */}
            {isCustomerRole && (
              <Link
                href="/customer/cart"
                id="cart-btn"
                onClick={() => {
                  void fetchCart();
                }}
                className="inline-flex p-2 rounded-lg relative text-[var(--text-secondary)] hover:bg-[var(--bg-sunken)] hover:text-[var(--text-primary)]"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartItems > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 w-5 h-5 text-[10px] rounded-full flex items-center justify-center font-bold"
                    style={{
                      background: "var(--brand-primary)",
                      color: "var(--text-inverse)",
                    }}
                  >
                    {cartItems}
                  </span>
                )}
              </Link>
            )}

            {/* User Menu */}
            {mounted &&
              (user ? (
                <div className="relative">
                  <Link
                    href={getDashboardLink()}
                    className="sm:hidden inline-flex p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-sunken)] hover:text-[var(--text-primary)]"
                    aria-label="Open dashboard"
                  >
                    <User className="w-5 h-5" />
                  </Link>

                  <button
                    id="user-menu-btn"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="hidden sm:flex p-1 rounded-full items-center gap-2 border border-[var(--border-default)]"
                  >
                    <div className="w-8 h-8 rounded-full bg-[var(--bg-sunken)] flex items-center justify-center overflow-hidden">
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                        alt="avatar"
                      />
                    </div>
                  </button>

                  {userMenuOpen && (
                    <div
                      className="hidden sm:block absolute right-0 mt-2 w-52 rounded-xl py-2 shadow-lg z-50"
                      style={{
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border-default)",
                        animation: "fadeInUp .15s ease",
                      }}
                    >
                      <Link
                        href="/profile"
                        className="block px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-sunken)] hover:text-[var(--text-primary)]"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Your Account
                      </Link>
                      <Link
                        href="/customer/orders"
                        className="block px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-sunken)] hover:text-[var(--text-primary)]"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        My Orders
                      </Link>{" "}
                      <div className="h-px bg-[var(--border-default)] my-1" />
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-[var(--status-error)] hover:bg-[var(--status-error-bg)]"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    id="login-btn"
                    className="sm:hidden inline-flex p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-sunken)] hover:text-[var(--text-primary)]"
                    aria-label="Login"
                  >
                    <User className="w-5 h-5" />
                  </Link>
                  <Link
                    href="/login"
                    className="px-4 py-2 hidden sm:inline-flex text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    id="signup-btn"
                    className="px-4 py-2 hidden sm:inline-flex items-center gap-1.5 text-sm font-medium border border-[var(--border-strong)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-sunken)] transition-colors"
                  >
                    Sign Up
                  </Link>
                  <Link
                    href="/vendor/apply"
                    id="become-vendor-btn"
                    className="px-4 py-2 hidden sm:inline-flex items-center gap-1.5 text-sm font-medium bg-[var(--brand-primary)] text-[var(--text-inverse)] rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Sell on Markivo
                  </Link>
                  <Link
                    href="/delivery/terms"
                    id="become-delivery-partner-btn"
                    className="px-4 py-2 hidden xl:inline-flex items-center gap-1.5 text-sm font-medium border border-[var(--border-strong)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-sunken)] transition-colors whitespace-nowrap"
                  >
                    Be a Delivery Partner
                  </Link>
                </div>
              ))}

            {/* Mobile Menu Toggle */}
            <button
              id="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-sunken)]"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden pb-3">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2.5 outline-none"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "16px",
                  background: "#F6F5FF",
                  border: "1px solid #E0DEFB",
                  borderRadius: "8px",
                  color: "#1A1A2E",
                }}
              />
              <button
                type="submit"
                className="absolute left-3 top-1/2 -translate-y-1/2"
              >
                <Search className="w-4 h-4" style={{ color: "#9CA3AF" }} />
              </button>
            </form>

            {searchQuery.trim().length >= 2 && (
              <div className="mt-2 rounded-xl border border-[var(--border-default)] overflow-hidden bg-[var(--bg-surface)]">
                {searchLoading ? (
                  <div className="px-3 py-2 text-xs text-[var(--text-secondary)]">
                    Searching products...
                  </div>
                ) : liveSearchResults.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-[var(--text-secondary)]">
                    No products matched your search.
                  </div>
                ) : (
                  liveSearchResults.slice(0, 4).map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleSuggestionSelect(product.id)}
                      className="w-full px-3 py-2 flex items-center gap-3 text-left border-b border-[var(--border-default)] last:border-b-0"
                    >
                      <div className="relative w-10 h-10 rounded-md overflow-hidden shrink-0 bg-[var(--bg-sunken)]">
                        <Image
                          src={
                            product.imageUrl ||
                            (Array.isArray(product.imageUrls)
                              ? product.imageUrls[0]
                              : null) ||
                            "/placeholder-product-1.jpg"
                          }
                          alt={product.name || "Product"}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                          {product.name || "Unnamed Product"}
                        </p>
                        <p className="text-[11px] text-[var(--text-secondary)] truncate">
                          {product.description || "No description available"}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div
            className="md:hidden pb-4 space-y-1"
            style={{ animation: "fadeInUp .15s ease" }}
          >
            <Link
              href="/products"
              className="block px-4 py-2.5 rounded-lg"
              onClick={closeMobileMenu}
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "16px",
                fontWeight: 500,
                color: "#3D3D4E",
              }}
            >
              All Products
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={cat.href}
                className="block px-4 py-2.5 rounded-lg"
                onClick={closeMobileMenu}
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "16px",
                  fontWeight: 500,
                  color: "#6B7280",
                }}
              >
                {cat.name}
              </Link>
            ))}
            {mounted && !user && (
              <>
                <Link
                  href="/login"
                  onClick={closeMobileMenu}
                  className="block px-4 py-2.5 rounded-lg"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "16px",
                    fontWeight: 500,
                    color: "#4F46E5",
                  }}
                >
                  Login
                </Link>
                <Link
                  href="/vendor/apply"
                  onClick={closeMobileMenu}
                  className="block px-4 py-2.5 rounded-lg"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "16px",
                    fontWeight: 500,
                    color: "#3D3D4E",
                  }}
                >
                  Become a Vendor
                </Link>
                <Link
                  href="/delivery/terms"
                  onClick={closeMobileMenu}
                  className="block px-4 py-2.5 rounded-lg"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "16px",
                    fontWeight: 500,
                    color: "#3D3D4E",
                  }}
                >
                  Be a Delivery Partner
                </Link>
              </>
            )}

            {mounted && user && (
              <>
                <div className="h-px bg-[var(--border-default)] my-1" />
                <Link
                  href="/profile"
                  onClick={closeMobileMenu}
                  className="block px-4 py-2.5 rounded-lg text-sm font-black uppercase tracking-widest text-black hover:bg-[var(--bg-sunken)]"
                >
                  Your Account
                </Link>
                <Link
                  href="/customer/orders"
                  onClick={closeMobileMenu}
                  className="block px-4 py-2.5 rounded-lg text-sm font-black uppercase tracking-widest text-black hover:bg-[var(--bg-sunken)]"
                >
                  My Orders
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 rounded-lg"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "16px",
                    fontWeight: 500,
                    color: "var(--status-error)",
                  }}
                >
                  Logout
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── CATEGORY PILLS BAR ── */}
      <div
        ref={categoryPillsRef}
        className="border-t border-[var(--border-default)] overflow-x-auto scrollbar-hide"
        style={{ background: "var(--bg-surface)" }}
      >
        <div className="flex items-center gap-0 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
          {bottomNavPills.map((pill, index) => (
            <Link
              key={pill.label}
              href={pill.href}
              data-pill-index={index}
              className="shrink-0 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors hover:text-[var(--text-primary)] border-b-2 border-transparent hover:border-[var(--brand-primary)]"
              style={{ color: "var(--text-secondary)" }}
            >
              {pill.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
