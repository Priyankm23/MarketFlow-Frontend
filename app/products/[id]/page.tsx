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
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { authFetch } from "@/lib/auth-fetch";
import { Product } from "@/lib/types";
import { useCartStore } from "@/lib/store";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

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
        text: "Enter a valid 6-digit pincode to check delivery timeline.",
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
      text: `Free delivery by ${etaLabel} • Cash on Delivery available.`,
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
        ? `Best Price: Save Rs. ${formatPrice(instantSaving)} on this product today.`
        : "Best Price: Everyday value pricing from verified local sellers.",
      "Coupon code MARKET100: Flat Rs. 100 off on your first order.",
      "10% instant discount on prepaid orders above Rs. 999.",
      `Returns: ${product.returnPolicy}.`,
    ];
  }, [product]);

  return (
    <div className="min-h-screen bg-[var(--bg-base)] font-body">
      <Navbar />

      <div className="max-w-[1220px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-7 lg:py-9">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)] hover:opacity-80 transition-opacity"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to products
        </Link>

        {loading ? (
          <div className="mt-6 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-8 shadow-sm">
            <div className="flex items-center gap-3 text-[var(--text-secondary)]">
              <div className="h-5 w-5 rounded-full border-2 border-[var(--brand-primary)] border-t-transparent animate-spin" />
              <span className="text-sm font-medium">
                Loading product details...
              </span>
            </div>
          </div>
        ) : error ? (
          <div className="mt-6 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-10 text-center shadow-sm">
            <h2 className="text-2xl font-semibold text-[var(--text-primary)] font-body">
              Product unavailable
            </h2>
            <p className="mt-2 text-[var(--text-secondary)]">{error}</p>
            <Link
              href="/products"
              className="mt-5 inline-flex rounded-lg px-4 py-2.5 text-sm font-semibold bg-[var(--brand-primary)] text-[var(--text-inverse)] hover:opacity-90 transition-opacity"
            >
              Continue shopping
            </Link>
          </div>
        ) : product ? (
          <div className="mt-6 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  Product Gallery
                </p>

                <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-3 shadow-[var(--shadow-card)]">
                  <div className="relative aspect-square overflow-hidden rounded-xl border border-[var(--border-default)] bg-white">
                    <Image
                      src={activeImage}
                      alt={product.name}
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>

                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {galleryImages.map((img, index) => (
                      <button
                        key={`${img}-${index}`}
                        type="button"
                        onClick={() => setSelectedImageIndex(index)}
                        className={`relative aspect-square overflow-hidden rounded-lg border transition-colors ${
                          selectedImageIndex === index
                            ? "border-[var(--brand-accent)]"
                            : "border-[var(--border-default)] hover:border-[var(--border-strong)]"
                        }`}
                      >
                        <Image
                          src={img}
                          alt={`${product.name} view ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="sticky top-24 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 sm:p-6 shadow-[var(--shadow-card)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand-accent)]">
                    MarketFlow Assured
                  </p>
                  <h1 className="mt-1.5 text-3xl sm:text-[2.1rem] leading-tight font-semibold font-body text-[var(--text-primary)]">
                    {product.name}
                  </h1>
                  <p className="mt-1 text-base text-[var(--text-secondary)]">
                    by{" "}
                    <span className="font-semibold text-[var(--text-primary)]">
                      {product.vendorName}
                    </span>
                  </p>

                  <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--bg-sunken)] px-3 py-1.5 text-sm">
                    <span className="inline-flex items-center gap-1 font-semibold text-[var(--text-primary)]">
                      <Star className="h-3.5 w-3.5 fill-[var(--status-success)] text-[var(--status-success)]" />
                      {product.rating.toFixed(1)}
                    </span>
                    <span className="text-[var(--text-muted)]">|</span>
                    <span className="font-medium text-[var(--text-secondary)]">
                      {formatPrice(product.reviewCount)} ratings
                    </span>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <p className="text-sm font-semibold text-[var(--text-secondary)]">Rate this product:</p>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                           key={star}
                           disabled={submittingRating}
                           onClick={() => handleRateProduct(star)}
                           className="text-[var(--text-muted)] hover:text-[var(--status-success)] hover:scale-110 transition-all disabled:opacity-50"
                           aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                        >
                          <Star className={`h-5 w-5 ${product.rating >= star ? 'fill-[var(--status-success)] text-[var(--status-success)]' : ''}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-end gap-x-3 gap-y-1">
                    <p className="text-4xl font-bold leading-none text-[var(--text-primary)]">
                      ₹{formatPrice(product.price)}
                    </p>
                    {product.originalPrice > product.price ? (
                      <>
                        <p className="text-base line-through text-[var(--text-muted)]">
                          ₹{formatPrice(product.originalPrice)}
                        </p>
                        <p className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--brand-accent)]">
                          <BadgePercent className="h-4 w-4" />
                          {product.discountPercent}% OFF
                        </p>
                      </>
                    ) : null}
                  </div>

                  <p className="mt-1.5 text-xs font-semibold text-[var(--status-success)] uppercase tracking-wide">
                    Inclusive of all taxes
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {product.stock > 0 ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold bg-[var(--status-success-bg)] text-[var(--status-success)] uppercase tracking-wide">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        In stock ({product.stock})
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full px-3 py-1.5 text-xs font-semibold bg-[var(--status-neutral-bg)] text-[var(--status-neutral)] uppercase tracking-wide">
                        Out of stock
                      </span>
                    )}
                    {product.stock > 0 && product.stock < 5 ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold bg-[var(--status-error-bg)] text-[var(--status-error)] uppercase tracking-wide">
                        <CircleAlert className="h-3.5 w-3.5" />
                        Only {product.stock} left
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-5 space-y-3 rounded-xl border border-[var(--border-default)] p-3.5 bg-[var(--bg-surface)]">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                      Delivery Options
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="Enter pincode"
                        value={pincode}
                        onChange={(e) =>
                          setPincode(e.target.value.replace(/\D/g, ""))
                        }
                        className="h-10 flex-1 rounded-lg border border-[var(--border-default)] bg-white px-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)]"
                      />
                      <button
                        type="button"
                        onClick={handleCheckDelivery}
                        className="h-10 rounded-lg border border-[var(--brand-primary)] px-3 text-sm font-semibold text-[var(--brand-primary)] hover:bg-[var(--bg-sunken)]"
                      >
                        Check
                      </button>
                    </div>
                    {deliveryMessage ? (
                      <p
                        className={`text-xs leading-5 ${
                          deliveryMessage.tone === "success"
                            ? "text-[var(--status-success)]"
                            : "text-[var(--status-error)]"
                        }`}
                      >
                        {deliveryMessage.text}
                      </p>
                    ) : (
                      <p className="text-xs text-[var(--text-secondary)]">
                        Enter PIN code to check delivery time and Pay on
                        Delivery availability.
                      </p>
                    )}
                  </div>

                  <div className="mt-5 flex items-center gap-3">
                    <label
                      htmlFor="qty"
                      className="text-sm font-semibold text-[var(--text-primary)]"
                    >
                      Quantity
                    </label>
                    <select
                      id="qty"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="h-10 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
                      disabled={product.stock === 0}
                    >
                      {Array.from(
                        { length: Math.max(1, Math.min(8, product.stock)) },
                        (_, i) => i + 1,
                      ).map((qty) => (
                        <option key={qty} value={qty}>
                          {qty}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                    <button
                      onClick={handleAddToCart}
                      disabled={product.stock === 0}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold bg-[var(--brand-primary)] text-[var(--text-inverse)] disabled:cursor-not-allowed disabled:opacity-60 hover:opacity-90 transition-opacity"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Add to cart
                    </button>

                    <Link
                      href="/products"
                      className="inline-flex h-11 items-center justify-center rounded-lg border border-[var(--brand-primary)] bg-[var(--bg-surface)] px-4 text-sm font-semibold text-[var(--brand-primary)] hover:bg-[var(--bg-sunken)] transition-colors"
                    >
                      Keep browsing
                    </Link>
                  </div>

                  <div className="mt-5 space-y-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--brand-accent)]">
                      Best Offers
                    </p>
                    <ul className="space-y-2">
                      {bestOffers.map((offer) => (
                        <li
                          key={offer}
                          className="text-sm leading-6 text-[var(--text-secondary)]"
                        >
                          • {offer}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                    <div className="flex items-start gap-2 rounded-xl border border-[var(--border-default)] p-3 bg-[var(--bg-surface)]">
                      <Truck className="mt-0.5 h-4 w-4 text-[var(--brand-primary)]" />
                      <p className="text-xs leading-5 text-[var(--text-secondary)]">
                        Delivery in {Math.ceil(product.dispatchInHours / 24)}-3
                        days with live tracking.
                      </p>
                    </div>

                    <div className="flex items-start gap-2 rounded-xl border border-[var(--border-default)] p-3 bg-[var(--bg-surface)]">
                      <ShieldCheck className="mt-0.5 h-4 w-4 text-[var(--brand-primary)]" />
                      <p className="text-xs leading-5 text-[var(--text-secondary)]">
                        Verified vendor and secure checkout protection.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 sm:p-6 space-y-4">
                <h2 className="text-2xl font-semibold text-[var(--text-primary)] font-body">
                  Product Highlights
                </h2>
                <p className="text-sm leading-7 text-[var(--text-secondary)]">
                  {product.description}
                </p>
                <ul className="space-y-2.5">
                  {product.highlights.map((point) => (
                    <li
                      key={point}
                      className="flex items-start gap-2 text-sm leading-6 text-[var(--text-secondary)]"
                    >
                      <CheckCircle2 className="mt-1 h-4 w-4 text-[var(--brand-accent)]" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 sm:p-6 space-y-4">
                <h2 className="text-2xl font-semibold text-[var(--text-primary)] font-body">
                  Product Details
                </h2>
                <div className="space-y-2.5">
                  {product.specifications.map((spec) => (
                    <div
                      key={spec.label}
                      className="grid grid-cols-2 gap-4 border-b border-[var(--border-default)] pb-2.5"
                    >
                      <p className="text-sm font-medium text-[var(--text-muted)]">
                        {spec.label}
                      </p>
                      <p className="text-sm text-[var(--text-primary)] text-right">
                        {spec.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                  <RotateCcw className="h-4 w-4 text-[var(--brand-accent)]" />
                  Easy Returns
                </p>
                <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
                  {product.returnPolicy} for damaged or incorrect orders.
                </p>
              </div>

              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                  <PackageCheck className="h-4 w-4 text-[var(--brand-accent)]" />
                  Fast Dispatch
                </p>
                <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
                  Packed and dispatched within {product.dispatchInHours} hours
                  from seller warehouse.
                </p>
              </div>

              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                  <ShieldCheck className="h-4 w-4 text-[var(--brand-accent)]" />
                  Buyer Protection
                </p>
                <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
                  Secure payment flow, verified listings, and {product.warranty}
                  warranty support.
                </p>
              </div>
            </div>

            {/* Vendor Products Section */}
            {vendorProducts.length > 0 && (
              <div className="pt-10 border-t border-[var(--border-default)] space-y-6">
                <h2 className="text-2xl font-semibold text-[var(--text-primary)] font-body">
                  More products from this vendor
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
                  {vendorProducts.map((vp) => (
                    <Link
                      key={vp.id}
                      href={`/products/${vp.id}`}
                      className="group"
                    >
                      <article className="h-full overflow-hidden rounded-3xl border border-[var(--border-default)] bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(26,26,46,0.12)]">
                        <div className="relative aspect-square overflow-hidden bg-[var(--bg-sunken)]">
                          <Image
                            src={
                              vp.images[0] || "/placeholder-product-1.jpg"
                            }
                            alt={vp.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          {vp.stock < 5 && (
                            <span className="absolute right-3 top-3 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-[var(--status-error-bg)] text-[var(--status-error)]">
                              {vp.stock === 0
                                ? "Out of Stock"
                                : `Only ${vp.stock} left`}
                            </span>
                          )}
                        </div>

                        <div className="p-3 sm:p-4 flex flex-col gap-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                              <BadgeCheck
                                size={13}
                                className="text-[var(--brand-primary)]"
                              />
                              {vp.vendorName}
                            </p>
                            <div className="inline-flex items-center gap-1 rounded-md bg-[var(--bg-sunken)] px-2 py-1 text-[10px] font-semibold text-[var(--text-secondary)]">
                              <Star
                                size={11}
                                className="fill-[var(--brand-primary)] text-[var(--brand-primary)]"
                              />
                              {vp.rating.toFixed(1)}
                            </div>
                          </div>

                          <h3 className="text-base sm:text-lg font-normal text-[var(--text-primary)] line-clamp-2 leading-tight min-h-10 font-body">
                            {vp.name}
                          </h3>

                          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                            <ShieldCheck
                              size={13}
                              className="text-[var(--brand-primary)]"
                            />
                            <span className="font-medium">
                              Secure checkout eligible
                            </span>
                          </div>

                          <div className="pt-3 border-t border-[var(--border-default)] flex items-center justify-between gap-2">
                            <div>
                              <p className="text-lg sm:text-xl font-bold text-[var(--text-primary)] leading-none">
                                ₹{formatPrice(vp.price)}
                              </p>
                              <p className="mt-1 text-[11px] font-medium text-[var(--text-muted)]">
                                Inclusive of all taxes
                              </p>
                            </div>

                            <div className="inline-flex items-center gap-1 rounded-lg bg-[var(--bg-sunken)] px-3 py-2 text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] group-hover:bg-[var(--brand-primary)] group-hover:text-[var(--text-inverse)] transition-colors">
                              View
                              <ArrowRight size={14} />
                            </div>
                          </div>
                        </div>
                      </article>
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
