"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { ProductCard } from "@/components/product-card";
import { ProductCardSkeleton } from "@/components/skeleton-loader";
import { Product } from "@/lib/types";
import { ChevronDown, RefreshCw } from "lucide-react";
import { API_BASE_URL } from "@/lib/config";

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

const PRICE_BANDS = [
  { value: "all", label: "All Prices" },
  { value: "0-499", label: "Under ₹500" },
  { value: "500-999", label: "₹500 - ₹999" },
  { value: "1000-1999", label: "₹1,000 - ₹1,999" },
  { value: "2000-4999", label: "₹2,000 - ₹4,999" },
  { value: "5000+", label: "₹5,000 & Above" },
];

const REVIEW_BANDS = [
  { value: "all", label: "Any Rating" },
  { value: "4", label: "4.0 ★ & Above" },
  { value: "3", label: "3.0 ★ & Above" },
  { value: "2", label: "2.0 ★ & Above" },
];

const matchesPriceBand = (price: number, band: string) => {
  if (band === "0-499") return price >= 0 && price <= 499;
  if (band === "500-999") return price >= 500 && price <= 999;
  if (band === "1000-1999") return price >= 1000 && price <= 1999;
  if (band === "2000-4999") return price >= 2000 && price <= 4999;
  if (band === "5000+") return price >= 5000;
  return true;
};

type ApiProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl?: string | null;
  imageUrls?: string[] | null;
  averageRating?: number | null;
  rating?: number | null;
  reviewCount?: number | null;
  categoryName?: string | null;
  businessName?: string | null;
  category?: { id?: string; name?: string } | null;
  vendor?: { id?: string; businessName?: string } | null;
  createdAt?: string;
};

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const searchQuery = (searchParams.get("search") || "").trim();

  const [sortBy, setSortBy] = useState("featured");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedPriceBand, setSelectedPriceBand] = useState("all");
  const [selectedReviewBand, setSelectedReviewBand] = useState("all");
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

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
    setSelectedCategory(category || "All");
    setPage(1);
  }, [searchParams]);

  const mapApiProductToUi = (item: ApiProduct): Product => {
    const safePrice = Number(item.price || 0);
    const rawOriginalPrice = Number(
      (item as ApiProduct & { originalPrice?: number | null }).originalPrice ||
        0,
    );
    const originalPrice =
      rawOriginalPrice > safePrice ? rawOriginalPrice : undefined;

    const ratingValue = Number(item.averageRating ?? item.rating ?? 0);
    const safeRating = Number.isFinite(ratingValue)
      ? Math.min(5, Math.max(0, ratingValue))
      : 0;

    return {
      id: item.id,
      name: item.name,
      description: item.description,
      price: safePrice,
      originalPrice,
      images:
        Array.isArray(item.imageUrls) && item.imageUrls.length > 0
          ? item.imageUrls
          : [item.imageUrl || "/placeholder-product-1.jpg"],
      category: item.category?.name || item.categoryName || "General",
      subcategory: "General",
      stock: item.stock || 0,
      vendorId: item.vendor?.id || "",
      vendorName:
        item.vendor?.businessName || item.businessName || "Verified Vendor",
      rating: safeRating,
      reviewCount: Number(item.reviewCount) || 0,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      featured: true,
    };
  };

  useEffect(() => {
    let active = true;
    const fetchProducts = async () => {
      setLoading(true);
      setError("");
      try {
        const isSearchMode = searchQuery.length > 0;
        const endpoint = isSearchMode
          ? `${API_BASE_URL}/products/search?q=${encodeURIComponent(searchQuery)}&page=${page}&limit=${limit}`
          : selectedCategory === "All"
            ? `${API_BASE_URL}/products?page=${page}&limit=${limit}`
            : `${API_BASE_URL}/products/category/${encodeURIComponent(selectedCategory)}`;

        const response = await fetch(endpoint);
        const payload = await response.json();

        if (!response.ok || payload.status !== "success")
          throw new Error("Could not fetch products");

        if (active) {
          const mapped = (payload.data || []).map(mapApiProductToUi);
          setProducts(mapped);
          setTotalProducts(payload.meta?.total || mapped.length);
          setTotalPages(payload.meta?.totalPages || 1);
        }
      } catch (err: any) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchProducts();
    return () => {
      active = false;
    };
  }, [page, limit, selectedCategory, searchQuery]);

  const availableBrands = useMemo(() => {
    const set = new Set<string>();
    products.forEach((product) => {
      if (product.vendorName) {
        set.add(product.vendorName);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const getFilterButtonClass = (isActive: boolean) =>
    `px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide border transition-colors ${
      isActive
        ? "bg-red-600 text-white border-red-600"
        : "bg-white text-[var(--text-primary)] border-[var(--border-default)] hover:border-red-300 hover:text-red-600"
    }`;

  const filteredProducts = useMemo(() => {
    const minRating =
      selectedReviewBand === "all" ? 0 : Number(selectedReviewBand);
    let result = products.filter(
      (p) =>
        matchesPriceBand(p.price, selectedPriceBand) &&
        p.rating >= minRating &&
        (selectedBrand === "all" || p.vendorName === selectedBrand),
    );

    if (sortBy === "price-low") result.sort((a, b) => a.price - b.price);
    else if (sortBy === "price-high") result.sort((a, b) => b.price - a.price);
    else if (sortBy === "newest")
      result.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

    return result;
  }, [products, selectedPriceBand, selectedReviewBand, selectedBrand, sortBy]);

  const resetFilters = () => {
    setSelectedCategory("All");
    setSelectedBrand("all");
    setSelectedPriceBand("all");
    setSelectedReviewBand("all");
    setSortBy("featured");
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] selection:bg-[var(--brand-accent)] selection:text-white">
      <Navbar />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* --- BREADCRUMBS --- */}
        <nav className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-6">
          <Link
            href="/"
            className="hover:text-[var(--brand-accent)] transition-colors"
          >
            Home
          </Link>
          <span className="opacity-30">/</span>
          <span className="text-black">Catalogue</span>
        </nav>

        {/* --- MAIN GRID --- */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-10">
          <aside className="h-fit lg:sticky lg:top-24 border border-[var(--border-default)] bg-white">
            <div className="hidden lg:flex items-center justify-between px-5 py-4 border-b border-[var(--border-default)]">
              <p className="text-[12px] font-black uppercase tracking-widest text-[var(--text-primary)]">
                Filters
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="text-[12px] font-black uppercase tracking-widest text-pink-500 hover:text-red-600"
              >
                Clear All
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsMobileFiltersOpen((prev) => !prev)}
              className="lg:hidden w-full flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)]"
            >
              <span className="text-[12px] font-black uppercase tracking-widest text-[var(--text-primary)]">
                Filters
              </span>
              <ChevronDown
                size={16}
                className={`text-[var(--text-secondary)] transition-transform ${isMobileFiltersOpen ? "rotate-180" : "rotate-0"}`}
              />
            </button>

            <div
              className={`${isMobileFiltersOpen ? "block" : "hidden"} lg:block px-5 py-4 space-y-6`}
            >
              <div className="lg:hidden flex justify-end">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-[11px] font-black uppercase tracking-widest text-pink-500 hover:text-red-600"
                >
                  Clear All
                </button>
              </div>

              <div>
                <p className="text-[12px] font-black uppercase tracking-wider text-[var(--text-primary)] mb-3">
                  Categories
                </p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={getFilterButtonClass(selectedCategory === cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[12px] font-black uppercase tracking-wider text-[var(--text-primary)] mb-3">
                  Brand
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedBrand("all")}
                    className={getFilterButtonClass(selectedBrand === "all")}
                  >
                    All
                  </button>
                  {availableBrands.map((brand) => (
                    <button
                      key={brand}
                      type="button"
                      onClick={() => setSelectedBrand(brand)}
                      className={getFilterButtonClass(selectedBrand === brand)}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[12px] font-black uppercase tracking-wider text-[var(--text-primary)] mb-3">
                  Price
                </p>
                <div className="flex flex-wrap gap-2">
                  {PRICE_BANDS.map((band) => (
                    <button
                      key={band.value}
                      type="button"
                      onClick={() => setSelectedPriceBand(band.value)}
                      className={getFilterButtonClass(
                        selectedPriceBand === band.value,
                      )}
                    >
                      {band.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[12px] font-black uppercase tracking-wider text-[var(--text-primary)] mb-3">
                  Rating
                </p>
                <div className="flex flex-wrap gap-2">
                  {REVIEW_BANDS.map((band) => (
                    <button
                      key={band.value}
                      type="button"
                      onClick={() => setSelectedReviewBand(band.value)}
                      className={getFilterButtonClass(
                        selectedReviewBand === band.value,
                      )}
                    >
                      {band.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* PRODUCT LISTING AREA */}
          <main className="space-y-6">
            {/* Header Controls */}
            <header className="flex items-center justify-between gap-4 py-4 px-1 sm:px-4 border-b border-[var(--border-default)] mb-4">
              <div>
                <h2 className="text-xs sm:text-sm font-black text-black uppercase tracking-widest">
                  {searchQuery ? "Search Results" : "Catalogue"}
                </h2>
                <p className="text-[9px] sm:text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-tighter">
                  {searchQuery
                    ? `${totalProducts} item(s) found for "${searchQuery}"`
                    : `${totalProducts} Items found`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent text-[10px] sm:text-xs font-black uppercase tracking-widest py-2 pl-2 pr-1 rounded-none outline-none border-none cursor-pointer focus:ring-0"
                >
                  <option value="featured">Sort / Featured</option>
                  <option value="newest">Sort / Newest</option>
                  <option value="price-low">Sort / Price Low</option>
                  <option value="price-high">Sort / Price High</option>
                </select>
              </div>
            </header>

            {/* RESULTS GRID */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {[...Array(10)].map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-y-10 gap-x-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center rounded-2xl border-2 border-dashed border-[var(--border-default)]">
                <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <RefreshCw size={32} className="text-zinc-300" />
                </div>
                <h3 className="text-xl font-bold text-black">
                  No matches found
                </h3>
                <p className="text-zinc-500 max-w-xs mx-auto mt-2">
                  Try adjusting your filters or clearing them to see all
                  available products.
                </p>
                <button
                  onClick={resetFilters}
                  className="mt-8 px-8 py-3 bg-black text-white rounded-full font-bold hover:bg-[var(--brand-accent)] transition-colors shadow-lg"
                >
                  Clear All Filters
                </button>
              </div>
            )}

            {/* Pagination */}
            {filteredProducts.length > 0 && (
              <div className="pt-10 flex items-center justify-center gap-0">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-12 px-6 rounded-none border border-[var(--border-default)] bg-white text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all disabled:opacity-30 shadow-sm"
                >
                  Prev
                </button>
                <div className="flex items-center justify-center px-6 h-12 border-y border-[var(--border-default)] bg-[var(--bg-sunken)]">
                  <span className="text-xs font-black text-black">{page}</span>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase mx-1">
                    /
                  </span>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">
                    {totalPages}
                  </span>
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="h-12 px-6 rounded-none border border-[var(--border-default)] bg-white text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all disabled:opacity-30 shadow-sm"
                >
                  Next
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
