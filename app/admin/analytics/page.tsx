"use client";

import React, { useEffect, useState } from "react";
import { authFetch } from "@/lib/auth-fetch";
import { API_BASE_URL } from "@/lib/config";
import { useAuthStore } from "@/lib/store";
import {
  Users,
  ShoppingBag,
  PackagePlus,
  CalendarDays,
  IndianRupee,
  RefreshCw,
} from "lucide-react";

function Stat({ label, value, icon: Icon, prefix }: any) {
  return (
    <div
      className="bg-white rounded-xl p-4"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[var(--text-secondary)]">{label}</p>
          <p className="mt-2 text-2xl font-extrabold text-[var(--text-primary)]">
            {prefix}
            {value}
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--bg-sunken)]">
          <Icon size={18} className="text-[var(--text-primary)]" />
        </div>
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<any>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/analytics`);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      const payload = await res.json();
      if (payload?.status !== "success") throw new Error("Unexpected response");
      setMetrics(payload.data || payload);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const formatNumber = (n: number | string | undefined) => {
    if (n == null) return "0";
    const num = typeof n === "string" ? Number(n) : n;
    return new Intl.NumberFormat("en-IN").format(num);
  };

  return (
    <div className="min-h-screen flex bg-[var(--bg-base)]">
      <main className="flex-1 ml-[260px] p-8 max-w-[1200px] w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              Platform Analytics
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Overview of key platform metrics
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--bg-surface)] border border-[var(--border-default)] text-sm"
              onClick={fetchAnalytics}
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 bg-white rounded-xl">Fetching analytics…</div>
        ) : error ? (
          <div className="p-6 bg-white rounded-xl text-red-600">{error}</div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Stat
                label="Total Users"
                value={formatNumber(metrics?.totalUsers)}
                icon={Users}
              />
              <Stat
                label="Total Vendors"
                value={formatNumber(metrics?.totalVendors)}
                icon={ShoppingBag}
              />
              <Stat
                label="Total Products"
                value={formatNumber(metrics?.totalProducts)}
                icon={PackagePlus}
              />
              <Stat
                label="Orders Today"
                value={formatNumber(metrics?.ordersToday)}
                icon={CalendarDays}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-white rounded-xl p-4">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                  Revenue
                </h3>
                <p className="text-3xl font-extrabold">
                  ₹{formatNumber(metrics?.totalRevenue)}
                </p>
                <p className="text-sm text-[var(--text-secondary)] mt-2">
                  Total successful payments
                </p>
              </div>

              <div className="bg-white rounded-xl p-4">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                  Low Stock
                </h3>
                <p className="text-2xl font-bold">
                  {formatNumber(metrics?.lowStockProducts)}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-2">
                  Threshold: {metrics?.lowStockThreshold}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-4">
                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                  Vendors by Status
                </h4>
                <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                  {metrics?.vendorStatusCounts &&
                    Object.entries(metrics.vendorStatusCounts).map(
                      ([k, v]: any) => (
                        <li
                          key={k}
                          className="flex items-center justify-between"
                        >
                          <span className="capitalize">{k.toLowerCase()}</span>
                          <span className="font-medium">{formatNumber(v)}</span>
                        </li>
                      ),
                    )}
                </ul>
              </div>

              <div className="bg-white rounded-xl p-4">
                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                  Orders by Status
                </h4>
                <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                  {metrics?.ordersByStatus &&
                    Object.entries(metrics.ordersByStatus).map(
                      ([k, v]: any) => (
                        <li
                          key={k}
                          className="flex items-center justify-between"
                        >
                          <span className="capitalize">{k.toLowerCase()}</span>
                          <span className="font-medium">{formatNumber(v)}</span>
                        </li>
                      ),
                    )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
