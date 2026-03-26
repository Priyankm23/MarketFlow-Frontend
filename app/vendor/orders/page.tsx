"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/store";
import {
  fetchVendorProfile,
  isVendorApproved,
  normalizeVendorStatus,
} from "@/lib/vendor-profile";
import { authFetch } from "@/lib/auth-fetch";
import { VendorProfileData } from "@/lib/types";
import {
  BarChart2,
  LayoutDashboard,
  Lock,
  Menu,
  Package,
  PackageSearch,
  Settings,
  ShoppingBag,
  User,
  X,
} from "lucide-react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

const toApiV1BaseUrl = (baseUrl: string) => {
  const trimmed = baseUrl.replace(/\/+$/, "");
  return trimmed.endsWith("/api/v1") ? trimmed : `${trimmed}/api/v1`;
};

const ORDERS_API_BASE_URL = toApiV1BaseUrl(API_BASE_URL);

type VendorOrderItem = {
  id?: string;
  quantity?: number;
  price?: number;
  product?: {
    name?: string;
    price?: number;
    stock?: number;
    imageUrl?: string;
  };
};

type VendorOrderEvent = {
  id?: string;
  status?: string;
  note?: string;
  createdAt?: string;
};

type VendorOrder = {
  id: string;
  totalAmount?: number;
  status?: string;
  createdAt?: string;
  shippingFullName?: string;
  shippingEmail?: string;
  shippingPhoneNumber?: string;
  shippingAddressLine1?: string;
  shippingAddressLine2?: string | null;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  user?: {
    name?: string;
    email?: string;
    phone?: string | number | null;
  };
  items?: VendorOrderItem[];
  events?: VendorOrderEvent[];
};

type VendorOrdersResponse = {
  status?: string;
  message?: string;
  data?: VendorOrder[];
};

const formatDate = (value?: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString();
};

const getOrderStatusTone = (status?: string) => {
  const normalized = (status || "PENDING").toUpperCase();

  if (normalized.includes("DELIVERED") || normalized.includes("PAID")) {
    return "bg-emerald-100 text-emerald-700";
  }

  if (normalized.includes("CANCEL")) {
    return "bg-red-100 text-red-700";
  }

  if (normalized.includes("PENDING") || normalized.includes("PROCESS")) {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-secondary text-foreground";
};

export default function VendorOrdersPage() {
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<VendorProfileData | null>(null);
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    let active = true;

    const loadVendorProfile = async () => {
      if (!user) {
        if (active) {
          setError("Please sign in to access vendor orders.");
          setLoading(false);
        }
        return;
      }

      if (user.role?.toUpperCase() !== "VENDOR") {
        if (active) {
          setError("Only users with vendor role can access this page.");
          setLoading(false);
        }
        return;
      }

      try {
        const vendorProfile = await fetchVendorProfile();
        if (!active) return;
        setProfile(vendorProfile);

        if (!isVendorApproved(vendorProfile?.status)) {
          return;
        }

        const endpoints = [
          `${ORDERS_API_BASE_URL}/orders/vendor-orders`,
          `${ORDERS_API_BASE_URL}/vendor-orders`,
          `${API_BASE_URL}/orders/vendor-orders`,
        ];

        let loaded = false;
        let lastError = "Failed to load vendor orders.";

        for (const endpoint of endpoints) {
          const response = await authFetch(endpoint, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            lastError = payload?.message || "Failed to load vendor orders.";
            continue;
          }

          const payload: VendorOrdersResponse = await response
            .json()
            .catch(() => ({}));

          setOrders(Array.isArray(payload?.data) ? payload.data : []);
          loaded = true;
          break;
        }

        if (!loaded) {
          setError(lastError);
        }
      } catch (err: unknown) {
        if (!active) return;
        const message =
          err instanceof Error ? err.message : "Failed to load vendor profile.";
        setError(message);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadVendorProfile();

    return () => {
      active = false;
    };
  }, [user]);

  const approved = useMemo(
    () => isVendorApproved(profile?.status),
    [profile?.status],
  );

  const status = useMemo(
    () => normalizeVendorStatus(profile?.status),
    [profile?.status],
  );

  const summary = useMemo(() => {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter((order) => {
      const normalized = (order.status || "").toUpperCase();
      return normalized.includes("PENDING") || normalized.includes("PROCESS");
    }).length;

    const cancelledOrders = orders.filter((order) => {
      const normalized = (order.status || "").toUpperCase();
      return normalized.includes("CANCEL");
    }).length;

    const totalRevenue = orders.reduce(
      (sum, order) => sum + Number(order.totalAmount || 0),
      0,
    );

    return {
      totalOrders,
      pendingOrders,
      cancelledOrders,
      totalRevenue,
    };
  }, [orders]);

  const navItems = [
    { href: "/vendor/dashboard", label: "Dashboard", icon: LayoutDashboard },
    {
      href: "/vendor/products",
      label: "Products",
      icon: Package,
      disabled: !approved,
    },
    {
      href: "/vendor/orders",
      label: "Orders",
      icon: ShoppingBag,
      active: true,
      disabled: !approved,
    },
    {
      href: "/vendor/analytics",
      label: "Analytics",
      icon: BarChart2,
      disabled: !approved,
    },
    { href: "/vendor/profile", label: "Profile", icon: User },
    {
      href: "/vendor/settings",
      label: "Settings",
      icon: Settings,
      disabled: !approved,
    },
  ];

  return (
    <div
      className="flex min-h-screen font-body [&_h1]:font-body [&_h2]:font-body [&_h3]:font-body [&_h4]:font-body"
      style={{
        backgroundColor: "var(--bg-base)",
        fontFamily: "var(--font-dm-sans)",
      }}
    >
      {isMobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          className="fixed inset-0 z-40 bg-black/35 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[250px] sm:w-[260px] flex flex-col transform transition-transform duration-300 ease-out ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
        style={{
          borderRight: "1px solid var(--border-default)",
          backgroundColor: "var(--bg-surface)",
        }}
      >
        <div className="p-4 sm:p-6 flex items-center justify-between">
          <Link href="/" className="block">
            <h2
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "22px",
                color: "var(--brand-primary)",
                letterSpacing: "0.03em",
                fontWeight: "normal",
              }}
            >
              MarketFlow
            </h2>
            <p
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                marginTop: "2px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Vendor Hub
            </p>
          </Link>

          <button
            type="button"
            aria-label="Close sidebar"
            className="md:hidden h-8 w-8 rounded-md flex items-center justify-center"
            style={{ color: "var(--text-secondary)" }}
            onClick={() => setIsMobileSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.active;
            return (
              <Link
                key={item.label}
                href={item.disabled ? "#" : item.href}
                onClick={(e) => {
                  if (item.disabled) {
                    e.preventDefault();
                    return;
                  }
                  setIsMobileSidebarOpen(false);
                }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive ? "" : "hover:bg-[var(--bg-sunken)]"
                }`}
                style={{
                  backgroundColor: isActive
                    ? "var(--brand-primary)"
                    : "transparent",
                  color: isActive
                    ? "var(--text-inverse)"
                    : "var(--text-secondary)",
                  opacity: item.disabled ? 0.5 : 1,
                  pointerEvents: item.disabled ? "none" : "auto",
                  fontWeight: isActive ? 500 : 400,
                }}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div
          className="p-4 mt-auto"
          style={{ borderTop: "1px solid var(--border-default)" }}
        >
          <div className="flex items-center gap-3 px-3 py-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: "var(--bg-sunken)",
                color: "var(--text-secondary)",
              }}
            >
              <User size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-medium truncate"
                style={{ color: "var(--text-primary)" }}
              >
                {user?.name || "Vendor"}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 ml-0 md:ml-[260px] flex flex-col min-h-screen">
        <header
          className="h-16 md:h-[72px] px-4 sm:px-6 md:px-8 flex items-center justify-between sticky top-0 z-30"
          style={{
            backgroundColor: "var(--bg-base)",
            borderBottom: "1px solid var(--border-default)",
          }}
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open sidebar"
              className="md:hidden h-9 w-9 rounded-md flex items-center justify-center"
              style={{
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
              }}
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <Menu size={18} />
            </button>

            <div className="flex flex-col gap-0.5">
              <h1
                className="text-2xl sm:text-3xl font-normal"
                style={{
                  letterSpacing: "0.04em",
                  color: "var(--text-primary)",
                }}
              >
                Order Management
              </h1>
              <p
                className="hidden sm:block text-xs font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                Review customer orders and prepare dispatch quickly.
              </p>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 md:p-8 max-w-7xl w-full space-y-6">
          {loading && (
            <div className="bg-card border border-border rounded-xl p-6 text-sm text-muted-foreground">
              Loading orders module...
            </div>
          )}

          {!loading && error && (
            <div className="bg-card border border-rose-200 rounded-xl p-6 text-sm text-rose-700">
              {error}
            </div>
          )}

          {!loading && !error && !profile && (
            <div className="bg-card border border-amber-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-amber-700">
                Vendor profile required
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                You need to complete your vendor application before accessing
                orders.
              </p>
              <Link
                href="/vendor/apply"
                className="inline-flex items-center mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Fill Vendor Form
              </Link>
            </div>
          )}

          {!loading && !error && profile && !approved && (
            <div className="bg-card border border-amber-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 mt-0.5 text-amber-700" />
                <div>
                  <h2 className="text-lg font-semibold text-amber-700">
                    Orders are locked until approval
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Current status: {status}. Once your profile is approved,
                    order management will become available.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && profile && approved && (
            <>
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Total Orders
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">
                    {summary.totalOrders.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Pending
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-amber-700">
                    {summary.pendingOrders.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Cancelled
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-red-700">
                    {summary.cancelledOrders.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    GMV
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">
                    ₹{summary.totalRevenue.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              {orders.length === 0 ? (
                <div className="bg-card border border-border rounded-xl p-10 text-center">
                  <PackageSearch className="w-10 h-10 mx-auto text-muted-foreground" />
                  <h2 className="text-xl font-semibold mt-4">No orders yet</h2>
                  <p className="text-sm text-muted-foreground mt-2">
                    Your store is active. Orders will appear here as soon as
                    customers start purchasing your products.
                  </p>
                  <div className="mt-4">
                    <Link
                      href="/vendor/products"
                      className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                    >
                      Add Products
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {orders.map((order) => {
                    const normalizedStatus = (order.status || "").toUpperCase();
                    const latestEvent = order.events?.[0];
                    const isCancelled =
                      normalizedStatus === "CANCELLED" ||
                      normalizedStatus === "CANCELED";
                    const cancellationReason =
                      latestEvent?.note?.trim() ||
                      "Order was cancelled by the system or customer.";

                    return (
                      <article
                        key={order.id}
                        className="rounded-xl border border-border bg-card p-5 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                              Order
                            </p>
                            <p className="mt-1 font-mono text-sm text-foreground break-all">
                              {order.id}
                            </p>
                            <p className="mt-2 text-xs text-muted-foreground">
                              {formatDate(order.createdAt)}
                            </p>
                          </div>
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getOrderStatusTone(order.status)}`}
                          >
                            {(order.status || "PENDING").replaceAll("_", " ")}
                          </span>
                        </div>

                        <div className="mt-4 rounded-lg border border-border bg-secondary/40 p-3">
                          <p className="text-sm font-medium text-foreground">
                            {order.user?.name ||
                              order.shippingFullName ||
                              "Unknown customer"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 break-all">
                            {order.user?.email ||
                              order.shippingEmail ||
                              "No email"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {order.shippingCity || "-"},{" "}
                            {order.shippingState || "-"}
                          </p>
                        </div>

                        <div className="mt-4 space-y-2">
                          {(order.items || []).slice(0, 2).map((item, idx) => {
                            const qty = Math.max(1, Number(item.quantity || 1));
                            const price = Number(
                              item.product?.price ?? item.price ?? 0,
                            );
                            return (
                              <div
                                key={item.id || `${order.id}-${idx}`}
                                className="flex items-center justify-between text-sm"
                              >
                                <p className="text-foreground truncate pr-2">
                                  {item.product?.name || "Product"}
                                </p>
                                <p className="text-muted-foreground whitespace-nowrap">
                                  {qty} x ₹{price.toLocaleString("en-IN")}
                                </p>
                              </div>
                            );
                          })}

                          {(order.items || []).length > 2 && (
                            <p className="text-xs text-muted-foreground">
                              +{(order.items || []).length - 2} more items
                            </p>
                          )}
                        </div>

                        {isCancelled && (
                          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                              Cancelled
                            </p>
                            <p className="text-sm text-red-700/90 mt-1">
                              {cancellationReason}
                            </p>
                          </div>
                        )}

                        <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                          <p className="text-sm text-muted-foreground">Total</p>
                          <p className="text-lg font-semibold text-foreground">
                            ₹
                            {Number(order.totalAmount || 0).toLocaleString(
                              "en-IN",
                            )}
                          </p>
                        </div>

                        <div className="mt-4 flex justify-end">
                          <Link
                            href={`/vendor/orders/${order.id}`}
                            className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                          >
                            View Workbench
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
