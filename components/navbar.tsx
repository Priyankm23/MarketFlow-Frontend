"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
  const cartItems = useCartStore((state) => state.getTotalItems());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
  };

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
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-[72px] gap-4">
          {/* Logo */}
          <Link
            href="/"
            id="logo"
            className="flex items-center shrink-0"
            style={{ textDecoration: "none" }}
          >
            <h2 style={{ fontFamily: "var(--font-instrument-serif)", fontSize: "24px", color: "var(--brand-primary)", letterSpacing: "0.02em", fontWeight: "normal" }}>
              MarketFlow
            </h2>
          </Link>

          {/* Category Dropdown */}
          <div className="relative hidden lg:block ml-4">
            <button
              id="category-menu-btn"
              onClick={() => setCategoryMenuOpen(!categoryMenuOpen)}
              onBlur={() => setTimeout(() => setCategoryMenuOpen(false), 200)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "16px",
                fontWeight: 500,
                color: "var(--text-primary)",
                transition: "color .2s",
              }}
            >
              <Menu className="w-5 h-5" />
              Categories
              <ChevronDown className="w-4 h-4" />
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
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <div className="w-full relative">
              <input
                id="search-input"
                type="text"
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
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                style={{ color: "var(--text-muted)" }}
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Notifications */}
            {user && (
              <button
                id="notifications-btn"
                className="p-2 rounded-lg relative text-[var(--text-secondary)] hover:bg-[var(--bg-sunken)] hover:text-[var(--text-primary)]"
              >
                <Bell className="w-5 h-5" />
                <span
                  className="absolute top-2 right-2 w-2 h-2 rounded-full"
                  style={{ background: "var(--brand-accent)" }}
                />
              </button>
            )}

            {/* Cart */}
            {(!user || user.role === "customer") && (
              <Link
                href="/customer/cart"
                id="cart-btn"
                className="p-2 rounded-lg relative text-[var(--text-secondary)] hover:bg-[var(--bg-sunken)] hover:text-[var(--text-primary)]"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartItems > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 w-5 h-5 text-[10px] rounded-full flex items-center justify-center font-bold"
                    style={{ background: "var(--brand-primary)", color: "var(--text-inverse)" }}
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
                  <button
                    id="user-menu-btn"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="p-1 rounded-full flex items-center gap-2 border border-[var(--border-default)]"
                  >
                    <div className="w-8 h-8 rounded-full bg-[var(--bg-sunken)] flex items-center justify-center overflow-hidden">
                       <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} alt="avatar" />
                    </div>
                  </button>

                  {userMenuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-52 rounded-xl py-2 shadow-lg z-50"
                      style={{
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border-default)",
                        animation: "fadeInUp .15s ease",
                      }}
                    >
                      <Link
                        href={getDashboardLink()}
                        className="block px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-sunken)] hover:text-[var(--text-primary)]"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/profile"
                        className="block px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-sunken)] hover:text-[var(--text-primary)]"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Profile
                      </Link>
                      <Link
                        href="/orders"
                        className="block px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-sunken)] hover:text-[var(--text-primary)]"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        My Orders
                      </Link>
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
                    className="px-4 py-2 hidden sm:inline-flex text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    Login
                  </Link>
                  <Link
                    href="/vendor/apply"
                    id="become-vendor-btn"
                    className="px-4 py-2 inline-flex items-center gap-1.5 text-sm font-medium bg-[var(--brand-primary)] text-[var(--text-inverse)] rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Become a Vendor
                  </Link>
                </div>
              ))}

            {/* Mobile Menu Toggle */}
            <button
              id="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-sunken)]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
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

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div
            className="md:hidden pb-4 space-y-1"
            style={{ animation: "fadeInUp .15s ease" }}
          >
            <Link
              href="/products"
              className="block px-4 py-2.5 rounded-lg"
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
              <Link
                href="/login"
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
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
