"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
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

type SeasonalBanner = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  background: string;
  textColor: string;
};

// High-end dark theme seasonal banners
const SEASONAL_BANNERS: SeasonalBanner[] = [
  {
    id: "premium-black",
    eyebrow: "Limited Edition",
    title: "The Midnight Collection",
    subtitle: "Premium craft meets modern design. Discover the most exclusive picks from India's top artisans.",
    ctaLabel: "Shop The Collection",
    ctaHref: "/products",
    background: "linear-gradient(135deg, #000000 0%, #1a1a1a 100%)",
    textColor: "white",
  },
  {
    id: "red-rush",
    eyebrow: "Season Finale",
    title: "Experience The Red Rush",
    subtitle: "Bold styles, vibrant energy. Grab the season's hottest trends with up to 40% off on verified brands.",
    ctaLabel: "View Deals",
    ctaHref: "/products",
    background: "linear-gradient(135deg, #000000 0%, #4a0000 100%)",
    textColor: "white",
  }
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
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
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

  const mapApiProductToUi = (item: ApiProduct): Product => ({
    id: item.id,
    name: item.name,
    description: item.description,
    price: Number(item.price || 0),
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
  });

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

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex(prev => (prev + 1) % SEASONAL_BANNERS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

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

  const currentBanner = SEASONAL_BANNERS[currentBannerIndex];

  return (
    <div className="min-h-screen bg-[var(--bg-base)] selection:bg-[var(--brand-accent)] selection:text-white">
      <Navbar />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* --- REFINED HERO --- */}
        <section 
          className="relative h-[200px] sm:h-[260px] rounded-xl overflow-hidden group transition-all duration-700 shadow-xl"
          style={{ background: currentBanner.background }}
        >
          {/* Animated Background Elements */}
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
          
          <div className="relative h-full flex items-center px-6 sm:px-10 lg:px-12">
            <div className="max-w-xl space-y-3 sm:space-y-4">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-accent)] animate-ping" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-white/80">{currentBanner.eyebrow}</span>
              </div>
              
              <h1 className="text-3xl sm:text-5xl font-bold text-white !leading-[1.1] tracking-tight">
                {currentBanner.title}
              </h1>
              
              <p className="text-white/60 text-xs sm:text-sm max-w-md font-medium leading-relaxed line-clamp-2">
                {currentBanner.subtitle}
              </p>
              
              <div className="flex items-center gap-4">
                <Link
                  href={currentBanner.ctaHref}
                  className="group relative px-6 py-2.5 bg-white text-black rounded-full text-sm font-bold overflow-hidden transition-all hover:pr-10"
                >
                  <span className="relative z-10">{currentBanner.ctaLabel}</span>
                  <ArrowRight className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all" size={16} />
                </Link>
              </div>
            </div>
          </div>

          {/* Banner Controls */}
          <div className="absolute bottom-6 right-6 flex gap-2">
             {SEASONAL_BANNERS.map((_, i) => (
               <button 
                 key={i} 
                 onClick={() => setCurrentBannerIndex(i)}
                 className={`h-1 rounded-full transition-all duration-500 ${currentBannerIndex === i ? 'w-8 bg-[var(--brand-accent)]' : 'w-3 bg-white/20 hover:bg-white/40'}`} 
               />
             ))}
          </div>
        </section>

        {/* --- MAIN GRID --- */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
          
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

            <div className={`${isFilterCollapsed ? 'hidden' : 'block'} lg:block space-y-8 lg:mt-8`}>
                {/* Category Section */}
                <section>
                  <h4 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4">Category</h4>
                  <div className="grid grid-cols-1 gap-1">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${selectedCategory === cat ? 'bg-black text-white shadow-lg' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-sunken)]'}`}
                      >
                        {cat}
                        {selectedCategory === cat && <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-accent)]" />}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Price Section */}
                <section>
                  <h4 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4">Price Range</h4>
                  <div className="space-y-2">
                    {PRICE_BANDS.map(band => (
                      <button
                        key={band.value}
                        onClick={() => setSelectedPriceBand(band.value)}
                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-all ${selectedPriceBand === band.value ? 'text-black font-bold' : 'text-[var(--text-secondary)] opacity-60 hover:opacity-100'}`}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedPriceBand === band.value ? 'border-[var(--brand-accent)]' : 'border-zinc-300'}`}>
                          {selectedPriceBand === band.value && <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-accent)]" />}
                        </div>
                        {band.label}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Rating Section */}
                <section>
                  <h4 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4">Rating</h4>
                  <div className="flex flex-wrap gap-2">
                    {REVIEW_BANDS.map(band => (
                      <button
                        key={band.value}
                        onClick={() => setSelectedReviewBand(band.value)}
                        className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${selectedReviewBand === band.value ? 'bg-[var(--brand-accent)] border-[var(--brand-accent)] text-white shadow-md' : 'bg-white border-[var(--border-default)] text-zinc-500 hover:border-zinc-400'}`}
                      >
                        {band.label}
                      </button>
                    ))}
                  </div>
                </section>

                <button 
                  onClick={resetFilters}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-[var(--bg-sunken)] text-[var(--text-primary)] text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
                >
                  <RefreshCw size={14} />
                  Reset All
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
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {[...Array(8)].map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {filteredProducts.map(product => (
                  <Link 
                    key={product.id} 
                    href={`/products/${product.id}`} 
                    className="group relative flex flex-col bg-white border border-[var(--border-default)] rounded-xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:border-black/10 hover:-translate-y-1 active:scale-95 sm:active:scale-100"
                  >
                    {/* Badge */}
                    <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
                      {product.stock < 5 && (
                        <span className="px-2 py-0.5 bg-red-600 text-[8px] font-black text-white uppercase tracking-tighter rounded-full shadow-lg">Low Stock</span>
                      )}
                    </div>

                    {/* Image */}
                    <div className="aspect-[4/5] relative overflow-hidden bg-zinc-100">
                      <Image 
                        src={product.images[0]} 
                        alt={product.name} 
                        fill 
                        className="object-cover transition-transform duration-1000 group-hover:scale-110" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 lg:group-hover:opacity-100 transition-opacity" />
                    </div>

                    {/* Info */}
                    <div className="p-3 sm:p-5 flex-1 flex flex-col gap-1 sm:gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] truncate max-w-[60%]">{product.vendorName}</span>
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-1 text-[10px] font-bold text-black">
                            <Star size={10} className="fill-[var(--brand-accent)] text-[var(--brand-accent)]" />
                            {product.rating.toFixed(1)}
                          </div>
                          <span className="text-[8px] font-bold text-zinc-400 leading-none">({product.reviewCount})</span>
                        </div>
                      </div>

                      <h3 className="text-xs sm:text-sm font-bold text-black line-clamp-2 leading-tight min-h-[32px] sm:min-h-[40px] group-hover:text-[var(--brand-accent)] transition-colors">{product.name}</h3>
                      
                      <div className="mt-auto pt-2 sm:pt-3 border-t border-zinc-50 flex items-center justify-between">
                        <div>
                          <p className="text-[9px] text-[var(--text-muted)] font-medium uppercase tracking-tighter">Price</p>
                          <p className="text-base sm:text-lg font-black text-black tracking-tight">₹{product.price.toLocaleString()}</p>
                        </div>
                        <button className="hidden sm:flex w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black text-white items-center justify-center transition-all lg:group-hover:bg-[var(--brand-accent)] lg:group-hover:rotate-45">
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                  </Link>
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
