"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore, useVendorStore } from "@/lib/store";
import { VendorProfileData } from "@/lib/types";
import {
  isVendorApproved,
  normalizeVendorStatus,
} from "@/lib/vendor-profile";
import { API_BASE_URL } from "@/lib/config";
import { authFetch } from "@/lib/auth-fetch";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  BarChart2,
  Settings,
  Bell,
  Search,
  LogOut,
  User,
  ShieldCheck,
  ShieldAlert,
  FileText,
  MapPin,
  Building2,
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  XCircle,
  Camera,
  X,
  Menu,
} from "lucide-react";

// --- REUSABLE COMPONENTS ---

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

export default function VendorProfilePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { profile, loadProfile, isLoading: loading, setProfile } = useVendorStore();

  const [error, setError] = useState("");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.role?.toUpperCase() === "VENDOR") {
      loadProfile().then(() => {
        if (!useVendorStore.getState().profile && !useVendorStore.getState().isLoading) {
          router.push("/vendor/apply");
        }
      });
    }
  }, [user, loadProfile, router]);

  const handleLogoChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);

      let response = await authFetch(`${API_BASE_URL}/vendor/profile/logo`, {
        method: "POST",
        body: formData,
      });

      if (response.status === 404) {
        response = await authFetch(`${API_BASE_URL}/vendors/profile/logo`, {
          method: "POST",
          body: formData,
        });
      }

      if (!response.ok) {
        throw new Error("Failed to upload logo");
      }

      const payload = await response.json().catch(() => ({}));

      if (payload?.data && payload.data.logoUrl) {
        setProfile(payload.data);
      } else if (payload?.logoUrl && profile) {
        setProfile({ ...profile, logoUrl: payload.logoUrl });
      } else {
        await loadProfile(true);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error uploading logo");
    } finally {
      setIsUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const approved = isVendorApproved(profile?.status);
  const status = normalizeVendorStatus(profile?.status);

  const navItems = [
    { href: "/vendor/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/vendor/products", label: "Products", icon: Package },
    { href: "/vendor/orders", label: "Orders", icon: ShoppingBag },
    { href: "/vendor/analytics", label: "Analytics", icon: BarChart2 },
    { href: "/vendor/profile", label: "Profile", icon: User, active: true },
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
                {profile?.user?.name || user?.name || "Vendor"}
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
                Profile
              </h1>
              <p className="hidden sm:block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Manage your store identity
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
        <div className="p-5 md:p-8 max-w-[1200px] w-full">
          {loading ? (
            <div className="text-[var(--text-secondary)] text-sm">
              Loading profile data...
            </div>
          ) : error ? (
            <div className="bg-[var(--status-error-bg)] border border-[var(--status-error)] rounded-xl p-6 text-sm text-[var(--status-error)]">
              {error}
            </div>
          ) : profile ? (
            <div className="space-y-6">
              {/* STATUS BANNER */}
              <div
                className="bg-card border rounded-3xl p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl"
                style={{
                  backgroundColor: approved
                    ? "var(--status-success-bg)"
                    : status === "REJECTED"
                      ? "var(--status-error-bg)"
                      : "var(--status-warning-bg)",
                  borderColor: approved
                    ? "#A7F3D0"
                    : status === "REJECTED"
                      ? "#FECACA"
                      : "#FDE68A",
                  boxShadow: approved
                    ? "0 20px 25px -5px rgba(16, 185, 129, 0.05)"
                    : status === "REJECTED"
                      ? "0 20px 25px -5px rgba(239, 68, 68, 0.05)"
                      : "0 20px 25px -5px rgba(245, 158, 11, 0.05)",
                }}
              >
                <div className="flex items-center gap-6">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner border"
                    style={{
                      backgroundColor: approved
                        ? "white"
                        : status === "REJECTED"
                          ? "#FEF2F2"
                          : "#FFFBEB",
                      borderColor: approved
                        ? "#A7F3D0"
                        : status === "REJECTED"
                          ? "#FECACA"
                          : "#FDE68A",
                    }}
                  >
                    {approved ? (
                      <ShieldCheck className="w-8 h-8 text-[var(--status-success)]" />
                    ) : status === "REJECTED" ? (
                      <ShieldAlert className="w-8 h-8 text-[var(--status-error)]" />
                    ) : (
                      <Clock className="w-8 h-8 text-[var(--status-warning)]" />
                    )}
                  </div>
                  <div>
                    <h2
                      className="text-2xl font-bold tracking-tight"
                      style={{
                        color: approved
                          ? "var(--status-success)"
                          : status === "REJECTED"
                            ? "var(--status-error)"
                            : "var(--status-warning)",
                      }}
                    >
                      {approved
                        ? "Store is Approved"
                        : status === "REJECTED"
                          ? "Application Rejected"
                          : "Account Pending Approval"}
                    </h2>
                    <p
                      className="text-muted-foreground text-sm mt-1 max-w-xl leading-relaxed"
                    >
                      {approved
                        ? "Your store is active and live on Markivo. You have full access to all vendor features."
                        : status === "REJECTED"
                          ? "Unfortunately, your application was rejected. Please review your business details and documents."
                          : "Your vendor application is currently under review. Approval usually takes 24-48 hours."}
                    </p>
                  </div>
                </div>
                {!approved && status !== "REJECTED" && (
                  <div className="flex-shrink-0">
                    <span
                      className="inline-flex items-center justify-center px-5 py-2 rounded-xl bg-white text-sm font-bold border shadow-sm"
                      style={{
                        color: "var(--status-warning)",
                        borderColor: "#FDE68A",
                      }}
                    >
                      Pending Review
                    </span>
                  </div>
                )}
              </div>

              {/* THREE COLUMN GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* BUSINESS DETAILS */}
                <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] overflow-hidden shadow-sm lg:col-span-2">
                  <div className="px-6 py-4 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--bg-sunken)]">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-[var(--text-muted)]" />
                      <h3 className="font-semibold text-[var(--text-primary)]">
                        Business Information
                      </h3>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-6 mb-8 pb-8 border-b border-[var(--border-default)]">
                      <div className="relative group shrink-0">
                        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl border-2 border-[var(--border-default)] bg-[var(--bg-sunken)] overflow-hidden flex items-center justify-center relative shadow-sm">
                          {profile?.logoUrl ? (
                            <img
                              src={profile.logoUrl}
                              alt="Store Logo"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Building2 className="w-8 h-8 text-[var(--text-muted)] opacity-40" />
                          )}

                          <div
                            className={`absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${isUploadingLogo ? "opacity-100 bg-white/70" : ""}`}
                            onClick={() =>
                              !isUploadingLogo && fileInputRef.current?.click()
                            }
                          >
                            {isUploadingLogo ? (
                              <div className="w-5 h-5 border-2 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <>
                                <Camera className="w-5 h-5 text-white mb-1" />
                                <span className="text-[10px] text-white font-semibold uppercase tracking-wider">
                                  Change
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={handleLogoChange}
                        />
                      </div>
                      <div>
                        <h4 className="text-xl sm:text-2xl font-semibold text-[var(--text-primary)] font-body">
                          {profile?.businessName}
                        </h4>
                        <p className="text-sm font-medium text-[var(--text-secondary)] mt-1">
                          {profile?.storeCategory} Store
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-2 gap-y-6 gap-x-8">
                      <div>
                        <p className="text-xs uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-1">
                          Business Name
                        </p>
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {profile.businessName}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-1">
                          Store Category
                        </p>
                        <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--bg-sunken)] text-[var(--text-secondary)] border border-[var(--border-default)]">
                          {profile.storeCategory}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-1">
                          Tax ID / GSTIN
                        </p>
                        <p className="text-sm text-[var(--text-primary)] font-mono">
                          {profile.taxId || "Not Provided"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-1">
                          Vendor ID
                        </p>
                        <p className="text-sm text-[var(--text-secondary)] font-mono">
                          {profile.id}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CONTACT DETAILS */}
                <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] overflow-hidden shadow-sm">
                  <div className="px-6 py-4 border-b border-[var(--border-default)] flex items-center gap-2 bg-[var(--bg-sunken)]">
                    <User className="w-5 h-5 text-[var(--text-muted)]" />
                    <h3 className="font-semibold text-[var(--text-primary)]">
                      Contact Details
                    </h3>
                  </div>
                  <div className="p-6 space-y-5">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <User className="w-4 h-4 text-[var(--text-muted)]" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-0.5">
                          Owner Name
                        </p>
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {profile.user?.name || "Vendor"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <Mail className="w-4 h-4 text-[var(--text-muted)]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-0.5">
                          Email Address
                        </p>
                        <p
                          className="text-sm font-medium text-[var(--text-primary)] truncate"
                          title={profile.user?.email || ""}
                        >
                          {profile.user?.email || "Not Provided"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <Phone className="w-4 h-4 text-[var(--text-muted)]" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-0.5">
                          Phone Number
                        </p>
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {profile.user?.phone || "Not Provided"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECOND ROW - ADDRESS AND DOCUMENTS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ADDRESS DETAILS */}
                <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] overflow-hidden shadow-sm">
                  <div className="px-6 py-4 border-b border-[var(--border-default)] flex items-center gap-2 bg-[var(--bg-sunken)]">
                    <MapPin className="w-5 h-5 text-[var(--text-muted)]" />
                    <h3 className="font-semibold text-[var(--text-primary)]">
                      Location & Address
                    </h3>
                  </div>
                  <div className="p-6 grid grid-cols-2 sm:grid-cols-2 gap-y-6 gap-x-8">
                    <div className="sm:col-span-2">
                      <p className="text-xs uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-1">
                        Full Address
                      </p>
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {profile.addressLine1}
                        {profile.addressLine2 && (
                          <>
                            <br />
                            {profile.addressLine2}
                          </>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-1">
                        City
                      </p>
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {profile.city}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-1">
                        State & Pincode
                      </p>
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {profile.state}{" "}
                        <span className="text-[var(--text-muted)] mx-1">
                          â€¢
                        </span>{" "}
                        {profile.pincode}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-1">
                        Country
                      </p>
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {profile.country || "India"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* DOCUMENTS */}
                <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] overflow-hidden shadow-sm">
                  <div className="px-6 py-4 border-b border-[var(--border-default)] flex items-center gap-2 bg-[var(--bg-sunken)]">
                    <FileText className="w-5 h-5 text-[var(--text-muted)]" />
                    <h3 className="font-semibold text-[var(--text-primary)]">
                      Uploaded Documents
                    </h3>
                  </div>
                  <div className="p-6 flex flex-col gap-4">
                    <div className="border border-[var(--border-default)] rounded-lg p-5 flex items-center justify-between hover:border-[var(--brand-primary)] transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-[var(--bg-sunken)] text-[var(--text-secondary)] flex items-center justify-center group-hover:bg-[var(--brand-primary)] group-hover:text-white transition-colors">
                          <FileText size={24} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[var(--text-primary)]">
                            Government ID
                          </p>
                          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                            Identity Proof
                          </p>
                        </div>
                      </div>
                      <a
                        href={profile.govIdUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium px-4 py-2 bg-[var(--bg-sunken)] rounded-md text-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-white transition-colors"
                      >
                        View File
                      </a>
                    </div>

                    <div className="border border-[var(--border-default)] rounded-lg p-5 flex items-center justify-between hover:border-[var(--brand-primary)] transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-[var(--bg-sunken)] text-[var(--text-secondary)] flex items-center justify-center group-hover:bg-[var(--brand-primary)] group-hover:text-white transition-colors">
                          <FileText size={24} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[var(--text-primary)]">
                            Business Document
                          </p>
                          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                            Registration Proof
                          </p>
                        </div>
                      </div>
                      <a
                        href={profile.businessDocUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium px-4 py-2 bg-[var(--bg-sunken)] rounded-md text-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-white transition-colors"
                      >
                        View File
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
