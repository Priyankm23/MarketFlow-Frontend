"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { ProductCardSkeleton } from "@/components/skeleton-loader";
import { Product } from "@/lib/types";
import { ArrowRight, ChevronDown } from "lucide-react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

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

type ApiProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl?: string | null;
  category?: {
    id?: string;
    name?: string;
  } | null;
  vendor?: {
    id?: string;
    businessName?: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
};

type ProductsResponse = {
  status: string;
  data?: ApiProduct[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
};

export default function ProductsPage() {
  const searchParams = useSearchParams();

  const [sortBy, setSortBy] = useState("featured");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedPriceBand, setSelectedPriceBand] = useState("all");

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  useEffect(() => {
    const category = searchParams.get("category");
    if (category && category.trim().length > 0) {
      setSelectedCategory(category);
      setCategories((prevCategories) => {
        if (prevCategories.includes(category)) {
          return prevCategories;
        }
        return [...prevCategories, category];
      });
      setPage(1);
    }
  }, [searchParams]);

  const mapApiProductToUi = (item: ApiProduct): Product => {
    const image =
      item.imageUrl && item.imageUrl.trim().length > 0
        ? item.imageUrl
        : "/placeholder-product-1.jpg";

    return {
      id: item.id,
      name: item.name,
      description: item.description,
      price: Number(item.price || 0),
      images: [image],
      category: item.category?.name || "Uncategorized",
      subcategory: item.category?.name || "General",
      stock: Number(item.stock || 0),
      vendorId: item.vendor?.id || "",
      vendorName: item.vendor?.businessName || "Unknown Vendor",
      rating: 4,
      reviewCount: 0,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || new Date().toISOString(),
      featured: true,
    };
  };

  useEffect(() => {
    let active = true;

    const fetchProducts = async () => {
      setLoading(true);
      setError("");

      try {
        let response: Response;

        if (selectedCategory === "All") {
          const params = new URLSearchParams({
            page: String(page),
            limit: String(limit),
          });

          response = await fetch(
            `${API_BASE_URL}/products?${params.toString()}`,
            {
              method: "GET",
            },
          );
        } else {
          response = await fetch(
            `${API_BASE_URL}/products/category/${encodeURIComponent(selectedCategory)}`,
            {
              method: "GET",
            },
          );
        }

        const payload: ProductsResponse = await response
          .json()
          .catch(() => ({ status: "error" }));

        if (!response.ok || payload.status !== "success") {
          throw new Error("Failed to load products");
        }

        const mappedProducts = (payload.data || []).map(mapApiProductToUi);

        if (!active) return;

        setProducts(mappedProducts);
        if (selectedCategory === "All") {
          setTotalProducts(payload.meta?.total || mappedProducts.length);
          setTotalPages(payload.meta?.totalPages || 1);
        } else {
          setTotalProducts(mappedProducts.length);
          setTotalPages(1);
        }

        setCategories((prevCategories) => {
          const categorySet = new Set<string>(prevCategories);
          mappedProducts.forEach((product) =>
            categorySet.add(product.category),
          );
          return Array.from(categorySet);
        });
      } catch (err: unknown) {
        if (!active) return;
        const message =
          err instanceof Error ? err.message : "Unable to fetch products";
        setError(message);
        setProducts([]);
        setTotalProducts(0);
        setTotalPages(1);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      active = false;
    };
  }, [page, limit, selectedCategory]);

  const filteredProducts = useMemo(() => {
    let minPrice = 0;
    let maxPrice = Number.POSITIVE_INFINITY;

    if (selectedPriceBand === "0-499") {
      minPrice = 0;
      maxPrice = 499;
    } else if (selectedPriceBand === "500-999") {
      minPrice = 500;
      maxPrice = 999;
    } else if (selectedPriceBand === "1000-1999") {
      minPrice = 1000;
      maxPrice = 1999;
    } else if (selectedPriceBand === "2000-4999") {
      minPrice = 2000;
      maxPrice = 4999;
    } else if (selectedPriceBand === "5000+") {
      minPrice = 5000;
      maxPrice = Number.POSITIVE_INFINITY;
    }

    const byPrice = products.filter(
      (p) => p.price >= minPrice && p.price <= maxPrice,
    );

    const sorted = [...byPrice];

    if (sortBy === "price-low") {
      sorted.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-high") {
      sorted.sort((a, b) => b.price - a.price);
    } else if (sortBy === "newest") {
      sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    } else if (sortBy === "name") {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    }

    return sorted;
  }, [products, selectedPriceBand, sortBy]);

  const resetFilters = () => {
    setSelectedCategory("All");
    setSelectedPriceBand("all");
    setSortBy("featured");
    setPage(1);
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 0,
    }).format(price);

  return (
    <div className="min-h-screen" style={{ background: "#FFFFFF" }}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        <div className="mb-6 lg:mb-8">
          <div>
            <h1
              className="text-4xl sm:text-5xl font-bold"
              style={{ color: "#1A1A2E", fontFamily: "var(--font-heading)" }}
            >
              All Products
            </h1>
            <p className="mt-2 text-base" style={{ color: "#6B7280" }}>
              {totalProducts} products found
            </p>
          </div>

          <div
            className="mt-5 rounded-xl border p-2.5 sm:p-3"
            style={{
              background: "#FFFFFF",
              borderColor: "#E0DEFB",
            }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setPage(1);
                  }}
                  className="w-full appearance-none rounded-lg border px-4 py-2.5 pr-9 text-sm font-medium outline-none"
                  style={{
                    background: "#FFFFFF",
                    borderColor: "#E0DEFB",
                    color: "#1A1A2E",
                  }}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: "#6366F1" }}
                />
              </div>

              <div className="relative">
                <select
                  value={selectedPriceBand}
                  onChange={(e) => {
                    setSelectedPriceBand(e.target.value);
                    setPage(1);
                  }}
                  className="w-full appearance-none rounded-lg border px-4 py-2.5 pr-9 text-sm font-medium outline-none"
                  style={{
                    background: "#FFFFFF",
                    borderColor: "#E0DEFB",
                    color: "#1A1A2E",
                  }}
                >
                  <option value="all">All Prices</option>
                  <option value="0-499">Under ₹500</option>
                  <option value="500-999">₹500 - ₹999</option>
                  <option value="1000-1999">₹1,000 - ₹1,999</option>
                  <option value="2000-4999">₹2,000 - ₹4,999</option>
                  <option value="5000+">₹5,000 and above</option>
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: "#6366F1" }}
                />
              </div>

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full appearance-none rounded-lg border px-4 py-2.5 pr-9 text-sm font-medium outline-none"
                  style={{
                    background: "#FFFFFF",
                    borderColor: "#E0DEFB",
                    color: "#1A1A2E",
                  }}
                >
                  <option value="featured">Featured</option>
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name">Name: A to Z</option>
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: "#6366F1" }}
                />
              </div>

              <button
                onClick={resetFilters}
                className="rounded-lg border px-4 py-2.5 text-sm font-semibold"
                style={{
                  borderColor: "#4F46E5",
                  color: "#4F46E5",
                  background: "#FFFFFF",
                }}
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {[...Array(8)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div
            className="text-center py-16 rounded-2xl border"
            style={{ background: "#FFFFFF", borderColor: "#E0DEFB" }}
          >
            <h3
              className="text-xl font-semibold mb-2"
              style={{ color: "#1A1A2E" }}
            >
              Unable to load products
            </h3>
            <p style={{ color: "#6B7280" }}>{error}</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {filteredProducts.map((product) => (
                <Link key={product.id} href={`/products/${product.id}`}>
                  <article
                    className="group h-full overflow-hidden rounded-2xl border transition-all duration-200 hover:-translate-y-1"
                    style={{
                      background: "#FFFFFF",
                      borderColor: "#E0DEFB",
                    }}
                  >
                    <div
                      className="relative aspect-4/5 overflow-hidden"
                      style={{ background: "#FFFFFF" }}
                    >
                      <Image
                        src={product.images[0] || "/placeholder-product-1.jpg"}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {product.stock === 0 && (
                        <span
                          className="absolute left-2 top-2 rounded-full px-2 py-1 text-[11px] font-semibold"
                          style={{ background: "#F3F4F6", color: "#6B7280" }}
                        >
                          Out of Stock
                        </span>
                      )}
                      {product.stock > 0 && product.stock <= 5 && (
                        <span
                          className="absolute left-2 top-2 rounded-full px-2 py-1 text-[11px] font-semibold"
                          style={{ background: "#FEE2E2", color: "#DC2626" }}
                        >
                          Only {product.stock} left
                        </span>
                      )}
                    </div>

                    <div className="p-3.5 sm:p-4">
                      <p
                        className="text-xs font-semibold"
                        style={{ color: "#6366F1" }}
                      >
                        {product.vendorName}
                      </p>
                      <h3
                        className="mt-1 line-clamp-2 text-sm sm:text-[15px] font-semibold"
                        style={{ color: "#1A1A2E" }}
                      >
                        {product.name}
                      </h3>

                      <div className="mt-2 flex items-center gap-2">
                        <span
                          className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                          style={{ background: "#EDEDFD", color: "#4F46E5" }}
                        >
                          {product.category}
                        </span>
                      </div>

                      <div className="mt-3 flex items-end justify-between gap-2">
                        <div>
                          <p
                            className="text-lg sm:text-xl font-bold leading-none"
                            style={{ color: "#1A1A2E" }}
                          >
                            ₹{formatPrice(product.price)}
                          </p>
                        </div>

                        <span
                          className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold"
                          style={{ color: "#4F46E5" }}
                        >
                          View
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="rounded-lg border px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  borderColor: "#E0DEFB",
                  background: "#FFFFFF",
                  color: "#3D3D4E",
                }}
              >
                Previous
              </button>
              <span className="text-sm" style={{ color: "#6B7280" }}>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={page === totalPages}
                className="rounded-lg border px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  borderColor: "#E0DEFB",
                  background: "#FFFFFF",
                  color: "#3D3D4E",
                }}
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <div
            className="text-center py-16 rounded-2xl border"
            style={{ background: "#FFFFFF", borderColor: "#E0DEFB" }}
          >
            <h3
              className="text-xl font-semibold mb-2"
              style={{ color: "#1A1A2E" }}
            >
              No products found
            </h3>
            <p style={{ color: "#6B7280" }}>Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
