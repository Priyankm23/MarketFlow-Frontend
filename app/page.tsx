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
    <Link href={`/products/${product.id}`} className="block h-full">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col group">
        <div className="aspect-square relative bg-[var(--bg-sunken)] flex items-center justify-center overflow-hidden">
          <span style={{ fontSize: "3.5rem" }}>{product.emoji}</span>
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
            <Sparkles className="w-3.5 h-3.5 text-[var(--brand-accent)]" />
            Empowering 2,000+ Local Vendors
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
        <section id="categories" className="py-24 bg-[var(--bg-sunken)]">
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
        <section id="trending" className="py-24">
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {trendingProducts.map((product) => (
                <ProductCardSection key={product.id} product={product} />
              ))}
            </div>
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
              {featuredVendors.map((vendor) => (
                <div
                  key={vendor.name}
                  className="p-8 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-base)] text-center group hover:border-[var(--brand-primary)] transition-colors"
                >
                  <div className="w-16 h-16 rounded-2xl bg-[var(--brand-primary)] text-[var(--text-inverse)] flex items-center justify-center mx-auto text-xl font-bold mb-4 shadow-sm">
                    {vendor.initials}
                  </div>
                  <h3 className="text-lg font-normal text-[var(--text-primary)] font-body">
                    {vendor.name}
                  </h3>
                  <div className="flex items-center justify-center gap-1 mt-2 mb-4">
                    <Star
                      size={14}
                      className="fill-[var(--brand-primary)] text-[var(--brand-primary)]"
                    />
                    <span className="text-sm font-bold text-[var(--text-primary)]">
                      {vendor.rating}
                    </span>
                    <span className="text-xs text-[var(--text-muted)] ml-1">
                      Rating
                    </span>
                  </div>
                  {vendor.verified && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--status-success-bg)] text-[var(--status-success)] text-[10px] font-bold uppercase tracking-wider">
                      <BadgeCheck size={12} />
                      Verified Vendor
                    </div>
                  )}
                </div>
              ))}
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
