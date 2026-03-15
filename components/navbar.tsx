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
        background: "#FFFFFF",
        borderBottom: "1px solid #E0DEFB",
      }}
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-[64px] gap-4">
          {/* Logo */}
          <Link
            href="/"
            id="logo"
            className="flex items-center shrink-0"
            style={{ textDecoration: "none" }}
          >
            <Image
              src="/logo.png"
              alt="MarketFlow Logo"
              width={160}
              height={45}
              className="object-contain"
              priority
            />
          </Link>

          {/* Category Dropdown */}
          <div className="relative hidden lg:block">
            <button
              id="category-menu-btn"
              onClick={() => setCategoryMenuOpen(!categoryMenuOpen)}
              onBlur={() => setTimeout(() => setCategoryMenuOpen(false), 200)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "14px",
                fontWeight: 500,
                color: "#3D3D4E",
                transition: "color .2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#4F46E5")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#3D3D4E")}
            >
              <Menu className="w-4 h-4" />
              Categories
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {categoryMenuOpen && (
              <div
                className="absolute left-0 mt-1 w-56 rounded-xl py-2 z-50"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #C7C4F6",
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
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "#3D3D4E",
                        transition: "color .15s, background .15s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#4F46E5";
                        e.currentTarget.style.background = "#F6F5FF";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "#3D3D4E";
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <Icon className="w-4 h-4" style={{ color: "#4F46E5" }} />
                      {cat.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-xl mx-4">
            <div className="w-full relative">
              <input
                id="search-input"
                type="text"
                placeholder="Search for products, brands, vendors..."
                className="w-full pl-11 pr-4 py-2.5 outline-none"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "14px",
                  fontWeight: 400,
                  background: "#F6F5FF",
                  border: "1px solid #E0DEFB",
                  borderRadius: "8px",
                  color: "#1A1A2E",
                  transition: "border-color .2s",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#4F46E5";
                  e.currentTarget.style.outline = "2px solid #4F46E5";
                  e.currentTarget.style.outlineOffset = "2px";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#E0DEFB";
                  e.currentTarget.style.outline = "none";
                }}
              />
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: "#9CA3AF" }}
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4 sm:gap-6 shrink-0">
            {/* Notifications */}
            {user && (
              <button
                id="notifications-btn"
                className="p-2.5 rounded-lg relative"
                style={{ transition: "color .15s" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.querySelector("svg")!.style.color =
                    "#4F46E5")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.querySelector("svg")!.style.color =
                    "#3D3D4E")
                }
              >
                <Bell
                  className="w-5 h-5"
                  style={{ color: "#3D3D4E", transition: "color .15s" }}
                />
                <span
                  className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                  style={{ background: "#DC2626" }}
                />
              </button>
            )}

            {/* Cart */}
            {(!user || user.role === "customer") && (
              <Link
                href="/customer/cart"
                id="cart-btn"
                className="p-2.5 rounded-lg relative"
                style={{ transition: "color .15s" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.querySelector("svg")!.style.color =
                    "#4F46E5")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.querySelector("svg")!.style.color =
                    "#3D3D4E")
                }
              >
                <ShoppingCart
                  className="w-5 h-5"
                  style={{ color: "#3D3D4E", transition: "color .15s" }}
                />
                {cartItems > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 w-5 h-5 text-xs rounded-full flex items-center justify-center font-bold"
                    style={{ background: "#4F46E5", color: "#fff" }}
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
                    className="p-2.5 rounded-lg flex items-center gap-2"
                    style={{ transition: "color .15s" }}
                  >
                    <User className="w-5 h-5" style={{ color: "#3D3D4E" }} />
                  </button>

                  {userMenuOpen && (
                    <div
                      className="absolute right-0 mt-1 w-52 rounded-xl py-2"
                      style={{
                        background: "#FFFFFF",
                        border: "1px solid #C7C4F6",
                        animation: "fadeInUp .15s ease",
                      }}
                    >
                      <Link
                        href={getDashboardLink()}
                        className="block px-4 py-2.5"
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "14px",
                          fontWeight: 500,
                          color: "#3D3D4E",
                        }}
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/profile"
                        className="block px-4 py-2.5"
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "14px",
                          fontWeight: 500,
                          color: "#3D3D4E",
                        }}
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Profile
                      </Link>
                      <Link
                        href="/orders"
                        className="block px-4 py-2.5"
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "14px",
                          fontWeight: 500,
                          color: "#3D3D4E",
                        }}
                        onClick={() => setUserMenuOpen(false)}
                      >
                        My Orders
                      </Link>
                      <div
                        style={{
                          borderTop: "1px solid #E0DEFB",
                          margin: ".25rem 0",
                        }}
                      />
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5"
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "14px",
                          fontWeight: 500,
                          color: "#DC2626",
                        }}
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
                    className="px-4 py-2 hidden sm:inline-flex"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "#3D3D4E",
                      transition: "color .15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "#4F46E5")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "#3D3D4E")
                    }
                  >
                    Login
                  </Link>
                  <Link
                    href="/vendor/apply"
                    id="become-vendor-btn"
                    className="px-4 py-2 inline-flex items-center gap-1.5"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "14px",
                      fontWeight: 500,
                      background: "transparent",
                      color: "#4F46E5",
                      border: "2px solid #4F46E5",
                      borderRadius: "10px",
                      transition: "background .15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#EDEDFD";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    Become a Vendor
                  </Link>
                </div>
              ))}

            {/* Mobile Menu Toggle */}
            <button
              id="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-lg"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" style={{ color: "#3D3D4E" }} />
              ) : (
                <Menu className="w-5 h-5" style={{ color: "#3D3D4E" }} />
              )}
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
                fontSize: "14px",
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
                fontSize: "14px",
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
                  fontSize: "14px",
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
                  fontSize: "14px",
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
