"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { authFetch } from "@/lib/auth-fetch";
import { fetchVendorProfile } from "@/lib/vendor-profile";
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

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [isAddImageModalOpen, setIsAddImageModalOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<FileList | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: "",
  });

  // Mock Offers Data
  const mockOffers = [
    {
      id: 1,
      name: "Summer Sale",
      discount: "20%",
      perks: "Free Shipping",
      status: "Active",
    },
  ];

  useEffect(() => {
    loadData();
  }, [id]);

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
      : [product?.imageUrl || "/placeholder-product-1.jpg"];

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
                }}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 ml-[260px] flex flex-col min-h-screen">
        <header className="h-[72px] px-8 flex items-center justify-between sticky top-0 bg-[var(--bg-base)] z-40 border-b border-[var(--border-default)]">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-[var(--bg-sunken)] rounded-full transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "2rem",
                color: "var(--text-primary)",
                letterSpacing: "0.03em",
                fontWeight: "normal",
              }}
            >
              Edit Product
            </h1>
          </div>
        </header>

        <div className="p-8 max-w-[1000px] w-full mx-auto space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Images */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] font-body">
                Images
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {images.map((img: string, i: number) => (
                  <div
                    key={i}
                    className="aspect-square relative rounded-lg overflow-hidden border border-[var(--border-default)] bg-[var(--bg-sunken)]"
                  >
                    <Image
                      src={img}
                      alt={`${product?.name} ${i}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
                <button
                  onClick={() => setIsAddImageModalOpen(true)}
                  className="aspect-square rounded-lg border-2 border-dashed border-[var(--border-default)] flex flex-col items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-sunken)] transition-colors"
                >
                  <Plus size={20} />
                  <span className="text-[10px] mt-1 font-medium">
                    Add Image
                  </span>
                </button>
              </div>
            </div>

            {/* Right: Form */}
            <div className="lg:col-span-2">
              <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] p-6 shadow-sm">
                <form onSubmit={handleUpdate} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      Product Name
                    </label>
                    <Input
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      Description
                    </label>
                    <Textarea
                      required
                      className="min-h-[120px]"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                        Price (₹)
                      </label>
                      <Input
                        required
                        type="number"
                        value={formData.price}
                        onChange={(e) =>
                          setFormData({ ...formData, price: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                        Category
                      </label>
                      <select
                        required
                        className="w-full flex h-9 rounded-md border border-[var(--border-default)] bg-transparent px-3 py-1 text-sm focus:ring-1 focus:ring-[var(--brand-primary)]"
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
                    className="w-full py-3 bg-[var(--brand-primary)] text-white font-bold rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                  >
                    {submitting ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <>
                        <Save size={18} /> Save Changes
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* MOCK OFFERS SECTION */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <h2
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "1.8rem",
                  color: "var(--text-primary)",
                  letterSpacing: "0.03em",
                  fontWeight: "normal",
                }}
              >
                Product Offers
              </h2>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--bg-sunken)] text-[var(--text-primary)] hover:bg-[var(--border-default)] transition-colors">
                <Plus size={16} /> Create New Offer
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Existing Offers */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] font-body">
                  Active Offers
                </h3>
                {mockOffers.map((offer) => (
                  <div
                    key={offer.id}
                    className="bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border-default)] relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-2">
                      <span className="px-2 py-0.5 bg-[var(--status-success-bg)] text-[var(--status-success)] text-[10px] font-bold rounded-full uppercase">
                        {offer.status}
                      </span>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-[var(--brand-primary)]/10 flex items-center justify-center text-[var(--brand-primary)]">
                        <Tag size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-[var(--text-primary)] font-body">
                          {offer.name}
                        </h4>
                        <p className="text-sm text-[var(--text-secondary)] mt-1">
                          <span className="text-[var(--brand-primary)] font-bold">
                            {offer.discount} OFF
                          </span>{" "}
                          • {offer.perks}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Create Offer Mock Form */}
              <div className="bg-[var(--bg-surface)] p-6 rounded-xl border border-[var(--border-default)] space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] font-body">
                  Quick Create (Mock)
                </h3>
                <div className="space-y-3">
                  <Input
                    placeholder="Offer Name (e.g. Festival Special)"
                    disabled
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="Discount %" disabled />
                    <Input placeholder="Coupon Code" disabled />
                  </div>
                  <Textarea
                    placeholder="Terms and Conditions"
                    disabled
                    className="min-h-[80px]"
                  />
                  <div className="flex items-center gap-2 p-3 bg-[var(--bg-sunken)] rounded-lg text-[var(--text-muted)] text-xs italic">
                    <AlertCircle size={14} />
                    This feature will be available soon.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ADD IMAGES MODAL */}
      <Dialog open={isAddImageModalOpen} onOpenChange={setIsAddImageModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "1.5rem",
                letterSpacing: "0.02em",
                fontWeight: "normal",
              }}
            >
              Add Product Images
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddImages} className="space-y-4 py-4">
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
                  PNG, JPG, WEBP up to 10MB
                </p>
                {selectedImages && selectedImages.length > 0 && (
                  <p className="text-xs font-semibold text-[var(--status-success)] mt-2">
                    {selectedImages.length} file(s) selected
                  </p>
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
            <DialogFooter>
              <button
                type="button"
                onClick={() => setIsAddImageModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-sunken)] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploadingImages || !selectedImages}
                className="flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm font-medium bg-[var(--brand-primary)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {uploadingImages ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  "Upload"
                )}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
