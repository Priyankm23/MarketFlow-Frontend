"use client";

import React from "react";
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
} from "lucide-react";
import "./hero-illustration.css";

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

const trendingProducts = [
  {
    id: "1",
    name: "Premium Wireless Headphones",
    vendor: "TechHub",
    price: 4999,
    originalPrice: 7999,
    rating: 4.5,
    reviews: 328,
    badge: "Trending",
    emoji: "🎧",
  },
  {
    id: "2",
    name: "Cotton Crew T-Shirt",
    vendor: "StyleWear",
    price: 599,
    originalPrice: 999,
    rating: 4.2,
    reviews: 215,
    badge: "Best Seller",
    emoji: "👕",
  },
  {
    id: "3",
    name: "Stainless Steel Bottle",
    vendor: "HomeEssentials",
    price: 1299,
    originalPrice: 1999,
    rating: 4.7,
    reviews: 456,
    badge: null,
    emoji: "🍶",
  },
  {
    id: "4",
    name: "Running Shoes Pro",
    vendor: "SportGear",
    price: 3499,
    originalPrice: 5999,
    rating: 4.4,
    reviews: 289,
    badge: "Hot Deal",
    emoji: "👟",
  },
];

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

function ProductCardSection({
  product,
}: {
  product: (typeof trendingProducts)[0];
}) {
  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100,
      )
    : 0;

  return (
    <Link href={`/products/${product.id}`} className="block">
      <div className="mf-product-card group">
        <div className="mf-product-image">
          <span style={{ fontSize: "3.5rem" }}>{product.emoji}</span>
          {product.badge && (
            <span className="mf-product-badge">{product.badge}</span>
          )}
          {discount > 0 && (
            <span className="mf-product-discount-badge">-{discount}%</span>
          )}
          <div className="mf-product-actions">
            <button
              className="mf-product-action-btn"
              style={{ background: "#4F46E5", color: "#fff" }}
              onClick={(e) => e.preventDefault()}
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
            <button
              className="mf-product-action-btn"
              style={{
                background: "#fff",
                color: "#3D3D4E",
                border: "1px solid #E0DEFB",
              }}
              onClick={(e) => e.preventDefault()}
            >
              <Heart className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="mf-product-info">
          <div>
            <p className="mf-product-vendor">{product.vendor}</p>
            <h3 className="mf-product-title">{product.name}</h3>
            <div className="mf-product-rating">
              <span className="mf-product-stars">
                {"★".repeat(Math.floor(product.rating))}
                {"☆".repeat(5 - Math.floor(product.rating))}
              </span>
              <span className="mf-product-review-count">
                {product.rating} ({product.reviews})
              </span>
            </div>
          </div>
          <div className="mf-product-price-row">
            <span className="mf-product-price">
              ₹{product.price.toLocaleString()}
            </span>
            {product.originalPrice && (
              <span className="mf-product-original-price">
                ₹{product.originalPrice.toLocaleString()}
              </span>
            )}
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
  return (
    <div style={{ background: "#F6F5FF" }}>
      <Navbar />

      {/* ── HERO ── */}
      <section id="hero" className="hero-section">
        <div className="hero-container">
          <div className="hero-left hero-left-visible">
            <div
              className="hero-eyebrow !bg-transparent !border-indigo-100 !px-4 !py-1.5"
              style={{
                color: "#4F46E5",
                fontWeight: 600,
                letterSpacing: "0.04em",
              }}
            >
              <Sparkles className="w-4 h-4 text-indigo-500 mr-1" />
              TRUSTED BY 50,000+ CUSTOMERS
            </div>

            <h1
              className="hero-headline !text-[3.15rem] sm:!text-[4.45rem] !leading-[0.98]"
              style={{
                fontFamily: "'Fraunces', Georgia, serif",
                fontWeight: 200,
                letterSpacing: "-0.03em",
              }}
            >
              Where Local Shops
              <br />
              <span
                className="hero-headline-accent block !italic"
                style={{
                  color: "#4F46E5",
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontWeight: 200,
                }}
              >
                Become Global
                <br className="hidden sm:block" />
                Brand
              </span>
            </h1>

            <p className="hero-subheadline !text-lg sm:!text-[1.15rem] !max-w-[500px] !leading-relaxed">
              Empowering India's local vendors by bringing their authentic
              products to your doorstep. Experience the charm of local markets
              from the comfort of your home.
            </p>

            <div className="hero-cta-group !mt-2">
              <Link
                href="/products"
                className="hero-btn-primary !px-8 !py-4 rounded-xl !text-[16px]"
              >
                Start Shopping
                <ArrowRight className="hero-btn-icon ml-1" />
              </Link>
              <Link
                href="/vendor/apply"
                className="hero-btn-secondary !px-8 !py-4 rounded-xl !text-[16px]"
              >
                Become a Vendor
              </Link>
            </div>

            <div className="hero-trust-badges !mt-4 !gap-6">
              <div className="hero-trust-item !text-[13px] !text-slate-600">
                <div className="hero-trust-check !w-4 !h-4 !text-[8px] bg-green-50 text-green-600 border border-green-200">
                  ✓
                </div>
                Verified Shops
              </div>
              <div className="hero-trust-item !text-[13px] !text-slate-600">
                <div className="hero-trust-check !w-4 !h-4 !text-[8px] bg-green-50 text-green-600 border border-green-200">
                  ✓
                </div>
                Secure Payments
              </div>
              <div className="hero-trust-item !text-[13px] !text-slate-600">
                <div className="hero-trust-check !w-4 !h-4 !text-[8px] bg-green-50 text-green-600 border border-green-200">
                  ✓
                </div>
                Fast Local Delivery
              </div>
            </div>
          </div>

          <div className="hero-right hero-right-visible hero-right-fade">
            <HeroCarousel />
            <div className="hero-stats hero-right-stats !gap-8 w-full border-t border-slate-200/60">
              <div className="hero-stat">
                <span className="hero-stat-value !text-2xl">
                  10k+{" "}
                  <span className="text-slate-500 font-body text-base font-normal">
                    Products
                  </span>
                </span>
              </div>
              <div className="hero-stat-divider !h-8" />
              <div className="hero-stat">
                <span className="hero-stat-value !text-2xl">
                  2k+{" "}
                  <span className="text-slate-500 font-body text-base font-normal">
                    Vendors
                  </span>
                </span>
              </div>
              <div className="hero-stat-divider !h-8" />
              <div className="hero-stat">
                <span className="hero-stat-value !text-2xl">
                  <Star
                    className="w-5 h-5 inline text-yellow-500 mb-1"
                    fill="currentColor"
                  />{" "}
                  4.9/5{" "}
                  <span className="text-slate-500 font-body text-base font-normal">
                    Rating
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SHOP BY CATEGORY ── */}
      <section
        id="categories"
        style={{ padding: "40px 0 80px", background: "#F5F3EE" }}
      >
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="section-heading">Shop by Category</h2>
              <p className="section-subheading">
                Explore curated collections from verified vendors
              </p>
            </div>
            <Link
              href="/products"
              className="hidden sm:inline-flex items-center gap-1"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "14px",
                fontWeight: 500,
                color: "#4F46E5",
              }}
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={`/products?category=${encodeURIComponent(cat.name)}`}
                className="category-card"
                style={{ border: "1px solid #E8E4DC" }}
              >
                <div
                  className="category-card-image"
                  style={{
                    height: "140px",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cat.image}
                    alt={cat.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transition: "transform .4s ease",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(to top, rgba(0,0,0,.15) 0%, transparent 50%)",
                      pointerEvents: "none",
                    }}
                  />
                </div>
                <div className="category-card-info">
                  <div className="category-card-name">{cat.name}</div>
                  <div className="category-card-desc">{cat.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRENDING PRODUCTS ── */}
      <section
        id="trending-products"
        style={{ padding: "80px 0", background: "#FFFFFF" }}
      >
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="section-heading">Trending Products</h2>
              <p className="section-subheading">
                Most loved by our community this week
              </p>
            </div>
            <Link
              href="/products?sort=trending"
              className="hidden sm:inline-flex items-center gap-1"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "14px",
                fontWeight: 500,
                color: "#4F46E5",
              }}
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {trendingProducts.map((product) => (
              <ProductCardSection key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* ── VENDOR SPOTLIGHT ── */}
      <section
        id="featured-vendors"
        style={{ padding: "80px 0", background: "#F6F5FF" }}
      >
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="section-heading">Vendor Spotlight</h2>
              <p className="section-subheading">
                Trusted vendors bringing local shops online
              </p>
            </div>
            <Link
              href="/vendors"
              className="hidden sm:inline-flex items-center gap-1"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "14px",
                fontWeight: 500,
                color: "#4F46E5",
              }}
            >
              All Vendors <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredVendors.map((vendor) => (
              <div key={vendor.name} className="vendor-card">
                <div className="vendor-logo">{vendor.initials}</div>
                <div className="vendor-name">{vendor.name}</div>
                <div className="vendor-rating">
                  <Star
                    className="w-4 h-4"
                    style={{ fill: "#CA8A04", color: "#CA8A04" }}
                  />
                  <span style={{ fontWeight: 600, color: "#1A1A2E" }}>
                    {vendor.rating}
                  </span>
                </div>
                <div className="vendor-products-count">
                  {vendor.products} products
                </div>
                {vendor.verified && (
                  <div className="vendor-verified">
                    <BadgeCheck className="w-3.5 h-3.5" />
                    Verified Vendor
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NEW ARRIVALS ── */}
      <section
        id="new-arrivals"
        style={{ padding: "80px 0", background: "#FFFFFF" }}
      >
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="section-heading">New Arrivals</h2>
              <p className="section-subheading">
                Fresh picks just added to the marketplace
              </p>
            </div>
            <Link
              href="/products?sort=newest"
              className="hidden sm:inline-flex items-center gap-1"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "14px",
                fontWeight: 500,
                color: "#4F46E5",
              }}
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {newArrivals.map((product) => (
              <ProductCardSection key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* ── POPULAR COLLECTIONS ── */}
      <section
        id="collections"
        style={{ padding: "80px 0", background: "#F6F5FF" }}
      >
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-heading text-center mb-10">
            Popular Collections
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div
              className="rounded-2xl p-8 flex flex-col justify-end min-h-[240px] relative overflow-hidden cursor-pointer group"
              style={{ background: "#4F46E5" }}
            >
              <div
                className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-15"
                style={{
                  background:
                    "radial-gradient(circle, #fff 0%, transparent 70%)",
                  transform: "translate(30%, -30%)",
                }}
              />
              <span
                className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium mb-3 w-fit"
                style={{
                  background: "rgba(255,255,255,.15)",
                  color: "#fff",
                  fontFamily: "var(--font-body)",
                  fontSize: "10px",
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                🔥 Hot Deals
              </span>
              <h3
                className="text-2xl font-bold text-white mb-2"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Tech Essentials
              </h3>
              <p
                className="text-white/70 mb-4 max-w-xs"
                style={{ fontFamily: "var(--font-body)", fontSize: "15px" }}
              >
                Up to 40% off on headphones, smartwatches, and accessories
              </p>
              <Link
                href={`/products?category=${encodeURIComponent("Electronics")}`}
                className="inline-flex items-center gap-1 text-white font-medium group-hover:gap-2 transition-all"
                style={{ fontFamily: "var(--font-body)", fontSize: "14px" }}
              >
                Shop Now <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            <div
              className="rounded-2xl p-8 flex flex-col justify-end min-h-[240px] relative overflow-hidden cursor-pointer group"
              style={{ background: "#3730A3" }}
            >
              <div
                className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-15"
                style={{
                  background:
                    "radial-gradient(circle, #fff 0%, transparent 70%)",
                  transform: "translate(30%, -30%)",
                }}
              />
              <span
                className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium mb-3 w-fit"
                style={{
                  background: "rgba(255,255,255,.15)",
                  color: "#fff",
                  fontFamily: "var(--font-body)",
                  fontSize: "10px",
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                ✨ Trending
              </span>
              <h3
                className="text-2xl font-bold text-white mb-2"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Fashion Forward
              </h3>
              <p
                className="text-white/70 mb-4 max-w-xs"
                style={{ fontFamily: "var(--font-body)", fontSize: "15px" }}
              >
                Latest styles from local designers and fashion vendors
              </p>
              <Link
                href={`/products?category=${encodeURIComponent("Fashion")}`}
                className="inline-flex items-center gap-1 text-white font-medium group-hover:gap-2 transition-all"
                style={{ fontFamily: "var(--font-body)", fontSize: "14px" }}
              >
                Explore <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BENEFITS ── */}
      <section
        id="trust-benefits"
        style={{ padding: "80px 0", background: "#FFFFFF" }}
      >
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-heading text-center mb-3">
            Why Choose MarketFlow?
          </h2>
          <p className="section-subheading text-center mb-12 max-w-lg mx-auto">
            We bridge offline commerce and online convenience with trust at the
            core
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {trustBenefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div key={benefit.title} className="trust-benefit">
                  <div className="trust-benefit-icon">
                    <Icon className="w-7 h-7" style={{ color: "#4F46E5" }} />
                  </div>
                  <div className="trust-benefit-title">{benefit.title}</div>
                  <div className="trust-benefit-desc">{benefit.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section
        id="testimonials"
        style={{ padding: "80px 0", background: "#F6F5FF" }}
      >
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-heading text-center mb-3">
            What Our Community Says
          </h2>
          <p className="section-subheading text-center mb-12 max-w-lg mx-auto">
            Real stories from customers and vendors on MarketFlow
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="testimonial-card">
                <div className="testimonial-stars">★★★★★</div>
                <p className="testimonial-text">{t.text}</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">{t.initials}</div>
                  <div className="testimonial-author-info">
                    <div className="name">{t.name}</div>
                    <div className="role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VENDOR CTA ── */}
      <section
        id="vendor-cta"
        style={{ padding: "80px 0", background: "#4F46E5" }}
      >
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2
                className="text-3xl sm:text-4xl font-bold text-white mb-4"
                style={{
                  fontFamily: "var(--font-heading)",
                  letterSpacing: "-0.02em",
                }}
              >
                Ready to Bring Your Shop Online?
              </h2>
              <p
                className="text-white/70 text-lg mb-6 max-w-lg"
                style={{
                  fontFamily: "var(--font-body)",
                  lineHeight: 1.7,
                  maxWidth: "480px",
                }}
              >
                Join thousands of successful vendors on MarketFlow. Get access
                to millions of customers, powerful analytics, and grow your
                revenue — all without any upfront costs.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/vendor/apply"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "15px",
                    fontWeight: 500,
                    background: "#fff",
                    color: "#4F46E5",
                    transition: "transform .2s",
                  }}
                >
                  Apply as a Vendor
                </Link>
                <Link
                  href="/vendor/learn-more"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "15px",
                    fontWeight: 500,
                    background: "transparent",
                    color: "#fff",
                    border: "1.5px solid rgba(255,255,255,.3)",
                    transition: "background .2s",
                  }}
                >
                  Learn More <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {[
                { value: "2,000+", label: "Active Vendors", icon: Store },
                { value: "50k+", label: "Happy Customers", icon: Users },
                { value: "3x", label: "Revenue Growth", icon: ArrowUpRight },
                { value: "₹0", label: "Setup Cost", icon: CreditCard },
              ].map((stat) => {
                const StatIcon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="rounded-xl p-5"
                    style={{
                      background: "rgba(255,255,255,.08)",
                      border: "1px solid rgba(255,255,255,.12)",
                    }}
                  >
                    <StatIcon className="w-5 h-5 text-white/50 mb-2" />
                    <div
                      className="text-2xl font-bold text-white"
                      style={{
                        fontFamily: "var(--font-heading)",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {stat.value}
                    </div>
                    <div
                      className="text-sm text-white/50"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      {stat.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER ── */}
      <section
        id="newsletter"
        style={{ padding: "80px 0", background: "#F6F5FF" }}
      >
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="rounded-2xl p-8 sm:p-12 text-center"
            style={{ background: "#FFFFFF", border: "1px solid #E0DEFB" }}
          >
            <div
              className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center"
              style={{ background: "#EDEDFD" }}
            >
              <Mail className="w-7 h-7" style={{ color: "#4F46E5" }} />
            </div>
            <h2
              className="text-2xl sm:text-3xl font-bold mb-3"
              style={{
                fontFamily: "var(--font-heading)",
                color: "#1A1A2E",
                letterSpacing: "-0.02em",
              }}
            >
              Join the MarketFlow Community
            </h2>
            <p
              className="mb-6 max-w-md mx-auto"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "15px",
                color: "#6B7280",
              }}
            >
              Get exclusive deals, new vendor announcements, and weekly curated
              picks delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <input
                type="email"
                placeholder="Enter your email address..."
                className="newsletter-input"
              />
              <button className="newsletter-btn">Subscribe</button>
            </div>
            <p className="text-xs mt-4" style={{ color: "#9CA3AF" }}>
              No spam, unsubscribe anytime. Join 20,000+ subscribers.
            </p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        id="footer"
        style={{ background: "#1A1A2E", color: "#fff", padding: "64px 0 32px" }}
      >
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center mb-4">
                <Image
                  src="/logo.png"
                  alt="MarketFlow Logo"
                  width={140}
                  height={40}
                  className="object-contain"
                />
              </div>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "14px",
                  lineHeight: 1.6,
                  color: "#6B7280",
                }}
              >
                Connecting offline vendors with online buyers. Discover products
                you&apos;ll love.
              </p>
            </div>

            {[
              {
                title: "About",
                items: ["About Us", "Careers", "Blog", "Press"],
              },
              {
                title: "For Customers",
                items: ["Help Center", "Track Order", "Returns", "Gift Cards"],
              },
              {
                title: "For Vendors",
                items: [
                  "Vendor Portal",
                  "Seller Guidelines",
                  "Vendor Support",
                  "Success Stories",
                ],
              },
              {
                title: "Legal",
                items: [
                  "Privacy Policy",
                  "Terms of Service",
                  "Cookie Policy",
                  "Contact Us",
                ],
              },
            ].map((col) => (
              <div key={col.title}>
                <h4
                  className="mb-4"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#9CA3AF",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {col.title}
                </h4>
                <ul className="space-y-2.5">
                  {col.items.map((item) => (
                    <li key={item}>
                      <Link
                        href="#"
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "14px",
                          color: "#6B7280",
                          transition: "color .15s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = "#fff")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color = "#6B7280")
                        }
                      >
                        {item}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div
            className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-4"
            style={{ borderTop: "1px solid #2A2A3E" }}
          >
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "13px",
                color: "#6B7280",
              }}
            >
              © 2026 MarketFlow. All rights reserved.
            </p>
            <div className="flex gap-5">
              {["Twitter", "Instagram", "Facebook", "LinkedIn"].map(
                (social) => (
                  <button
                    key={social}
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "13px",
                      color: "#6B7280",
                      transition: "color .15s",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "#6B7280")
                    }
                  >
                    {social}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
