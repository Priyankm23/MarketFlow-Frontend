"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/navbar";
import { HeroCarousel } from "@/components/hero-carousel";
import {
  ArrowRight,
  Truck,
  Shield,
  Star,
  ShoppingCart,
  Heart,
  BadgeCheck,
  Headphones,
  ShoppingBag,
  BookOpen,
  Sparkles,
  Utensils,
  Gamepad2,
  Store,
  Users,
  Package,
  CreditCard,
  ArrowUpRight,
  Mail,
  ChevronRight,
  MapPin,
} from "lucide-react";
import "./hero-illustration.css";
import { API_BASE_URL } from "@/lib/config";

/* ================================================================== */
/*  DATA                                                               */
/* ================================================================== */

const categories = [
  {
    name: "Electronics",
    desc: "2,400+ products",
    Icon: Headphones,
    image: "/category-electronics.png",
  },
  {
    name: "Fashion",
    desc: "3,800+ products",
    Icon: ShoppingBag,
    image: "/category-fashion.png",
  },
  {
    name: "Home & Living",
    desc: "1,600+ products",
    Icon: Store,
    image: "/category-home.png",
  },
  {
    name: "Sports",
    desc: "900+ products",
    Icon: Package,
    image: "/category-sports.png",
  },
  {
    name: "Books",
    desc: "5,200+ products",
    Icon: BookOpen,
    image: "/category-books.png",
  },
  {
    name: "Beauty",
    desc: "1,800+ products",
    Icon: Sparkles,
    image: "/category-beauty.png",
  },
  {
    name: "Food & Gourmet",
    desc: "720+ products",
    Icon: Utensils,
    image: "/category-food.png",
  },
  {
    name: "Toys & Games",
    desc: "1,100+ products",
    Icon: Gamepad2,
    image: "/category-toys.png",
  },
];

const TRENDING_PRODUCTS_ENDPOINT = `${API_BASE_URL}/products/trending`;
const TRENDING_PRODUCTS_PER_SLIDE = 4;

type ApiTrendingProduct = {
  id: string;
  name?: string;
  price?: string | number;
  reviewCount?: number;
  rating?: number;
  imageUrl?: string | null;
  imageUrls?: string[] | null;
  vendor?: {
    businessName?: string;
  } | null;
};

type ApiTrendingResponse = {
  status?: string;
  products?: ApiTrendingProduct[];
};

type TrendingProductCard = {
  id: string;
  name: string;
  vendor: string;
  price: number;
  originalPrice: number | null;
  rating: number;
  reviews: number;
  badge: string | null;
  imageUrl: string;
};

const cleanBusinessName = (name?: string) => {
  if (!name) {
    return "Verified Vendor";
  }
  return name.replace(/^"+|"+$/g, "").trim() || "Verified Vendor";
};

const toTrendingProductCard = (
  product: ApiTrendingProduct,
): TrendingProductCard => {
  const parsedPrice = Number(product.price || 0);
  const safePrice = Number.isFinite(parsedPrice) ? parsedPrice : 0;
  const parsedRating = Number(product.rating || 0);
  const safeRating = Number.isFinite(parsedRating)
    ? Math.max(0, Math.min(5, parsedRating))
    : 0;
  const parsedReviews = Number(product.reviewCount || 0);
  const safeReviews = Number.isFinite(parsedReviews)
    ? Math.max(0, parsedReviews)
    : 0;

  return {
    id: product.id,
    name: product.name?.trim() || "Trending Product",
    vendor: cleanBusinessName(product.vendor?.businessName),
    price: safePrice,
    originalPrice: null,
    rating: safeRating,
    reviews: safeReviews,
    badge: "Trending",
    imageUrl:
      product.imageUrls?.[0] ||
      product.imageUrl ||
      "/placeholder-product-1.jpg",
  };
};

const newArrivals = [
  {
    id: "5",
    name: "LED Desk Lamp USB",
    vendor: "TechHub",
    price: 1899,
    originalPrice: 2999,
    rating: 4.6,
    reviews: 342,
    badge: "New",
    emoji: "💡",
  },
  {
    id: "6",
    name: "Organic Tea Gift Set",
    vendor: "NaturesBrew",
    price: 899,
    originalPrice: 1499,
    rating: 4.8,
    reviews: 567,
    badge: "New",
    emoji: "🍵",
  },
  {
    id: "7",
    name: "Yoga Mat Premium",
    vendor: "FitLife",
    price: 1499,
    originalPrice: 2499,
    rating: 4.3,
    reviews: 189,
    badge: "New",
    emoji: "🧘",
  },
  {
    id: "8",
    name: "Smart Watch Lite",
    vendor: "TechHub",
    price: 2999,
    originalPrice: 4999,
    rating: 4.5,
    reviews: 421,
    badge: "New",
    emoji: "⌚",
  },
];

const featuredVendors = [
  {
    name: "TechHub Electronics",
    rating: 4.8,
    products: 342,
    initials: "TH",
    verified: true,
  },
  {
    name: "StyleWear Fashion",
    rating: 4.6,
    products: 567,
    initials: "SW",
    verified: true,
  },
  {
    name: "HomeEssentials",
    rating: 4.9,
    products: 234,
    initials: "HE",
    verified: true,
  },
  {
    name: "SportGear Pro",
    rating: 4.7,
    products: 189,
    initials: "SG",
    verified: false,
  },
];

const testimonials = [
  {
    text: '"MarketFlow made it so easy to find quality products from local vendors. The delivery was fast and the products exceeded expectations!"',
    name: "Priya Sharma",
    role: "Regular Customer",
    initials: "PS",
  },
  {
    text: '"As a vendor, MarketFlow helped me reach thousands of customers I never had access to. My revenue grew 3x in the first month."',
    name: "Rajesh Kumar",
    role: "Verified Vendor",
    initials: "RK",
  },
  {
    text: '"The platform is so intuitive. I love how I can discover unique products from shops near me that I never knew existed."',
    name: "Ananya Patel",
    role: "Premium Member",
    initials: "AP",
  },
];

const trustBenefits = [
  {
    icon: BadgeCheck,
    title: "Verified Vendors",
    desc: "Every vendor goes through a rigorous verification process",
    iconColor: "#4F46E5",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    desc: "Express shipping with real-time tracking across India",
    iconColor: "#4F46E5",
  },
  {
    icon: Shield,
    title: "Secure Payments",
    desc: "100% encrypted transactions with buyer protection",
    iconColor: "#4F46E5",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    desc: "Our dedicated team is always here to help you",
    iconColor: "#4F46E5",
  },
];

/* ================================================================== */
/*  Product Card Component                                             */
/* ================================================================== */

/* ================================================================== */
/*  Product Card Component                                             */
/* ================================================================== */

function ProductCardSection({ product }: { product: TrendingProductCard }) {
  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100,
      )
    : 0;

  return (
    <Link href={`/products/${product.id}`} className="block h-full">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col group">
        <div className="aspect-square relative bg-[var(--bg-sunken)] flex items-center justify-center overflow-hidden">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          {product.badge && (
            <span className="absolute top-3 left-3 bg-[var(--bg-surface)] text-[var(--text-primary)] text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider border border-[var(--border-default)] shadow-sm">
              {product.badge}
            </span>
          )}
          {discount > 0 && (
            <span className="absolute top-3 right-3 bg-[var(--brand-accent)] text-white text-[10px] font-bold px-2 py-1 rounded-md">
              -{discount}%
            </span>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
        </div>
        <div className="p-5 flex-1 flex flex-col gap-3">
          <div>
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
              {product.vendor}
            </p>
            <h3 className="text-xl font-normal text-[var(--text-primary)] line-clamp-2 leading-tight font-body">
              {product.name}
            </h3>
          </div>
          <div className="mt-auto">
            <div className="flex items-center gap-1.5 mb-3">
              <Star className="w-4 h-4 fill-[var(--brand-primary)] text-[var(--brand-primary)]" />
              <span className="text-sm font-bold text-[var(--text-primary)]">
                {product.rating}
              </span>
              <span className="text-xs text-[var(--text-muted)]">
                ({product.reviews} reviews)
              </span>
            </div>
            <div className="flex items-baseline gap-2.5">
              <span className="text-xl font-bold text-[var(--text-primary)]">
                ₹{product.price.toLocaleString()}
              </span>
              {product.originalPrice && (
                <span className="text-sm text-[var(--text-muted)] line-through">
                  ₹{product.originalPrice.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ================================================================== */
/*  PAGE                                                               */
/* ================================================================== */

export default function HomePage() {
  const [trendingProducts, setTrendingProducts] = useState<
    TrendingProductCard[]
  >([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [currentTrendingSlide, setCurrentTrendingSlide] = useState(0);

  const [spotlightVendors, setSpotlightVendors] = useState<any[]>([]);
  const [spotlightLoading, setSpotlightLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    const fetchTrendingProducts = async () => {
      try {
        const response = await fetch(TRENDING_PRODUCTS_ENDPOINT, {
          method: "GET",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
          },
        });

        const payload: ApiTrendingResponse = await response
          .json()
          .catch(() => ({}));

        if (!response.ok || payload.status !== "success") {
          throw new Error("Failed to fetch trending products");
        }

        const mappedProducts = Array.isArray(payload.products)
          ? payload.products.map(toTrendingProductCard)
          : [];

        setTrendingProducts(mappedProducts);
      } catch {
        setTrendingProducts([]);
      } finally {
        setTrendingLoading(false);
      }
    };

    void fetchTrendingProducts();

    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const fetchSpotlightVendors = async () => {
      try {
        const url = `${API_BASE_URL}/admin/vendors/approved`;
        console.log("Fetching vendor spotlight from:", url);
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        console.log("Vendor spotlight response status:", response.status);
        const payload = await response.json().catch(() => ({}));
        console.log("Vendor spotlight payload:", payload);
        const vendorsList = payload.data || payload.vendors || [];

        if (Array.isArray(vendorsList)) {
          setSpotlightVendors(vendorsList.slice(0, 4));
        } else {
          setSpotlightVendors([]);
        }
      } catch (err) {
        console.error("Vendor spotlight fetch error:", err);
        setSpotlightVendors([]);
      } finally {
        setSpotlightLoading(false);
      }
    };
    fetchSpotlightVendors();
  }, []);

  const trendingSlides = useMemo(() => {
    if (trendingProducts.length === 0) {
      return [] as TrendingProductCard[][];
    }

    const slideCount = Math.ceil(
      trendingProducts.length / TRENDING_PRODUCTS_PER_SLIDE,
    );

    const slides = Array.from({ length: slideCount }, (_, slideIndex) =>
      Array.from({ length: TRENDING_PRODUCTS_PER_SLIDE }, (_, itemIndex) => {
        const index =
          (slideIndex * TRENDING_PRODUCTS_PER_SLIDE + itemIndex) %
          trendingProducts.length;
        return trendingProducts[index];
      }),
    );

    return slides.length === 1 ? [slides[0], slides[0]] : slides;
  }, [trendingProducts]);

  useEffect(() => {
    setCurrentTrendingSlide(0);
  }, [trendingSlides.length]);

  useEffect(() => {
    if (trendingSlides.length <= 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setCurrentTrendingSlide((current) =>
        current + 1 >= trendingSlides.length ? 0 : current + 1,
      );
    }, 4500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [trendingSlides.length]);

  return (
    <div
      className="font-body"
      style={{
        backgroundColor: "var(--bg-base)",
        fontFamily: "var(--font-dm-sans)",
      }}
    >
      <Navbar />

      {/* ── HERO ── */}
      <section
        id="hero"
        className="relative px-4 sm:px-6 lg:px-8 pt-4 pb-10 sm:pt-10 sm:pb-14 max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
      >
        <div className="space-y-6 animate-in fade-in slide-in-from-left-8 duration-700 text-center lg:text-left flex flex-col items-center lg:items-start">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-sunken)] border border-[var(--border-default)] text-[var(--text-primary)] text-xs font-semibold uppercase tracking-wider">
            Empowering 2,000+ Local Vendors 🛍️
          </div>

          <h1 className="text-6xl sm:text-8xl lg:text-9xl !leading-[1.02] !tracking-tight">
            Local Shops <br />
            <span className="italic text-[var(--brand-accent)]">Go Global</span>
          </h1>

          <p className="text-lg text-[var(--text-secondary)] max-w-lg leading-relaxed">
            MarketFlow bridges the gap between your favorite local boutiques and
            the convenience of global e-commerce. Discover authenticity,
            delivered.
          </p>

          <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
            <Link
              href="/products"
              className="px-8 py-4 bg-[var(--brand-primary)] text-[var(--text-inverse)] rounded-full text-base font-semibold hover:opacity-90 transition-all flex items-center gap-2 group"
            >
              Start Shopping
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/vendor/apply"
              className="px-8 py-4 bg-transparent text-[var(--text-primary)] border-2 border-[var(--border-default)] rounded-full text-base font-semibold hover:bg-[var(--bg-sunken)] transition-all"
            >
              Become a Vendor
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-2 justify-center lg:justify-start">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-[var(--status-success-bg)] text-[var(--status-success)] flex items-center justify-center text-[10px] font-bold">
                ✓
              </div>
              <span className="text-sm font-semibold text-[var(--text-secondary)]">
                Verified Sellers
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-[var(--status-success-bg)] text-[var(--status-success)] flex items-center justify-center text-[10px] font-bold">
                ✓
              </div>
              <span className="text-sm font-semibold text-[var(--text-secondary)]">
                Zero Upfront Cost
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-[var(--status-success-bg)] text-[var(--status-success)] flex items-center justify-center text-[10px] font-bold">
                ✓
              </div>
              <span className="text-sm font-semibold text-[var(--text-secondary)]">
                Instant Setup
              </span>
            </div>
          </div>
        </div>

        <div className="relative animate-in fade-in slide-in-from-right-8 duration-700 delay-150">
          <HeroCarousel />
        </div>
      </section>

      <div className="[&_h1]:font-body [&_h2]:font-body [&_h3]:font-body [&_h4]:font-body">
        {/* ── SHOP BY CATEGORY ── */}
        <section
          id="categories"
          className="pt-12 pb-10 sm:py-24 bg-[var(--bg-sunken)]"
        >
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-12">
              <div>
                <h2 className="text-4xl sm:text-5xl">Shop by Category</h2>
                <p className="text-[var(--text-secondary)] mt-2">
                  Curated collections from across the country
                </p>
              </div>
              <Link
                href="/products"
                className="text-sm font-bold text-[var(--brand-primary)] hover:underline flex items-center gap-1"
              >
                Browse All <ChevronRight size={16} />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {categories.map((cat) => (
                <Link
                  key={cat.name}
                  href={`/products?category=${encodeURIComponent(cat.name)}`}
                  className="group bg-[var(--bg-surface)] rounded-2xl overflow-hidden border border-[var(--border-default)] hover:shadow-lg transition-all"
                >
                  <div className="aspect-[16/9] relative overflow-hidden bg-[var(--bg-sunken)]">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-5 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-normal text-[var(--text-primary)] font-body">
                        {cat.name}
                      </h3>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        {cat.desc}
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[var(--bg-sunken)] flex items-center justify-center text-[var(--text-primary)] group-hover:bg-[var(--brand-primary)] group-hover:text-[var(--text-inverse)] transition-colors">
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── TRENDING PRODUCTS ── */}
        <section id="trending" className="pt-8 pb-24 sm:py-24">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-12">
              <div>
                <h2 className="text-4xl sm:text-5xl">Trending Now</h2>
                <p className="text-[var(--text-secondary)] mt-2">
                  The most popular picks this week
                </p>
              </div>
              <Link
                href="/products"
                className="text-sm font-bold text-[var(--brand-primary)] hover:underline flex items-center gap-1"
              >
                View Store <ChevronRight size={16} />
              </Link>
            </div>
            {trendingLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: TRENDING_PRODUCTS_PER_SLIDE }).map(
                  (_, index) => (
                    <div
                      key={`trending-skeleton-${index}`}
                      className="h-[340px] rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] animate-pulse"
                    />
                  ),
                )}
              </div>
            ) : trendingSlides.length === 0 ? (
              <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-8 text-center text-sm text-[var(--text-secondary)]">
                Trending products are unavailable right now.
              </div>
            ) : (
              <div className="relative">
                <div className="overflow-hidden">
                  <div
                    className="flex transition-transform duration-700 ease-out"
                    style={{
                      transform: `translateX(-${currentTrendingSlide * 100}%)`,
                    }}
                  >
                    {trendingSlides.map((slide, slideIndex) => (
                      <div
                        key={`trending-slide-${slideIndex}`}
                        className="min-w-full grid grid-cols-2 lg:grid-cols-4 gap-6"
                      >
                        {slide.map((product, productIndex) => (
                          <ProductCardSection
                            key={`${product.id}-${slideIndex}-${productIndex}`}
                            product={product}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {trendingSlides.length > 1 && (
                  <div className="mt-6 flex items-center justify-center gap-2">
                    {trendingSlides.map((_, index) => (
                      <button
                        key={`trending-dot-${index}`}
                        type="button"
                        onClick={() => setCurrentTrendingSlide(index)}
                        aria-label={`Go to trending slide ${index + 1}`}
                        className={`h-2.5 rounded-full transition-all ${
                          index === currentTrendingSlide
                            ? "w-8 bg-[var(--brand-primary)]"
                            : "w-2.5 bg-[var(--border-strong)]"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ── VENDOR SPOTLIGHT ── */}
        <section
          id="vendors"
          className="py-24 bg-[var(--bg-surface)] border-y border-[var(--border-default)]"
        >
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-12">
              <div>
                <h2 className="text-4xl sm:text-5xl">Vendor Spotlight</h2>
                <p className="text-[var(--text-secondary)] mt-2">
                  Trusted shops bringing their legacy online
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {spotlightLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={`vendor-skeleton-${i}`}
                    className="h-[280px] rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] animate-pulse"
                  />
                ))
              ) : spotlightVendors.length === 0 ? (
                <div className="lg:col-span-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-base)] p-8 text-center text-sm text-[var(--text-secondary)]">
                  No vendor spots available right now.
                </div>
              ) : (
                spotlightVendors.map((vendor, index) => {
                  const rawName = vendor.businessName || "Verified Vendor";
                  const cleanName = rawName.replace(/^"+|"+$/g, "");
                  const rawCity = vendor.city || "Local Area";
                  const cleanCity = rawCity
                    .replace(/^"+|"+$/g, "")
                    .toLowerCase();
                  const rawCat = vendor.storeCategory || "";
                  const cleanCat = rawCat.replace(/^"+|"+$/g, "").toUpperCase();

                  return (
                    <div
                      key={vendor.id || index}
                      className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl overflow-hidden hover:shadow-xl hover:border-[var(--brand-primary)] transition-all duration-300 group flex flex-col"
                    >
                      <div className="w-full aspect-[4/3] bg-[var(--bg-sunken)] relative overflow-hidden flex items-center justify-center shrink-0">
                        {vendor.logoUrl ? (
                          <img
                            src={vendor.logoUrl}
                            alt={cleanName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-[var(--bg-sunken)] group-hover:scale-105 transition-transform duration-700">
                            <Store className="w-12 h-12 text-[var(--text-muted)] mb-3" />
                            <span className="text-sm font-medium text-[var(--text-muted)] text-opacity-70">
                              No Image
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 pointer-events-none" />
                      </div>

                      <div className="p-6 flex flex-col items-center text-center flex-1">
                        <h3
                          className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] font-body line-clamp-1 w-full"
                          title={cleanName}
                        >
                          {cleanName}
                        </h3>

                        {cleanCat && (
                          <div className="mt-4">
                            <span className="text-[var(--brand-primary)] text-xs font-bold px-3 py-1 bg-[var(--brand-primary)]/10 rounded-full max-w-full truncate uppercase tracking-widest border border-[var(--brand-primary)]/20">
                              {cleanCat}
                            </span>
                          </div>
                        )}

                        <div className="mt-auto pt-6 w-full flex items-center justify-center text-[var(--text-secondary)] text-sm md:text-base capitalize font-medium">
                          <MapPin size={18} className="mr-1.5 shrink-0" />
                          <span className="truncate">{cleanCity}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>

        {/* ── TRUST BENEFITS ── */}
        <section className="py-24">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
              {trustBenefits.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <div key={benefit.title} className="text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-[var(--bg-sunken)] flex items-center justify-center mx-auto text-[var(--brand-primary)]">
                      <Icon size={32} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[var(--text-primary)] font-body">
                        {benefit.title}
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)] mt-2 leading-relaxed max-w-[200px] mx-auto">
                        {benefit.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-24 bg-[var(--brand-primary)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-white/5 skew-x-12 translate-x-1/2" />
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl sm:text-6xl text-[var(--text-inverse)] !leading-[1.1]">
                Join the Digital <br />
                <span className="italic opacity-80">Market Revolution</span>
              </h2>
              <p className="text-lg text-white/70 leading-relaxed max-w-lg">
                Scale your business with MarketFlow. Reach more customers,
                manage inventory seamlessly, and grow your brand beyond borders.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/vendor/apply"
                  className="px-8 py-4 bg-white text-[var(--brand-primary)] rounded-full font-bold hover:bg-white/90 transition-all"
                >
                  Apply Now
                </Link>
                <Link
                  href="/vendor/apply"
                  className="px-8 py-4 bg-transparent text-white border-2 border-white/30 rounded-full font-bold hover:bg-white/10 transition-all"
                >
                  Learn More
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Active Vendors", value: "2,000+" },
                { label: "Avg Growth", value: "3.5x" },
                { label: "Active Cities", value: "150+" },
                { label: "Zero Fees", value: "90 Days" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="p-6 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm"
                >
                  <p className="text-3xl font-bold text-white mb-1">
                    {stat.value}
                  </p>
                  <p className="text-xs font-medium text-white/50 uppercase tracking-widest">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="bg-[var(--bg-surface)] pt-24 pb-12 border-t border-[var(--border-default)]">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-12 mb-20">
              <div className="col-span-2">
                <h2
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "28px",
                    color: "var(--brand-primary)",
                    letterSpacing: "0.02em",
                    fontWeight: "normal",
                  }}
                  className="mb-6"
                >
                  MarketFlow
                </h2>
                <p className="text-[var(--text-secondary)] leading-relaxed max-w-xs">
                  The most trusted bridge between offline commerce and digital
                  convenience in India.
                </p>
              </div>
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-6">
                  Explore
                </h4>
                <ul className="space-y-4">
                  <li>
                    <Link
                      href="#"
                      className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      Products
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      Categories
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      Vendors
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-6">
                  Partners
                </h4>
                <ul className="space-y-4">
                  <li>
                    <Link
                      href="#"
                      className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      Become a Vendor
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      Vendor Guidelines
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      Support
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-6">
                  Legal
                </h4>
                <ul className="space-y-4">
                  <li>
                    <Link
                      href="#"
                      className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      Privacy
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      Terms
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="pt-8 border-t border-[var(--border-default)] flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider">
                © 2026 MarketFlow. All rights reserved. Built for India.
              </p>
              <div className="flex gap-6">
                <Link
                  href="#"
                  className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  Twitter
                </Link>
                <Link
                  href="#"
                  className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  Instagram
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
