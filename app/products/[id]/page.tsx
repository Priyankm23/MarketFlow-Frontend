"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BadgePercent,
  CheckCircle2,
  CircleAlert,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
  MapPin,
  Clock,
  ChevronRight,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { authFetch } from "@/lib/auth-fetch";
import { Product } from "@/lib/types";
import { useCartStore } from "@/lib/store";
import { API_BASE_URL } from "@/lib/config";

type ApiProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  originalPrice?: number | null;
  imageUrl?: string | null;
  images?: string[] | null;
  rating?: number | null;
  reviewCount?: number | null;
  brand?: string | null;
  highlights?: string[] | null;
  specifications?: Record<string, string> | null;
  returnPolicy?: string | null;
  warranty?: string | null;
  returnWindowDays?: number | null;
  warrantyMonths?: number | null;
  dispatchInHours?: number | null;
  sku?: string | null;
  category?: {
    id?: string;
    name?: string;
  } | null;
  vendor?: {
    id?: string;
    businessName?: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
};

type ProductDetailResponse = {
  status: string;
  data?: ApiProduct;
};

type ProductDetailViewModel = Product & {
  originalPrice: number;
  discountPercent: number;
  brandName: string;
  highlights: string[];
  specifications: Array<{ label: string; value: string }>;
  returnPolicy: string;
  warranty: string;
  dispatchInHours: number;
  sku: string;
};

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const addItem = useCartStore((state) => state.addItem);

  const [product, setProduct] = useState<ProductDetailViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [pincode, setPincode] = useState("");
  const [deliveryMessage, setDeliveryMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);

  const [submittingRating, setSubmittingRating] = useState(false);
  const [vendorProducts, setVendorProducts] = useState<Product[]>([]);
  const [vendorProductsLoading, setVendorProductsLoading] = useState(false);

  const productId = useMemo(() => {
    const value = params?.id;
    return Array.isArray(value) ? value[0] : value;
  }, [params]);

  const mapApiProductToUi = (item: ApiProduct): ProductDetailViewModel => {
    const imageCandidates = [
      ...(Array.isArray(item.images) ? item.images : []),
      item.imageUrl || "",
    ]
      .map((img) => (typeof img === "string" ? img.trim() : ""))
      .filter((img) => img.length > 0);

    const images =
      imageCandidates.length > 0
        ? Array.from(new Set(imageCandidates))
        : ["/placeholder-product-1.jpg"];

    const safePrice = Number(item.price || 0);
    const rawOriginalPrice = Number(item.originalPrice || 0);
    const generatedOriginalPrice =
      safePrice > 0 ? Math.ceil((safePrice * 1.22) / 10) * 10 : 0;
    const originalPrice =
      rawOriginalPrice > safePrice ? rawOriginalPrice : generatedOriginalPrice;

    const discountPercent =
      originalPrice > safePrice && safePrice > 0
        ? Math.round(((originalPrice - safePrice) / originalPrice) * 100)
        : 0;

    const dispatchInHours = Math.max(12, Number(item.dispatchInHours || 24));

    const returnPolicy =
      item.returnPolicy && item.returnPolicy.trim().length > 0
        ? item.returnPolicy.trim()
        : Number.isFinite(Number(item.returnWindowDays))
          ? `${Math.max(1, Number(item.returnWindowDays))}-day easy return`
          : "Return policy available at checkout";

    const warranty =
      item.warranty && item.warranty.trim().length > 0
        ? item.warranty.trim()
        : Number.isFinite(Number(item.warrantyMonths))
          ? `${Math.max(1, Number(item.warrantyMonths))} months`
          : "Warranty details available at checkout";

    const sku =
      item.sku && item.sku.trim().length > 0
        ? item.sku.trim()
        : `MF-${item.id.slice(0, 8).toUpperCase()}`;

    const categoryName = item.category?.name || "Uncategorized";
    const vendorName = item.vendor?.businessName || "Unknown Vendor";
    const fallbackHighlights = [
      `Optimized for ${categoryName.toLowerCase()} shoppers with quality checks before dispatch.`,
      `Ships quickly from ${vendorName} with secure packaging and order tracking.`,
      `Return policy: ${returnPolicy}.`,
    ];

    const highlights =
      Array.isArray(item.highlights) && item.highlights.length > 0
        ? item.highlights.filter((point) => point && point.trim().length > 0)
        : fallbackHighlights;

    const specEntries =
      item.specifications && typeof item.specifications === "object"
        ? Object.entries(item.specifications).filter(
            ([label, value]) =>
              label.trim().length > 0 && value.trim().length > 0,
          )
        : [];

    const brandName =
      item.brand && item.brand.trim().length > 0 ? item.brand : vendorName;

    const specifications =
      specEntries.length > 0
        ? specEntries.slice(0, 8).map(([label, value]) => ({ label, value }))
        : [
            { label: "Brand", value: brandName },
            { label: "Category", value: categoryName },
            { label: "Warranty", value: warranty },
            {
              label: "Return Policy",
              value: returnPolicy,
            },
            { label: "Dispatch", value: `Within ${dispatchInHours} hours` },
            { label: "SKU", value: sku },
          ];

    const ratingValue = Number(item.rating);
    const reviewCountValue = Number(item.reviewCount);

    const rating = Number.isFinite(ratingValue)
      ? Math.min(5, Math.max(0, ratingValue))
      : 0;

    const reviewCount = Number.isFinite(reviewCountValue)
      ? Math.max(0, reviewCountValue)
      : 0;

    return {
      id: item.id,
      name: item.name,
      description: item.description,
      price: safePrice,
      originalPrice,
      images,
      category: categoryName,
      subcategory: categoryName,
      stock: Number(item.stock || 0),
      vendorId: item.vendor?.id || "",
      vendorName,
      rating,
      reviewCount,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || new Date().toISOString(),
      featured: true,
      discountPercent,
      brandName,
      highlights,
      specifications,
      returnPolicy,
      warranty,
      dispatchInHours,
      sku,
    };
  };

  useEffect(() => {
    let active = true;

    const fetchProduct = async () => {
      if (!productId) {
        setError("Invalid product id");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
          method: "GET",
        });

        const payload: ProductDetailResponse = await response
          .json()
          .catch(() => ({ status: "error" }));

        if (!response.ok || payload.status !== "success" || !payload.data) {
          throw new Error("Failed to load product details");
        }

        if (!active) return;
        setProduct(mapApiProductToUi(payload.data));
      } catch (err: unknown) {
        if (!active) return;
        const message =
          err instanceof Error ? err.message : "Unable to fetch product";
        setError(message);
        setProduct(null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchProduct();

    return () => {
      active = false;
    };
  }, [productId]);

  useEffect(() => {
    setSelectedImageIndex(0);
    setDeliveryMessage(null);
    setPincode("");
  }, [product?.id]);

  useEffect(() => {
    if (!product?.vendorName) return;
    let active = true;
    const fetchVendorProducts = async () => {
      setVendorProductsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/products?businessName=${encodeURIComponent(product.vendorName)}`);
        const payload = await response.json();
        if (response.ok && payload.status === "success" && active) {
            const mapped = (payload.data || []).map((item: ApiProduct): Product => ({
                id: item.id,
                name: item.name,
                description: item.description,
                price: Number(item.price || 0),
                images: item.imageUrl ? [item.imageUrl] : ["/placeholder-product-1.jpg"],
                category: item.category?.name || "Uncategorized",
                subcategory: item.category?.name || "General",
                stock: Number(item.stock || 0),
                vendorId: item.vendor?.id || "",
                vendorName: item.vendor?.businessName || "Unknown Vendor",
                rating: Number.isFinite(Number(item.rating)) ? Math.min(5, Math.max(0, Number(item.rating))) : 0,
                reviewCount: Number.isFinite(Number(item.reviewCount)) ? Math.max(0, Number(item.reviewCount)) : 0,
                createdAt: item.createdAt || new Date().toISOString(),
                updatedAt: item.updatedAt || new Date().toISOString(),
                featured: true,
            }));
            setVendorProducts(mapped.filter((p: Product) => p.id !== product.id));
        }
      } catch (err) {
        console.error("Failed to fetch vendor products", err);
      } finally {
        if (active) setVendorProductsLoading(false);
      }
    };
    fetchVendorProducts();
    return () => { active = false; };
  }, [product?.vendorName, product?.id]);

  const handleRateProduct = async (newRating: number) => {
    if (!product) return;
    setSubmittingRating(true);
    try {
      const response = await authFetch(`${API_BASE_URL}/products/${product.id}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: newRating }),
      });
      if (response.ok) {
        const payload = await response.json();
        const updatedRating = payload?.rating ?? payload?.data?.rating;
        const updatedReviewCount = payload?.reviewCount ?? payload?.data?.reviewCount;
        
        if (updatedRating !== undefined && updatedReviewCount !== undefined) {
           setProduct((prev) => prev ? { ...prev, rating: updatedRating, reviewCount: updatedReviewCount } : prev);
        }
        alert("Thanks for rating!");
      } else {
        alert("Failed to rate product");
      }
    } catch (error) {
       console.error(error);
       alert("Error rating product");
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleAddToCart = () => {
    if (!product || quantity < 1 || product.stock === 0) {
      return;
    }

    const safeQuantity = Math.min(quantity, product.stock);

    addItem({
      productId: product.id,
      quantity: safeQuantity,
      price: product.price,
      product,
    });
  };

  const handleCheckDelivery = () => {
    const normalized = pincode.trim();

    if (!/^\d{6}$/.test(normalized)) {
      setDeliveryMessage({
        tone: "error",
        text: "Enter a valid 6-digit pincode.",
      });
      return;
    }

    const etaDate = new Date();
    etaDate.setDate(etaDate.getDate() + 2);
    const etaLabel = etaDate.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });

    setDeliveryMessage({
      tone: "success",
      text: `Delivery by ${etaLabel} • COD available.`,
    });
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 0,
    }).format(price);

  const galleryImages = useMemo(() => {
    if (!product) {
      return ["/placeholder-product-1.jpg"];
    }

    const baseImages = product.images.length
      ? product.images
      : ["/placeholder-product-1.jpg"];
    const expanded = [...baseImages];

    while (expanded.length < 4) {
      expanded.push(baseImages[expanded.length % baseImages.length]);
    }

    return expanded.slice(0, 4);
  }, [product]);

  const activeImage = galleryImages[selectedImageIndex] || galleryImages[0];

  const bestOffers = useMemo(() => {
    if (!product) {
      return [] as string[];
    }

    const instantSaving = Math.max(0, product.originalPrice - product.price);

    return [
      instantSaving > 0
        ? `Best Price: Save Rs. ${formatPrice(instantSaving)} today.`
        : "Best Price: Verified local seller value.",
      "Coupon code MARKET100: Flat Rs. 100 off on your first order.",
      "10% instant discount on prepaid orders above Rs. 999.",
    ];
  }, [product]);

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <Navbar />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-2 mb-6">
          <Link
            href="/products"
            className="p-2 rounded-full hover:bg-[var(--bg-sunken)] transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-black" />
          </Link>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">
            <Link href="/" className="hover:text-black">Home</Link>
            <ChevronRight size={12} />
            <Link href="/products" className="hover:text-black">Catalogue</Link>
            <ChevronRight size={12} />
            <span className="text-black truncate max-w-[150px]">{product?.name || 'Product'}</span>
          </div>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="aspect-square bg-[var(--bg-sunken)] rounded-xl" />
              <div className="space-y-6">
                <div className="h-10 bg-[var(--bg-sunken)] rounded w-3/4" />
                <div className="h-6 bg-[var(--bg-sunken)] rounded w-1/4" />
                <div className="h-24 bg-[var(--bg-sunken)] rounded w-full" />
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="py-20 text-center rounded-xl border border-[var(--border-default)] bg-white shadow-sm">
            <h2 className="text-xl font-black text-black uppercase tracking-tight">Product unavailable</h2>
            <p className="mt-2 text-[var(--text-secondary)] text-sm">{error}</p>
            <Link
              href="/products"
              className="mt-8 px-8 py-3 inline-block bg-black text-white rounded-full font-black text-xs uppercase tracking-widest hover:bg-[var(--brand-accent)] transition-colors"
            >
              Continue shopping
            </Link>
          </div>
        ) : product ? (
          <div className="space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
              {/* --- LEFT: GALLERY --- */}
              <div className="space-y-4">
                <div className="relative aspect-square overflow-hidden rounded-xl border border-[var(--border-default)] bg-white shadow-sm group">
                  <Image
                    src={activeImage}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    priority
                  />
                  {product.stock < 5 && product.stock > 0 && (
                    <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-red-600 text-[10px] font-black text-white uppercase tracking-tighter rounded-full shadow-lg">Low Stock</div>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-4">
                  {galleryImages.map((img, index) => (
                    <button
                      key={`${img}-${index}`}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`relative aspect-square overflow-hidden rounded-xl border-2 transition-all ${
                        selectedImageIndex === index
                          ? "border-[var(--brand-accent)] shadow-md scale-[0.98]"
                          : "border-transparent hover:border-black/10"
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`${product.name} ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* --- RIGHT: INFO --- */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-[var(--brand-accent)] text-[9px] font-black text-white uppercase tracking-widest rounded-full">Assured</span>
                    <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{product.vendorName}</span>
                  </div>
                  
                  <h1 className="text-3xl sm:text-4xl font-black text-black leading-tight tracking-tight">
                    {product.name}
                  </h1>

                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 text-lg font-black text-black">
                        <Star className="h-4 w-4 fill-[var(--brand-accent)] text-[var(--brand-accent)]" />
                        {product.rating.toFixed(1)}
                      </div>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">{formatPrice(product.reviewCount)} reviews</span>
                    </div>
                    <div className="h-8 w-px bg-[var(--border-default)]" />
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                           key={star}
                           disabled={submittingRating}
                           onClick={() => handleRateProduct(star)}
                           className="text-zinc-200 hover:text-[var(--brand-accent)] transition-all hover:scale-110"
                        >
                          <Star className={`h-5 w-5 ${product.rating >= star ? 'fill-[var(--brand-accent)] text-[var(--brand-accent)]' : ''}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-xl border border-[var(--border-default)] bg-white shadow-sm space-y-6">
                  <div className="flex flex-wrap items-end gap-3">
                    <p className="text-4xl font-black text-black tracking-tight">
                      ₹{formatPrice(product.price)}
                    </p>
                    {product.originalPrice > product.price && (
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-lg line-through text-zinc-300 font-bold">
                          ₹{formatPrice(product.originalPrice)}
                        </p>
                        <p className="px-2 py-0.5 bg-green-50 text-[var(--status-success)] text-[10px] font-black rounded uppercase">
                          {product.discountPercent}% OFF
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Quantity</label>
                      <select
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="w-full h-12 rounded-xl border border-[var(--border-default)] bg-[var(--bg-sunken)] px-4 text-sm font-black outline-none appearance-none"
                        disabled={product.stock === 0}
                      >
                        {[...Array(Math.min(8, product.stock || 1))].map((_, i) => (
                          <option key={i+1} value={i+1}>{i+1}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={handleAddToCart}
                        disabled={product.stock === 0}
                        className="w-full h-12 flex items-center justify-center gap-3 bg-black text-white rounded-full font-black text-xs uppercase tracking-widest hover:bg-[var(--brand-accent)] transition-all disabled:opacity-20"
                      >
                        <ShoppingCart size={16} />
                        Add to cart
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-sunken)] space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-black">
                      <MapPin size={14} className="text-[var(--brand-accent)]" />
                      Check Delivery
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="Pincode"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                        className="w-full h-10 px-3 bg-white border border-[var(--border-default)] rounded-lg text-xs font-bold outline-none focus:border-black"
                      />
                      <button onClick={handleCheckDelivery} className="px-4 h-10 bg-black text-white rounded-lg text-[10px] font-black uppercase">Go</button>
                    </div>
                    {deliveryMessage && (
                      <p className={`text-[10px] font-bold ${deliveryMessage.tone === "success" ? "text-green-600" : "text-red-600"}`}>
                        {deliveryMessage.text}
                      </p>
                    )}
                  </div>

                  <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-sunken)] space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-black">
                      <BadgePercent size={14} className="text-[var(--brand-accent)]" />
                      Best Offers
                    </div>
                    <ul className="space-y-1.5">
                      {bestOffers.map((offer, i) => (
                        <li key={i} className="text-[10px] font-bold text-zinc-500 leading-tight flex items-start gap-1.5">
                          <div className="w-1 h-1 rounded-full bg-black mt-1.5 shrink-0" />
                          {offer}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* --- BOTTOM TABS/INFO --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 space-y-10">
                <section className="space-y-4">
                  <h2 className="text-xl font-black text-black uppercase tracking-tight flex items-center gap-2">
                    <div className="w-1 h-6 bg-[var(--brand-accent)]" />
                    Product Story
                  </h2>
                  <p className="text-sm leading-relaxed text-zinc-600 font-medium">
                    {product.description}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                    {product.highlights.map((point, i) => (
                      <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-[var(--bg-sunken)] border border-transparent hover:border-[var(--border-default)] transition-colors">
                        <CheckCircle2 size={18} className="text-[var(--brand-accent)] shrink-0 mt-0.5" />
                        <span className="text-xs font-bold text-zinc-700 leading-snug">{point}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-xl font-black text-black uppercase tracking-tight flex items-center gap-2">
                    <div className="w-1 h-6 bg-[var(--brand-accent)]" />
                    Specifications
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-[var(--border-default)] border border-[var(--border-default)] rounded-xl overflow-hidden shadow-sm">
                    {product.specifications.map((spec, i) => (
                      <div key={i} className="bg-white p-4 flex flex-col gap-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">{spec.label}</span>
                        <span className="text-xs font-black text-black uppercase">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="space-y-6">
                <div className="p-6 rounded-xl border border-zinc-800 bg-black text-white space-y-6 shadow-xl">
                  <h3 className="text-sm font-black uppercase tracking-widest text-white">MarketFlow Trust</h3>
                  
                  <div className="flex items-start gap-4">
                    <RotateCcw className="text-[var(--brand-accent)] shrink-0" size={20} />
                    <div>
                      <p className="text-xs font-black uppercase tracking-tight text-white">Easy Returns</p>
                      <p className="text-[10px] text-zinc-400 font-bold mt-1 leading-relaxed">{product.returnPolicy}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Truck className="text-[var(--brand-accent)] shrink-0" size={20} />
                    <div>
                      <p className="text-xs font-black uppercase tracking-tight text-white">Express Dispatch</p>
                      <p className="text-[10px] text-zinc-400 font-bold mt-1 leading-relaxed">Packed & shipped in {product.dispatchInHours} hours.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <ShieldCheck className="text-[var(--brand-accent)] shrink-0" size={20} />
                    <div>
                      <p className="text-xs font-black uppercase tracking-tight text-white">Safe Shopping</p>
                      <p className="text-[10px] text-zinc-400 font-bold mt-1 leading-relaxed">100% verified listings & secure checkout.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* --- VENDOR PRODUCTS --- */}
            {vendorProducts.length > 0 && (
              <div className="pt-12 border-t border-[var(--border-default)] space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl sm:text-2xl font-black text-black uppercase tracking-tight">More from {product.vendorName}</h2>
                  <Link href="/products" className="text-xs font-black text-[var(--brand-accent)] uppercase tracking-widest hover:underline">View Shop</Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                  {vendorProducts.map((vp) => (
                    <Link key={vp.id} href={`/products/${vp.id}`} className="group relative flex flex-col bg-white border border-[var(--border-default)] rounded-xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:border-black/10 hover:-translate-y-1 active:scale-95 sm:active:scale-100">
                      <div className="aspect-[4/5] relative overflow-hidden bg-zinc-100">
                        <Image src={vp.images[0]} alt={vp.name} fill className="object-cover transition-transform duration-1000 group-hover:scale-110" />
                      </div>
                      <div className="p-3 sm:p-5 flex-1 flex flex-col gap-1 sm:gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] truncate max-w-[60%]">{vp.vendorName}</span>
                          <div className="flex flex-col items-end">
                            <div className="flex items-center gap-1 text-[10px] font-bold text-black">
                              <Star size={10} className="fill-[var(--brand-accent)] text-[var(--brand-accent)]" />
                              {vp.rating.toFixed(1)}
                            </div>
                            <span className="text-[8px] font-bold text-zinc-400 leading-none">({vp.reviewCount})</span>
                          </div>
                        </div>
                        <h3 className="text-xs sm:text-sm font-bold text-black line-clamp-2 leading-tight min-h-[32px] sm:min-h-[40px] group-hover:text-[var(--brand-accent)] transition-colors tracking-tight">{vp.name}</h3>
                        <div className="mt-auto pt-2 sm:pt-3 border-t border-zinc-50 flex items-center justify-between">
                          <p className="text-base sm:text-lg font-black text-black tracking-tight">₹{vp.price.toLocaleString()}</p>
                          <button className="hidden sm:flex w-8 h-8 rounded-full bg-black text-white items-center justify-center transition-all group-hover:bg-[var(--brand-accent)] group-hover:rotate-45">
                            <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
