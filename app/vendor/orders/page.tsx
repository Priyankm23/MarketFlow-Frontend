"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuthStore, useVendorStore } from "@/lib/store";
import {
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
  IndianRupee,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  CalendarClock,
  Plus,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/config";

const ORDERS_API_BASE_URL = API_BASE_URL;

// --- REUSABLE COMPONENTS (Consistent with Dashboard) ---

function StatusBadge({ status }: { status: string }) {
  const normalized = (status || "PENDING").toUpperCase();
  const config: Record<
    string,
    { label: string; bg: string; color: string; dot: boolean }
  > = {
    APPROVED: {
      label: "Approved",
      bg: "bg-emerald-50",
      color: "text-emerald-700",
      dot: true,
    },
    PENDING: {
      label: "Pending",
      bg: "bg-amber-50",
      color: "text-amber-700",
      dot: true,
    },
    REJECTED: {
      label: "Rejected",
      bg: "bg-rose-50",
      color: "text-rose-700",
      dot: false,
    },
    CONFIRMED: {
      label: "Confirmed",
      bg: "bg-indigo-50",
      color: "text-indigo-700",
      dot: true,
    },
    DELIVERED: {
      label: "Delivered",
      bg: "bg-emerald-100",
      color: "text-emerald-800",
      dot: false,
    },
    CANCELLED: {
      label: "Cancelled",
      bg: "bg-rose-100",
      color: "text-rose-800",
      dot: false,
    },
  };

  const c = config[normalized] || {
    label: normalized.replaceAll("_", " "),
    bg: "bg-slate-100",
    color: "text-slate-700",
    dot: false,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm border border-black/5 ${c.bg} ${c.color}`}
    >
      {c.dot && (
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ backgroundColor: "currentColor" }}
        />
      )}
      {c.label}
    </span>
  );
}

function StatCard({ label, value, delta, deltaType, icon: Icon, prefix, colorClass }: any) {
  return (
    <div
      className="bg-card rounded-2xl p-4 sm:p-5 border border-border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
    >
      <div className={`absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 -mr-8 -mt-8 rounded-full opacity-10 transition-transform group-hover:scale-110 ${colorClass || "bg-primary"}`} />
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-1.5 sm:space-y-3">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.1em] sm:tracking-widest text-muted-foreground truncate">
            {label}
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-3xl font-bold text-foreground tracking-tight">
              {prefix}{value}
            </span>
          </div>
          {delta && (
            <div
              className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-lg text-[9px] sm:text-xs font-bold ${
                deltaType === "up"
                  ? "bg-emerald-50 text-emerald-700"
                  : deltaType === "down"
                    ? "bg-rose-50 text-rose-700"
                    : "bg-slate-50 text-slate-700"
              }`}
            >
              <span className="shrink-0">{deltaType === "up" ? "↑" : deltaType === "down" ? "↓" : "•"}</span>
              <span className="truncate max-w-[60px] sm:max-w-none italic">{delta}</span>
            </div>
          )}
        </div>
        <div
          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm border border-black/5 shrink-0 ${colorClass || "bg-primary/10 text-primary"}`}
        >
          <Icon size={18} className="sm:w-[22px] sm:h-[22px]" />
        </div>
      </div>
    </div>
  );
}

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

const isCancelledOrder = (status?: string) =>
  (status || "").toUpperCase().includes("CANCEL");

export default function VendorOrdersPage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { profile, loadProfile, isLoading: loadingProfile } = useVendorStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ORDERS_PER_PAGE = 10;

  useEffect(() => {
    if (user?.role?.toUpperCase() === "VENDOR") {
      loadProfile();
    }
  }, [user, loadProfile]);

  useEffect(() => {
    let active = true;

    const loadOrders = async () => {
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

      if (!profile) {
        if (!loadingProfile) {
          setLoading(false);
        }
        return;
      }

      try {
        if (!isVendorApproved(profile?.status)) {
          setLoading(false);
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

    void loadOrders();

    return () => {
      active = false;
    };
  }, [user, profile, loadingProfile]);

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

    const cancelledOrders = orders.filter((order) =>
      isCancelledOrder(order.status),
    ).length;

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

  const [activeTab, setActiveTab] = useState<"active" | "delivered">("active");

  const activeOrders = useMemo(
    () => orders.filter((order) => {
      const status = (order.status || "").toUpperCase();
      return !isCancelledOrder(order.status) && status !== "DELIVERED";
    }),
    [orders],
  );

  const deliveredOrders = useMemo(
    () => orders.filter((order) => (order.status || "").toUpperCase() === "DELIVERED"),
    [orders],
  );

  const currentOrderList = activeTab === "active" ? activeOrders : deliveredOrders;

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ORDERS_PER_PAGE;
    return currentOrderList.slice(startIndex, startIndex + ORDERS_PER_PAGE);
  }, [currentOrderList, currentPage]);

  const totalPages = Math.ceil(currentOrderList.length / ORDERS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [orders.length, activeTab]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

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

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[250px] sm:w-[260px] flex flex-col border-r border-[var(--border-default)] bg-[var(--bg-surface)] transform transition-transform duration-300 ease-out ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="p-4 sm:p-6 flex items-center justify-between">
          <Link href="/vendor/dashboard" className="block">
            <Image
              src="/logo/logo.png"
              alt="Markivo"
              width={172}
              height={46}
              className="h-9 sm:h-10 w-auto"
              priority
            />
            <p
              className="text-[11px] font-bold text-muted-foreground mt-0.5 uppercase tracking-widest"
            >
              Vendor Hub
            </p>
          </Link>

          <button
            type="button"
            aria-label="Close sidebar"
            className="md:hidden h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-slate-100"
            onClick={() => setIsMobileSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 mb-6">
          <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
            <h3 className="font-bold text-foreground text-sm truncate">
              {profile?.businessName || "My Store"}
            </h3>
            <div className="mt-2">
              <StatusBadge status={status || "PENDING"} />
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5">
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
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 group ${
                  isActive ? "shadow-md" : "hover:bg-primary/5"
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
                  fontWeight: isActive ? 600 : 500,
                }}
              >
                <Icon size={18} className={`${isActive ? "" : "group-hover:text-primary transition-colors"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div
          className="p-5 mt-auto"
          style={{ borderTop: "1px solid var(--border-default)" }}
        >
          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/50">
            <div className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-primary border border-black/5">
              <User size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-foreground">
                {user?.name || "Vendor"}
              </p>
            </div>
            <button 
              onClick={() => logout()}
              className="text-muted-foreground hover:text-rose-600 transition-colors p-1.5 hover:bg-rose-50 rounded-lg"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 ml-0 md:ml-[260px] flex flex-col min-h-screen">
        <header
          className="h-16 md:h-[72px] px-4 sm:px-6 md:px-8 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-40 border-b border-border"
        >
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Open sidebar"
              className="md:hidden h-9 w-9 rounded-xl border border-border bg-white text-foreground hover:bg-slate-50 flex items-center justify-center shadow-sm"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <Menu size={18} />
            </button>

            <div className="space-y-0.5">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Orders
              </h1>
              <p className="hidden sm:block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Manage your customer orders
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
          </div>
        </header>

        <div className="p-5 md:p-8 max-w-[1400px] w-full mx-auto space-y-8">
          {(loading || loadingProfile) && (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="h-10 w-10 animate-spin mb-4 text-primary" />
              <p className="text-sm font-medium">Loading orders data...</p>
            </div>
          )}

          {!(loading || loadingProfile) && error && (
            <div className="bg-card border border-rose-200 rounded-3xl p-10 text-center max-w-2xl mx-auto shadow-xl shadow-rose-900/5">
              <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-rose-100">
                <X size={40} />
              </div>
              <h2 className="text-3xl font-bold text-foreground tracking-tight">
                An error occurred
              </h2>
              <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
                {error}
              </p>
            </div>
          )}

          {!(loading || loadingProfile) && !error && !profile && (
            <div className="bg-card border border-amber-200 rounded-3xl p-10 text-center max-w-2xl mx-auto shadow-xl shadow-amber-900/5">
              <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-amber-100">
                <User size={40} />
              </div>
              <h2 className="text-3xl font-bold text-foreground tracking-tight">
                Profile Required
              </h2>
              <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
                You need to complete your vendor application before accessing
                orders.
              </p>
              <Link
                href="/vendor/apply"
                className="inline-flex items-center justify-center px-8 py-4 mt-8 rounded-2xl text-base font-bold transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95 bg-primary text-white"
              >
                Complete Application
              </Link>
            </div>
          )}

          {!(loading || loadingProfile) && !error && profile && !isVendorApproved(profile.status) && (
            <div className="bg-card border border-amber-200 rounded-3xl p-10 text-center max-w-2xl mx-auto shadow-xl shadow-amber-900/5">
              <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-amber-100">
                <Lock size={40} />
              </div>
              <h2 className="text-3xl font-bold text-foreground tracking-tight">
                Orders are locked
              </h2>
              <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
                Current status: {normalizeVendorStatus(profile.status)}. Once your profile is approved,
                order management will become available.
              </p>
            </div>
          )}

          {!(loading || loadingProfile) && !error && profile && isVendorApproved(profile.status) && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                <StatCard
                  label="Total Orders"
                  value={summary.totalOrders.toLocaleString()}
                  delta="Order Volume"
                  deltaType="neutral"
                  icon={ShoppingBag}
                  colorClass="bg-primary text-white"
                />
                <StatCard
                  label="Pending"
                  value={summary.pendingOrders.toLocaleString()}
                  delta="Action Needed"
                  deltaType="down"
                  icon={CalendarClock}
                  colorClass="bg-amber-500 text-white"
                />
                <StatCard
                  label="Cancelled"
                  value={summary.cancelledOrders.toLocaleString()}
                  delta="Lost Potential"
                  deltaType="down"
                  icon={X}
                  colorClass="bg-rose-500 text-white"
                />
                <StatCard
                  label="GMV"
                  value={summary.totalRevenue.toLocaleString("en-IN")}
                  prefix="₹"
                  delta="Total Gross Value"
                  deltaType="up"
                  icon={IndianRupee}
                  colorClass="bg-emerald-500 text-white"
                />
              </div>

              {/* TABS SECTION */}
              <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-2xl w-fit">
                <button
                  onClick={() => setActiveTab("active")}
                  className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    activeTab === "active"
                      ? "bg-white text-primary shadow-sm ring-1 ring-black/5"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Active Orders ({activeOrders.length})
                </button>
                <button
                  onClick={() => setActiveTab("delivered")}
                  className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    activeTab === "delivered"
                      ? "bg-white text-emerald-600 shadow-sm ring-1 ring-black/5"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Delivered ({deliveredOrders.length})
                </button>
              </div>

              {currentOrderList.length === 0 ? (
                <div className="col-span-full py-20 text-center border-2 border-dashed border-border rounded-3xl bg-slate-50/50">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-border">
                    <PackageSearch size={32} className="text-muted-foreground/40" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">
                    {activeTab === "active" ? "No active orders yet" : "No delivered orders yet"}
                  </h3>
                  <p className="text-muted-foreground mt-1 max-w-xs mx-auto">
                    {activeTab === "active" 
                      ? "Your store is active. New orders will appear here as customers purchase your products."
                      : "Orders you complete will appear here for your records."}
                  </p>
                  {activeTab === "active" && (
                    <Link
                      href="/vendor/products"
                      className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-white border border-border rounded-2xl text-sm font-bold text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                    >
                      <Plus size={18} />
                      Manage Catalog
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {paginatedOrders.map((order) => {
                      const items = order.items || [];
                      const primaryItem = items[0];
                      const primaryProduct = primaryItem?.product;
                      const primaryName = primaryProduct?.name || "Product";
                      const primaryImage = primaryProduct?.imageUrl || "/placeholder.svg";
                      const primaryQty = Math.max(
                        1,
                        Number(primaryItem?.quantity || 1),
                      );
                      const primaryPrice = Number(
                        primaryProduct?.price ?? primaryItem?.price ?? 0,
                      );
                      const additionalCount = Math.max(items.length - 1, 0);
                      const orderRef = order.id.slice(-8);

                      return (
                        <article
                          key={order.id}
                          className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col md:flex-row h-full"
                        >
                          {/* PRODUCT IMAGE SECTION */}
                          <div className="md:w-48 h-48 md:h-full relative bg-slate-50 border-b md:border-b-0 md:border-r border-border shrink-0 overflow-hidden">
                            <Image
                              src={primaryImage}
                              alt={primaryName}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-2 left-2">
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm border border-black/5 ${getOrderStatusTone(order.status)}`}
                              >
                                {(order.status || "PENDING").replaceAll("_", " ")}
                              </span>
                            </div>
                          </div>

                          {/* CONTENT SECTION */}
                          <div className="flex-1 p-5 flex flex-col">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="min-w-0">
                                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                                  Order #{orderRef.toUpperCase()}
                                </p>
                                <h3 className="text-lg font-bold text-foreground truncate mt-1">
                                  {primaryName}
                                </h3>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-lg font-bold text-primary">
                                  ₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}
                                </p>
                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                                  Total Amount
                                </p>
                              </div>
                            </div>

                            <div className="mt-auto space-y-3">
                              <div className="flex items-center gap-4 text-xs">
                                <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 flex items-center gap-2">
                                  <span className="text-muted-foreground font-bold">Qty:</span>
                                  <span className="text-foreground font-bold">{primaryQty}</span>
                                </div>
                                {additionalCount > 0 && (
                                  <p className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                                    <Plus size={10} /> {additionalCount} more item{additionalCount > 1 ? "s" : ""}
                                  </p>
                                )}
                              </div>

                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-border/50">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 border border-slate-200">
                                    <User size={14} />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-foreground truncate">
                                      {order.user?.name || order.shippingFullName || "Customer"}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground truncate font-medium">
                                      {order.shippingCity || "Unknown City"}
                                    </p>
                                  </div>
                                </div>

                                <Link
                                  href={`/vendor/orders/${order.id}`}
                                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 border border-primary/10 bg-primary/5 text-primary hover:bg-primary hover:text-white active:scale-95"
                                >
                                  View Workbench
                                  <ChevronRight size={14} />
                                </Link>

                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  {/* PAGINATION UI */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-8 pb-12">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="h-10 w-10 rounded-xl border border-border flex items-center justify-center hover:bg-slate-50 disabled:opacity-50 transition-all active:scale-90"
                      >
                        <ChevronLeft size={18} />
                      </button>

                      <div className="flex items-center gap-1.5 px-4">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                          // Show first page, last page, current page, and pages around current page
                          const isGap = page !== 1 && page !== totalPages && Math.abs(page - currentPage) > 1;
                          const showPage = !isGap;

                          if (isGap) {
                            if (page === 2 || page === totalPages - 1) {
                              return <span key={page} className="text-muted-foreground px-1">...</span>;
                            }
                            return null;
                          }

                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`h-10 min-w-[40px] px-2 rounded-xl text-xs font-bold border transition-all active:scale-90 ${
                                currentPage === page
                                  ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                                  : "border-border hover:bg-slate-50 text-muted-foreground"
                              }`}
                            >
                              {page}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="h-10 w-10 rounded-xl border border-border flex items-center justify-center hover:bg-slate-50 disabled:opacity-50 transition-all active:scale-90"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
