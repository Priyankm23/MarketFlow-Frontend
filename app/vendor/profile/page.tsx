"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { useAuthStore } from "@/lib/store";
import { VendorProfileData } from "@/lib/types";
import {
  fetchVendorProfile,
  isVendorApproved,
  normalizeVendorStatus,
} from "@/lib/vendor-profile";

export default function VendorProfilePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [profile, setProfile] = useState<VendorProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      if (!user) {
        setError("Please sign in first to view your vendor profile.");
        setLoading(false);
        return;
      }

      if (user.role?.toUpperCase() !== "VENDOR") {
        setError("Only users with VENDOR role can access this page.");
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem("accessToken");
        const vendorProfile = await fetchVendorProfile(token);

        if (!isMounted) return;

        if (!vendorProfile) {
          router.push("/vendor/apply");
          return;
        }

        setProfile(vendorProfile);
      } catch (err: unknown) {
        if (!isMounted) return;
        const message =
          err instanceof Error ? err.message : "Unable to load vendor profile.";
        setError(message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [router, user]);

  const approved = isVendorApproved(profile?.status);
  const status = normalizeVendorStatus(profile?.status);

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
          <h1 className="text-3xl font-bold">Vendor Profile</h1>
          <p className="text-muted-foreground mt-1">
            Your registered business and compliance details
          </p>
        </div>

        <div className="p-6">
          {loading && (
            <div className="bg-card border border-border rounded-lg p-6 text-sm text-muted-foreground">
              Loading profile...
            </div>
          )}

          {!loading && error && (
            <div className="bg-card border border-red-200 rounded-lg p-6 text-sm text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && profile && (
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-xl font-bold mb-3">Moderation Status</h2>
                <div className="inline-flex items-center rounded-full border border-border px-3 py-1 text-sm font-medium">
                  {status}
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  {approved
                    ? "Your profile is approved and all vendor features are available."
                    : "Your profile is under moderation or needs updates. Other vendor sections remain locked until APPROVED."}
                </p>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Business Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Business Name</p>
                    <p className="font-medium">{profile.businessName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Store Category</p>
                    <p className="font-medium">{profile.storeCategory}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tax ID</p>
                    <p className="font-medium">
                      {profile.taxId || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Vendor ID</p>
                    <p className="font-medium">{profile.id}</p>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Contact & Account</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Name</p>
                    <p className="font-medium">{profile.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{profile.email}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p className="font-medium">
                      {profile.phone || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">User ID</p>
                    <p className="font-medium">{profile.userId}</p>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Address</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="md:col-span-2">
                    <p className="text-muted-foreground">Address Line 1</p>
                    <p className="font-medium">{profile.addressLine1}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-muted-foreground">Address Line 2</p>
                    <p className="font-medium">
                      {profile.addressLine2 || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">City</p>
                    <p className="font-medium">{profile.city}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">State</p>
                    <p className="font-medium">{profile.state}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Country</p>
                    <p className="font-medium">{profile.country}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Pincode</p>
                    <p className="font-medium">{profile.pincode}</p>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Uploaded Documents</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Government ID</p>
                    <a
                      href={profile.govIdUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-primary hover:underline break-all"
                    >
                      Open Government ID
                    </a>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Business Document</p>
                    <a
                      href={profile.businessDocUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-primary hover:underline break-all"
                    >
                      Open Business Document
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/vendor/dashboard"
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 text-sm font-medium"
                >
                  Back to Dashboard
                </Link>
                <Link
                  href="/vendor/orders"
                  className="px-4 py-2 rounded-lg border border-border hover:bg-secondary text-sm font-medium"
                >
                  View Orders
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
