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
import { CheckCircle2, Clock3, Lock, XCircle } from "lucide-react";

const statusStyles: Record<string, string> = {
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  REJECTED: "bg-rose-50 text-rose-700 border-rose-200",
};

const statusText: Record<string, string> = {
  APPROVED: "Your vendor account is approved. You can manage your store now.",
  PENDING:
    "Your application is under moderation. Store operations are locked until approval.",
  REJECTED:
    "Your application was rejected. Update your profile details and re-apply.",
};

export default function VendorDashboard() {
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<VendorProfileData | null>(null);

  useEffect(() => {
    let active = true;

    const loadVendorProfile = async () => {
      if (!user) {
        if (active) {
          setError("Please sign in to access your vendor dashboard.");
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

  const status = useMemo(
    () => normalizeVendorStatus(profile?.status),
    [profile?.status],
  );
  const approved = useMemo(
    () => isVendorApproved(profile?.status),
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

  const statusClass = statusStyles[status] || statusStyles.PENDING;
  const moderationText = statusText[status] || statusText.PENDING;

  return (
    <div className="flex bg-background min-h-screen">
      <Sidebar
        items={navItems}
        title="Vendor Hub"
        userRole={user?.role || "vendor"}
      />

      <div className="flex-1 overflow-auto">
        <div className="bg-card border-b border-border p-6 sticky top-0 z-40">
          <h1 className="text-3xl font-bold">Vendor Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Track your onboarding and account readiness.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {loading && (
            <div className="bg-card border border-border rounded-lg p-6 text-sm text-muted-foreground">
              Loading dashboard...
            </div>
          )}

          {!loading && error && (
            <div className="bg-card border border-rose-200 rounded-lg p-6 text-sm text-rose-700">
              {error}
            </div>
          )}

          {!loading && !error && !profile && (
            <div className="bg-card border border-amber-200 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-amber-700">
                Complete your vendor application
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                Your profile is not registered yet. Fill the vendor form to
                start moderation and unlock store features.
              </p>
              <div className="mt-4 flex gap-3">
                <Link
                  href="/vendor/apply"
                  className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  Fill Vendor Form
                </Link>
                <Link
                  href="/vendor/profile"
                  className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
                >
                  Open Profile
                </Link>
              </div>
            </div>
          )}

          {!loading && !error && profile && (
            <>
              <div className={`rounded-xl border p-5 ${statusClass}`}>
                <div className="flex items-start gap-3">
                  {status === "APPROVED" && (
                    <CheckCircle2 className="w-5 h-5 mt-0.5" />
                  )}
                  {status === "PENDING" && (
                    <Clock3 className="w-5 h-5 mt-0.5" />
                  )}
                  {status === "REJECTED" && (
                    <XCircle className="w-5 h-5 mt-0.5" />
                  )}
                  <div>
                    <p className="text-sm font-semibold">Status: {status}</p>
                    <p className="text-sm mt-1">{moderationText}</p>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="text-lg font-semibold">Business Profile</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Business Name</p>
                    <p className="font-medium">{profile.businessName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Category</p>
                    <p className="font-medium">{profile.storeCategory}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">City</p>
                    <p className="font-medium">{profile.city}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">State</p>
                    <p className="font-medium">{profile.state}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <Link
                    href="/vendor/profile"
                    className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
                  >
                    View Full Profile
                  </Link>
                </div>
              </div>

              {!approved && (
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-start gap-3">
                    <Lock className="w-5 h-5 mt-0.5 text-muted-foreground" />
                    <div>
                      <h3 className="text-base font-semibold">
                        Operations are locked
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Products, orders, analytics, and settings will unlock
                        once your profile status becomes APPROVED.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {approved && (
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-base font-semibold">Store is active</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your account is approved. You can now add products and start
                    processing orders.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      href="/vendor/orders"
                      className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                    >
                      Open Orders
                    </Link>
                    <Link
                      href="/vendor/products"
                      className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
                    >
                      Manage Products
                    </Link>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
