"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/store";
import { authFetch } from "@/lib/auth-fetch";
import {
  LayoutDashboard,
  Users,
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
  Check,
  X,
  Eye,
  Loader2,
  MoreVertical,
} from "lucide-react";

// --- REUSABLE COMPONENTS (Matching Vendor Dashboard Theme) ---

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
      label: "Pending",
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
  };

  const c = config[status.toUpperCase()] || {
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

import { API_BASE_URL } from "@/lib/config";

export default function AdminDashboard() {
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [pendingVendors, setPendingVendors] = useState<any[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingVendors();
  }, []);

  const fetchPendingVendors = async () => {
    setLoading(true);
    try {
      const response = await authFetch(`${API_BASE_URL}/admin/vendors/pending`);
      if (response.ok) {
        const result = await response.json();
        setPendingVendors(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching pending vendors:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewVendor = async (
    vendorId: string,
    status: "APPROVED" | "REJECTED" | "SUSPENDED",
  ) => {
    setProcessingId(vendorId);
    try {
      const response = await authFetch(
        `${API_BASE_URL}/admin/vendors/${vendorId}/review`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        },
      );

      if (response.ok) {
        setPendingVendors((prev) => prev.filter((v) => v.id !== vendorId));
      } else {
        // If POST fails, try PATCH as backup if that's what's actually implemented
        const patchResponse = await authFetch(
          `${API_BASE_URL}/admin/vendors/${vendorId}/review`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ status }),
          },
        );
        if (patchResponse.ok) {
          setPendingVendors((prev) => prev.filter((v) => v.id !== vendorId));
        }
      }
    } catch (error) {
      console.error("Error reviewing vendor:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const navItems = [
    {
      href: "/admin/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      active: true,
    },
    { href: "/admin/vendors", label: "Vendors", icon: Users },
    { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart2 },
    { href: "/admin/settings", label: "Settings", icon: Settings },
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
        className="w-[260px] flex-shrink-0 flex flex-col fixed inset-y-0 left-0"
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
              Admin Hub
            </p>
          </Link>
          <div className="mt-8 mb-6">
            <h3
              className="font-medium truncate"
              style={{ color: "var(--text-primary)", fontSize: "14px" }}
            >
              System Administrator
            </h3>
            <div className="mt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--brand-primary)] text-white">
                Admin Access
              </span>
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
                {user?.name || "Admin User"}
              </p>
            </div>
            <button className="text-[var(--text-muted)] hover:text-[var(--status-error)] transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 ml-[260px] flex flex-col min-h-screen">
        {/* TOP BAR */}
        <header
          className="h-[72px] px-8 flex items-center justify-between sticky top-0 bg-[var(--bg-base)] z-40"
          style={{ borderBottom: "1px solid var(--border-default)" }}
        >
          <div className="flex items-center gap-4">
            <h1
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "2.1rem",
                color: "var(--text-primary)",
                letterSpacing: "0.04em",
                fontWeight: "normal",
              }}
            >
              Admin Overview
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search vendors, users..."
                className="pl-9 pr-4 py-2 rounded-full text-sm w-64 bg-[var(--bg-surface)] border-[var(--border-default)] border focus:outline-none focus:border-[var(--brand-primary)]"
                style={{ color: "var(--text-primary)" }}
              />
            </div>
            <button className="relative p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-sunken)] rounded-full transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-[var(--brand-accent)] rounded-full"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-[var(--bg-sunken)] flex items-center justify-center overflow-hidden border border-[var(--border-default)]">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || "admin"}`}
                alt="avatar"
              />
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="p-8 max-w-[1200px] w-full">
          <div className="space-y-8">
            {/* STATS ROW */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                label="Total Revenue"
                value="45,23,000"
                prefix="₹"
                delta="+15% this month"
                deltaType="up"
                icon={IndianRupee}
              />
              <StatCard
                label="Active Vendors"
                value="342"
                delta="+12 new this week"
                deltaType="up"
                icon={ShoppingBag}
              />
              <StatCard
                label="Pending Approvals"
                value={pendingVendors.length}
                delta="Needs immediate attention"
                deltaType={pendingVendors.length > 0 ? "down" : "neutral"}
                icon={AlertTriangle}
              />
              <StatCard
                label="Active Users"
                value="1,234"
                delta="+86 today"
                deltaType="up"
                icon={Users}
              />
            </div>

            {/* PENDING VENDOR APPLICATIONS */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "1.5rem",
                    color: "var(--text-primary)",
                  }}
                >
                  Pending Vendor Applications
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider">
                    {pendingVendors.length} Application
                    {pendingVendors.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] overflow-hidden">
                {loading ? (
                  <div className="p-12 text-center text-[var(--text-secondary)]">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                    <p>Fetching pending applications...</p>
                  </div>
                ) : pendingVendors.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-[var(--bg-sunken)] rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShieldCheck
                        size={32}
                        className="text-[var(--text-muted)]"
                      />
                    </div>
                    <h3 className="text-lg font-medium text-[var(--text-primary)]">
                      All Caught Up!
                    </h3>
                    <p className="text-[var(--text-secondary)] mt-1">
                      No pending vendor applications at the moment.
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[var(--bg-sunken)]">
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                          Business / Owner
                        </th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                          Contact Info
                        </th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                          Category
                        </th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                          Status
                        </th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingVendors.map((vendor) => (
                        <tr
                          key={vendor.id}
                          className="border-t border-[var(--border-default)] hover:bg-[#F9F9F9] transition-colors"
                        >
                          <td className="px-5 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-[var(--text-primary)]">
                                {vendor.businessName}
                              </span>
                              <span className="text-xs text-[var(--text-secondary)]">
                                {vendor.user?.name || "N/A"}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm text-[var(--text-primary)]">
                                {vendor.user?.email}
                              </span>
                              <span className="text-xs text-[var(--text-secondary)]">
                                {vendor.user?.phone || "No Phone"}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="px-2 py-1 bg-[var(--bg-sunken)] text-[var(--text-secondary)] text-[10px] font-bold uppercase rounded tracking-wider">
                              {vendor.storeCategory || "General"}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <StatusBadge status="PENDING" />
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  handleReviewVendor(vendor.id, "APPROVED")
                                }
                                disabled={processingId === vendor.id}
                                className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--status-success-bg)] text-[var(--status-success)] hover:opacity-80 transition-opacity"
                                title="Approve"
                              >
                                {processingId === vendor.id ? (
                                  <Loader2 size={16} className="animate-spin" />
                                ) : (
                                  <Check size={16} />
                                )}
                              </button>
                              <button
                                onClick={() =>
                                  handleReviewVendor(vendor.id, "REJECTED")
                                }
                                disabled={processingId === vendor.id}
                                className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--status-error-bg)] text-[var(--status-error)] hover:opacity-80 transition-opacity"
                                title="Reject"
                              >
                                <X size={16} />
                              </button>
                              <button
                                className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--bg-sunken)] text-[var(--text-secondary)] hover:bg-[var(--border-default)] transition-colors"
                                title="View Details"
                              >
                                <Eye size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* RECENT SYSTEM LOGS (Placeholder) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <h2
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "1.5rem",
                    color: "var(--text-primary)",
                  }}
                >
                  Recent Activity
                </h2>
                <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] p-5 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-start gap-4 pb-4 border-b border-[var(--border-default)] last:border-0 last:pb-0"
                    >
                      <div className="w-8 h-8 rounded-full bg-[var(--bg-sunken)] flex items-center justify-center text-[var(--text-secondary)] mt-1">
                        <Users size={14} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-[var(--text-primary)]">
                          <span className="font-semibold">
                            New vendor registration
                          </span>{" "}
                          from "Luxe Wear" is pending review.
                        </p>
                        <p className="text-xs text-[var(--text-muted)] mt-1">
                          2 hours ago
                        </p>
                      </div>
                      <button className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h2
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "1.5rem",
                    color: "var(--text-primary)",
                  }}
                >
                  Quick Actions
                </h2>
                <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] p-5 space-y-3">
                  <button className="w-full py-2.5 text-sm font-medium rounded-lg bg-[var(--brand-primary)] text-white hover:opacity-90 transition-opacity">
                    Generate Platform Report
                  </button>
                  <button className="w-full py-2.5 text-sm font-medium rounded-lg border border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--bg-sunken)] transition-colors">
                    Manage Categories
                  </button>
                  <button className="w-full py-2.5 text-sm font-medium rounded-lg border border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--bg-sunken)] transition-colors">
                    Platform Settings
                  </button>
                  <button className="w-full py-2.5 text-sm font-medium rounded-lg border border-[var(--border-default)] text-[var(--status-error)] hover:bg-[var(--status-error-bg)] transition-colors">
                    System Maintenance
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
