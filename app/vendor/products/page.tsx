"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuthStore, useVendorStore } from "@/lib/store";
import { authFetch } from "@/lib/auth-fetch";
import { isVendorApproved, normalizeVendorStatus } from "@/lib/vendor-profile";
import { VendorProfileData } from "@/lib/types";
import {
  LayoutDashboard,
  LogOut,
  Package,
  ShoppingBag,
  BarChart2,
  Settings,
  Search,
  Plus,
  MoreVertical,
  Loader2,
  User,
  Upload,
  Minus,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Boxes,
  CircleOff,
  IndianRupee,
  Menu,
  Star,
  X,
  Tag,
  ShieldCheck,
  CalendarClock,
  Lock,
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

// Using centralized API_BASE_URL from lib/config

type VendorCategory = {
  id: string;
  name: string;
};

type VendorProduct = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  imageUrl?: string | null;
  imageUrls?: string[] | null;
  rating?: number | null;
  reviewCount?: number | null;
  warranty?: string | null;
  returnPolicy?: string | null;
  category?:
    | {
        id?: string;
        name?: string;
      }
    | string
    | null;
  createdAt?: string;
  updatedAt?: string;
};

type StockFilter = "all" | "in-stock" | "low-stock" | "out-of-stock";
type SortOption =
  | "newest"
  | "name-asc"
  | "price-high"
  | "price-low"
  | "stock-high"
  | "stock-low";

type OfferMode = "flash" | "other";

const STOCK_FILTER_OPTIONS: Array<{ label: string; value: StockFilter }> = [
  { label: "All", value: "all" },
  { label: "In Stock", value: "in-stock" },
  { label: "Low Stock", value: "low-stock" },
  { label: "Out of Stock", value: "out-of-stock" },
];

const getSafeNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(value);

const getCategoryName = (product: VendorProduct) => {
  if (typeof product.category === "string") {
    return product.category;
  }
  return product.category?.name || "General";
};

function StatCard({
  title,
  value,
  detail,
  icon: Icon,
  colorClass,
}: {
  title: string;
  value: string;
  detail: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  colorClass?: string;
}) {
  return (
    <div className="bg-card rounded-2xl p-4 sm:p-5 border border-border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 -mr-6 -mt-6 rounded-full opacity-10 transition-transform group-hover:scale-110 ${colorClass || "bg-primary"}`} />
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-3">
        <div>
          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.1em] sm:tracking-[0.15em] text-muted-foreground truncate">
            {title}
          </p>
          <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            {value}
          </p>
          <p className="mt-1 text-[9px] sm:text-[11px] font-medium text-muted-foreground italic truncate">
            {detail}
          </p>
        </div>
        <div className={`h-9 w-9 sm:h-11 sm:w-11 rounded-lg sm:rounded-xl shadow-sm border border-black/5 flex items-center justify-center shrink-0 ${colorClass || "bg-primary/10 text-primary"}`}>
          <Icon size={18} className="sm:w-5 sm:h-5" />
        </div>
      </div>
    </div>
  );
}

// --- PRODUCT CARD COMPONENT ---

function ProductCard({
  product,
  onUpdateStock,
  onCreateOtherOffer,
}: {
  product: VendorProduct;
  onUpdateStock: (id: string, newStock: number) => Promise<void>;
  onCreateOtherOffer: (product: VendorProduct) => void;
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [localStock, setLocalStock] = useState(getSafeNumber(product.stock));
  const [updating, setUpdating] = useState(false);
  const router = useRouter();

  const images =
    Array.isArray(product.imageUrls) && product.imageUrls.length > 0
      ? product.imageUrls
      : [product.imageUrl || "/placeholder.svg"];

  const categoryName = getCategoryName(product);
  const rating = getSafeNumber(product.rating);
  const reviewCount = getSafeNumber(product.reviewCount);
  const numericPrice = getSafeNumber(product.price);

  const stockConfig =
    localStock === 0
      ? { label: "Sold Out", bg: "bg-rose-50", color: "text-rose-700", border: "border-rose-200" }
      : localStock <= 10
        ? { label: `${localStock} Left`, bg: "bg-amber-50", color: "text-amber-700", border: "border-amber-200" }
        : { label: "In Stock", bg: "bg-emerald-50", color: "text-emerald-700", border: "border-emerald-200" };

  const hasMultipleImages = images.length > 1;

  useEffect(() => {
    setLocalStock(getSafeNumber(product.stock));
  }, [product.stock]);

  useEffect(() => {
    if (!hasMultipleImages) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [hasMultipleImages, images.length]);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleStockChange = (e: React.MouseEvent, delta: number) => {
    e.stopPropagation();
    setLocalStock((prev: number) => Math.max(0, prev + delta));
  };

  const isStockChanged = localStock !== product.stock;

  const handleUpdateClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setUpdating(true);
    await onUpdateStock(product.id, localStock);
    setUpdating(false);
  };

  return (
    <div
      onClick={() => router.push(`/vendor/products/${product.id}`)}
      className="bg-card rounded-2xl border border-border overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer flex flex-col h-full shadow-sm"
    >
      <div className="aspect-[4/3] relative bg-slate-50 overflow-hidden">
        <Image
          src={images[currentImageIndex]}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="absolute top-3 left-3 inline-flex items-center rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-foreground shadow-sm border border-black/5">
          {categoryName}
        </div>

        <div
          className={`absolute top-3 right-3 inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest shadow-sm border ${stockConfig.bg} ${stockConfig.color} ${stockConfig.border}`}
        >
          {stockConfig.label}
        </div>

        {hasMultipleImages && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-all hover:bg-white active:scale-90"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-all hover:bg-white active:scale-90"
            >
              <ChevronRight size={16} />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_: any, i: number) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full shadow-sm transition-all duration-300 ${i === currentImageIndex ? "bg-primary w-4" : "bg-white/70"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-foreground line-clamp-2 leading-snug min-h-[52px]">
            {product.name}
          </h3>

          <div className="mt-3 flex items-center justify-between gap-2">
            <p className="text-2xl font-bold text-foreground tracking-tight">
              ₹{formatPrice(numericPrice)}
            </p>
            {rating > 0 ? (
              <p className="inline-flex items-center gap-1 rounded-lg border border-border bg-slate-50 px-2 py-1 text-xs font-bold text-muted-foreground">
                <Star size={12} className="text-amber-500 fill-amber-500" />
                {rating.toFixed(1)} <span className="opacity-50">•</span> {formatPrice(reviewCount)}
              </p>
            ) : (
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Fresh Item
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">
              Stock Control
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => handleStockChange(e, -1)}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-white border border-border text-foreground hover:bg-slate-50 shadow-sm active:scale-90 transition-transform"
              >
                <Minus size={14} />
              </button>
              <span className="text-sm font-bold w-6 text-center tabular-nums">
                {localStock}
              </span>
              <button
                onClick={(e) => handleStockChange(e, 1)}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-white border border-border text-foreground hover:bg-slate-50 shadow-sm active:scale-90 transition-transform"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            {!isStockChanged ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateOtherOffer(product);
                }}
                className="w-full py-2.5 bg-primary/5 text-primary text-xs font-bold rounded-xl hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2 border border-primary/10 shadow-sm active:scale-95"
              >
                <Tag size={14} />
                Offer
              </button>
            ) : (
              <button
                onClick={handleUpdateClick}
                disabled={updating}
                className="w-full py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                {updating ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <>
                    <ShieldCheck size={14} />
                    Confirm Stock Change
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- MAIN PAGE COMPONENT ---

export default function VendorProductsPage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { profile, loadProfile, isLoading: loadingProfile } = useVendorStore();

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [categories, setCategories] = useState<VendorCategory[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const vendorId = profile?.id || profile?.userId || user?.id || "";

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    categoryId: "",
    warranty: "",
    returnPolicy: "",
  });

  const [isFlashDealModalOpen, setIsFlashDealModalOpen] = useState(false);
  const [flashDealSubmitting, setFlashDealSubmitting] = useState(false);
  const [offerMode, setOfferMode] = useState<OfferMode>("flash");
  const [selectedProductForFlashDeal, setSelectedProductForFlashDeal] =
    useState<VendorProduct | null>(null);
  const [flashDealData, setFlashDealData] = useState({
    offerName: "",
    discountPercentage: "",
    couponCode: "",
    startAt: "",
    endAt: "",
    termsAndConditions: "",
  });

  useEffect(() => {
    if (user?.role?.toUpperCase() === "VENDOR") {
      loadProfile();
    }
  }, [user, loadProfile]);

  useEffect(() => {
    const loadData = async () => {
      if (!user || user.role?.toUpperCase() !== "VENDOR" || !profile) {
        if (!profile && !loadingProfile) {
          setLoading(false);
        }
        return;
      }
      try {
        if (isVendorApproved(profile.status)) {
          const resolvedVendorId =
            profile.id || profile.userId || user?.id;
          if (resolvedVendorId) {
            await Promise.all([
              fetchProducts(resolvedVendorId),
              fetchCategories(),
            ]);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user, profile, loadingProfile]);

  const fetchCategories = async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/products/categories`);
      if (response.ok) {
        const result = await response.json();
        const cats = Array.isArray(result.data) ? result.data : [];
        setCategories(cats);
        if (cats.length > 0) {
          setFormData((prev) => ({ ...prev, categoryId: cats[0].id }));
        }
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchProducts = async (currentVendorId: string) => {
    try {
      const response = await authFetch(
        `${API_BASE_URL}/products/vendor/${encodeURIComponent(currentVendorId)}`,
      );
      if (response.ok) {
        const result = await response.json();
        setProducts(Array.isArray(result.data) ? result.data : []);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const openFlashDealModal = (product: VendorProduct) => {
    setSelectedProductForFlashDeal(product);
    setOfferMode("flash");
    setFlashDealData({
      offerName: "Flash Deal",
      discountPercentage: "",
      couponCode: "",
      startAt: "",
      endAt: "",
      termsAndConditions: "",
    });
    setIsFlashDealModalOpen(true);
  };

  const openOtherOfferModal = (product: VendorProduct) => {
    setSelectedProductForFlashDeal(product);
    setOfferMode("other");
    setFlashDealData({
      offerName: "",
      discountPercentage: "",
      couponCode: "",
      startAt: "",
      endAt: "",
      termsAndConditions: "",
    });
    setIsFlashDealModalOpen(true);
  };

  const handleCreateFlashDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForFlashDeal) return;

    setFlashDealSubmitting(true);
    try {
      const response = await authFetch(`${API_BASE_URL}/flash-deals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProductForFlashDeal.id,
          offerName: flashDealData.offerName,
          discountPercentage: Number(flashDealData.discountPercentage),
          couponCode: flashDealData.couponCode || null,
          startAt: new Date(flashDealData.startAt).toISOString(),
          endAt: new Date(flashDealData.endAt).toISOString(),
          termsAndConditions: flashDealData.termsAndConditions || null,
        }),
      });

      if (response.ok) {
        alert("Offer created successfully!");
        setIsFlashDealModalOpen(false);
        setFlashDealData({
          offerName: "",
          discountPercentage: "",
          couponCode: "",
          startAt: "",
          endAt: "",
          termsAndConditions: "",
        });
        if (vendorId) {
          await fetchProducts(vendorId);
        }
      } else {
        const error = await response.json();
        alert(error.message || "Failed to create offer");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while creating the offer");
    } finally {
      setFlashDealSubmitting(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body = new FormData();
      body.append("name", formData.name);
      body.append("description", formData.description);
      body.append("price", formData.price);
      body.append("stock", formData.stock);
      body.append("categoryId", formData.categoryId);
      body.append("warranty", formData.warranty);
      body.append("returnPolicy", formData.returnPolicy);

      if (selectedFiles) {
        for (let i = 0; i < selectedFiles.length; i++) {
          body.append("images", selectedFiles[i]);
        }
        body.append("image", selectedFiles[0]);
      }

      const response = await authFetch(`${API_BASE_URL}/products`, {
        method: "POST",
        body: body,
      });

      if (response.ok) {
        setIsAddModalOpen(false);
        setFormData({
          name: "",
          description: "",
          price: "",
          stock: "",
          categoryId: categories.length > 0 ? categories[0].id : "",
          warranty: "",
          returnPolicy: "",
        });
        setSelectedFiles(null);
        if (vendorId) {
          await fetchProducts(vendorId);
        }
      } else {
        const error = await response.json();
        alert(error.message || "Failed to add product");
      }
    } catch (error) {
      console.error("Error adding product:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const onUpdateStock = async (productId: string, newStock: number) => {
    try {
      const response = await authFetch(
        `${API_BASE_URL}/products/${productId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stock: newStock }),
        },
      );
      if (response.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p)),
        );
      }
    } catch (error) {
      console.error("Error updating stock:", error);
    }
  };

  const approved = isVendorApproved(profile?.status);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const searched = products.filter((product) => {
      if (!query) return true;
      const categoryName = getCategoryName(product).toLowerCase();
      const name = (product.name || "").toLowerCase();
      return name.includes(query) || categoryName.includes(query);
    });

    const filteredByStock = searched.filter((product) => {
      const stock = getSafeNumber(product.stock);
      if (stockFilter === "in-stock") return stock > 0;
      if (stockFilter === "low-stock") return stock > 0 && stock <= 10;
      if (stockFilter === "out-of-stock") return stock === 0;
      return true;
    });

    const sorted = [...filteredByStock];
    sorted.sort((a, b) => {
      if (sortBy === "name-asc") {
        return (a.name || "").localeCompare(b.name || "");
      }
      if (sortBy === "price-high") {
        return getSafeNumber(b.price) - getSafeNumber(a.price);
      }
      if (sortBy === "price-low") {
        return getSafeNumber(a.price) - getSafeNumber(b.price);
      }
      if (sortBy === "stock-high") {
        return getSafeNumber(b.stock) - getSafeNumber(a.stock);
      }
      if (sortBy === "stock-low") {
        return getSafeNumber(a.stock) - getSafeNumber(b.stock);
      }

      const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return bTime - aTime;
    });

    return sorted;
  }, [products, searchQuery, stockFilter, sortBy]);

  const productStats = useMemo(() => {
    const totalProducts = products.length;
    const totalUnits = products.reduce(
      (sum, product) => sum + getSafeNumber(product.stock),
      0,
    );
    const lowStock = products.filter((product) => {
      const stock = getSafeNumber(product.stock);
      return stock > 0 && stock <= 10;
    }).length;
    const outOfStock = products.filter(
      (product) => getSafeNumber(product.stock) === 0,
    ).length;
    const inventoryValue = products.reduce(
      (sum, product) =>
        sum + getSafeNumber(product.stock) * getSafeNumber(product.price),
      0,
    );

    return {
      totalProducts,
      totalUnits,
      lowStock,
      outOfStock,
      inventoryValue,
    };
  }, [products]);

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
              <StatusBadge status={normalizeVendorStatus(profile?.status) || "PENDING"} />
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
        <header
          className="h-16 md:h-[72px] px-4 sm:px-6 md:px-8 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-30 border-b border-border"
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
                Products
              </h1>
              <p className="hidden sm:block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Inventory & Catalog Management
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsAddModalOpen(true)}
              disabled={!approved}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: "var(--brand-primary)",
                color: "var(--text-inverse)",
              }}
            >
              <Plus size={18} />
              <span className="hidden sm:inline">List New Product</span>
            </button>
          </div>
        </header>

        <div className="p-5 md:p-8 max-w-[1400px] w-full mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="h-10 w-10 animate-spin mb-4 text-primary" />
              <p className="text-sm font-medium">Loading catalog data...</p>
            </div>
          ) : !approved ? (
            <div className="bg-card border border-amber-200 rounded-3xl p-10 text-center max-w-2xl mx-auto mt-12 shadow-xl shadow-amber-900/5">
              <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-amber-100">
                <AlertTriangle size={40} />
              </div>
              <h2 className="text-3xl font-bold text-foreground tracking-tight">
                Account Pending Approval
              </h2>
              <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
                Your vendor application is currently under review. You will be able to manage products and view orders once your store is approved.
              </p>
              <Link
                href="/vendor/profile"
                className="inline-flex items-center justify-center px-8 py-4 mt-8 rounded-2xl text-base font-bold transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95"
                style={{
                  backgroundColor: "var(--brand-primary)",
                  color: "var(--text-inverse)",
                }}
              >
                Check Application Status
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                <StatCard
                  title="Total Products"
                  value={formatPrice(productStats.totalProducts)}
                  detail="Active catalog items"
                  icon={Package}
                  colorClass="bg-indigo-500 text-white"
                />
                <StatCard
                  title="Total Units"
                  value={formatPrice(productStats.totalUnits)}
                  detail="Available stock pool"
                  icon={Boxes}
                  colorClass="bg-emerald-500 text-white"
                />
                <StatCard
                  title="Needs Attention"
                  value={formatPrice(productStats.lowStock + productStats.outOfStock)}
                  detail={`${formatPrice(productStats.outOfStock)} items out of stock`}
                  icon={AlertTriangle}
                  colorClass="bg-rose-500 text-white"
                />
                <StatCard
                  title="Inventory Value"
                  value={`₹${formatPrice(productStats.inventoryValue)}`}
                  detail="Estimated retail value"
                  icon={IndianRupee}
                  colorClass="bg-amber-500 text-white"
                />
              </div>

              <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="relative flex-1 group">
                    <Search
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors"
                    />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by product name or category..."
                      className="pl-11 h-12 rounded-xl border-border bg-slate-50 focus:bg-white transition-all shadow-none"
                    />
                  </div>

                  <div className="flex gap-3">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="h-12 rounded-xl border border-border bg-slate-50 px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all min-w-[160px]"
                    >
                      <option value="newest">Newest Listed</option>
                      <option value="name-asc">Alphabetical (A-Z)</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="stock-high">Stock: High to Low</option>
                      <option value="stock-low">Stock: Low to High</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-border/50">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mr-1">Filter by stock:</span>
                  {STOCK_FILTER_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setStockFilter(option.value)}
                      className={`rounded-xl px-4 py-1.5 text-xs font-bold transition-all border ${
                        stockFilter === option.value
                          ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                          : "bg-white text-muted-foreground border-border hover:bg-slate-50 hover:text-foreground"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}

                  {(searchQuery.length > 0 || stockFilter !== "all") && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setStockFilter("all");
                      }}
                      className="ml-auto text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 px-2 py-1"
                    >
                      <X size={14} />
                      Reset All Filters
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between px-1">
                <p className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                  Catalog
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg text-xs font-mono">
                    {formatPrice(filteredProducts.length)} / {formatPrice(products.length)}
                  </span>
                </p>
                {productStats.outOfStock > 0 && (
                  <div className="animate-bounce">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded-lg border border-rose-100">
                      <CircleOff size={14} />
                      {formatPrice(productStats.outOfStock)} item(s) out of stock
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onUpdateStock={onUpdateStock}
                    onCreateOtherOffer={openOtherOfferModal}
                  />
                ))}

                {products.length === 0 && (
                  <div className="col-span-full py-20 text-center border-2 border-dashed border-border rounded-3xl bg-slate-50/50">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-border">
                      <Package size={32} className="text-muted-foreground/40" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">No products listed yet</h3>
                    <p className="text-muted-foreground mt-1 max-w-xs mx-auto">Start building your catalog by adding your first product today.</p>
                    <button
                      onClick={() => setIsAddModalOpen(true)}
                      className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-white border border-border rounded-2xl text-sm font-bold text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                    >
                      <Plus size={18} />
                      Add First Product
                    </button>
                  </div>
                )}

                {products.length > 0 && filteredProducts.length === 0 && (
                  <div className="col-span-full py-20 text-center rounded-3xl border border-border bg-card shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Search size={32} className="text-muted-foreground/30" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">No matching products</h3>
                    <p className="text-muted-foreground mt-1">We couldn't find anything matching your current filters.</p>
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setStockFilter("all");
                      }}
                      className="mt-6 text-sm font-bold text-primary hover:underline"
                    >
                      Clear search and filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* FLASH DEAL MODAL */}
      <Dialog
        open={isFlashDealModalOpen}
        onOpenChange={setIsFlashDealModalOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "1.5rem",
                letterSpacing: "0.02em",
                fontWeight: "normal",
              }}
            >
              {offerMode === "flash"
                ? `Create Flash Deal for ${selectedProductForFlashDeal?.name || ""}`
                : `Create Offer for ${selectedProductForFlashDeal?.name || ""}`}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateFlashDeal} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Offer Name
              </label>
              <Input
                required
                placeholder="e.g. Midnight Madness"
                value={flashDealData.offerName}
                readOnly={offerMode === "flash"}
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
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Discount (%)
                </label>
                <Input
                  required
                  type="number"
                  min="1"
                  max="100"
                  placeholder="20"
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
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Coupon Code (Optional)
                </label>
                <Input
                  placeholder="SAVE20"
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
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Start Date & Time
                </label>
                <Input
                  required
                  type="datetime-local"
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
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  End Date & Time
                </label>
                <Input
                  required
                  type="datetime-local"
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
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Terms & Conditions (Optional)
              </label>
              <Textarea
                placeholder="e.g. Valid on minimum purchase of ₹500"
                className="min-h-[80px]"
                value={flashDealData.termsAndConditions}
                onChange={(e) =>
                  setFlashDealData({
                    ...flashDealData,
                    termsAndConditions: e.target.value,
                  })
                }
              />
            </div>

            <DialogFooter>
              <button
                type="button"
                onClick={() => setIsFlashDealModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-sunken)] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={flashDealSubmitting}
                className="flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm font-medium bg-[var(--brand-primary)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {flashDealSubmitting ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : offerMode === "flash" ? (
                  "Create Flash Deal"
                ) : (
                  "Create Offer"
                )}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "1.8rem",
                letterSpacing: "0.03em",
                fontWeight: "normal",
              }}
            >
              Add New Product
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddProduct} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] font-body">
                Product Name
              </label>
              <Input
                required
                placeholder="e.g. Wireless Headphones"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] font-body">
                Description
              </label>
              <Textarea
                required
                placeholder="Describe your product..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] font-body">
                  Price (₹)
                </label>
                <Input
                  required
                  type="number"
                  placeholder="0"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] font-body">
                  Initial Stock
                </label>
                <Input
                  required
                  type="number"
                  placeholder="0"
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData({ ...formData, stock: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] font-body">
                Category
              </label>
              <select
                required
                className="w-full flex h-9 rounded-md border border-[var(--border-default)] bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--brand-primary)]"
                value={formData.categoryId}
                onChange={(e) =>
                  setFormData({ ...formData, categoryId: e.target.value })
                }
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] font-body">
                  Warranty
                </label>
                <Input
                  required
                  placeholder="e.g. 6 months"
                  value={formData.warranty}
                  onChange={(e) =>
                    setFormData({ ...formData, warranty: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] font-body">
                  Return Policy
                </label>
                <Input
                  required
                  placeholder="e.g. 7-day easy return"
                  value={formData.returnPolicy}
                  onChange={(e) =>
                    setFormData({ ...formData, returnPolicy: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] font-body">
                Product Images
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-[var(--border-default)] border-dashed rounded-lg hover:bg-[var(--bg-sunken)] transition-colors cursor-pointer relative">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-10 w-10 text-[var(--text-muted)]" />
                  <div className="flex text-sm text-[var(--text-secondary)]">
                    <span className="relative cursor-pointer rounded-md font-medium text-[var(--brand-primary)] hover:underline">
                      Upload files
                    </span>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    PNG, JPG, WEBP, PDF up to 10MB
                  </p>
                  {selectedFiles && selectedFiles.length > 0 && (
                    <p className="text-xs font-semibold text-[var(--status-success)] mt-2">
                      {selectedFiles.length} file(s) selected
                    </p>
                  )}
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => setSelectedFiles(e.target.files)}
                />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-sunken)] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm font-medium bg-[var(--brand-primary)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  "Create Product"
                )}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
