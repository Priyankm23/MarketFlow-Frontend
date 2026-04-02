"use client";

import React, { useEffect, useState } from "react";
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

  return {
    id: item.id,
    name: item.name?.trim() || "Trending Product",
    description: "",
    price: Number.isFinite(safePrice) ? safePrice : 0,
    images: [
      item.imageUrls?.[0] || item.imageUrl || "/placeholder-product-1.jpg",
    ],
    category: "General",
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

export default function TrendingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

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
        setProducts(items.map(toTrendingProductCard));
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

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-y-10 gap-x-6">
              {Array.from({ length: 10 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-y-10 gap-x-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
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
