"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore, useVendorStore } from "@/lib/store";
import { authFetch } from "@/lib/auth-fetch";
import { normalizeVendorStatus } from "@/lib/vendor-profile";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  BarChart2,
  Settings,
  Bell,
  Search,
  ArrowLeft,
  Loader2,
  User,
  Save,
  Tag,
  AlertCircle,
  Plus,
  Upload,
  X,
  Menu,
  LogOut,
  ChevronLeft,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { API_BASE_URL } from "@/lib/config";

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

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { profile, loadProfile } = useVendorStore();

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [isAddImageModalOpen, setIsAddImageModalOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<FileList | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: "",
  });

  const [isFlashDealModalOpen, setIsFlashDealModalOpen] = useState(false);
  const [flashDealSubmitting, setFlashDealSubmitting] = useState(false);
  const [flashDealData, setFlashDealData] = useState({
    offerName: "",
    discountPercentage: "",
    couponCode: "",
    startAt: "",
    endAt: "",
    termsAndConditions: "",
  });

  // Mock Offers Data
  const [offers, setOffers] = useState<any[]>([]);

  useEffect(() => {
    if (user?.role?.toUpperCase() === "VENDOR") {
      loadProfile();
    }
  }, [user, loadProfile]);

  useEffect(() => {
    loadData();
    fetchOffers();
  }, [id]);

  const fetchOffers = async () => {
    try {
      const res = await authFetch(
        `${API_BASE_URL}/flash-deals?productId=${id}`,
      );
      if (res.ok) {
        const data = await res.json();
        setOffers(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching offers:", err);
    }
  };

  const handleCreateFlashDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setFlashDealSubmitting(true);
    try {
      const response = await authFetch(`${API_BASE_URL}/flash-deals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: id,
          offerName: flashDealData.offerName,
          discountPercentage: Number(flashDealData.discountPercentage),
          couponCode: flashDealData.couponCode || null,
          startAt: new Date(flashDealData.startAt).toISOString(),
          endAt: new Date(flashDealData.endAt).toISOString(),
          termsAndConditions: flashDealData.termsAndConditions || null,
        }),
      });

      if (response.ok) {
        alert("Flash deal created successfully!");
        setIsFlashDealModalOpen(false);
        setFlashDealData({
          offerName: "",
          discountPercentage: "",
          couponCode: "",
          startAt: "",
          endAt: "",
          termsAndConditions: "",
        });
        fetchOffers();
      } else {
        const error = await response.json();
        alert(error.message || "Failed to create flash deal");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while creating the flash deal");
    } finally {
      setFlashDealSubmitting(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/products/${id}`),
        authFetch(`${API_BASE_URL}/products/categories`),
      ]);

      if (prodRes.ok) {
        const prodData = await prodRes.json();
        const p = prodData.data || prodData;
        setProduct(p);
        setFormData({
          name: p.name,
          description: p.description,
          price: p.price.toString(),
          categoryId: p.categoryId || p.category?.id || "",
        });
      }

      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData.data || []);
      }
    } catch (err) {
      console.error("Error loading product:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await authFetch(`${API_BASE_URL}/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
        }),
      });

      if (response.ok) {
        alert("Product updated successfully!");
        loadData();
      } else {
        alert("Failed to update product");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddImages = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImages || selectedImages.length === 0) return;

    setUploadingImages(true);
    try {
      const body = new FormData();
      for (let i = 0; i < selectedImages.length; i++) {
        body.append("images", selectedImages[i]);
      }

      const response = await authFetch(
        `${API_BASE_URL}/vendors/products/${id}/images`,
        {
          method: "POST",
          body: body,
        },
      );

      if (response.ok) {
        setIsAddImageModalOpen(false);
        setSelectedImages(null);
        await loadData();
      } else {
        const error = await response.json();
        alert(error.message || "Failed to upload images");
      }
    } catch (error) {
      console.error("Error uploading images:", error);
    } finally {
      setUploadingImages(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--bg-base)]">
        <Loader2
          className="animate-spin text-[var(--brand-primary)]"
          size={32}
        />
      </div>
    );
  }

  const navItems = [
    { href: "/vendor/dashboard", label: "Dashboard", icon: LayoutDashboard },
    {
      href: "/vendor/products",
      label: "Products",
      icon: Package,
      active: true,
    },
    { href: "/vendor/orders", label: "Orders", icon: ShoppingBag },
    { href: "/vendor/analytics", label: "Analytics", icon: BarChart2 },
    { href: "/vendor/profile", label: "Profile", icon: User },
    { href: "/vendor/settings", label: "Settings", icon: Settings },
  ];

  const images =
    product?.imageUrls && product.imageUrls.length > 0
      ? product.imageUrls
      : [product?.imageUrl || "/placeholder.svg"];

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
            <p className="text-[11px] font-bold text-muted-foreground mt-0.5 uppercase tracking-widest">
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
              <StatusBadge
                status={normalizeVendorStatus(profile?.status) || "PENDING"}
              />
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
                onClick={() => setIsMobileSidebarOpen(false)}
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
              >
                <Icon
                  size={18}
                  className={`${isActive ? "" : "group-hover:text-primary transition-colors"}`}
                />
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
            <button
              onClick={() => logout()}
              className="text-muted-foreground hover:text-rose-600 transition-colors p-1.5 hover:bg-rose-50 rounded-lg"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 ml-0 md:ml-[260px] flex flex-col min-h-screen">
        <header className="h-16 md:h-[72px] px-4 sm:px-6 md:px-8 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-30 border-b border-border">
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Open sidebar"
              className="md:hidden h-9 w-9 rounded-xl border border-border bg-white text-foreground hover:bg-slate-50 flex items-center justify-center shadow-sm"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <Menu size={18} />
            </button>

            <button
              onClick={() => router.back()}
              className="h-9 w-9 rounded-xl border border-border bg-white text-foreground hover:bg-slate-50 flex items-center justify-center shadow-sm transition-colors"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="space-y-0.5">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Edit Product
              </h1>
              <p className="hidden sm:block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {product?.name || "Refining your listing"}
              </p>
            </div>
          </div>
        </header>

        <div className="p-5 md:p-8 max-w-[1200px] w-full mx-auto space-y-8 pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Images */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Product Gallery
                </h3>
                <span className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
                  {images.length} Image(s)
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {images.map((img: string, i: number) => (
                  <div
                    key={i}
                    className="aspect-square relative rounded-2xl overflow-hidden border border-border bg-slate-50 group"
                  >
                    <Image
                      src={img}
                      alt={`${product?.name} ${i}`}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
                <button
                  onClick={() => setIsAddImageModalOpen(true)}
                  className="aspect-square rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:bg-slate-50 hover:border-primary/30 hover:text-primary transition-all active:scale-95 bg-white shadow-sm"
                >
                  <Plus size={24} />
                  <span className="text-[10px] mt-2 font-bold uppercase tracking-widest">
                    Add Media
                  </span>
                </button>
              </div>
            </div>

            {/* Right: Form */}
            <div className="lg:col-span-2">
              <div className="bg-card rounded-3xl border border-border p-6 sm:p-8 shadow-sm">
                <form onSubmit={handleUpdate} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                      Product Identity
                    </label>
                    <Input
                      required
                      placeholder="Display Name"
                      className="h-12 rounded-xl border-border bg-slate-50 focus:bg-white transition-all text-base font-medium shadow-none"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                      Detailed Description
                    </label>
                    <Textarea
                      required
                      placeholder="What makes this product special?"
                      className="min-h-[160px] rounded-xl border-border bg-slate-50 focus:bg-white transition-all text-base shadow-none resize-none p-4"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                        Pricing (₹)
                      </label>
                      <Input
                        required
                        type="number"
                        placeholder="0.00"
                        className="h-12 rounded-xl border-border bg-slate-50 focus:bg-white transition-all text-base font-bold shadow-none"
                        value={formData.price}
                        onChange={(e) =>
                          setFormData({ ...formData, price: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                        Category Classification
                      </label>
                      <select
                        required
                        className="w-full flex h-12 rounded-xl border border-border bg-slate-50 px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer"
                        value={formData.categoryId}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            categoryId: e.target.value,
                          })
                        }
                      >
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 bg-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-95 transition-all shadow-lg shadow-primary/20 active:scale-[0.98] disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <>
                        <Save size={20} /> Update Product Details
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* OFFERS SECTION */}
          <div className="space-y-6 pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  Promotional Campaigns
                </h2>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Flash deals and seasonal offers for this item
                </p>
              </div>
              <button
                onClick={() => setIsFlashDealModalOpen(true)}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95 bg-primary text-white"
              >
                <Plus size={18} /> Launch New Offer
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Existing Offers */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  Active & Scheduled Roadmap
                </h3>
                {offers.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {offers.map((offer) => {
                      const isExpired = new Date(offer.endAt) < new Date();
                      const isScheduled = new Date(offer.startAt) > new Date();
                      const isActive = !isExpired && !isScheduled;

                      return (
                        <div
                          key={offer.id}
                          className="bg-card p-5 rounded-2xl border border-border relative overflow-hidden group hover:shadow-md transition-shadow"
                        >
                          <div className="absolute top-0 right-0 p-3">
                            <span
                              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider border shadow-sm ${
                                isExpired
                                  ? "bg-rose-50 text-rose-700 border-rose-100"
                                  : isScheduled
                                    ? "bg-slate-100 text-slate-600 border-slate-200"
                                    : "bg-emerald-50 text-emerald-700 border-emerald-100 animate-pulse"
                              }`}
                            >
                              {isExpired
                                ? "Concluded"
                                : isScheduled
                                  ? "Scheduled"
                                  : "Live Now"}
                            </span>
                          </div>
                          <div className="flex items-start gap-4">
                            <div
                              className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm border border-black/5 shrink-0 ${
                                isExpired
                                  ? "bg-slate-100 text-slate-400"
                                  : "bg-primary/10 text-primary"
                              }`}
                            >
                              <Tag
                                size={22}
                                className={isActive ? "animate-bounce" : ""}
                              />
                            </div>
                            <div className="flex-1 min-w-0 pr-16">
                              <h4 className="font-bold text-foreground truncate">
                                {offer.offerName}
                              </h4>
                              <p className="text-xl font-black text-primary mt-1 tracking-tighter">
                                {offer.discountPercentage}% OFF
                              </p>
                              {offer.couponCode && (
                                <p className="text-[10px] font-bold text-muted-foreground mt-1 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded inline-block uppercase tracking-widest">
                                  Code: {offer.couponCode}
                                </p>
                              )}
                              <div className="mt-4 pt-4 border-t border-border/50 flex flex-col gap-1.5">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  {new Date(offer.startAt).toLocaleString(
                                    "en-IN",
                                    {
                                      day: "2-digit",
                                      month: "short",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                  {new Date(offer.endAt).toLocaleString(
                                    "en-IN",
                                    {
                                      day: "2-digit",
                                      month: "short",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-12 text-center border-2 border-dashed border-border rounded-3xl bg-slate-50/50">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-border">
                      <Tag size={32} className="text-muted-foreground/30" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">
                      No active offers
                    </h3>
                    <p className="text-muted-foreground mt-1 max-w-xs mx-auto">
                      Boost sales by creating a time-limited flash deal for this
                      product.
                    </p>
                  </div>
                )}
              </div>

              {/* Tips Section */}
              <div className="bg-card p-6 rounded-3xl border border-border shadow-sm h-fit space-y-6">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  Strategy Center
                </h3>
                <div className="space-y-6">
                  <div className="flex gap-4 group">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <BarChart2 size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        Maximized Reach
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Deals appear on the "Flash Sales" homepage and top of
                        categories.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 group">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100 group-hover:bg-amber-600 group-hover:text-white transition-all">
                      <Bell size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        FOMO Effect
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Short-duration deals (4-12 hours) create urgency and
                        higher conversion.
                      </p>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 text-rose-600 mb-2">
                      <AlertCircle size={14} />
                      <span className="text-[10px] font-black uppercase tracking-wider">
                        Quick Tip
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-slate-600 leading-relaxed italic">
                      "Products with at least 3 high-quality images see 40%
                      higher engagement during flash sales."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* FLASH DEAL MODAL */}
      <Dialog
        open={isFlashDealModalOpen}
        onOpenChange={setIsFlashDealModalOpen}
      >
        <DialogContent className="sm:max-w-[500px] rounded-3xl border-none p-0 overflow-hidden shadow-2xl">
          <div className="bg-primary p-6 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                <Tag size={24} className="fill-white/20" />
                Configure Campaign
              </DialogTitle>
              <p className="text-white/70 text-sm font-medium mt-1">
                Setting up a new offer for: {product?.name}
              </p>
            </DialogHeader>
          </div>
          <form
            onSubmit={handleCreateFlashDeal}
            className="space-y-5 p-6 bg-white"
          >
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                Internal Campaign Name
              </label>
              <Input
                required
                placeholder="e.g. Weekend Rush"
                className="h-11 rounded-xl border-border bg-slate-50 focus:bg-white transition-all text-sm font-bold shadow-none"
                value={flashDealData.offerName}
                onChange={(e) =>
                  setFlashDealData({
                    ...flashDealData,
                    offerName: e.target.value,
                  })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  Discount (%)
                </label>
                <Input
                  required
                  type="number"
                  min="1"
                  max="100"
                  placeholder="20"
                  className="h-11 rounded-xl border-border bg-slate-50 focus:bg-white transition-all text-sm font-bold shadow-none"
                  value={flashDealData.discountPercentage}
                  onChange={(e) =>
                    setFlashDealData({
                      ...flashDealData,
                      discountPercentage: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  Promo Code
                </label>
                <Input
                  placeholder="MARK20"
                  className="h-11 rounded-xl border-border bg-slate-50 focus:bg-white transition-all text-sm font-bold shadow-none uppercase"
                  value={flashDealData.couponCode}
                  onChange={(e) =>
                    setFlashDealData({
                      ...flashDealData,
                      couponCode: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  Activation
                </label>
                <Input
                  required
                  type="datetime-local"
                  className="h-11 rounded-xl border-border bg-slate-50 focus:bg-white transition-all text-xs font-bold shadow-none"
                  value={flashDealData.startAt}
                  onChange={(e) =>
                    setFlashDealData({
                      ...flashDealData,
                      startAt: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  Expiration
                </label>
                <Input
                  required
                  type="datetime-local"
                  className="h-11 rounded-xl border-border bg-slate-50 focus:bg-white transition-all text-xs font-bold shadow-none"
                  value={flashDealData.endAt}
                  onChange={(e) =>
                    setFlashDealData({
                      ...flashDealData,
                      endAt: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                Terms & Fine Print
              </label>
              <Textarea
                placeholder="One per customer, minimum spend ₹199..."
                className="min-h-[80px] rounded-xl border-border bg-slate-50 focus:bg-white transition-all text-sm shadow-none resize-none"
                value={flashDealData.termsAndConditions}
                onChange={(e) =>
                  setFlashDealData({
                    ...flashDealData,
                    termsAndConditions: e.target.value,
                  })
                }
              />
            </div>

            <DialogFooter className="pt-2">
              <button
                type="button"
                onClick={() => setIsFlashDealModalOpen(false)}
                className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
              >
                Discard
              </button>
              <button
                type="submit"
                disabled={flashDealSubmitting}
                className="flex items-center justify-center gap-2 px-8 py-2.5 rounded-xl text-sm font-bold bg-primary text-white hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-primary/20"
              >
                {flashDealSubmitting ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  "Initiate Offer"
                )}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ADD IMAGES MODAL */}
      <Dialog open={isAddImageModalOpen} onOpenChange={setIsAddImageModalOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-3xl p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold tracking-tight flex items-center gap-3">
              <Upload size={24} className="text-primary" />
              Upload Media
            </DialogTitle>
            <p className="text-sm font-medium text-muted-foreground mt-1">
              Enhance your listing with new visuals.
            </p>
          </DialogHeader>
          <form onSubmit={handleAddImages} className="space-y-6 pt-6">
            <div className="flex justify-center px-6 pt-10 pb-10 border-2 border-border border-dashed rounded-3xl hover:bg-slate-50 hover:border-primary/30 transition-all cursor-pointer relative group bg-slate-50/50">
              <div className="space-y-3 text-center">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-border group-hover:scale-110 transition-transform">
                  <Plus size={32} className="text-primary" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-bold text-foreground">
                    Select Product Images
                  </p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    JPEG, PNG, WEBP (MAX 10MB)
                  </p>
                </div>
                {selectedImages && selectedImages.length > 0 && (
                  <div className="mt-4 px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-100 inline-block">
                    {selectedImages.length} file(s) ready to upload
                  </div>
                )}
              </div>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => setSelectedImages(e.target.files)}
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <button
                type="button"
                onClick={() => setIsAddImageModalOpen(false)}
                className="flex-1 sm:flex-none px-6 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploadingImages || !selectedImages}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-sm font-bold bg-primary text-white hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-primary/20"
              >
                {uploadingImages ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  "Start Upload"
                )}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
