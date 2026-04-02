"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  Bell,
  ChevronDown,
  Smartphone,
  Shirt,
  Home,
  Dumbbell,
  BookOpen,
  Sparkles,
  Utensils,
  Gamepad2,
} from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { useCartStore } from "@/lib/store";

const categories = [
  {
    name: "Electronics",
    icon: Smartphone,
    href: `/products?category=${encodeURIComponent("Electronics")}`,
  },
  {
    name: "Fashion",
    icon: Shirt,
    href: `/products?category=${encodeURIComponent("Fashion")}`,
  },
  {
    name: "Home",
    icon: Home,
    href: `/products?category=${encodeURIComponent("Home")}`,
  },
  {
    name: "Sports",
    icon: Dumbbell,
    href: `/products?category=${encodeURIComponent("Sports")}`,
  },
  {
    name: "Books",
    icon: BookOpen,
    href: `/products?category=${encodeURIComponent("Books")}`,
  },
  {
    name: "Beauty",
    icon: Sparkles,
    href: `/products?category=${encodeURIComponent("Beauty")}`,
  },
  {
    name: "Food",
    icon: Utensils,
    href: `/products?category=${encodeURIComponent("Food")}`,
  },
  {
    name: "Toys",
    icon: Gamepad2,
    href: `/products?category=${encodeURIComponent("Toys")}`,
  },
];

export function Navbar() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const fetchCart = useCartStore((state) => state.fetchCart);
  const cartItems = useCartStore((state) => state.items.length);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const categoryPillsRef = React.useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const bottomNavPills = [
    { label: "For You", href: "/products" },
    {
      label: "Electronics",
      href: `/products?category=${encodeURIComponent("Electronics")}`,
    },
    {
      label: "Fashion",
      href: `/products?category=${encodeURIComponent("Fashion")}`,
    },
    {
      label: "Home & Living",
      href: `/products?category=${encodeURIComponent("Home & Living")}`,
    },
    {
      label: "Sports",
      href: `/products?category=${encodeURIComponent("Sports")}`,
    },
    {
      label: "Books",
      href: `/products?category=${encodeURIComponent("Books")}`,
    },
    {
      label: "Beauty",
      href: `/products?category=${encodeURIComponent("Beauty")}`,
    },
    {
      label: "Food & Gourmet",
      href: `/products?category=${encodeURIComponent("Food & Gourmet")}`,
    },
    {
      label: "Toys & Games",
      href: `/products?category=${encodeURIComponent("Toys & Games")}`,
    },
    { label: "Trending Now", href: "/trending" },
    { label: "New Arrivals", href: "/new-arrivals" },
    { label: "Today's Deals", href: "/deals" },
  ];

  const isCustomerRole =
    !user ||
    user.role === "customer" ||
    String(user.role).toLowerCase() === "user";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) router.push(`/products?search=${encodeURIComponent(q)}`);
  };

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    void fetchCart();
  }, [fetchCart, user?.id, user?.role]);

  React.useEffect(() => {
    const container = categoryPillsRef.current;
    if (!container) {
      return;
    }

    const isReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (isReducedMotion) {
      return;
    }

    const groupSize = 3;
    const totalGroups = Math.ceil(bottomNavPills.length / groupSize);

    if (totalGroups <= 1) {
      return;
    }

    const groupStarts = Array.from(
      { length: totalGroups },
      (_, index) => index * groupSize,
    );
    // Example for 12 links: 0,3,6,9 then back 6,3.
    const mobileSequence =
      groupStarts.length > 1
        ? [...groupStarts, ...groupStarts.slice(1, -1).reverse()]
        : groupStarts;
    let sequenceCursor = 0;

    const scrollToPillIndex = (pillIndex: number) => {
      const isMobileViewport = window.matchMedia("(max-width: 767px)").matches;

      if (!isMobileViewport) {
        container.scrollTo({ left: 0, behavior: "smooth" });
        sequenceCursor = 0;
        return;
      }

      const linkElement = container.querySelector<HTMLAnchorElement>(
        `a[data-pill-index='${pillIndex}']`,
      );

      if (!linkElement) {
        return;
      }

      const containerLeft = container.getBoundingClientRect().left;
      const linkLeft = linkElement.getBoundingClientRect().left;
      const delta = linkLeft - containerLeft;

      container.scrollTo({
        left: container.scrollLeft + delta,
        behavior: "smooth",
      });
    };

    // Keep the first three links visible initially on mobile.
    scrollToPillIndex(0);

    const intervalId = window.setInterval(() => {
      sequenceCursor = (sequenceCursor + 1) % mobileSequence.length;
      scrollToPillIndex(mobileSequence[sequenceCursor]);
    }, 4800);

    const handleResize = () => {
      if (!window.matchMedia("(max-width: 767px)").matches) {
        container.scrollTo({ left: 0, behavior: "smooth" });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("resize", handleResize);
    };
  }, [bottomNavPills.length]);

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const getDashboardLink = () => {
    if (!user) return "/login";
    switch (user.role) {
      case "vendor":
        return "/vendor/dashboard";
      case "delivery":
        return "/delivery/tasks";
      case "admin":
        return "/admin/dashboard";
      default:
        return "/customer/dashboard";
    }
  };

  return (
    <nav
      id="main-nav"
      className="sticky top-0 z-50"
      style={{
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--border-default)",
      }}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 sm:h-[72px] gap-2 sm:gap-4">
          {/* Logo */}
          <Link
            href="/"
            id="logo"
            className="flex items-center shrink-0"
            style={{ textDecoration: "none" }}
          >
            <h2
              className="!text-[2rem] sm:!text-[2.25rem] !leading-none"
              style={{
                fontFamily: "var(--font-instrument-serif)",
                color: "var(--brand-accent)",
                letterSpacing: "0.02em",
                fontWeight: "normal",
              }}
            >
              MarketFlow
            </h2>
          </Link>

          {/* Category Dropdown */}
          <div className="relative hidden lg:block ml-4">
            <button
              id="category-menu-btn"
              onClick={() => setCategoryMenuOpen(!categoryMenuOpen)}
              onBlur={() => setTimeout(() => setCategoryMenuOpen(false), 200)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-[var(--brand-accent-soft)] transition-colors"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "16px",
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              <Menu className="w-5 h-5 text-[var(--brand-accent)]" />
              Categories
              <ChevronDown className="w-4 h-4 opacity-50" />
            </button>

            {categoryMenuOpen && (
              <div
                className="absolute left-0 mt-1 w-56 rounded-xl py-2 z-50 shadow-lg"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                  animation: "fadeInUp .15s ease",
                }}
              >
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <Link
                      key={cat.name}
                      href={cat.href}
                      className="flex items-center gap-3 px-4 py-2.5"
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "16px",
                        fontWeight: 500,
                        color: "var(--text-secondary)",
                        transition: "color .15s, background .15s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "var(--text-primary)";
                        e.currentTarget.style.background = "var(--bg-sunken)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "var(--text-secondary)";
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <Icon className="w-4 h-4" />
                      {cat.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Search Bar */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-xl mx-8"
          >
            <div className="w-full relative">
              <input
                id="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for products, brands, vendors..."
                className="w-full pl-11 pr-4 py-2.5 outline-none"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "16px",
                  fontWeight: 400,
                  background: "var(--bg-sunken)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "99px",
                  color: "var(--text-primary)",
                  transition: "border-color .2s",
                }}
              />
              <button
                type="submit"
                className="absolute left-4 top-1/2 -translate-y-1/2"
              >
                <Search
                  className="w-5 h-5"
                  style={{ color: "var(--text-muted)" }}
                />
              </button>
            </div>
          </form>

          {/* Right Actions */}
          <div className="ml-auto flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Notifications */}
            {user && (
              <button
                id="notifications-btn"
                className="hidden sm:inline-flex p-2 rounded-lg relative text-[var(--text-secondary)] hover:bg-[var(--bg-sunken)] hover:text-[var(--text-primary)]"
              >
                <Bell className="w-5 h-5" />
                <span
                  className="absolute top-2 right-2 w-2 h-2 rounded-full"
                  style={{ background: "var(--brand-accent)" }}
                />
              </button>
            )}

            {/* Cart */}
            {isCustomerRole && (
              <Link
                href="/customer/cart"
                id="cart-btn"
                onClick={() => {
                  void fetchCart();
                }}
                className="inline-flex p-2 rounded-lg relative text-[var(--text-secondary)] hover:bg-[var(--bg-sunken)] hover:text-[var(--text-primary)]"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartItems > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 w-5 h-5 text-[10px] rounded-full flex items-center justify-center font-bold"
                    style={{
                      background: "var(--brand-primary)",
                      color: "var(--text-inverse)",
                    }}
                  >
                    {cartItems}
                  </span>
                )}
              </Link>
            )}

            {/* User Menu */}
            {mounted &&
              (user ? (
                <div className="relative">
                  <Link
                    href={getDashboardLink()}
                    className="sm:hidden inline-flex p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-sunken)] hover:text-[var(--text-primary)]"
                    aria-label="Open dashboard"
                  >
                    <User className="w-5 h-5" />
                  </Link>

                  <button
                    id="user-menu-btn"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="hidden sm:flex p-1 rounded-full items-center gap-2 border border-[var(--border-default)]"
                  >
                    <div className="w-8 h-8 rounded-full bg-[var(--bg-sunken)] flex items-center justify-center overflow-hidden">
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                        alt="avatar"
                      />
                    </div>
                  </button>

                  {userMenuOpen && (
                    <div
                      className="hidden sm:block absolute right-0 mt-2 w-52 rounded-xl py-2 shadow-lg z-50"
                      style={{
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border-default)",
                        animation: "fadeInUp .15s ease",
                      }}
                    >
                      <Link
                        href="/profile"
                        className="block px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-sunken)] hover:text-[var(--text-primary)]"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Your Account
                      </Link>
                      <Link
                        href="/customer/orders"
                        className="block px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-sunken)] hover:text-[var(--text-primary)]"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        My Orders
                      </Link>{" "}
                      <div className="h-px bg-[var(--border-default)] my-1" />
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-[var(--status-error)] hover:bg-[var(--status-error-bg)]"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    id="login-btn"
                    className="sm:hidden inline-flex p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-sunken)] hover:text-[var(--text-primary)]"
                    aria-label="Login"
                  >
                    <User className="w-5 h-5" />
                  </Link>
                  <Link
                    href="/login"
                    className="px-4 py-2 hidden sm:inline-flex text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    id="signup-btn"
                    className="px-4 py-2 hidden sm:inline-flex items-center gap-1.5 text-sm font-medium border border-[var(--border-strong)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-sunken)] transition-colors"
                  >
                    Sign Up
                  </Link>
                  <Link
                    href="/vendor/apply"
                    id="become-vendor-btn"
                    className="px-4 py-2 hidden sm:inline-flex items-center gap-1.5 text-sm font-medium bg-[var(--brand-primary)] text-[var(--text-inverse)] rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Sell on MarketFlow
                  </Link>
                </div>
              ))}

            {/* Mobile Menu Toggle */}
            <button
              id="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-sunken)]"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden pb-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2.5 outline-none"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "16px",
                  background: "#F6F5FF",
                  border: "1px solid #E0DEFB",
                  borderRadius: "8px",
                  color: "#1A1A2E",
                }}
              />
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: "#9CA3AF" }}
              />
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div
            className="md:hidden pb-4 space-y-1"
            style={{ animation: "fadeInUp .15s ease" }}
          >
            <Link
              href="/products"
              className="block px-4 py-2.5 rounded-lg"
              onClick={closeMobileMenu}
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "16px",
                fontWeight: 500,
                color: "#3D3D4E",
              }}
            >
              All Products
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={cat.href}
                className="block px-4 py-2.5 rounded-lg"
                onClick={closeMobileMenu}
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "16px",
                  fontWeight: 500,
                  color: "#6B7280",
                }}
              >
                {cat.name}
              </Link>
            ))}
            {mounted && !user && (
              <>
                <Link
                  href="/login"
                  onClick={closeMobileMenu}
                  className="block px-4 py-2.5 rounded-lg"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "16px",
                    fontWeight: 500,
                    color: "#4F46E5",
                  }}
                >
                  Login
                </Link>
                <Link
                  href="/vendor/apply"
                  onClick={closeMobileMenu}
                  className="block px-4 py-2.5 rounded-lg"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "16px",
                    fontWeight: 500,
                    color: "#3D3D4E",
                  }}
                >
                  Become a Vendor
                </Link>
              </>
            )}

            {mounted && user && (
              <>
                <div className="h-px bg-[var(--border-default)] my-1" />
                <Link
                  href="/profile"
                  onClick={closeMobileMenu}
                  className="block px-4 py-2.5 rounded-lg text-sm font-black uppercase tracking-widest text-black hover:bg-[var(--bg-sunken)]"
                >
                  Your Account
                </Link>
                <Link
                  href="/customer/orders"
                  onClick={closeMobileMenu}
                  className="block px-4 py-2.5 rounded-lg text-sm font-black uppercase tracking-widest text-black hover:bg-[var(--bg-sunken)]"
                >
                  My Orders
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 rounded-lg"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "16px",
                    fontWeight: 500,
                    color: "var(--status-error)",
                  }}
                >
                  Logout
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── CATEGORY PILLS BAR ── */}
      <div
        ref={categoryPillsRef}
        className="border-t border-[var(--border-default)] overflow-x-auto scrollbar-hide"
        style={{ background: "var(--bg-surface)" }}
      >
        <div className="flex items-center gap-0 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
          {bottomNavPills.map((pill, index) => (
            <Link
              key={pill.label}
              href={pill.href}
              data-pill-index={index}
              className="shrink-0 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors hover:text-[var(--text-primary)] border-b-2 border-transparent hover:border-[var(--brand-primary)]"
              style={{ color: "var(--text-secondary)" }}
            >
              {pill.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
