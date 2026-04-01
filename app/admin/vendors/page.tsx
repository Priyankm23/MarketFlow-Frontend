"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/store";
import { authFetch } from "@/lib/auth-fetch";
import { API_BASE_URL } from "@/lib/config";
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  BarChart2,
  Settings,
  Bell,
  Search,
  LogOut,
  User,
  ShieldCheck,
  Check,
  X,
  Eye,
  Loader2,
  Zap,
  Clock,
  AlertCircle,
  MoreVertical,
  RefreshCw,
  ChevronRight,
  Star,
  Package,
  Tag,
  Calendar,
  Info,
  BadgeAlert,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// --- TYPES ---

interface PendingOffer {
  offer: {
    id: string;
    offerName: string;
    discountPercentage: number;
    couponCode: string | null;
    termsAndConditions: string | null;
    startAt: string;
    endAt: string;
    createdAt: string;
    isActive: boolean;
  };
  product: {
    id: string;
    name: string;
    price: number;
    isActive: boolean;
    stock: number;
  };
  vendor: {
    id: string | null;
    userId: string | null;
    status: string | null;
    businessName: string | null;
  };
  criteria: {
    productIsActive: boolean;
    productHasStock: boolean;
    discountValid: boolean;
    startBeforeEnd: boolean;
    durationOk: boolean;
    vendorStatusApproved: boolean;
    avgRating: number | null;
    ratingCount: number;
    minRating: number;
    minReviews: number;
    passed: boolean;
    failingReasons: string[];
  };
}

export default function AdminVendorsPage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [loading, setLoading] = useState(true);
  const [pendingOffers, setPendingOffers] = useState<PendingOffer[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingOffers();
  }, []);

  const fetchPendingOffers = async () => {
    setLoading(true);
    try {
      // API call as per vendor_product.md: prefix /api/v1/flash-deals + /pending
      const response = await authFetch(`${API_BASE_URL}/flash-deals/pending`);
      if (response.ok) {
        const result = await response.json();
        setPendingOffers(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching pending offers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewOffer = async (
    offerId: string,
    action: "approve" | "reject"
  ) => {
    setProcessingId(offerId);
    try {
      const response = await authFetch(
        `${API_BASE_URL}/flash-deals/${offerId}/${action}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.ok) {
        setPendingOffers((prev) => prev.filter((o) => o.offer.id !== offerId));
      } else {
        const error = await response.json();
        alert(error.message || `Failed to ${action} offer`);
      }
    } catch (error) {
      console.error(`Error during ${action}:`, error);
    } finally {
      setProcessingId(null);
    }
  };

  const formatFailingReason = (reason: string) => {
    const reasons: Record<string, string> = {
      product_inactive: "Product is inactive",
      out_of_stock: "Out of stock",
      invalid_discount: "Invalid discount (must be 1-60%)",
      invalid_time_range: "End date must be after start date",
      duration_too_long: "Duration exceeds 120 hours",
      vendor_not_approved: "Vendor is not approved",
      insufficient_rating: "Rating below threshold",
      insufficient_reviews: "Reviews below threshold",
    };
    return reasons[reason] || reason;
  };

  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/vendors", label: "Vendors", icon: Users, active: true },
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
            <button 
              onClick={() => logout()}
              className="text-[var(--text-muted)] hover:text-[var(--status-error)] transition-colors"
            >
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
              Vendor Management
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search vendors..."
                className="pl-9 pr-4 py-2 rounded-full text-sm w-64 bg-[var(--bg-surface)] border-[var(--border-default)] border focus:outline-none focus:border-[var(--brand-primary)]"
                style={{ color: "var(--text-primary)" }}
              />
            </div>
            <button 
              onClick={fetchPendingOffers}
              className="p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-sunken)] rounded-full transition-colors"
            >
              <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
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
            
            {/* FLASH DEAL REQUESTS SECTION */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <Zap size={20} className="text-red-600 fill-red-600" />
                    Flash Deal Approval Requests
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    Review offers that require manual override or failed automated criteria.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full border border-red-100 shadow-sm">
                    {pendingOffers.length} Pending
                  </span>
                </div>
              </div>

              {loading ? (
                <div className="py-24 text-center text-[var(--text-secondary)] bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] border-dashed">
                  <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-[var(--brand-primary)]" />
                  <p className="text-base font-medium">Fetching deal requests...</p>
                </div>
              ) : pendingOffers.length === 0 ? (
                <div className="py-24 text-center bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] border-dashed">
                  <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 shadow-inner">
                    <ShieldCheck size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-[var(--text-primary)]">No Pending Requests</h3>
                  <p className="text-[var(--text-secondary)] mt-2">All flash deal offers have been successfully reviewed.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {pendingOffers.map((item) => (
                    <div 
                      key={item.offer.id} 
                      className="group bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col"
                    >
                      {/* CARD HEADER */}
                      <div className="p-5 border-b border-[var(--border-default)] bg-gradient-to-r from-zinc-50 to-transparent">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-none font-black text-[10px] uppercase tracking-wider px-2 py-0.5">
                                Flash Deal
                              </Badge>
                              <span className="text-[11px] font-mono text-zinc-400">ID: {item.offer.id.split('-')[0]}...</span>
                            </div>
                            <h3 className="text-lg font-bold text-zinc-900 line-clamp-1 group-hover:text-[var(--brand-primary)] transition-colors">
                              {item.offer.offerName}
                            </h3>
                            <div className="flex items-center gap-1 text-sm text-zinc-500 mt-1">
                              <Users size={14} className="text-zinc-400" />
                              <span className="font-medium text-zinc-700">{item.vendor.businessName || "Unknown Vendor"}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <div className="text-2xl font-black text-red-600">
                              {item.offer.discountPercentage}%
                              <span className="text-xs ml-0.5 uppercase tracking-tighter">Off</span>
                            </div>
                            {item.offer.couponCode && (
                              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 text-amber-700 rounded border border-amber-100 text-[10px] font-bold">
                                <Tag size={10} />
                                {item.offer.couponCode}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* CARD BODY */}
                      <div className="p-5 grid grid-cols-2 gap-6 flex-1">
                        {/* LEFT: Product Info */}
                        <div className="space-y-4">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-2">Product Details</span>
                            <div className="space-y-2.5">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400 flex-shrink-0">
                                  <Package size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-zinc-800 truncate">{item.product.name}</p>
                                  <p className="text-xs font-medium text-zinc-500">₹{Number(item.product.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex flex-col p-2 bg-zinc-50 rounded-lg border border-zinc-100">
                                  <span className="text-[9px] font-bold text-zinc-400 uppercase">Stock</span>
                                  <span className={`text-sm font-bold ${item.product.stock > 0 ? 'text-zinc-700' : 'text-red-600'}`}>
                                    {item.product.stock} units
                                  </span>
                                </div>
                                <div className="flex flex-col p-2 bg-zinc-50 rounded-lg border border-zinc-100">
                                  <span className="text-[9px] font-bold text-zinc-400 uppercase">Rating</span>
                                  <div className="flex items-center gap-1">
                                    <Star size={12} className="text-amber-500 fill-amber-500" />
                                    <span className="text-sm font-bold text-zinc-700">
                                      {item.criteria.avgRating !== null && item.criteria.avgRating !== undefined ? Number(item.criteria.avgRating).toFixed(1) : "N/A"}
                                    </span>
                                    {item.criteria.ratingCount > 0 && (
                                      <span className="text-[10px] text-zinc-400 font-medium">({item.criteria.ratingCount})</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-2">Timeline</span>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2.5 text-xs text-zinc-600">
                                <div className="w-6 h-6 rounded flex items-center justify-center bg-green-50 text-green-600">
                                  <Calendar size={12} />
                                </div>
                                <span>Starts: <b>{new Date(item.offer.startAt).toLocaleDateString()}</b></span>
                              </div>
                              <div className="flex items-center gap-2.5 text-xs text-zinc-600">
                                <div className="w-6 h-6 rounded flex items-center justify-center bg-red-50 text-red-600">
                                  <Clock size={12} />
                                </div>
                                <span>Ends: <b>{new Date(item.offer.endAt).toLocaleDateString()}</b></span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* RIGHT: Criteria / Failing Reasons */}
                        <div className="border-l border-zinc-100 pl-6">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block mb-2">Approval Criteria</span>
                          {item.criteria.failingReasons.length > 0 ? (
                            <div className="space-y-2">
                              {item.criteria.failingReasons.map((reason) => (
                                <div key={reason} className="flex items-start gap-2 p-2 bg-red-50/50 rounded-lg border border-red-100/50">
                                  <AlertTriangle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                                  <span className="text-xs font-medium text-red-700 leading-tight">
                                    {formatFailingReason(reason)}
                                  </span>
                                </div>
                              ))}
                              <div className="mt-4 p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase">
                                  <Info size={12} />
                                  Requirements
                                </div>
                                <div className="mt-1 space-y-1">
                                  <div className="flex justify-between text-[11px]">
                                    <span className="text-zinc-500">Min Rating:</span>
                                    <span className="font-bold text-zinc-700">{item.criteria.minRating}</span>
                                  </div>
                                  <div className="flex justify-between text-[11px]">
                                    <span className="text-zinc-500">Min Reviews:</span>
                                    <span className="font-bold text-zinc-700">{item.criteria.minReviews}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full py-4 text-center">
                              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600 mb-2">
                                <Check size={24} />
                              </div>
                              <p className="text-xs font-bold text-green-700">All Criteria Passed</p>
                              <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-tighter">Manual review recommended</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* CARD FOOTER */}
                      <div className="p-5 bg-zinc-50 border-t border-[var(--border-default)] flex items-center gap-3">
                        <button
                          onClick={() => handleReviewOffer(item.offer.id, "approve")}
                          disabled={!!processingId}
                          className="flex-1 h-10 px-4 rounded-xl bg-zinc-900 text-white text-sm font-bold hover:bg-black transition-all shadow-sm hover:shadow active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {processingId === item.offer.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Check size={16} />
                          )}
                          Approve Deal
                        </button>
                        <button
                          onClick={() => handleReviewOffer(item.offer.id, "reject")}
                          disabled={!!processingId}
                          className="flex-1 h-10 px-4 rounded-xl bg-white border border-zinc-200 text-zinc-700 text-sm font-bold hover:bg-zinc-100 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {processingId === item.offer.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <X size={16} />
                          )}
                          Reject Offer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CRITERIA NOTICE */}
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 flex items-start gap-5 shadow-sm">
              <div className="bg-amber-100 p-3 rounded-xl text-amber-700 shadow-inner">
                <AlertCircle size={24} />
              </div>
              <div>
                <h4 className="text-base font-bold text-amber-900 uppercase tracking-widest">Manual Override Protocol</h4>
                <p className="text-sm text-amber-800 mt-1.5 leading-relaxed opacity-90">
                  The items listed above have been flagged by the automated validation engine. This occurs when an offer deviates from standard profitability or risk profiles 
                  (e.g., extreme discounts, low merchant reputation, or inventory inconsistency). 
                  <b> Your approval manually overrides these safety checks.</b>
                </p>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
