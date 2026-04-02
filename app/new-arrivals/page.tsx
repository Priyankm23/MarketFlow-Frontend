"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { ProductCard } from "@/components/product-card";
import { ProductCardSkeleton } from "@/components/skeleton-loader";
import { API_BASE_URL } from "@/lib/config";
import { Product } from "@/lib/types";

const NEW_ARRIVALS_PRODUCTS_ENDPOINT = `${API_BASE_URL}/products/new-arrivals`;

type ApiNewArrivalProduct = {
  id: string;
  name?: string;
  description?: string;
  price?: string | number;
  stock?: number;
  imageUrl?: string | null;
  imageUrls?: string[] | null;
  rating?: number;
  reviewCount?: number;
  category?: { name?: string } | null;
  vendor?: { id?: string; businessName?: string } | null;
  createdAt?: string;
  updatedAt?: string;
};

const cleanBusinessName = (name?: string) => {
  if (!name) {
    return "Verified Vendor";
  }

  return name.replace(/^"+|"+$/g, "").trim() || "Verified Vendor";
};

const getNewArrivalsFromPayload = (
  payload: unknown,
): ApiNewArrivalProduct[] => {
  if (Array.isArray(payload)) {
    return payload as ApiNewArrivalProduct[];
  }

  if (
    payload &&
    typeof payload === "object" &&
    Array.isArray((payload as { data?: unknown }).data)
  ) {
    return (payload as { data: ApiNewArrivalProduct[] }).data;
  }

  if (
    payload &&
    typeof payload === "object" &&
    Array.isArray((payload as { products?: unknown }).products)
  ) {
    return (payload as { products: ApiNewArrivalProduct[] }).products;
  }

  return [];
};

const toNewArrivalProductCard = (item: ApiNewArrivalProduct): Product => {
  const safePrice = Number(item.price || 0);

  return {
    id: item.id,
    name: item.name || "New Arrival",
    description: item.description || "",
    price: Number.isFinite(safePrice) ? safePrice : 0,
    images: [
      item.imageUrls?.[0] || item.imageUrl || "/placeholder-product-1.jpg",
    ],
    category: item.category?.name || "General",
    subcategory: "General",
    stock: Number(item.stock || 0),
    vendorId: item.vendor?.id || "",
    vendorName: cleanBusinessName(item.vendor?.businessName),
    rating: Number(item.rating || 0),
    reviewCount: Number(item.reviewCount || 0),
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || new Date().toISOString(),
    featured: false,
  };
};

export default function NewArrivalsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    const fetchNewArrivals = async () => {
      try {
        const response = await fetch(NEW_ARRIVALS_PRODUCTS_ENDPOINT, {
          method: "GET",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
          },
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error("Failed to fetch new arrivals");
        }

        const items = getNewArrivalsFromPayload(payload);
        setProducts(items.map(toNewArrivalProductCard));
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchNewArrivals();

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
          <span className="text-black">New Arrivals</span>
        </div>

        <section className="py-2 sm:py-4">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl sm:text-6xl font-black text-black uppercase tracking-tighter leading-none">
                New{" "}
                <span className="text-red-600 underline decoration-black decoration-4 underline-offset-8">
                  Arrivals
                </span>
              </h1>
              <p className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest mt-6">
                Latest products sorted by recently added
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
              New arrivals are unavailable right now.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
