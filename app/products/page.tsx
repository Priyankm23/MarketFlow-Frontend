"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { ProductCard } from "@/components/product-card";
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
  Filter,
  RefreshCw,
  LayoutGrid,
  List,
} from "lucide-react";
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
  rating?: number | null;
  reviewCount?: number | null;
  category?: { id?: string; name?: string } | null;
  vendor?: { id?: string; businessName?: string } | null;
  createdAt?: string;
};

export default function ProductsPage() {
  const searchParams = useSearchParams();

  const [sortBy, setSortBy] = useState("featured");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedPriceBand, setSelectedPriceBand] = useState("all");
  const [selectedReviewBand, setSelectedReviewBand] = useState("all");
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(true);

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
    if (category) {
      setSelectedCategory(category);
      setPage(1);
    }
  }, [searchParams]);

  const mapApiProductToUi = (item: ApiProduct): Product => {
    const safePrice = Number(item.price || 0);
    const generatedOriginalPrice = safePrice > 0 ? Math.ceil((safePrice * 1.25) / 10) * 10 : 0;
    
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      price: safePrice,
      originalPrice: generatedOriginalPrice,
      images: [item.imageUrl || "/placeholder-product-1.jpg"],
      category: item.category?.name || "General",
      subcategory: "General",
      stock: item.stock || 0,
      vendorId: item.vendor?.id || "",
      vendorName: item.vendor?.businessName || "Verified Vendor",
      rating: Number(item.rating) || 0,
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
        const endpoint = selectedCategory === "All" 
          ? `${API_BASE_URL}/products?page=${page}&limit=${limit}`
          : `${API_BASE_URL}/products/category/${encodeURIComponent(selectedCategory)}`;
        
        const response = await fetch(endpoint);
        const payload = await response.json();

        if (!response.ok || payload.status !== "success") throw new Error("Could not fetch products");

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
    return () => { active = false; };
  }, [page, limit, selectedCategory]);

  const filteredProducts = useMemo(() => {
    const minRating = selectedReviewBand === "all" ? 0 : Number(selectedReviewBand);
    let result = products.filter(p => matchesPriceBand(p.price, selectedPriceBand) && p.rating >= minRating);
    
    if (sortBy === "price-low") result.sort((a, b) => a.price - b.price);
    else if (sortBy === "price-high") result.sort((a, b) => b.price - a.price);
    else if (sortBy === "newest") result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return result;
  }, [products, selectedPriceBand, selectedReviewBand, sortBy]);

  const resetFilters = () => {
    setSelectedCategory("All");
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
          <Link href="/" className="hover:text-[var(--brand-accent)] transition-colors">Home</Link>
          <span className="opacity-30">/</span>
          <span className="text-black">Catalogue</span>
        </nav>

        {/* --- MAIN GRID --- */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-10">
          
          {/* REFINED SIDEBAR */}
          <aside className="h-fit">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-default)] lg:mb-0 mb-2">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-[var(--brand-accent)]" />
                <span className="font-bold text-xs uppercase tracking-widest">Refine</span>
              </div>
              {/* Only show collapse on mobile */}
              <button onClick={() => setIsFilterCollapsed(!isFilterCollapsed)} className="lg:hidden p-2 hover:bg-[var(--bg-sunken)] rounded-lg transition-colors">
                {isFilterCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
              </button>
            </div>

            <div className={`${isFilterCollapsed ? 'hidden' : 'block'} lg:block space-y-8 lg:mt-6`}>
                {/* Category Section */}
                <section>
                  <h4 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-4">Category</h4>
                  <div className="grid grid-cols-1 gap-1.5">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all ${selectedCategory === cat ? 'bg-black text-white shadow-xl' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-sunken)]'}`}
                      >
                        {cat}
                        {selectedCategory === cat && <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-accent)]" />}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Price Section */}
                <section>
                  <h4 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-4">Price</h4>
                  <div className="space-y-1.5">
                    {PRICE_BANDS.map(band => (
                      <button
                        key={band.value}
                        onClick={() => setSelectedPriceBand(band.value)}
                        className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-[11px] transition-all ${selectedPriceBand === band.value ? 'text-black font-black' : 'text-[var(--text-secondary)] opacity-70 hover:opacity-100'}`}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${selectedPriceBand === band.value ? 'border-[var(--brand-accent)]' : 'border-zinc-300'}`}>
                          {selectedPriceBand === band.value && <div className="w-2 h-2 rounded-full bg-[var(--brand-accent)]" />}
                        </div>
                        {band.label}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Rating Section */}
                <section>
                  <h4 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-4">Rating</h4>
                  <div className="flex flex-wrap gap-2">
                    {REVIEW_BANDS.map(band => (
                      <button
                        key={band.value}
                        onClick={() => setSelectedReviewBand(band.value)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-black border transition-all ${selectedReviewBand === band.value ? 'bg-[var(--brand-accent)] border-[var(--brand-accent)] text-white shadow-lg' : 'bg-white border-[var(--border-default)] text-zinc-500 hover:border-zinc-400'}`}
                      >
                        {band.label}
                      </button>
                    ))}
                  </div>
                </section>

                <button 
                  onClick={resetFilters}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-zinc-100 text-black text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-sm"
                >
                  <RefreshCw size={12} />
                  Reset
                </button>
              </div>
          </aside>

          {/* PRODUCT LISTING AREA */}
          <main className="space-y-6">
            {/* Header Controls */}
            <header className="flex items-center justify-between gap-4 py-4 px-1 sm:px-4 border-b border-[var(--border-default)] mb-4">
              <div>
                <h2 className="text-xs sm:text-sm font-black text-black uppercase tracking-widest">Catalogue</h2>
                <p className="text-[9px] sm:text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-tighter">{totalProducts} Items found</p>
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
                {[...Array(10)].map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-y-10 gap-x-6">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center rounded-2xl border-2 border-dashed border-[var(--border-default)]">
                <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <RefreshCw size={32} className="text-zinc-300" />
                </div>
                <h3 className="text-xl font-bold text-black">No matches found</h3>
                <p className="text-zinc-500 max-w-xs mx-auto mt-2">Try adjusting your filters or clearing them to see all available products.</p>
                <button onClick={resetFilters} className="mt-8 px-8 py-3 bg-black text-white rounded-full font-bold hover:bg-[var(--brand-accent)] transition-colors shadow-lg">Clear All Filters</button>
              </div>
            )}

            {/* Pagination */}
            {filteredProducts.length > 0 && (
              <div className="pt-10 flex items-center justify-center gap-0">
                <button 
                  onClick={() => setPage(p => Math.max(1, p-1))}
                  disabled={page === 1}
                  className="h-12 px-6 rounded-none border border-[var(--border-default)] bg-white text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all disabled:opacity-30 shadow-sm"
                >
                  Prev
                </button>
                <div className="flex items-center justify-center px-6 h-12 border-y border-[var(--border-default)] bg-[var(--bg-sunken)]">
                  <span className="text-xs font-black text-black">{page}</span>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase mx-1">/</span>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">{totalPages}</span>
                </div>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p+1))}
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
