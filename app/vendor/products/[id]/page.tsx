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
    loadData();
    fetchOffers();
  }, [id]);

  const fetchOffers = async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/flash-deals?productId=${id}`);
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

          {/* OFFERS SECTION */}
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
                Product Flash Deals
              </h2>
              <button
                onClick={() => setIsFlashDealModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--brand-primary)] text-white hover:opacity-90 transition-opacity"
              >
                <Plus size={16} /> Create Flash Deal
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Existing Offers */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] font-body">
                  Active & Scheduled Deals
                </h3>
                {offers.length > 0 ? (
                  offers.map((offer) => (
                    <div
                      key={offer.id}
                      className="bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border-default)] relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-2">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                            new Date(offer.endAt) < new Date()
                              ? "bg-[var(--status-error-bg)] text-[var(--status-error)]"
                              : new Date(offer.startAt) > new Date()
                                ? "bg-[var(--bg-sunken)] text-[var(--text-secondary)]"
                                : "bg-[var(--status-success-bg)] text-[var(--status-success)]"
                          }`}
                        >
                          {new Date(offer.endAt) < new Date()
                            ? "Expired"
                            : new Date(offer.startAt) > new Date()
                              ? "Scheduled"
                              : "Active"}
                        </span>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-[var(--brand-primary)]/10 flex items-center justify-center text-[var(--brand-primary)]">
                          <Tag size={20} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-[var(--text-primary)] font-body">
                            {offer.offerName}
                          </h4>
                          <p className="text-sm text-[var(--text-secondary)] mt-1">
                            <span className="text-[var(--brand-primary)] font-bold">
                              {offer.discountPercentage}% OFF
                            </span>{" "}
                            {offer.couponCode && `• Code: ${offer.couponCode}`}
                          </p>
                          <div className="mt-2 text-[10px] text-[var(--text-muted)] flex flex-col gap-0.5">
                            <span>
                              Starts: {new Date(offer.startAt).toLocaleString()}
                            </span>
                            <span>
                              Ends: {new Date(offer.endAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center border border-dashed border-[var(--border-default)] rounded-xl bg-[var(--bg-sunken)]/30">
                    <p className="text-sm text-[var(--text-secondary)]">
                      No flash deals created yet.
                    </p>
                  </div>
                )}
              </div>

              {/* Quick Info / Tips */}
              <div className="bg-[var(--bg-surface)] p-6 rounded-xl border border-[var(--border-default)] space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] font-body">
                  Flash Deal Tips
                </h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--bg-sunken)] flex items-center justify-center flex-shrink-0">
                      <BarChart2 size={16} className="text-[var(--brand-primary)]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">Increase Visibility</p>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">Flash deals are featured on the home page and category pages.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--bg-sunken)] flex items-center justify-center flex-shrink-0">
                      <Bell size={16} className="text-[var(--brand-primary)]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">Limited Time</p>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">Short, high-discount deals (4-24 hours) typically perform best.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
              Create Flash Deal
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
