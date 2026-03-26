"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { VendorProfileData } from "@/lib/types";
import {
  fetchVendorProfile,
  isVendorApproved,
  normalizeVendorStatus,
  API_BASE_URL,
} from "@/lib/vendor-profile";
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
} from "lucide-react";

// --- REUSABLE COMPONENTS ---

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

export default function VendorProfilePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [profile, setProfile] = useState<VendorProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      if (!user || user.role?.toUpperCase() !== "VENDOR") {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const vendorProfile = await fetchVendorProfile();
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
        if (isMounted) setLoading(false);
      }
    };

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, [router, user]);

  const handleLogoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
         const updatedProfile = await fetchVendorProfile();
         if (updatedProfile) setProfile(updatedProfile);
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
                {profile?.user?.name || user?.name || "Vendor"}
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
              Profile
            </h1>
            {!approved && !loading && profile && (
              <span className="px-3 py-1 bg-[var(--status-warning-bg)] text-[var(--status-warning)] text-xs font-medium rounded-full border border-yellow-200">
                Approval Pending
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search orders, products..."
                className="pl-9 pr-4 py-2 rounded-full text-sm w-64 bg-[var(--bg-surface)] border-[var(--border-default)] border focus:outline-none focus:border-[var(--brand-primary)]"
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
        <div className="p-8 max-w-[1200px] w-full">
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
                className="rounded-xl border p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
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
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {approved ? (
                      <CheckCircle2 className="w-6 h-6 text-[var(--status-success)]" />
                    ) : status === "REJECTED" ? (
                      <XCircle className="w-6 h-6 text-[var(--status-error)]" />
                    ) : (
                      <Clock className="w-6 h-6 text-[var(--status-warning)]" />
                    )}
                  </div>
                  <div>
                    <h2
                      className="text-lg font-semibold"
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
                          : "Application Under Review"}
                    </h2>
                    <p
                      className="text-sm mt-1"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {approved
                        ? "Your store is active and live on MarketFlow. You have full access to all vendor features."
                        : status === "REJECTED"
                          ? "Unfortunately, your application was rejected. Please review your details and documents."
                          : "Your store profile and documents are currently being reviewed by our team. Approval usually takes 24-48 hours."}
                    </p>
                  </div>
                </div>
                {!approved && status !== "REJECTED" && (
                  <div className="flex-shrink-0">
                    <span
                      className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-white bg-opacity-50 text-sm font-medium border border-white border-opacity-60 shadow-sm"
                      style={{ color: "var(--status-warning)" }}
                    >
                      Pending
                    </span>
                  </div>
                )}
              </div>

              {/* THREE COLUMN GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                            <img src={profile.logoUrl} alt="Store Logo" className="w-full h-full object-cover" />
                          ) : (
                            <Building2 className="w-8 h-8 text-[var(--text-muted)] opacity-40" />
                          )}
                          
                          <div 
                            className={`absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${isUploadingLogo ? 'opacity-100 bg-white/70' : ''}`} 
                            onClick={() => !isUploadingLogo && fileInputRef.current?.click()}
                          >
                            {isUploadingLogo ? (
                              <div className="w-5 h-5 border-2 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <>
                                <Camera className="w-5 h-5 text-white mb-1" />
                                <span className="text-[10px] text-white font-semibold uppercase tracking-wider">Change</span>
                              </>
                            )}
                          </div>
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoChange} />
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ADDRESS DETAILS */}
                <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] overflow-hidden shadow-sm">
                  <div className="px-6 py-4 border-b border-[var(--border-default)] flex items-center gap-2 bg-[var(--bg-sunken)]">
                    <MapPin className="w-5 h-5 text-[var(--text-muted)]" />
                    <h3 className="font-semibold text-[var(--text-primary)]">
                      Location & Address
                    </h3>
                  </div>
                  <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
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
