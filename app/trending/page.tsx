"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { ProductCard } from "@/components/product-card";
import { ProductCardSkeleton } from "@/components/skeleton-loader";
import { API_BASE_URL } from "@/lib/config";
import { Product } from "@/lib/types";

const TRENDING_PRODUCTS_ENDPOINT = `${API_BASE_URL}/products/trending`;

type ApiTrendingProduct = {
  id: string;
  name?: string;
  price?: string | number;
  reviewCount?: number;
  rating?: number;
  imageUrl?: string | null;
  imageUrls?: string[] | null;
  vendor?: {
    id?: string;
    businessName?: string;
  } | null;
  category?: {
    name?: string;
  } | null;
  categoryName?: string;
  createdAt?: string;
  updatedAt?: string;
};

type ApiTrendingResponse = {
  status?: string;
  products?: ApiTrendingProduct[];
  data?: ApiTrendingProduct[];
};

const cleanBusinessName = (name?: string) => {
  if (!name) {
    return "Verified Vendor";
  }
  return name.replace(/^"+|"+$/g, "").trim() || "Verified Vendor";
};

const getTrendingProductsFromPayload = (
  payload: ApiTrendingResponse,
): ApiTrendingProduct[] => {
  if (Array.isArray(payload?.products)) {
    return payload.products;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
};

const toTrendingProductCard = (item: ApiTrendingProduct): Product => {
  const safePrice = Number(item.price || 0);
  const categoryName =
    item.category?.name?.trim() || item.categoryName?.trim() || "General";

  return {
    id: item.id,
    name: item.name?.trim() || "Trending Product",
    description: "",
    price: Number.isFinite(safePrice) ? safePrice : 0,
    images: [
      item.imageUrls?.[0] || item.imageUrl || "/placeholder-product-1.jpg",
    ],
    category: categoryName,
    subcategory: "General",
    stock: 10,
    vendorId: item.vendor?.id || "",
    vendorName: cleanBusinessName(item.vendor?.businessName),
    rating: Number(item.rating || 0),
    reviewCount: Number(item.reviewCount || 0),
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || new Date().toISOString(),
    featured: true,
  };
};

type DisplayTrendingProduct = Product & {
  filterCategory: string;
  filterBrand: string;
};

const normalizeFilterValue = (value?: string | null) => {
  if (!value) return "";
  return value.trim();
};

export default function TrendingPage() {
  const [products, setProducts] = useState<DisplayTrendingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBrand, setSelectedBrand] = useState("all");

  const getFilterButtonClass = (isActive: boolean) =>
    `px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide border transition-colors ${
      isActive
        ? "bg-red-600 text-white border-red-600"
        : "bg-white text-[var(--text-primary)] border-[var(--border-default)] hover:border-red-300 hover:text-red-600"
    }`;

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((product) => {
      if (product.filterCategory) {
        set.add(product.filterCategory);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const availableBrands = useMemo(() => {
    const set = new Set<string>();
    products.forEach((product) => {
      if (product.filterBrand) {
        set.add(product.filterBrand);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const hasFilters =
    !loading && (availableCategories.length > 0 || availableBrands.length > 0);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const categoryMatch =
        selectedCategory === "all" ||
        product.filterCategory === selectedCategory;
      const brandMatch =
        selectedBrand === "all" || product.filterBrand === selectedBrand;

      return categoryMatch && brandMatch;
    });
  }, [products, selectedCategory, selectedBrand]);

  useEffect(() => {
    if (
      selectedCategory !== "all" &&
      !availableCategories.includes(selectedCategory)
    ) {
      setSelectedCategory("all");
    }
  }, [availableCategories, selectedCategory]);

  useEffect(() => {
    if (selectedBrand !== "all" && !availableBrands.includes(selectedBrand)) {
      setSelectedBrand("all");
    }
  }, [availableBrands, selectedBrand]);

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

        if (!response.ok) {
          throw new Error("Failed to fetch trending products");
        }

        const items = getTrendingProductsFromPayload(payload);
        setProducts(
          items.map((item) => {
            const base = toTrendingProductCard(item);

            return {
              ...base,
              filterCategory: normalizeFilterValue(
                item.category?.name || item.categoryName,
              ),
              filterBrand: normalizeFilterValue(item.vendor?.businessName),
            };
          }),
        );
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchTrendingProducts();

    return () => {
      controller.abort();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <Navbar />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-2 mb-8 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
          <Link href="/" className="hover:text-black">
            Home
          </Link>
          <ChevronRight size={12} />
          <span className="text-black">Trending Now</span>
        </div>

        <section className="py-2 sm:py-4">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl sm:text-6xl font-black text-black uppercase tracking-tighter leading-none">
                Trending{" "}
                <span className="text-red-600 underline decoration-black decoration-4 underline-offset-8">
                  Now
                </span>
              </h1>
              <p className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest mt-6">
                The most popular picks this week
              </p>
            </div>
          </div>

          {hasFilters && (
            <div className="mb-8 space-y-4 lg:hidden">
              {availableCategories.length > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">
                    Categories
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCategory("all")}
                      className={getFilterButtonClass(
                        selectedCategory === "all",
                      )}
                    >
                      All
                    </button>
                    {availableCategories.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setSelectedCategory(category)}
                        className={getFilterButtonClass(
                          selectedCategory === category,
                        )}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {availableBrands.length > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">
                    Brands
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
                        className={getFilterButtonClass(
                          selectedBrand === brand,
                        )}
                      >
                        {brand}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-y-10 gap-x-6">
              {Array.from({ length: 10 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-8">
              {hasFilters && (
                <aside className="hidden lg:block border border-[var(--border-default)] bg-white h-fit sticky top-24">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-default)]">
                    <p className="text-[12px] font-black uppercase tracking-widest text-[var(--text-primary)]">
                      Filters
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory("all");
                        setSelectedBrand("all");
                      }}
                      className="text-[12px] font-black uppercase tracking-widest text-pink-500 hover:text-red-600"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="px-5 py-4 space-y-6">
                    {availableCategories.length > 0 && (
                      <div>
                        <p className="text-[12px] font-black uppercase tracking-wider text-[var(--text-primary)] mb-3">
                          Categories
                        </p>
                        <div className="space-y-2.5">
                          <button
                            type="button"
                            onClick={() => setSelectedCategory("all")}
                            className={getFilterButtonClass(
                              selectedCategory === "all",
                            )}
                          >
                            All
                          </button>
                          {availableCategories.map((category) => (
                            <button
                              key={category}
                              type="button"
                              onClick={() => setSelectedCategory(category)}
                              className={getFilterButtonClass(
                                selectedCategory === category,
                              )}
                            >
                              {category}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {availableBrands.length > 0 && (
                      <div>
                        <p className="text-[12px] font-black uppercase tracking-wider text-[var(--text-primary)] mb-3">
                          Brand
                        </p>
                        <div className="space-y-2.5">
                          <button
                            type="button"
                            onClick={() => setSelectedBrand("all")}
                            className={getFilterButtonClass(
                              selectedBrand === "all",
                            )}
                          >
                            All
                          </button>
                          {availableBrands.map((brand) => (
                            <button
                              key={brand}
                              type="button"
                              onClick={() => setSelectedBrand(brand)}
                              className={getFilterButtonClass(
                                selectedBrand === brand,
                              )}
                            >
                              {brand}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </aside>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-y-10 gap-x-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          ) : (
            <div className="w-full py-12 text-center text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] border-2 border-dashed border-[var(--border-default)]">
              Trending products are unavailable right now.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
