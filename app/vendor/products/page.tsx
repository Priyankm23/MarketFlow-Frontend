"use client";

import React, { useEffect, useState } from "react";
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
  Bell,
  Search,
  Plus,
  MoreVertical,
  Loader2,
  User,
  Upload,
  Minus,
  ChevronLeft,
  ChevronRight,
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

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

// --- PRODUCT CARD COMPONENT ---

function ProductCard({
  product,
  onUpdateStock,
}: {
  product: any;
  onUpdateStock: (id: string, newStock: number) => Promise<void>;
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [localStock, setLocalStock] = useState(product.stock);
  const [updating, setUpdating] = useState(false);
  const router = useRouter();

  const images =
    product.imageUrls && product.imageUrls.length > 0
      ? product.imageUrls
      : [product.imageUrl || "/placeholder-product-1.jpg"];

  const hasMultipleImages = images.length > 1;

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
      className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] overflow-hidden group hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full"
    >
      <div className="aspect-square relative bg-[var(--bg-sunken)] overflow-hidden">
        <Image
          src={images[currentImageIndex]}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

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
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-normal text-[var(--text-primary)] line-clamp-2 leading-tight min-h-[56px] flex-1 font-body pr-2">
            {product.name}
          </h3>
          <button
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical size={16} />
          </button>
        </div>
        <p className="text-lg font-bold text-[var(--text-primary)] mb-4">
          ₹{product.price}
        </p>

        <div className="mt-auto space-y-3">
          <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-sunken)]">
            <span className="text-xs font-medium text-[var(--text-muted)] uppercase">
              Stock
            </span>
            <div className="flex items-center gap-3">
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

          {isStockChanged && (
            <button
              onClick={handleUpdateClick}
              disabled={updating}
              className="w-full py-2 bg-[var(--brand-primary)] text-white text-xs font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
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
  );
}

// --- MAIN PAGE COMPONENT ---

export default function VendorProductsPage() {
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<VendorProfileData | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    categoryId: "",
  });

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
        const cats = result.data || [];
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
        setProducts(result.data || []);
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
                {user?.name || "Vendor"}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 ml-[260px] flex flex-col min-h-screen">
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
              Products
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsAddModalOpen(true)}
              disabled={!approved}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: "var(--brand-primary)",
                color: "var(--text-inverse)",
              }}
            >
              <Plus size={18} />
              Add Product
            </button>
          </div>
        </header>

        <div className="p-8 max-w-[1200px] w-full">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onUpdateStock={onUpdateStock}
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
            </div>
          )}
        </div>
      </main>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
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

            <div className="grid grid-cols-2 gap-4">
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
