"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { ProductCardSkeleton } from "@/components/skeleton-loader";
import { Product } from "@/lib/types";
import {
  ArrowRight,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  Star,
  Truck,
} from "lucide-react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

const DEFAULT_CATEGORIES = [
  "All",
  "Electronics",
  "Fashion",
  "Home",
  "Sports",
  "Books",
  "Beauty",
  "Food",
  "Toys",
];

type SeasonalBanner = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  background: string;
};

// Admin-editable seasonal campaigns for the products page hero banner.
const SEASONAL_BANNERS: SeasonalBanner[] = [
  {
    id: "festive-spring",
    eyebrow: "Spring Festival Edit",
    title: "Celebrate The Season With Local Favorites",
    subtitle:
      "Fresh festive collections, trusted sellers, and delivery across India.",
    ctaLabel: "Explore Festive Picks",
    ctaHref: "/products?category=Fashion",
    background:
      "linear-gradient(120deg, #FFFFFF 0%, #F5F5F6 56%, #ECECEE 100%)",
  },
  {
    id: "wedding-season",
    eyebrow: "Wedding Season",
    title: "Curated Styles For Every Celebration",
    subtitle:
      "Premium wedding-ready fashion and gifting essentials from verified vendors.",
    ctaLabel: "Shop Occasion Wear",
    ctaHref: "/products?category=Fashion",
    background:
      "linear-gradient(120deg, #FFFFFF 0%, #F3F3F5 55%, #E6E6EA 100%)",
  },
  {
    id: "summer-deals",
    eyebrow: "Seasonal Spotlight",
    title: "Top Rated Deals, Handpicked For You",
    subtitle:
      "Discover trusted electronics, home, and lifestyle products at best-value prices.",
    ctaLabel: "View Top Deals",
    ctaHref: "/products",
    background:
      "linear-gradient(120deg, #FFFFFF 0%, #F7F7F8 55%, #EFEFF1 100%)",
  },
];

const PRICE_BANDS = [
  { value: "all", label: "All Prices" },
  { value: "0-499", label: "Under Rs. 500" },
  { value: "500-999", label: "Rs. 500 - Rs. 999" },
  { value: "1000-1999", label: "Rs. 1,000 - Rs. 1,999" },
  { value: "2000-4999", label: "Rs. 2,000 - Rs. 4,999" },
  { value: "5000+", label: "Rs. 5,000 and above" },
];

const REVIEW_BANDS = [
  { value: "all", label: "All Ratings" },
  { value: "4", label: "4.0 and above" },
  { value: "3", label: "3.0 and above" },
  { value: "2", label: "2.0 and above" },
];

const matchesPriceBand = (price: number, band: string) => {
  if (band === "0-499") {
    return price >= 0 && price <= 499;
  }

  if (band === "500-999") {
    return price >= 500 && price <= 999;
  }

  if (band === "1000-1999") {
    return price >= 1000 && price <= 1999;
  }

  if (band === "2000-4999") {
    return price >= 2000 && price <= 4999;
  }

  if (band === "5000+") {
    return price >= 5000;
  }

  return true;
};

type ApiProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
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

type ProductsResponse = {
  status: string;
  data?: ApiProduct[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
};

export default function ProductsPage() {
  const searchParams = useSearchParams();

  const [sortBy, setSortBy] = useState("featured");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedPriceBand, setSelectedPriceBand] = useState("all");
  const [selectedReviewBand, setSelectedReviewBand] = useState("all");
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  useEffect(() => {
    const category = searchParams.get("category");
    if (category && category.trim().length > 0) {
      setSelectedCategory(category);
      setCategories((prevCategories) => {
        if (prevCategories.includes(category)) {
          return prevCategories;
        }
        return [...prevCategories, category];
      });
      setPage(1);
    }
  }, [searchParams]);

  const mapApiProductToUi = (item: ApiProduct): Product => {
    const image =
      item.imageUrl && item.imageUrl.trim().length > 0
        ? item.imageUrl
        : "/placeholder-product-1.jpg";

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
      price: Number(item.price || 0),
      images: [image],
      category: item.category?.name || "Uncategorized",
      subcategory: item.category?.name || "General",
      stock: Number(item.stock || 0),
      vendorId: item.vendor?.id || "",
      vendorName: item.vendor?.businessName || "Unknown Vendor",
      rating,
      reviewCount,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || new Date().toISOString(),
      featured: true,
    };
  };

  useEffect(() => {
    let active = true;

    const fetchProducts = async () => {
      setLoading(true);
      setError("");

      try {
        let response: Response;

        if (selectedCategory === "All") {
          const params = new URLSearchParams({
            page: String(page),
            limit: String(limit),
          });

          response = await fetch(
            `${API_BASE_URL}/products?${params.toString()}`,
            {
              method: "GET",
            },
          );
        } else {
          response = await fetch(
            `${API_BASE_URL}/products/category/${encodeURIComponent(selectedCategory)}`,
            {
              method: "GET",
            },
          );
        }

        const payload: ProductsResponse = await response
          .json()
          .catch(() => ({ status: "error" }));

        if (!response.ok || payload.status !== "success") {
          throw new Error("Failed to load products");
        }

        const mappedProducts = (payload.data || []).map(mapApiProductToUi);

        if (!active) return;

        setProducts(mappedProducts);
        if (selectedCategory === "All") {
          setTotalProducts(payload.meta?.total || mappedProducts.length);
          setTotalPages(payload.meta?.totalPages || 1);
        } else {
          setTotalProducts(mappedProducts.length);
          setTotalPages(1);
        }

        setCategories((prevCategories) => {
          const categorySet = new Set<string>(prevCategories);
          mappedProducts.forEach((product) =>
            categorySet.add(product.category),
          );
          return Array.from(categorySet);
        });
      } catch (err: unknown) {
        if (!active) return;
        const message =
          err instanceof Error ? err.message : "Unable to fetch products";
        setError(message);
        setProducts([]);
        setTotalProducts(0);
        setTotalPages(1);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      active = false;
    };
  }, [page, limit, selectedCategory]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % SEASONAL_BANNERS.length);
    }, 4500);

    return () => window.clearInterval(intervalId);
  }, []);

  const filteredProducts = useMemo(() => {
    const minRating =
      selectedReviewBand === "all" ? 0 : Number(selectedReviewBand);

    const byPriceAndReview = products.filter(
      (p) =>
        matchesPriceBand(p.price, selectedPriceBand) && p.rating >= minRating,
    );

    const sorted = [...byPriceAndReview];

    if (sortBy === "price-low") {
      sorted.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-high") {
      sorted.sort((a, b) => b.price - a.price);
    } else if (sortBy === "newest") {
      sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    } else if (sortBy === "name") {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    }

    return sorted;
  }, [products, selectedPriceBand, selectedReviewBand, sortBy]);

  const resetFilters = () => {
    setSelectedCategory("All");
    setSelectedPriceBand("all");
    setSelectedReviewBand("all");
    setSortBy("featured");
    setPage(1);
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 0,
    }).format(price);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    products.forEach((product) => {
      counts[product.category] = (counts[product.category] || 0) + 1;
    });

    return counts;
  }, [products]);

  const priceBandCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    PRICE_BANDS.forEach((band) => {
      counts[band.value] = products.filter((product) =>
        matchesPriceBand(product.price, band.value),
      ).length;
    });

    return counts;
  }, [products]);

  const reviewBandCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    REVIEW_BANDS.forEach((band) => {
      if (band.value === "all") {
        counts[band.value] = products.length;
      } else {
        counts[band.value] = products.filter(
          (product) => product.rating >= Number(band.value),
        ).length;
      }
    });

    return counts;
  }, [products]);

  const activeFilterCount =
    Number(selectedCategory !== "All") +
    Number(selectedPriceBand !== "all") +
    Number(selectedReviewBand !== "all") +
    Number(sortBy !== "featured");

  const currentBanner = SEASONAL_BANNERS[currentBannerIndex];

  return (
    <div
      className="min-h-screen bg-[var(--bg-base)]"
      style={{ fontFamily: "var(--font-dm-sans)" }}
    >
      <Navbar />

      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <section
          className="relative overflow-hidden rounded-3xl border border-[var(--border-default)]"
          style={{ background: currentBanner.background }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,0,0,0.12),transparent_55%)]" />
          <div className="relative z-10 p-5 sm:p-8 lg:p-10 pb-24 sm:pb-24 lg:pb-10">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div className="max-w-3xl">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--brand-accent)]">
                  {currentBanner.eyebrow}
                </p>
                <h1
                  className="mt-2 text-3xl sm:text-5xl lg:text-6xl !leading-[1.04]"
                  style={{
                    color: "var(--brand-accent)",
                    fontFamily: "var(--font-instrument-serif)",
                  }}
                >
                  {currentBanner.title}
                </h1>
                <p className="mt-3 max-w-2xl text-sm sm:text-base leading-relaxed text-[var(--text-secondary)]">
                  {currentBanner.subtitle}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Link
                    href={currentBanner.ctaHref}
                    className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--text-primary)] transition-colors"
                  >
                    {currentBanner.ctaLabel}
                    <ArrowRight size={14} />
                  </Link>
                  <Link
                    href="/customer/orders"
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--brand-primary)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-white transition-colors"
                  >
                    My Orders
                    <ArrowRight size={14} />
                  </Link>
                  <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)]">
                    <BadgeCheck
                      size={14}
                      className="text-[var(--brand-primary)]"
                    />
                    Verified Sellers
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)]">
                    <ShieldCheck
                      size={14}
                      className="text-[var(--brand-primary)]"
                    />
                    Secure Checkout
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)]">
                    <Truck size={14} className="text-[var(--brand-primary)]" />
                    Fast Delivery
                  </span>
                </div>
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-[var(--brand-primary)]"></p>
              </div>

              <div className="w-full lg:w-auto lg:min-w-[320px] flex justify-center lg:justify-end">
                <div className="w-full max-w-[320px] sm:max-w-none inline-flex items-center gap-3 rounded-2xl border border-[var(--border-default)] bg-white/90 px-4 py-3 shadow-sm">
                  <div className="h-10 w-10 rounded-full bg-[var(--brand-primary)] text-white flex items-center justify-center">
                    <Truck size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Special Offer
                    </p>
                    <p className="text-lg font-bold text-[var(--text-primary)]">
                      First 3 Deliveries Free
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setCurrentBannerIndex(
                  (prev) =>
                    (prev - 1 + SEASONAL_BANNERS.length) %
                    SEASONAL_BANNERS.length,
                )
              }
              className="h-9 w-9 rounded-full border border-[var(--border-default)] bg-white/90 text-[var(--text-primary)] flex items-center justify-center"
              aria-label="Previous banner"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() =>
                setCurrentBannerIndex(
                  (prev) => (prev + 1) % SEASONAL_BANNERS.length,
                )
              }
              className="h-9 w-9 rounded-full border border-[var(--border-default)] bg-white/90 text-[var(--text-primary)] flex items-center justify-center"
              aria-label="Next banner"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="absolute bottom-6 left-6 z-20 flex items-center gap-2">
            {SEASONAL_BANNERS.map((banner, index) => (
              <button
                key={banner.id}
                type="button"
                onClick={() => setCurrentBannerIndex(index)}
                className={`h-2.5 rounded-full transition-all ${
                  currentBannerIndex === index
                    ? "w-8 bg-[var(--brand-primary)]"
                    : "w-2.5 bg-[var(--border-default)]"
                }`}
                aria-label={`Go to banner ${index + 1}`}
              />
            ))}
          </div>
        </section>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="h-fit rounded-2xl border border-[var(--border-default)] bg-white p-4 sm:p-5 lg:sticky lg:top-24 transition-all duration-300">
            <div className="flex items-center justify-between">
              <p className="font-body text-sm font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)]">
                Filters
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsFilterCollapsed((prev) => !prev)}
                  className="inline-flex h-8 w-8 rounded-md border border-[var(--border-default)] text-[var(--brand-primary)] items-center justify-center"
                  aria-label={
                    isFilterCollapsed ? "Expand filters" : "Shrink filters"
                  }
                >
                  {isFilterCollapsed ? (
                    <PanelLeftOpen size={14} />
                  ) : (
                    <PanelLeftClose size={14} />
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs font-semibold text-[var(--brand-primary)] hover:underline"
                >
                  Clear All
                </button>
              </div>
            </div>

            {isFilterCollapsed ? (
              activeFilterCount > 0 ? (
                <div className="mt-4 pt-4 border-t border-[var(--border-default)] flex flex-col items-center gap-2">
                  <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-semibold">
                    Active
                  </p>
                  <p className="text-lg font-bold text-[var(--text-primary)]">
                    {activeFilterCount}
                  </p>
                </div>
              ) : null
            ) : (
              <>
                <div className="mt-5 border-t border-[var(--border-default)] pt-5">
                  <p className="font-body text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)] mb-3">
                    Category
                  </p>
                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    {["All", ...categories.filter((cat) => cat !== "All")].map(
                      (cat) => (
                        <label
                          key={cat}
                          className="flex items-center justify-between gap-2 text-sm cursor-pointer"
                        >
                          <span className="flex items-center gap-2 text-[var(--text-secondary)]">
                            <input
                              type="radio"
                              name="category-filter"
                              checked={selectedCategory === cat}
                              onChange={() => {
                                setSelectedCategory(cat);
                                setPage(1);
                              }}
                              className="h-4 w-4 accent-[var(--brand-primary)]"
                            />
                            {cat}
                          </span>
                          <span className="text-xs font-semibold text-[var(--text-muted)]">
                            {cat === "All"
                              ? totalProducts
                              : categoryCounts[cat] || 0}
                          </span>
                        </label>
                      ),
                    )}
                  </div>
                </div>

                <div className="mt-5 border-t border-[var(--border-default)] pt-5">
                  <p className="font-body text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)] mb-3">
                    Review
                  </p>
                  <div className="space-y-2.5">
                    {REVIEW_BANDS.map((band) => (
                      <label
                        key={band.value}
                        className="flex items-center justify-between gap-2 text-sm cursor-pointer"
                      >
                        <span className="flex items-center gap-2 text-[var(--text-secondary)]">
                          <input
                            type="radio"
                            name="review-filter"
                            checked={selectedReviewBand === band.value}
                            onChange={() => {
                              setSelectedReviewBand(band.value);
                              setPage(1);
                            }}
                            className="h-4 w-4 accent-[var(--brand-primary)]"
                          />
                          {band.label}
                        </span>
                        <span className="text-xs font-semibold text-[var(--text-muted)]">
                          {reviewBandCounts[band.value] || 0}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mt-5 border-t border-[var(--border-default)] pt-5">
                  <p className="font-body text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)] mb-3">
                    Price
                  </p>
                  <div className="space-y-2.5">
                    {PRICE_BANDS.map((band) => (
                      <label
                        key={band.value}
                        className="flex items-center justify-between gap-2 text-sm cursor-pointer"
                      >
                        <span className="flex items-center gap-2 text-[var(--text-secondary)]">
                          <input
                            type="radio"
                            name="price-filter"
                            checked={selectedPriceBand === band.value}
                            onChange={() => {
                              setSelectedPriceBand(band.value);
                              setPage(1);
                            }}
                            className="h-4 w-4 accent-[var(--brand-primary)]"
                          />
                          {band.label}
                        </span>
                        <span className="text-xs font-semibold text-[var(--text-muted)]">
                          {priceBandCounts[band.value] || 0}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}
          </aside>

          <section>
            <div className="rounded-2xl border border-[var(--border-default)] bg-white p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--text-secondary)]">
                    Showing {filteredProducts.length} result
                    {filteredProducts.length === 1 ? "" : "s"}
                  </p>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Trusted marketplace products from local vendors
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Sort By
                  </span>
                  <div className="relative min-w-[190px]">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-[var(--border-default)] bg-[var(--bg-sunken)] px-4 py-2.5 pr-9 text-sm font-bold text-[var(--text-primary)] outline-none focus:border-[var(--brand-primary)] transition-colors"
                    >
                      <option value="featured">Featured</option>
                      <option value="newest">Newest</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="name">Name: A to Z</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                  </div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="mt-5 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
                {[...Array(10)].map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : error ? (
              <div className="mt-5 text-center py-20 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)]">
                <h3 className="text-xl font-bold mb-2 text-[var(--text-primary)]">
                  Unable to load products
                </h3>
                <p className="text-[var(--text-secondary)]">{error}</p>
              </div>
            ) : filteredProducts.length > 0 ? (
              <>
                <div className="mt-5 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
                  {filteredProducts.map((product) => (
                    <Link
                      key={product.id}
                      href={`/products/${product.id}`}
                      className="group"
                    >
                      <article className="h-full overflow-hidden rounded-3xl border border-[var(--border-default)] bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(26,26,46,0.12)]">
                        <div className="relative aspect-square overflow-hidden bg-[var(--bg-sunken)]">
                          <Image
                            src={
                              product.images[0] || "/placeholder-product-1.jpg"
                            }
                            alt={product.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          {product.stock < 5 && (
                            <span className="absolute right-3 top-3 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-[var(--status-error-bg)] text-[var(--status-error)]">
                              {product.stock === 0
                                ? "Out of Stock"
                                : `Only ${product.stock} left`}
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
                              {product.vendorName}
                            </p>
                            <div className="inline-flex items-center gap-1 rounded-md bg-[var(--bg-sunken)] px-2 py-1 text-[10px] font-semibold text-[var(--text-secondary)]">
                              <Star
                                size={11}
                                className="fill-[var(--brand-primary)] text-[var(--brand-primary)]"
                              />
                              {product.rating.toFixed(1)}
                            </div>
                          </div>

                          <h3 className="text-base sm:text-lg font-normal text-[var(--text-primary)] line-clamp-2 leading-tight min-h-10 font-body">
                            {product.name}
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
                                ₹{formatPrice(product.price)}
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

                <div className="mt-12 flex items-center justify-center gap-4">
                  <button
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={page === 1}
                    className="rounded-xl border border-[var(--border-default)] px-6 py-2.5 text-sm font-bold text-[var(--text-primary)] disabled:opacity-40 hover:bg-[var(--bg-surface)] transition-colors shadow-sm"
                  >
                    Previous
                  </button>
                  <span className="text-sm font-medium text-[var(--text-secondary)]">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={page === totalPages}
                    className="rounded-xl border border-[var(--border-default)] px-6 py-2.5 text-sm font-bold text-[var(--text-primary)] disabled:opacity-40 hover:bg-[var(--bg-surface)] transition-colors shadow-sm"
                  >
                    Next
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-5 text-center py-20 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)]">
                <h3 className="text-xl font-bold mb-2 text-[var(--text-primary)]">
                  No products found
                </h3>
                <p className="text-[var(--text-secondary)]">
                  Try adjusting your filters to find what you're looking for.
                </p>
                <button
                  onClick={resetFilters}
                  className="mt-6 text-sm font-bold text-[var(--brand-primary)] hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
