"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { authFetch } from "@/lib/auth-fetch";
import { fetchVendorProfile, isVendorApproved } from "@/lib/vendor-profile";
import { VendorProfileData } from "@/lib/types";
import {
  LayoutDashboard,
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
}: {
  title: string;
  value: string;
  detail: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
            {title}
          </p>
          <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">
            {value}
          </p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">{detail}</p>
        </div>
        <div className="h-10 w-10 rounded-lg bg-[var(--bg-sunken)] text-[var(--brand-primary)] flex items-center justify-center">
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

// --- PRODUCT CARD COMPONENT ---

function ProductCard({
  product,
  onUpdateStock,
  onCreateFlashDeal,
}: {
  product: VendorProduct;
  onUpdateStock: (id: string, newStock: number) => Promise<void>;
  onCreateFlashDeal: (product: VendorProduct) => void;
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [localStock, setLocalStock] = useState(getSafeNumber(product.stock));
  const [updating, setUpdating] = useState(false);
  const router = useRouter();

  const images =
    Array.isArray(product.imageUrls) && product.imageUrls.length > 0
      ? product.imageUrls
      : [product.imageUrl || "/placeholder-product-1.jpg"];

  const categoryName = getCategoryName(product);
  const rating = getSafeNumber(product.rating);
  const reviewCount = getSafeNumber(product.reviewCount);
  const numericPrice = getSafeNumber(product.price);

  const stockTone =
    localStock === 0
      ? "bg-[var(--status-error-bg)] text-[var(--status-error)]"
      : localStock <= 10
        ? "bg-[var(--bg-sunken)] text-[var(--text-primary)]"
        : "bg-[var(--status-success-bg)] text-[var(--status-success)]";

  const stockLabel =
    localStock === 0
      ? "Out of stock"
      : localStock <= 10
        ? "Low stock"
        : "In stock";

  const hasMultipleImages = images.length > 1;

  useEffect(() => {
    setLocalStock(getSafeNumber(product.stock));
  }, [product.stock]);

  useEffect(() => {
    if (!hasMultipleImages) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 3000); // Slide every 3 seconds

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
      className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] overflow-hidden group hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col h-full"
    >
      <div className="aspect-[4/3] relative bg-[var(--bg-sunken)] overflow-hidden">
        <Image
          src={images[currentImageIndex]}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        <div className="absolute top-2 left-2 inline-flex items-center rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-primary)]">
          {categoryName}
        </div>

        <div
          className={`absolute top-2 right-2 inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${stockTone}`}
        >
          {stockLabel}
        </div>

        {hasMultipleImages && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-[var(--text-primary)] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-[var(--text-primary)] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
            >
              <ChevronRight size={16} />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {images.map((_: any, i: number) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentImageIndex ? "bg-[var(--brand-primary)]" : "bg-white/50"}`}
                />
              ))}
            </div>
          </>
        )}

        <button
          className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-white/90 text-[var(--text-primary)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onCreateFlashDeal(product);
          }}
          aria-label="Create flash deal"
          title="Create flash deal"
        >
          <Tag size={16} className="text-[var(--brand-primary)]" />
        </button>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-xl font-normal text-[var(--text-primary)] line-clamp-2 leading-tight min-h-[56px] font-body">
          {product.name}
        </h3>

        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="text-2xl font-semibold text-[var(--text-primary)]">
            ₹{formatPrice(numericPrice)}
          </p>
          {rating > 0 ? (
            <p className="inline-flex items-center gap-1 rounded-md border border-[var(--border-default)] bg-white px-2 py-1 text-xs font-semibold text-[var(--text-secondary)]">
              <Star size={12} className="text-[var(--brand-primary)]" />
              {rating.toFixed(1)} ({formatPrice(reviewCount)})
            </p>
          ) : (
            <p className="text-xs font-medium text-[var(--text-muted)]">
              No ratings yet
            </p>
          )}
        </div>

        <div className="mt-3 space-y-1.5 text-xs text-[var(--text-secondary)]">
          <p className="line-clamp-1">
            Warranty: {product.warranty || "Not specified"}
          </p>
          <p className="line-clamp-1">
            Returns: {product.returnPolicy || "Not specified"}
          </p>
        </div>

        <div className="mt-auto space-y-3">
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-sunken)]">
            <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">
              Stock
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => handleStockChange(e, -1)}
                className="w-6 h-6 rounded flex items-center justify-center bg-white border border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--bg-base)]"
              >
                <Minus size={12} />
              </button>
              <span className="text-sm font-bold w-4 text-center">
                {localStock}
              </span>
              <button
                onClick={(e) => handleStockChange(e, 1)}
                className="w-6 h-6 rounded flex items-center justify-center bg-white border border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--bg-base)]"
              >
                <Plus size={12} />
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCreateFlashDeal(product);
              }}
              className="flex-1 py-2 bg-[var(--bg-sunken)] text-[var(--text-primary)] text-xs font-semibold rounded-lg hover:bg-[var(--border-default)] transition-colors flex items-center justify-center gap-2"
            >
              <Tag size={14} />
              Flash Deal
            </button>
            {isStockChanged && (
              <button
                onClick={handleUpdateClick}
                disabled={updating}
                className="flex-1 py-2 bg-[var(--brand-primary)] text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                {updating ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  "Update Stock"
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
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<VendorProfileData | null>(null);
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [categories, setCategories] = useState<VendorCategory[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

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
  const [selectedProductForFlashDeal, setSelectedProductForFlashDeal] = useState<VendorProduct | null>(null);
  const [flashDealSubmitting, setFlashDealSubmitting] = useState(false);
  const [flashDealData, setFlashDealData] = useState({
    offerName: "",
    discountPercentage: "",
    couponCode: "",
    startAt: "",
    endAt: "",
    termsAndConditions: "",
  });

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

  const openFlashDealModal = (product: VendorProduct) => {
    setSelectedProductForFlashDeal(product);
    setIsFlashDealModalOpen(true);
  };

  useEffect(() => {
    const loadData = async () => {
      if (!user || user.role?.toUpperCase() !== "VENDOR") {
        setLoading(false);
        return;
      }
      try {
        const vendorProfile = await fetchVendorProfile();
        setProfile(vendorProfile);

        if (vendorProfile && isVendorApproved(vendorProfile.status)) {
          await Promise.all([fetchProducts(), fetchCategories()]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

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

  const fetchProducts = async () => {
    try {
      const response = await authFetch(
        `${API_BASE_URL}/products?businessName=${profile?.businessName || ""}`,
      );
      if (response.ok) {
        const result = await response.json();
        setProducts(Array.isArray(result.data) ? result.data : []);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
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
        await fetchProducts();
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
          <Link href="/" className="block">
            <h2
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "22px",
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

          <button
            type="button"
            aria-label="Close sidebar"
            className="md:hidden h-8 w-8 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-sunken)] flex items-center justify-center"
            onClick={() => setIsMobileSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.active;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setIsMobileSidebarOpen(false)}
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
                {user?.name || "Vendor"}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 ml-0 md:ml-[260px] flex flex-col min-h-screen">
        <header
          className="h-16 md:h-[72px] px-4 sm:px-6 md:px-8 flex items-center justify-between sticky top-0 bg-[var(--bg-base)] z-30"
          style={{ borderBottom: "1px solid var(--border-default)" }}
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open sidebar"
              className="md:hidden h-9 w-9 rounded-md border border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--bg-sunken)] flex items-center justify-center"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <Menu size={18} />
            </button>

            <div className="flex flex-col gap-0.5">
              <h1 className="text-2xl sm:text-3xl font-normal tracking-[0.04em] text-[var(--text-primary)]">
                Products
              </h1>
              <p className="hidden sm:block text-xs font-medium text-[var(--text-secondary)]">
                Track inventory, pricing, and product readiness.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsAddModalOpen(true)}
              disabled={!approved}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: "var(--brand-primary)",
                color: "var(--text-inverse)",
              }}
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Add Product</span>
            </button>
          </div>
        </header>

        <div className="p-4 sm:p-6 md:p-8 max-w-[1200px] w-full">
          {loading ? (
            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
              <Loader2 className="animate-spin" size={20} />
              <span>Loading products...</span>
            </div>
          ) : !approved ? (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-8 text-center max-w-2xl mx-auto mt-12">
              <Package
                size={48}
                className="mx-auto mb-4 text-[var(--text-muted)]"
              />
              <h2
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "1.8rem",
                  color: "var(--text-primary)",
                }}
              >
                Verify your account to list products
              </h2>
              <p className="mt-2 text-[var(--text-secondary)]">
                Once your vendor application is approved, you'll be able to
                manage your inventory and start selling.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard
                  title="Total Products"
                  value={formatPrice(productStats.totalProducts)}
                  detail="Active items in your catalog"
                  icon={Package}
                />
                <StatCard
                  title="Inventory Units"
                  value={formatPrice(productStats.totalUnits)}
                  detail="Sellable units currently available"
                  icon={Boxes}
                />
                <StatCard
                  title="Low Stock"
                  value={formatPrice(productStats.lowStock)}
                  detail={`${formatPrice(productStats.outOfStock)} currently out of stock`}
                  icon={AlertTriangle}
                />
                <StatCard
                  title="Inventory Value"
                  value={`₹${formatPrice(productStats.inventoryValue)}`}
                  detail="Approx. value based on listed prices"
                  icon={IndianRupee}
                />
              </div>

              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 shadow-sm space-y-3">
                <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                  <div className="relative flex-1">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                    />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by product name or category"
                      className="pl-9"
                    />
                  </div>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="h-10 rounded-md border border-[var(--border-default)] bg-white px-3 text-sm text-[var(--text-primary)]"
                  >
                    <option value="newest">Newest first</option>
                    <option value="name-asc">Name: A to Z</option>
                    <option value="price-high">Price: High to low</option>
                    <option value="price-low">Price: Low to high</option>
                    <option value="stock-high">Stock: High to low</option>
                    <option value="stock-low">Stock: Low to high</option>
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {STOCK_FILTER_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setStockFilter(option.value)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                        stockFilter === option.value
                          ? "bg-[var(--brand-primary)] text-white"
                          : "bg-[var(--bg-sunken)] text-[var(--text-secondary)] hover:bg-[var(--bg-base)]"
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
                      className="ml-auto text-xs font-semibold text-[var(--brand-primary)] hover:underline"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <p className="text-sm text-[var(--text-secondary)]">
                  Showing {formatPrice(filteredProducts.length)} of{" "}
                  {formatPrice(products.length)} products
                </p>
                {productStats.outOfStock > 0 && (
                  <p className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--status-error)]">
                    <CircleOff size={14} />
                    {formatPrice(productStats.outOfStock)} item(s) need restock
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onUpdateStock={onUpdateStock}
                    onCreateFlashDeal={openFlashDealModal}
                  />
                ))}

                {products.length === 0 && (
                  <div className="col-span-full py-20 text-center border-2 border-dashed border-[var(--border-default)] rounded-2xl">
                    <Package
                      size={40}
                      className="mx-auto mb-3 text-[var(--text-muted)] opacity-50"
                    />
                    <p className="text-[var(--text-secondary)]">
                      No products listed yet.
                    </p>
                    <button
                      onClick={() => setIsAddModalOpen(true)}
                      className="mt-4 text-[var(--brand-primary)] text-sm font-medium hover:underline"
                    >
                      Add your first product
                    </button>
                  </div>
                )}

                {products.length > 0 && filteredProducts.length === 0 && (
                  <div className="col-span-full py-16 text-center rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)]">
                    <Search
                      size={28}
                      className="mx-auto text-[var(--text-muted)]"
                    />
                    <p className="mt-3 text-base font-medium text-[var(--text-primary)]">
                      No products match these filters
                    </p>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      Try changing search terms or stock filters.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* FLASH DEAL MODAL */}
      <Dialog open={isFlashDealModalOpen} onOpenChange={setIsFlashDealModalOpen}>
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
              Create Flash Deal for {selectedProductForFlashDeal?.name}
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
                onChange={(e) =>
                  setFlashDealData({ ...flashDealData, offerName: e.target.value })
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
                    setFlashDealData({ ...flashDealData, startAt: e.target.value })
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
                    setFlashDealData({ ...flashDealData, endAt: e.target.value })
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
                ) : (
                  "Create Deal"
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
