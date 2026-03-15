"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/sidebar";
import { useAuthStore } from "@/lib/store";
import {
  fetchVendorProfile,
  isVendorApproved,
  normalizeVendorStatus,
} from "@/lib/vendor-profile";
import { VendorProfileData } from "@/lib/types";
import { Lock, PackageSearch } from "lucide-react";

export default function VendorOrdersPage() {
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<VendorProfileData | null>(null);

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
        const token = localStorage.getItem("accessToken");
        const vendorProfile = await fetchVendorProfile(token);
        if (!active) return;
        setProfile(vendorProfile);
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

    loadVendorProfile();

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

  const navItems = [
    { href: "/vendor/dashboard", label: "Dashboard", icon: "📊" },
    {
      href: "/vendor/products",
      label: "Products",
      icon: "🛍️",
      disabled: !approved,
    },
    {
      href: "/vendor/orders",
      label: "Orders",
      icon: "📦",
      disabled: !approved,
    },
    {
      href: "/vendor/analytics",
      label: "Analytics",
      icon: "📈",
      disabled: !approved,
    },
    { href: "/vendor/profile", label: "Profile", icon: "👤" },
    {
      href: "/vendor/settings",
      label: "Settings",
      icon: "⚙️",
      disabled: !approved,
    },
  ];

  return (
    <div className="flex bg-background min-h-screen">
      <Sidebar
        items={navItems}
        title="Vendor Hub"
        userRole={user?.role || "vendor"}
      />

      <div className="flex-1 overflow-auto">
        <div className="bg-card border-b border-border p-6 sticky top-0 z-40">
          <h1 className="text-3xl font-bold">Order Management</h1>
          <p className="text-muted-foreground mt-1">
            Review and process customer orders.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {loading && (
            <div className="bg-card border border-border rounded-lg p-6 text-sm text-muted-foreground">
              Loading orders module...
            </div>
          )}

          {!loading && error && (
            <div className="bg-card border border-rose-200 rounded-lg p-6 text-sm text-rose-700">
              {error}
            </div>
          )}

          {!loading && !error && !profile && (
            <div className="bg-card border border-amber-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-amber-700">
                Vendor profile required
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                You need to complete your vendor application before accessing
                orders.
              </p>
              <Link
                href="/vendor/apply"
                className="inline-flex items-center mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Fill Vendor Form
              </Link>
            </div>
          )}

          {!loading && !error && profile && !approved && (
            <div className="bg-card border border-amber-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 mt-0.5 text-amber-700" />
                <div>
                  <h2 className="text-lg font-semibold text-amber-700">
                    Orders are locked until approval
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Current status: {status}. Once your profile is APPROVED,
                    order management will become available.
                  </p>
                  <div className="mt-4 flex gap-3">
                    <Link
                      href="/vendor/profile"
                      className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
                    >
                      Review Profile
                    </Link>
                    <Link
                      href="/vendor/dashboard"
                      className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                    >
                      Back to Dashboard
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && profile && approved && (
            <div className="bg-card border border-border rounded-lg p-10 text-center">
              <PackageSearch className="w-10 h-10 mx-auto text-muted-foreground" />
              <h2 className="text-xl font-semibold mt-4">No orders yet</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Your store is active. Orders will appear here as soon as
                customers start purchasing your products.
              </p>
              <div className="mt-4">
                <Link
                  href="/vendor/products"
                  className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  Add Products
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
