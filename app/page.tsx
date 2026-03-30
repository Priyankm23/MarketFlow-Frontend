"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/lib/store";
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
  Zap,
  Clock,
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

const flashDeals = [
  {
    id: "fd1",
    name: "Wireless Earbuds Pro",
    vendor: "TechHub Electronics",
    price: 1499,
    originalPrice: 3999,
    discount: 63,
    rating: 4.7,
    reviews: 892,
    emoji: "🎧",
  },
  {
    id: "fd2",
    name: "Pure Silk Saree",
    vendor: "StyleWear Fashion",
    price: 2199,
    originalPrice: 5999,
    discount: 63,
    rating: 4.5,
    reviews: 234,
    emoji: "👗",
  },
  {
    id: "fd3",
    name: "Cold Press Juice Set",
    vendor: "NaturesBrew",
    price: 599,
    originalPrice: 999,
    discount: 40,
    rating: 4.8,
    reviews: 678,
    emoji: "🍋",
  },
  {
    id: "fd4",
    name: "Premium Yoga Mat",
    vendor: "FitLife",
    price: 899,
    originalPrice: 1999,
    discount: 55,
    rating: 4.6,
    reviews: 445,
    emoji: "🧘",
  },
  {
    id: "fd5",
    name: "Artisan Candle Set",
    vendor: "AromaCraft",
    price: 449,
    originalPrice: 899,
    discount: 50,
    rating: 4.7,
    reviews: 321,
    emoji: "🕯️",
  },
  {
    id: "fd6",
    name: "Raw Organic Honey",
    vendor: "FarmFresh",
    price: 349,
    originalPrice: 599,
    discount: 42,
    rating: 4.9,
    reviews: 1203,
    emoji: "🍯",
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
    iconColor: "var(--brand-accent)",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    desc: "Express shipping with real-time tracking across India",
    iconColor: "var(--brand-accent)",
  },
  {
    icon: Shield,
    title: "Secure Payments",
    desc: "100% encrypted transactions with buyer protection",
    iconColor: "var(--brand-accent)",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    desc: "Our dedicated team is always here to help you",
    iconColor: "var(--brand-accent)",
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
                {product.rating.toFixed(1)}
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
  const [countdown, setCountdown] = useState({ h: 4, m: 23, s: 47 });
  const user = useAuthStore((state) => state.user);
  const [heroBanner, setHeroBanner] = useState(0);

  const heroBanners = [
    {
      img: "/hero-fashion.png",
      label: "New Collection",
      sub: "Fashion & Ethnic Wear",
      cta: "Shop Fashion",
      href: "/products?category=Fashion",
    },
    {
      img: "/hero-electronics.png",
      label: "Up to 60% Off",
      sub: "Electronics & Gadgets",
      cta: "Shop Electronics",
      href: "/products?category=Electronics",
    },
    {
      img: "/hero-sale.png",
      label: "Mega Sale",
      sub: "Deals Across All Categories",
      cta: "View Deals",
      href: "#deals",
    },
    {
      img: "/hero-delivery.png",
      label: "Express Delivery",
      sub: "Order now, get it fast",
      cta: "Start Shopping",
      href: "/products",
    },
  ];

  // Auto-advance hero banner every 4 seconds
  useEffect(() => {
    const t = setInterval(() => setHeroBanner((p) => (p + 1) % 4), 4000);
    return () => clearInterval(t);
  }, []);

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

  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown((prev) => {
        const total = prev.h * 3600 + prev.m * 60 + prev.s - 1;
        if (total <= 0) return { h: 4, m: 0, s: 0 };
        return {
          h: Math.floor(total / 3600),
          m: Math.floor((total % 3600) / 60),
          s: total % 60,
        };
      });
    }, 1000);
    return () => clearInterval(tick);
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
      {/* ── ANNOUNCEMENT BAR ── */}
      <div className="bg-[var(--brand-primary)] text-[var(--text-inverse)] flex items-center justify-center gap-2 sm:gap-6 flex-wrap text-center py-2.5 px-4 text-xs sm:text-sm font-medium">
        <span>
          🎉 Free delivery on orders above <strong>₹499</strong>
        </span>
        <span className="hidden sm:inline opacity-30">|</span>
        <span>
          New user? Use code{" "}
          <strong className="bg-white/20 px-2 py-0.5 rounded tracking-wide">
            FIRST100
          </strong>{" "}
          for ₹100 off
        </span>
        <Link
          href="/products"
          className="underline font-bold hover:no-underline opacity-90 hover:opacity-100"
        >
          Shop Now →
        </Link>
      </div>

      <Navbar />

      {/* ── HERO ── */}
      <section
        id="hero"
        className="bg-[var(--bg-base)] border-b border-[var(--border-default)]"
      >
        <div className="max-w-[1400px] mx-auto px-0 sm:px-6 lg:px-8">
          {/* Flex row: image slider (60%) + brand marquee (40%) */}
          <div className="flex flex-col lg:flex-row items-stretch lg:gap-6 py-6">
            {/* Left — Image Banner Slider (60% width) */}
            <div
              className="relative overflow-hidden w-full lg:flex-[60] shadow-sm"
              style={{ height: "400px" }}
            >
              {/* Slides Container for sliding effect */}
              <div
                className="flex h-full transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(-${heroBanner * 100}%)` }}
              >
                {heroBanners.map((banner, i) => (
                  <div key={i} className="w-full h-full flex-shrink-0 relative">
                    <img
                      src={banner.img}
                      alt={banner.sub}
                      className="w-full h-full object-cover"
                    />
                    {/* Overlay text */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/25 to-transparent flex flex-col justify-end p-6 sm:p-10 gap-4">
                      <span className="text-white/70 text-xs sm:text-sm font-medium mb-1">
                        {banner.sub}
                      </span>
                      <h2 className="text-white text-2xl sm:text-3xl lg:text-4xl font-bold !leading-tight mb-6">
                        {banner.label}
                      </h2>
                      <Link
                        href={banner.href}
                        className="w-fit px-5 py-2.5 bg-white text-[var(--text-primary)] rounded-full text-sm font-bold hover:bg-white/90 transition-all flex items-center gap-2 group"
                      >
                        {banner.cta}
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {/* Dot nav: center on small screens, left on larger screens */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 sm:left-8 sm:translate-x-0 flex gap-1.5 z-20">
                {heroBanners.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setHeroBanner(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === heroBanner ? "w-8 bg-white" : "w-1.5 bg-white/50"
                    }`}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Right — Brand Marquee (40% width) */}
            <div
              className="hidden lg:flex lg:flex-col overflow-hidden bg-white hero-right-fade relative border border-[var(--border-default)] shadow-sm"
              style={{ flex: "40", height: "400px" }}
            >
              {/* Title */}
              <div className="px-5 pt-5 pb-2 text-center">
                <h2
                  className="font-bold tracking-widest uppercase"
                  style={{
                    color: "var(--text-primary)",
                    letterSpacing: "0.08em",
                    fontSize: "17px",
                  }}
                >
                  Shop from Big Brands
                </h2>
                <div
                  className="mx-auto mt-2 h-0.5 w-12 rounded-full"
                  style={{ background: "var(--brand-accent)" }}
                />
              </div>
              {/* Marquee rows */}
              <div className="relative z-10 flex-1 flex flex-col justify-center">
                <HeroCarousel />
              </div>
            </div>
          </div>

          {/* Brand Marquee — mobile/tablet (CSS animated, not static) */}
          <div className="lg:hidden border-t border-[var(--border-default)] pt-4 pb-3 overflow-hidden bg-[var(--bg-surface)]">
            {/* Title */}
            <div className="text-center mb-3">
              <h2
                className="font-bold tracking-widest uppercase"
                style={{
                  color: "var(--text-primary)",
                  letterSpacing: "0.08em",
                  fontSize: "15px",
                }}
              >
                Shop from Big Brands
              </h2>
              <div
                className="mx-auto mt-2 h-0.5 w-12 rounded-full"
                style={{ background: "var(--brand-accent)" }}
              />
            </div>
            <div className="mobile-brand-marquee">
              {[
                "/brands/342045552_264830236025844_6486536419961059087_n.jpg",
                "/brands/548b64086f65eda8216ec65d3bb4fa44.jpg",
                "/brands/attachment_68653513.jpg",
                "/brands/Boat_Logo.webp",
                "/brands/BrandEmporio-Logos-04.webp",
                "/brands/cbca1848a4eb31e0cd5e5978c6e959ae.jpg",
                "/brands/images%20(7).png",
                "/brands/image4_480x480.webp",
                "/brands/images%20(2).png",
                "/brands/images%20(3).png",
                "/brands/images%20(5).png",
                "/brands/images%20(6).png",
              ].map((src, i) => (
                <div key={`brand-${i}`} className="mobile-brand-tile">
                  <img
                    src={src}
                    alt="Brand"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ))}
              {/* Duplicate the set for seamless loop */}
              {[
                "/brands/342045552_264830236025844_6486536419961059087_n.jpg",
                "/brands/548b64086f65eda8216ec65d3bb4fa44.jpg",
                "/brands/attachment_68653513.jpg",
                "/brands/Boat_Logo.webp",
                "/brands/BrandEmporio-Logos-04.webp",
                "/brands/cbca1848a4eb31e0cd5e5978c6e959ae.jpg",
                "/brands/images%20(7).png",
                "/brands/image4_480x480.webp",
                "/brands/images%20(2).png",
                "/brands/images%20(3).png",
                "/brands/images%20(5).png",
                "/brands/images%20(6).png",
              ].map((src, i) => (
                <div key={`brand-dup-${i}`} className="mobile-brand-tile">
                  <img
                    src={src}
                    alt="Brand"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="[&_h1]:font-body [&_h2]:font-body [&_h3]:font-body [&_h4]:font-body">
        {/* ── FLASH DEALS ── */}
        <section id="deals" className="py-8 sm:py-12 bg-[var(--bg-base)]">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <Zap className="w-6 h-6 text-[var(--brand-accent)] fill-[var(--brand-accent)]" />
                    Flash Deals
                  </h2>
                  <p className="text-[var(--text-secondary)] text-sm mt-1">
                    Limited time &mdash; grab them before they&apos;re gone
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-[var(--bg-sunken)] border border-[var(--border-default)] text-[var(--text-primary)] px-3 py-2 rounded-xl text-xs sm:text-sm font-mono font-semibold">
                  <Clock className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                  <span className="text-[var(--text-muted)] font-sans font-medium hidden sm:inline">
                    Ends in
                  </span>
                  <span className="tabular-nums">
                    {String(countdown.h).padStart(2, "0")}
                  </span>
                  <span className="text-[var(--text-muted)]">:</span>
                  <span className="tabular-nums">
                    {String(countdown.m).padStart(2, "0")}
                  </span>
                  <span className="text-[var(--text-muted)]">:</span>
                  <span className="tabular-nums">
                    {String(countdown.s).padStart(2, "0")}
                  </span>
                </div>
              </div>
              <Link
                href="/products"
                className="text-sm font-bold text-[var(--brand-accent)] hover:underline flex items-center gap-1"
              >
                View All <ChevronRight size={16} />
              </Link>
            </div>
            {/* Horizontal scroll strip */}
            <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
              {flashDeals.map((deal) => (
                <Link
                  key={deal.id}
                  href={`/products?search=${encodeURIComponent(deal.name)}`}
                  className="group flex-none w-[160px] sm:w-[185px] bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl overflow-hidden hover:shadow-lg hover:border-[var(--brand-accent)] transition-all duration-300"
                >
                  <div className="aspect-square bg-[var(--bg-sunken)] flex items-center justify-center relative overflow-hidden">
                    <span className="text-4xl sm:text-5xl group-hover:scale-110 transition-transform duration-300">
                      {deal.emoji}
                    </span>
                    <span className="absolute top-2 left-2 bg-[#fff1f1] text-[#cc2200] border border-[#fecaca] text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                      -{deal.discount}%
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider truncate">
                      {deal.vendor}
                    </p>
                    <p className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] mt-0.5 line-clamp-2 leading-snug">
                      {deal.name}
                    </p>
                    <div className="flex items-baseline gap-1.5 mt-2">
                      <span className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
                        ₹{deal.price.toLocaleString()}
                      </span>
                      <span className="text-xs text-[var(--text-muted)] line-through">
                        ₹{deal.originalPrice.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3 h-3 fill-[var(--brand-primary)] text-[var(--brand-primary)]" />
                      <span className="text-[11px] font-bold text-[var(--text-secondary)]">
                        {deal.rating}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)]">
                        ({deal.reviews})
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── SHOP BY CATEGORY ── */}
        <section
          id="categories"
          className="pt-12 pb-10 sm:py-24 bg-[var(--bg-sunken)]"
        >
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-12">
              <div>
                <h2 className="text-4xl sm:text-5xl">Shop by Category</h2>
                <p className="text-[var(--text-secondary)] mt-2">
                  Curated collections from across the country
                </p>
              </div>
              <Link
                href="/products"
                className="text-sm font-bold text-[var(--brand-accent)] hover:underline flex items-center gap-1"
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
        <section id="trending" className="py-10 sm:py-14">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
                  Trending Now
                </h2>
                <p className="text-[var(--text-secondary)] mt-1 text-sm">
                  The most popular picks this week
                </p>
              </div>
              <Link
                href="/products"
                className="text-sm font-bold text-[var(--brand-accent)] hover:underline flex items-center gap-1"
              >
                View All <ChevronRight size={16} />
              </Link>
            </div>
            {trendingLoading ? (
              <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-none w-[185px] h-[280px] rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] animate-pulse"
                  />
                ))}
              </div>
            ) : trendingSlides.length === 0 ? (
              <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-8 text-center text-sm text-[var(--text-secondary)]">
                Trending products are unavailable right now.
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
                {trendingSlides.flat().map((product, i) => (
                  <div
                    key={`${product.id}-${i}`}
                    className="flex-none w-[185px]"
                  >
                    <ProductCardSection product={product} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── NEW ARRIVALS ── */}
        <section
          id="new-arrivals"
          className="py-10 sm:py-14 bg-[var(--bg-sunken)]"
        >
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[var(--brand-accent)]" />
                  New Arrivals
                </h2>
                <p className="text-[var(--text-secondary)] mt-1 text-sm">
                  Fresh drops from our latest vendors
                </p>
              </div>
              <Link
                href="/products?sort=newest"
                className="text-sm font-bold text-[var(--brand-accent)] hover:underline flex items-center gap-1"
              >
                See All <ChevronRight size={16} />
              </Link>
            </div>
            {/* Horizontal scroll strip */}
            <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
              {newArrivals.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className="group flex-none w-[160px] sm:w-[185px] bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl overflow-hidden hover:shadow-md transition-all"
                >
                  <div className="aspect-square bg-[var(--bg-sunken)] flex items-center justify-center relative overflow-hidden">
                    <span className="text-4xl sm:text-5xl group-hover:scale-110 transition-transform duration-300">
                      {product.emoji}
                    </span>
                    <span className="absolute top-2 left-2 bg-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                      New
                    </span>
                    {product.originalPrice && (
                      <span className="absolute top-2 right-2 bg-[#fff1f1] text-[#cc2200] border border-[#fecaca] text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                        -
                        {Math.round(
                          ((product.originalPrice - product.price) /
                            product.originalPrice) *
                            100,
                        )}
                        %
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider truncate">
                      {product.vendor}
                    </p>
                    <h3 className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] mt-0.5 line-clamp-2">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-1 mt-1.5">
                      <Star className="w-3 h-3 fill-[var(--brand-primary)] text-[var(--brand-primary)]" />
                      <span className="text-[11px] font-bold text-[var(--text-primary)]">
                        {product.rating.toFixed(1)}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)]">
                        ({product.reviews})
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1.5 mt-2">
                      <span className="text-sm font-bold text-[var(--text-primary)]">
                        ₹{product.price.toLocaleString()}
                      </span>
                      {product.originalPrice && (
                        <span className="text-xs text-[var(--text-muted)] line-through">
                          ₹{product.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section
          id="testimonials"
          className="py-16 sm:py-20 bg-[var(--bg-base)]"
        >
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
                What Our Customers Say
              </h2>
              <p className="text-[var(--text-secondary)] mt-2 text-sm">
                Real reviews from real people across India
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <div
                  key={t.name}
                  className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-6 space-y-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className="w-4 h-4 fill-[var(--brand-primary)] text-[var(--brand-primary)]"
                      />
                    ))}
                  </div>
                  <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                    {t.text}
                  </p>
                  <div className="flex items-center gap-3 pt-2 border-t border-[var(--border-default)]">
                    <div className="w-10 h-10 rounded-full bg-[var(--bg-sunken)] flex items-center justify-center text-sm font-bold text-[var(--text-primary)] shrink-0">
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[var(--text-primary)]">
                        {t.name}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {t.role}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CUSTOMER CTA (guests only) ── */}
        {!user && (
          <section className="py-20 bg-[var(--brand-primary)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-white/5 skew-x-12 translate-x-1/4 pointer-events-none" />
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div className="space-y-6">
                <h2 className="text-3xl sm:text-5xl font-bold text-white !leading-tight">
                  Your Favourite Local
                  <br />
                  <span className="opacity-75">Shops, Now Online</span>
                </h2>
                <p className="text-white/70 text-base leading-relaxed max-w-md">
                  Sign up today and get ₹100 off your first order. Discover
                  handpicked products from 2,000+ verified local vendors across
                  India.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/register"
                    className="px-7 py-3.5 bg-white text-[var(--brand-accent)] rounded-full font-bold hover:bg-white/90 transition-all text-sm sm:text-base"
                  >
                    Sign Up &amp; Get ₹100 Off
                  </Link>
                  <Link
                    href="/products"
                    className="px-7 py-3.5 bg-transparent text-white border-2 border-white/30 rounded-full font-bold hover:bg-white/10 transition-all text-sm sm:text-base"
                  >
                    Browse Products
                  </Link>
                </div>
                <p className="text-white/40 text-xs">
                  Are you a local vendor?{" "}
                  <Link
                    href="/vendor/apply"
                    className="text-white/70 font-semibold hover:text-white underline"
                  >
                    Apply to list your shop →
                  </Link>
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Verified Vendors", value: "2,000+" },
                  { label: "Products Listed", value: "50,000+" },
                  { label: "Cities Covered", value: "150+" },
                  { label: "Happy Customers", value: "25,000+" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="p-5 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm text-center"
                  >
                    <p className="text-2xl sm:text-3xl font-bold text-white">
                      {stat.value}
                    </p>
                    <p className="text-[10px] sm:text-xs font-medium text-white/50 uppercase tracking-widest mt-1">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── FOOTER ── */}
        <footer className="bg-[var(--bg-surface)] pt-24 pb-12 border-t border-[var(--border-default)]">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-12 mb-20">
              <div className="col-span-2">
                <h2
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "28px",
                    color: "var(--brand-accent)",
                    letterSpacing: "0.02em",
                    fontWeight: "bold",
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
                      href="/products"
                      className="text-sm text-[var(--text-secondary)] hover:text-[var(--brand-accent)] transition-colors"
                    >
                      Products
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/products"
                      className="text-sm text-[var(--text-secondary)] hover:text-[var(--brand-accent)] transition-colors"
                    >
                      Categories
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/products"
                      className="text-sm text-[var(--text-secondary)] hover:text-[var(--brand-accent)] transition-colors"
                    >
                      Browse Deals
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
                      href="/vendor/apply"
                      className="text-sm text-[var(--text-secondary)] hover:text-[var(--brand-accent)] transition-colors"
                    >
                      Become a Vendor
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/vendor/apply"
                      className="text-sm text-[var(--text-secondary)] hover:text-[var(--brand-accent)] transition-colors"
                    >
                      Vendor Guidelines
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/login"
                      className="text-sm text-[var(--text-secondary)] hover:text-[var(--brand-accent)] transition-colors"
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
                      className="text-sm text-[var(--text-secondary)] hover:text-[var(--brand-accent)] transition-colors"
                    >
                      Privacy
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#"
                      className="text-sm text-[var(--text-secondary)] hover:text-[var(--brand-accent)] transition-colors"
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
                  className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--brand-accent)] transition-colors"
                >
                  Twitter
                </Link>
                <Link
                  href="#"
                  className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--brand-accent)] transition-colors"
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
