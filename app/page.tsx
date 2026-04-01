"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/lib/store";
import { Navbar } from "@/components/navbar";
import { HeroCarousel } from "@/components/hero-carousel";
import { ProductCard } from "@/components/product-card";
import { FlashDealCard } from "@/components/flash-deal-card";
import { FlashDeal } from "@/lib/types";
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
    role: "Regular Shopper",
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
    role: "Regular Shopper",
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
/*  PAGE                                                               */
/* ================================================================== */

export default function HomePage() {
  const [trendingProducts, setTrendingProducts] = useState<
    TrendingProductCard[]
  >([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [currentTrendingSlide, setCurrentTrendingSlide] = useState(0);

  const [flashDeals, setFlashDeals] = useState<FlashDeal[]>([]);
  const [flashDealsLoading, setFlashDealsLoading] = useState(true);

  const [spotlightVendors, setSpotlightVendors] = useState<any[]>([]);
  const [spotlightLoading, setSpotlightLoading] = useState(true);
  const [countdown, setCountdown] = useState({ h: 4, m: 23, s: 47 });
  const user = useAuthStore((state) => state.user);
  const [heroBanner, setHeroBanner] = useState(0);
  const showCustomerCta = !user || user.role !== "customer";
  const heroTouchStartX = useRef<number | null>(null);
  const heroTouchStartY = useRef<number | null>(null);
  const heroTouchDeltaX = useRef(0);
  const heroTouchDeltaY = useRef(0);

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
    const t = setInterval(
      () => setHeroBanner((p) => (p + 1) % heroBanners.length),
      4000,
    );
    return () => clearInterval(t);
  }, [heroBanners.length]);

  const handleHeroTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    heroTouchStartX.current = touch.clientX;
    heroTouchStartY.current = touch.clientY;
    heroTouchDeltaX.current = 0;
    heroTouchDeltaY.current = 0;
  };

  const handleHeroTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (heroTouchStartX.current === null || heroTouchStartY.current === null) {
      return;
    }

    const touch = e.touches[0];
    heroTouchDeltaX.current = touch.clientX - heroTouchStartX.current;
    heroTouchDeltaY.current = touch.clientY - heroTouchStartY.current;
  };

  const handleHeroTouchEnd = () => {
    const swipeThreshold = 50;
    const isHorizontalSwipe =
      Math.abs(heroTouchDeltaX.current) > Math.abs(heroTouchDeltaY.current);

    if (
      isHorizontalSwipe &&
      Math.abs(heroTouchDeltaX.current) > swipeThreshold
    ) {
      setHeroBanner((prev) => {
        if (heroTouchDeltaX.current < 0) {
          return (prev + 1) % heroBanners.length;
        }

        return (prev - 1 + heroBanners.length) % heroBanners.length;
      });
    }

    heroTouchStartX.current = null;
    heroTouchStartY.current = null;
    heroTouchDeltaX.current = 0;
    heroTouchDeltaY.current = 0;
  };

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
    const fetchFlashDeals = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/flash-deals?limit=10`);
        const payload = await response.json();
        if (response.ok && payload.status === "success") {
          setFlashDeals(payload.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch flash deals:", err);
      } finally {
        setFlashDealsLoading(false);
      }
    };
    fetchFlashDeals();
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
    if (flashDeals.length === 0) return;

    const minSeconds = Math.min(
      ...flashDeals.map((d) => d.timeTillValidSeconds),
    );
    setCountdown({
      h: Math.floor(minSeconds / 3600),
      m: Math.floor((minSeconds % 3600) / 60),
      s: minSeconds % 60,
    });

    const tick = setInterval(() => {
      setCountdown((prev) => {
        const total = prev.h * 3600 + prev.m * 60 + prev.s - 1;
        if (total <= 0) return { h: 0, m: 0, s: 0 };
        return {
          h: Math.floor(total / 3600),
          m: Math.floor((total % 3600) / 60),
          s: total % 60,
        };
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [flashDeals]);

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
              className="relative overflow-hidden w-full lg:flex-[60] shadow-sm touch-pan-y"
              style={{ height: "400px" }}
              onTouchStart={handleHeroTouchStart}
              onTouchMove={handleHeroTouchMove}
              onTouchEnd={handleHeroTouchEnd}
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
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-3xl sm:text-6xl font-black text-black uppercase tracking-tighter leading-none">
                  Flash{" "}
                  <span className="text-red-600 underline decoration-black decoration-4 underline-offset-8">
                    Deals
                  </span>
                </h2>
                <p className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest mt-6">
                  Limited time &mdash; grab them before they&apos;re gone
                </p>
              </div>
              <Link
                href="/products"
                className="text-[10px] font-black uppercase tracking-widest text-black border-b-2 border-red-600 pb-0.5 hover:text-red-600 hover:border-black transition-all"
              >
                View All Catalogue
              </Link>
            </div>
            {/* Horizontal scroll strip */}
            <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
              {flashDealsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-none w-[185px] h-[320px] bg-[var(--bg-sunken)] animate-pulse rounded-none"
                  />
                ))
              ) : flashDeals.length > 0 ? (
                flashDeals.map((deal) => (
                  <div key={deal.id} className="flex-none w-[185px]">
                    <FlashDealCard deal={deal} />
                  </div>
                ))
              ) : (
                <div className="w-full py-10 text-center text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] border-2 border-dashed border-[var(--border-default)]">
                  No active flash deals at the moment.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── SHOP BY CATEGORY ── */}
        <section
          id="categories"
          className="py-10 sm:py-14 bg-white border-y border-[var(--border-default)]"
        >
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
              <div>
                <h2 className="text-3xl sm:text-6xl font-black text-black tracking-tighter uppercase leading-none whitespace-nowrap">
                  Shop by{" "}
                  <span className="text-red-600 underline decoration-black decoration-4 underline-offset-8">
                    Category
                  </span>
                </h2>
                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mt-6">
                  Curated collections from across the country
                </p>
              </div>
              <Link
                href="/products"
                className="group flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-black"
              >
                Browse All
                <div className="w-10 h-10 rounded-full border-2 border-black flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                  <ArrowRight size={16} />
                </div>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {categories.map((cat) => (
                <Link
                  key={cat.name}
                  href={`/products?category=${encodeURIComponent(cat.name)}`}
                  className="group relative flex flex-col bg-zinc-50 border border-transparent hover:border-black transition-all duration-500 overflow-hidden"
                >
                  <div className="aspect-[16/9] relative overflow-hidden bg-zinc-100">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                  </div>
                  <div className="p-5 flex items-center justify-between bg-white border-t border-[var(--border-default)] group-hover:bg-black transition-colors duration-300">
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-black uppercase tracking-widest group-hover:text-white transition-colors">
                        {cat.name}
                      </h3>
                      <p className="text-[9px] font-bold text-red-600 group-hover:text-red-400 transition-colors">
                        Explore Collection
                      </p>
                    </div>
                    <ArrowRight
                      size={14}
                      className="text-black group-hover:text-white transition-colors group-hover:translate-x-1 duration-300"
                    />
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
                <h2 className="text-3xl sm:text-6xl font-black text-[var(--text-primary)] tracking-tighter leading-none">
                  Trending{" "}
                  <span className="text-red-600 underline decoration-black decoration-4 underline-offset-8">
                    Now
                  </span>
                </h2>
                <p className="text-[var(--text-secondary)] mt-6 text-sm">
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
                    <ProductCard
                      product={
                        {
                          ...product,
                          images: [product.imageUrl],
                          vendorName: product.vendor,
                          reviewCount: product.reviews,
                          stock: 10, // Mock stock for homepage
                          category: "General",
                          subcategory: "General",
                          updatedAt: new Date().toISOString(),
                          createdAt: new Date().toISOString(),
                        } as any
                      }
                    />
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
                <h2 className="text-3xl sm:text-6xl font-black text-[var(--text-primary)] tracking-tighter leading-none">
                  New{" "}
                  <span className="text-red-600 underline decoration-black decoration-4 underline-offset-8">
                    Arrivals
                  </span>
                </h2>
                <p className="text-[var(--text-secondary)] mt-6 text-sm">
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
                <div key={product.id} className="flex-none w-[185px]">
                  <ProductCard
                    product={
                      {
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        originalPrice: product.originalPrice,
                        rating: product.rating,
                        reviewCount: product.reviews,
                        vendorName: product.vendor,
                        images: ["/placeholder-product-1.jpg"],
                        stock: 10,
                        category: "General",
                        subcategory: "General",
                        updatedAt: new Date().toISOString(),
                        createdAt: new Date().toISOString(),
                        featured: true,
                      } as any
                    }
                  />
                </div>
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
              <h2 className="text-3xl sm:text-6xl font-black text-[var(--text-primary)] tracking-tighter leading-none">
                What Our Trusted Users Say
              </h2>
              <p className="text-[var(--text-secondary)] mt-6 text-sm">
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
        {showCustomerCta && (
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
