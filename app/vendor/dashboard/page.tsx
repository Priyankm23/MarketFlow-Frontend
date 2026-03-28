"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/store";
import {
  fetchVendorProfile,
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
  Search,
  IndianRupee,
  AlertTriangle,
  ChevronRight,
  LogOut,
  User,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";

// --- REUSABLE COMPONENTS (Specific to new design) ---

function StatusBadge({ status }: { status: string }) {
  const config: Record<
    string,
    { label: string; bg: string; color: string; dot: boolean }
  > = {
    APPROVED: {
      label: "Approved",
      bg: "var(--status-success-bg)",
      color: "var(--status-success)",
      dot: false,
    },
    PENDING: {
      label: "Pending Review",
      bg: "var(--status-warning-bg)",
      color: "var(--status-warning)",
      dot: true,
    },
    REJECTED: {
      label: "Rejected",
      bg: "var(--status-error-bg)",
      color: "var(--status-error)",
      dot: false,
    },
    SUSPENDED: {
      label: "Suspended",
      bg: "#FDF4FF",
      color: "#9333EA",
      dot: false,
    },
    DELIVERED: {
      label: "Delivered",
      bg: "var(--status-success-bg)",
      color: "var(--status-success)",
      dot: false,
    },
    CONFIRMED: {
      label: "Confirmed",
      bg: "var(--status-info-bg)",
      color: "var(--status-info)",
      dot: true,
    },
  };

  const c = config[status] || {
    label: status,
    bg: "var(--status-neutral-bg)",
    color: "var(--status-neutral)",
    dot: false,
  };

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{
        backgroundColor: c.bg,
        color: c.color,
        fontFamily: "var(--font-dm-sans)",
      }}
    >
      {c.dot && (
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: "currentColor" }}
        />
      )}
      {c.label}
    </span>
  );
}

function StatCard({ label, value, delta, deltaType, icon: Icon, prefix }: any) {
  return (
    <div
      className="bg-white rounded-xl p-6"
      style={{
        boxShadow: "var(--shadow-card)",
        fontFamily: "var(--font-dm-sans)",
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
            {label}
          </p>
          <p
            className="mt-2"
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "2rem",
              color: "var(--text-primary)",
              lineHeight: 1,
              fontWeight: 500,
            }}
          >
            {prefix}
            {value}
          </p>
          {delta && (
            <p
              className="mt-2 text-xs font-medium"
              style={{
                color:
                  deltaType === "up"
                    ? "var(--status-success)"
                    : deltaType === "down"
                      ? "var(--status-error)"
                      : "var(--text-secondary)",
              }}
            >
              {delta}
            </p>
          )}
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: "var(--bg-sunken)" }}
        >
          <Icon size={20} style={{ color: "var(--text-primary)" }} />
        </div>
      </div>
    </div>
  );
}

export default function VendorDashboard() {
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<VendorProfileData | null>(null);

  useEffect(() => {
    let active = true;
    const loadVendorProfile = async () => {
      if (!user || user.role?.toUpperCase() !== "VENDOR") {
        if (active) setLoading(false);
        return;
      }
      try {
        const vendorProfile = await fetchVendorProfile();
        if (active) setProfile(vendorProfile);
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadVendorProfile();
    return () => {
      active = false;
    };
  }, [user]);

  const status = normalizeVendorStatus(profile?.status);
  const approved = isVendorApproved(profile?.status);

  // --- DUMMY DATA FOR DASHBOARD ---
  const recentOrders = [
    {
      id: "ORD-7029",
      customer: "Rahul Sharma",
      items: 3,
      amount: 4299,
      status: "CONFIRMED",
      date: "Today, 10:42 AM",
    },
    {
      id: "ORD-7028",
      customer: "Priya Patel",
      items: 1,
      amount: 899,
      status: "DELIVERED",
      date: "Yesterday",
    },
    {
      id: "ORD-7025",
      customer: "Amit Singh",
      items: 2,
      amount: 1249,
      status: "PENDING",
      date: "Mar 15",
    },
  ];

  const lowStockItems = [
    {
      id: 1,
      name: "Wireless Earbuds Pro",
      stock: 2,
      image:
        "https://images.unsplash.com/photo-1606220588913-b3aecb48ce38?w=100&q=80",
    },
    {
      id: 2,
      name: "Smart Fitness Watch",
      stock: 0,
      image:
        "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=100&q=80",
    },
  ];

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
      {/* SIDEBAR */}
      <aside
        className="hidden md:flex w-[260px] flex-shrink-0 flex flex-col fixed inset-y-0 left-0"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderRight: "1px solid var(--border-default)",
          zIndex: 50,
        }}
      >
        <div className="p-6">
          <Link href="/" className="block">
            <h2
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "24px",
                color: "var(--brand-primary)",
                letterSpacing: "0.01em",
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
          <div className="mt-8 mb-6">
            <h3
              className="font-medium truncate"
              style={{ color: "var(--text-primary)", fontSize: "14px" }}
            >
              {profile?.businessName || "My Store"}
            </h3>
            <div className="mt-2">
              <StatusBadge status={status || "PENDING"} />
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.active;
            return (
              <Link
                key={item.label}
                href={item.href}
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
            <div className="w-8 h-8 rounded-full bg-[var(--bg-sunken)] flex items-center justify-center text-[var(--text-secondary)]">
              <User size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-[var(--text-primary)]">
                {user?.name || "Vendor"}
              </p>
            </div>
            <button className="text-[var(--text-muted)] hover:text-[var(--status-error)] transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 ml-0 md:ml-[260px] flex flex-col min-h-screen">
        {/* TOP BAR */}
        <header
          className="h-[72px] px-4 md:px-8 flex items-center justify-between sticky top-0 bg-[var(--bg-base)] z-40"
          style={{ borderBottom: "1px solid var(--border-default)" }}
        >
          <div className="flex items-center gap-4">
            <h1
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "2.1rem",
                color: "var(--text-primary)",
                letterSpacing: "0.01em",
                fontWeight: "normal",
              }}
            >
              Overview
            </h1>
            {!approved && (
              <span className="px-3 py-1 bg-[var(--status-warning-bg)] text-[var(--status-warning)] text-xs font-medium rounded-full border border-yellow-200">
                Approval Pending
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search orders, products..."
                className="pl-9 pr-4 py-2 rounded-full text-sm w-full md:w-64 bg-[var(--bg-surface)] border-[var(--border-default)] border focus:outline-none focus:border-[var(--brand-primary)]"
                style={{ color: "var(--text-primary)" }}
              />
            </div>
            <div className="hidden md:flex items-center gap-2 pl-4 border-l border-[var(--border-default)]">
              {approved ? (
                <span className="flex items-center gap-1.5 text-sm font-medium text-[var(--status-success)] bg-[var(--status-success-bg)] px-3 py-1.5 rounded-full">
                  <ShieldCheck size={16} />
                  Verified
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-sunken)] px-3 py-1.5 rounded-full">
                  <ShieldAlert size={16} />
                  Unverified
                </span>
              )}
            </div>
            <button className="relative p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-sunken)] rounded-full transition-colors ml-2">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-[var(--brand-accent)] rounded-full"></span>
            </button>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="p-4 sm:p-8 max-w-[1200px] w-full">
          {loading ? (
            <div className="text-[var(--text-secondary)] text-sm">
              Loading dashboard data...
            </div>
          ) : (
            <div className="space-y-8">
              {/* VENDOR BASIC DETAILS CARD */}
              <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] p-6 shadow-sm">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                  <div>
                    <p className="text-[var(--text-muted)] text-xs uppercase tracking-wider font-semibold mb-1">
                      Business Name
                    </p>
                    <p className="text-[var(--text-primary)] font-medium truncate">
                      {profile?.businessName || "Not Provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[var(--text-muted)] text-xs uppercase tracking-wider font-semibold mb-1">
                      Vendor Name
                    </p>
                    <p className="text-[var(--text-primary)] font-medium truncate">
                      {profile?.user?.name || user?.name || "Not Provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[var(--text-muted)] text-xs uppercase tracking-wider font-semibold mb-1">
                      Email
                    </p>
                    <p
                      className="text-[var(--text-primary)] font-medium truncate"
                      title={profile?.user?.email || user?.email}
                    >
                      {profile?.user?.email || user?.email || "Not Provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[var(--text-muted)] text-xs uppercase tracking-wider font-semibold mb-1">
                      Today's Orders
                    </p>
                    <p className="text-[var(--text-primary)] font-medium">12</p>
                  </div>
                  <div>
                    <p className="text-[var(--text-muted)] text-xs uppercase tracking-wider font-semibold mb-1">
                      Products Listed
                    </p>
                    <p className="text-[var(--text-primary)] font-medium">
                      156
                    </p>
                  </div>
                </div>
              </div>

              {!approved ? (
                <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-8 text-center max-w-2xl mx-auto mt-6">
                  <div className="w-16 h-16 bg-[var(--status-warning-bg)] text-[var(--status-warning)] rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle size={32} />
                  </div>
                  <h2
                    style={{
                      fontFamily: "var(--font-dm-sans)",
                      fontSize: "2.2rem",
                      color: "var(--text-primary)",
                      letterSpacing: "0.01em",
                      fontWeight: "normal",
                    }}
                  >
                    Account Pending Approval
                  </h2>
                  <p className="mt-3 text-[var(--text-secondary)]">
                    Your vendor application is currently under review by our
                    team. You will be able to manage products and view analytics
                    once your store is approved.
                  </p>
                  <Link
                    href="/vendor/profile"
                    className="inline-flex items-center justify-center px-6 py-3 mt-6 rounded-lg text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: "var(--brand-primary)",
                      color: "var(--text-inverse)",
                    }}
                  >
                    View Application Status
                  </Link>
                </div>
              ) : (
                <>
                  {/* STATS ROW */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                      label="Total Revenue"
                      value="1,24,500"
                      prefix="₹"
                      delta="+12.5% this week"
                      deltaType="up"
                      icon={IndianRupee}
                    />
                    <StatCard
                      label="Active Orders"
                      value="24"
                      delta="+3 since yesterday"
                      deltaType="up"
                      icon={ShoppingBag}
                    />
                    <StatCard
                      label="Total Products"
                      value="156"
                      delta="Live on store"
                      deltaType="neutral"
                      icon={Package}
                    />
                    <StatCard
                      label="Low Stock Items"
                      value="8"
                      delta="Needs attention"
                      deltaType="down"
                      icon={AlertTriangle}
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* RECENT ORDERS TABLE */}
                    <div className="lg:col-span-2 space-y-4">
                      <div className="flex items-center justify-between">
                        <h2
                          style={{
                            fontFamily: "var(--font-dm-sans)",
                            fontSize: "1.5rem",
                            color: "var(--text-primary)",
                          }}
                        >
                          Recent Orders
                        </h2>
                        <Link
                          href="/vendor/orders"
                          className="text-sm font-medium hover:underline flex items-center gap-1"
                          style={{ color: "var(--brand-primary)" }}
                        >
                          View All <ChevronRight size={16} />
                        </Link>
                      </div>

                      <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] overflow-auto">
                        <table className="w-full min-w-[700px] text-left border-collapse">
                          <thead>
                            <tr className="bg-[var(--bg-sunken)]">
                              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                Order ID
                              </th>
                              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                Customer
                              </th>
                              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                Amount
                              </th>
                              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                Status
                              </th>
                              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                                Date
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {recentOrders.map((order) => (
                              <tr
                                key={order.id}
                                className="border-t border-[var(--border-default)] hover:bg-[#F9F9F9] transition-colors"
                              >
                                <td
                                  className="px-5 py-4 text-sm font-medium"
                                  style={{
                                    fontFamily: "var(--font-dm-mono)",
                                    color: "var(--text-primary)",
                                  }}
                                >
                                  {order.id}
                                </td>
                                <td className="px-5 py-4 text-sm text-[var(--text-secondary)]">
                                  {order.customer}
                                  <div className="text-xs text-[var(--text-muted)] mt-0.5">
                                    {order.items} items
                                  </div>
                                </td>
                                <td
                                  className="px-5 py-4 text-sm font-medium"
                                  style={{
                                    fontFamily: "var(--font-dm-mono)",
                                    color: "var(--text-primary)",
                                  }}
                                >
                                  ₹{order.amount}
                                </td>
                                <td className="px-5 py-4">
                                  <StatusBadge status={order.status} />
                                </td>
                                <td className="px-5 py-4 text-sm text-[var(--text-secondary)]">
                                  {order.date}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* STOCK ALERTS */}
                    <div className="space-y-4">
                      <h2
                        style={{
                          fontFamily: "var(--font-dm-sans)",
                          fontSize: "1.5rem",
                          color: "var(--text-primary)",
                        }}
                      >
                        Stock Alerts
                      </h2>
                      <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] p-5 space-y-4">
                        {lowStockItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-4 pb-4 border-b border-[var(--border-default)] last:border-0 last:pb-0"
                          >
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-12 h-12 rounded-lg object-cover bg-[var(--bg-sunken)]"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                                {item.name}
                              </p>
                              <p
                                className="text-xs font-medium mt-1"
                                style={{
                                  color:
                                    item.stock === 0
                                      ? "var(--status-error)"
                                      : "var(--status-warning)",
                                }}
                              >
                                {item.stock === 0
                                  ? "Out of Stock"
                                  : `Only ${item.stock} left`}
                              </p>
                            </div>
                            <button
                              className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
                              style={{
                                backgroundColor: "var(--bg-sunken)",
                                color: "var(--text-primary)",
                              }}
                            >
                              Update
                            </button>
                          </div>
                        ))}
                        <button className="w-full py-2.5 text-sm font-medium rounded-lg border border-[var(--border-default)] hover:bg-[var(--bg-sunken)] transition-colors text-[var(--text-primary)]">
                          View Inventory
                        </button>
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
