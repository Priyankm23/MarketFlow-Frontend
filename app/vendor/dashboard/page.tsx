"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuthStore, useVendorStore } from "@/lib/store";
import { authFetch } from "@/lib/auth-fetch";
import { API_BASE_URL } from "@/lib/config";
import {
  isVendorApproved,
  normalizeVendorStatus,
} from "@/lib/vendor-profile";
import { VendorProfileData } from "@/lib/types";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  BarChart2,
  Settings,
  Bell,
  IndianRupee,
  AlertTriangle,
  ChevronRight,
  LogOut,
  User,
  ShieldCheck,
  ShieldAlert,
  Menu,
  X,
  Loader2,
  CalendarClock,
} from "lucide-react";

// --- REUSABLE COMPONENTS (Specific to new design) ---

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

type VendorDashboardSummary = {
  totalRevenue: string;
  revenueChangePctThisWeek: number;
  activeOrders: number;
  activeOrdersDeltaSinceYesterday: number;
  totalProducts: number;
  lowStockItems: number;
  lowStockThreshold: number;
};

type VendorRecentOrder = {
  orderId: string;
  customerName: string;
  itemCount: number;
  amount: number;
  status: string;
  createdAt: string;
};

type VendorStockAlert = {
  productId: string;
  name: string;
  imageUrl: string | null;
  stock: number;
  isOutOfStock: boolean;
};

type VendorDashboardData = {
  summary: VendorDashboardSummary;
  recentOrders: VendorRecentOrder[];
  stockAlerts: VendorStockAlert[];
};

const formatCurrency = (value: number) =>
  value.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

const formatOrderDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function VendorDashboard() {
  const user = useAuthStore((state) => state.user);
  const { profile, loadProfile, isLoading: loadingProfile } = useVendorStore();

  const [dashboardData, setDashboardData] = useState<VendorDashboardData | null>(
    null,
  );
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState("");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (user?.role?.toUpperCase() === "VENDOR") {
      loadProfile();
    }
  }, [user, loadProfile]);

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      if (!user || user.role?.toUpperCase() !== "VENDOR" || !profile) {
        return;
      }


      setDashboardLoading(true);
      setDashboardError("");

      try {
        const params = new URLSearchParams({
          recentOrdersLimit: "5",
          lowStockThreshold: "5",
        });
        const response = await authFetch(
          `${API_BASE_URL}/vendors/dashboard?${params.toString()}`,
        );

        if (!response.ok) {
          throw new Error("Failed to load vendor dashboard data.");
        }

        const payload = await response.json().catch(() => ({}));
        if (!payload?.data || payload?.status !== "success") {
          throw new Error("Invalid dashboard response.");
        }

        if (active) {
          setDashboardData(payload.data as VendorDashboardData);
        }
      } catch (error) {
        if (active) {
          setDashboardError(
            error instanceof Error
              ? error.message
              : "Unable to load dashboard data.",
          );
        }
      } finally {
        if (active) {
          setDashboardLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      active = false;
    };
  }, [user]);

  const status = normalizeVendorStatus(profile?.status);
  const approved = isVendorApproved(profile?.status);
  const summary = dashboardData?.summary;
  const recentOrders = dashboardData?.recentOrders ?? [];
  const lowStockItems = dashboardData?.stockAlerts ?? [];

  const navItems = [
    {
      href: "/vendor/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      active: true,
    },
    { href: "/vendor/products", label: "Products", icon: Package },
    { href: "/vendor/orders", label: "Orders", icon: ShoppingBag },
    { href: "/vendor/analytics", label: "Analytics", icon: BarChart2 },
    { href: "/vendor/profile", label: "Profile", icon: User },
    { href: "/vendor/settings", label: "Settings", icon: Settings },
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
                href={item.href}
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
                  fontWeight: isActive ? 600 : 500,
                }}
                onClick={() => setIsMobileSidebarOpen(false)}
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
            <button className="text-muted-foreground hover:text-rose-600 transition-colors p-1.5 hover:bg-rose-50 rounded-lg">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 ml-0 md:ml-[260px] flex flex-col min-h-screen">
        {/* TOP BAR */}
        <header
          className="h-16 md:h-[72px] px-4 md:px-8 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-40 border-b border-border"
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
                Dashboard
              </h1>
              <p className="hidden sm:block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Platform Overview
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2.5 text-muted-foreground hover:bg-slate-100 rounded-xl transition-all border border-transparent hover:border-slate-200 shadow-sm md:shadow-none">
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="p-5 md:p-8 max-w-[1400px] w-full mx-auto">
          {loadingProfile ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="h-10 w-10 animate-spin mb-4 text-primary" />
              <p className="text-sm font-medium">Synchronizing dashboard data...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {!approved ? (
                <div className="bg-card border border-amber-200 rounded-3xl p-10 text-center max-w-2xl mx-auto mt-6 shadow-xl shadow-amber-900/5">
                  <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-amber-100">
                    <AlertTriangle size={40} />
                  </div>
                  <h2 className="text-3xl font-bold text-foreground tracking-tight">
                    Account Pending Approval
                  </h2>
                  <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
                    Your vendor application is currently under review. You will be able to manage products and view orders once your store is approved.
                  </p>
                  <Link
                    href="/vendor/profile"
                    className="inline-flex items-center justify-center px-8 py-4 mt-8 rounded-2xl text-base font-bold transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95"
                    style={{
                      backgroundColor: "var(--brand-primary)",
                      color: "var(--text-inverse)",
                    }}
                  >
                    Check Application Status
                  </Link>
                </div>
              ) : (
                <>
                  {/* STATS ROW */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                    <StatCard
                      label="Total Revenue"
                      value={
                        summary?.totalRevenue
                          ? formatCurrency(Number(summary.totalRevenue))
                          : "0"
                      }
                      prefix="₹"
                      delta={
                        typeof summary?.revenueChangePctThisWeek === "number"
                          ? `${Math.abs(summary.revenueChangePctThisWeek)}% this week`
                          : ""
                      }
                      deltaType={
                        summary?.revenueChangePctThisWeek > 0
                          ? "up"
                          : summary?.revenueChangePctThisWeek < 0
                            ? "down"
                            : "neutral"
                      }
                      icon={IndianRupee}
                      colorClass="bg-emerald-500 text-white"
                    />
                    <StatCard
                      label="Active Orders"
                      value={summary?.activeOrders ?? "0"}
                      delta={
                        typeof summary?.activeOrdersDeltaSinceYesterday ===
                        "number"
                          ? `${Math.abs(summary.activeOrdersDeltaSinceYesterday)} since yesterday`
                          : ""
                      }
                      deltaType={
                        summary?.activeOrdersDeltaSinceYesterday > 0
                          ? "up"
                          : summary?.activeOrdersDeltaSinceYesterday < 0
                            ? "down"
                            : "neutral"
                      }
                      icon={ShoppingBag}
                      colorClass="bg-indigo-500 text-white"
                    />
                    <StatCard
                      label="Total Products"
                      value={summary?.totalProducts ?? "0"}
                      delta="Live Catalog"
                      deltaType="neutral"
                      icon={Package}
                      colorClass="bg-primary text-white"
                    />
                    <StatCard
                      label="Stock Alerts"
                      value={summary?.lowStockItems ?? "0"}
                      delta={
                        summary?.lowStockThreshold
                          ? `Below ${summary.lowStockThreshold} units`
                          : "Needs attention"
                      }
                      deltaType="down"
                      icon={AlertTriangle}
                      colorClass="bg-rose-500 text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* RECENT ORDERS TABLE */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                          Recent Orders
                          <span className="bg-primary/10 text-primary text-[10px] uppercase font-bold px-2 py-0.5 rounded-md">Real-time</span>
                        </h2>
                        <Link
                          href="/vendor/orders"
                          className="text-sm font-bold hover:text-primary transition-colors flex items-center gap-1 group"
                        >
                          View Full History <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      </div>

                      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[700px] text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50/50">
                                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                                  Order ID
                                </th>
                                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                                  Customer
                                </th>
                                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                                  Amount
                                </th>
                                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                                  Status
                                </th>
                                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                                  Timeline
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {recentOrders.length === 0 ? (
                                <tr>
                                  <td
                                    className="px-6 py-10 text-sm text-center text-muted-foreground"
                                    colSpan={5}
                                  >
                                    <div className="flex flex-col items-center">
                                      <ShoppingBag className="w-10 h-10 text-slate-200 mb-3" />
                                      {dashboardLoading
                                        ? "Fetching recent orders..."
                                        : dashboardError || "No recent orders to display."}
                                    </div>
                                  </td>
                                </tr>
                              ) : (
                                recentOrders.map((order, idx) => (
                                  <tr
                                    key={order.orderId}
                                    className={`group hover:bg-slate-50/50 transition-colors ${idx !== recentOrders.length - 1 ? "border-b border-border" : ""}`}
                                  >
                                  <td className="px-6 py-5">
                                    <span className="text-sm font-bold text-foreground font-mono">
                                      #{order.orderId.slice(-8).toUpperCase()}
                                    </span>
                                  </td>
                                  <td className="px-6 py-5">
                                    <div className="flex flex-col">
                                      <span className="text-sm font-bold text-foreground">
                                        {order.customerName || "Customer"}
                                      </span>
                                      <span className="text-xs text-muted-foreground mt-0.5 font-medium">
                                        {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-5">
                                    <span className="text-sm font-bold text-foreground">
                                      ₹{formatCurrency(order.amount)}
                                    </span>
                                  </td>
                                  <td className="px-6 py-5">
                                    <StatusBadge status={order.status} />
                                  </td>
                                  <td className="px-6 py-5">
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                                      <CalendarClock size={14} />
                                      {formatOrderDate(order.createdAt)}
                                    </div>
                                  </td>
                                </tr>
                              ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* STOCK ALERTS */}
                    <div className="space-y-6">
                      <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                        Inventory Alerts
                        {lowStockItems.length > 0 && (
                          <span className="bg-rose-100 text-rose-600 text-[10px] uppercase font-bold px-2 py-0.5 rounded-md animate-pulse">Action Required</span>
                        )}
                      </h2>
                      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
                        {lowStockItems.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-6 text-center">
                            <ShieldCheck className="w-12 h-12 text-emerald-200 mb-3" />
                            <p className="text-sm font-bold text-emerald-800">Inventory Healthy</p>
                            <p className="text-xs text-emerald-600 mt-1">All products are well stocked.</p>
                          </div>
                        ) : (
                          lowStockItems.map((item) => (
                            <div
                              key={item.productId}
                              className="flex items-center gap-4 group"
                            >
                              <div className="relative">
                                <img
                                  src={item.imageUrl || "/placeholder.svg"}
                                  alt={item.name}
                                  className="w-14 h-14 rounded-xl object-cover border border-border shadow-sm"
                                />
                                {item.isOutOfStock && (
                                  <div className="absolute inset-0 bg-rose-500/10 rounded-xl border border-rose-500/20" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-foreground truncate">
                                  {item.name}
                                </p>
                                <div className="mt-1.5 flex items-center gap-2">
                                  <span
                                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                                      item.isOutOfStock
                                        ? "bg-rose-50 text-rose-600 border border-rose-100"
                                        : "bg-amber-50 text-amber-600 border border-amber-100"
                                    }`}
                                  >
                                    {item.isOutOfStock
                                      ? "Sold Out"
                                      : `${item.stock} Units Left`}
                                  </span>
                                </div>
                              </div>
                              <Link
                                href={`/vendor/products/edit/${item.productId}`}
                                className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-all border border-transparent hover:border-primary/10 shadow-sm"
                              >
                                <ChevronRight size={18} />
                              </Link>
                            </div>
                          ))
                        )}
                        <Link 
                          href="/vendor/products"
                          className="w-full inline-flex items-center justify-center py-3.5 text-sm font-bold rounded-xl border border-border bg-slate-50 hover:bg-slate-100 transition-all text-foreground shadow-sm"
                        >
                          Manage Inventory
                        </Link>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
