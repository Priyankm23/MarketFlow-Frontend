"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  ShoppingCart,
  Truck,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Product } from "@/lib/types";
import { useCartStore } from "@/lib/store";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

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

type ProductDetailResponse = {
  status: string;
  data?: ApiProduct;
};

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const addItem = useCartStore((state) => state.addItem);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);

  const productId = useMemo(() => {
    const value = params?.id;
    return Array.isArray(value) ? value[0] : value;
  }, [params]);

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
      rating: 0,
      reviewCount: 0,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || new Date().toISOString(),
      featured: true,
    };
  };

  useEffect(() => {
    let active = true;

    const fetchProduct = async () => {
      if (!productId) {
        setError("Invalid product id");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
          method: "GET",
        });

        const payload: ProductDetailResponse = await response
          .json()
          .catch(() => ({ status: "error" }));

        if (!response.ok || payload.status !== "success" || !payload.data) {
          throw new Error("Failed to load product details");
        }

        if (!active) return;
        setProduct(mapApiProductToUi(payload.data));
      } catch (err: unknown) {
        if (!active) return;
        const message =
          err instanceof Error ? err.message : "Unable to fetch product";
        setError(message);
        setProduct(null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchProduct();

    return () => {
      active = false;
    };
  }, [productId]);

  const handleAddToCart = () => {
    if (!product || quantity < 1 || product.stock === 0) {
      return;
    }

    const safeQuantity = Math.min(quantity, product.stock);

    addItem({
      productId: product.id,
      quantity: safeQuantity,
      price: product.price,
      product,
    });
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 0,
    }).format(price);

  return (
    <div className="min-h-screen" style={{ background: "#FFFFFF" }}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm font-semibold"
          style={{ color: "#4F46E5" }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to products
        </Link>

        {loading ? (
          <div
            className="mt-6 rounded-2xl border p-8"
            style={{ background: "#FFFFFF", borderColor: "#E0DEFB" }}
          >
            <div className="animate-pulse grid gap-6 lg:grid-cols-2">
              <div
                className="aspect-4/5 rounded-2xl"
                style={{ background: "#EDEDFD" }}
              />
              <div className="space-y-4">
                <div
                  className="h-8 w-3/4 rounded"
                  style={{ background: "#EDEDFD" }}
                />
                <div
                  className="h-4 w-1/2 rounded"
                  style={{ background: "#EDEDFD" }}
                />
                <div
                  className="h-6 w-1/3 rounded"
                  style={{ background: "#EDEDFD" }}
                />
                <div
                  className="h-24 w-full rounded"
                  style={{ background: "#EDEDFD" }}
                />
              </div>
            </div>
          </div>
        ) : error ? (
          <div
            className="mt-6 rounded-2xl border p-10 text-center"
            style={{ background: "#FFFFFF", borderColor: "#E0DEFB" }}
          >
            <h2
              className="text-2xl font-bold"
              style={{ color: "#1A1A2E", fontFamily: "var(--font-heading)" }}
            >
              Product unavailable
            </h2>
            <p className="mt-2" style={{ color: "#6B7280" }}>
              {error}
            </p>
            <Link
              href="/products"
              className="mt-5 inline-flex rounded-lg px-4 py-2.5 text-sm font-semibold"
              style={{ background: "#4F46E5", color: "#FFFFFF" }}
            >
              Continue shopping
            </Link>
          </div>
        ) : product ? (
          <section className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div
              className="rounded-2xl border p-4 sm:p-5"
              style={{ background: "#FFFFFF", borderColor: "#E0DEFB" }}
            >
              <div
                className="relative aspect-4/5 overflow-hidden rounded-xl"
                style={{ background: "#FFFFFF" }}
              >
                <Image
                  src={product.images[0] || "/placeholder-product-1.jpg"}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>

            <div
              className="rounded-2xl border p-5 sm:p-6"
              style={{ background: "#FFFFFF", borderColor: "#E0DEFB" }}
            >
              <span
                className="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                style={{ background: "#EDEDFD", color: "#4F46E5" }}
              >
                {product.category}
              </span>

              <h1
                className="mt-3 text-3xl sm:text-4xl font-bold"
                style={{ color: "#1A1A2E", fontFamily: "var(--font-heading)" }}
              >
                {product.name}
              </h1>

              <p
                className="mt-2 text-sm sm:text-base font-medium"
                style={{ color: "#3D3D4E" }}
              >
                by {product.vendorName}
              </p>

              <div className="mt-5">
                <p className="text-3xl font-bold" style={{ color: "#1A1A2E" }}>
                  ₹{formatPrice(product.price)}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {product.stock > 0 ? (
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold"
                    style={{ background: "#DCFCE7", color: "#15803D" }}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    In stock ({product.stock} available)
                  </span>
                ) : (
                  <span
                    className="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                    style={{ background: "#F3F4F6", color: "#6B7280" }}
                  >
                    Out of stock
                  </span>
                )}
              </div>

              <p className="mt-5 leading-7" style={{ color: "#3D3D4E" }}>
                {product.description}
              </p>

              <div className="mt-6 flex items-center gap-3">
                <label
                  htmlFor="qty"
                  className="text-sm font-semibold"
                  style={{ color: "#1A1A2E" }}
                >
                  Quantity
                </label>
                <select
                  id="qty"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="rounded-lg border px-3 py-2 text-sm outline-none"
                  style={{
                    borderColor: "#E0DEFB",
                    background: "#FFFFFF",
                    color: "#1A1A2E",
                  }}
                  disabled={product.stock === 0}
                >
                  {Array.from(
                    { length: Math.max(1, Math.min(5, product.stock)) },
                    (_, i) => i + 1,
                  ).map((qty) => (
                    <option key={qty} value={qty}>
                      {qty}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ background: "#4F46E5", color: "#FFFFFF" }}
                >
                  <ShoppingCart className="h-4 w-4" />
                  Add to cart
                </button>

                <Link
                  href="/products"
                  className="inline-flex items-center justify-center rounded-lg border px-4 py-3 text-sm font-semibold"
                  style={{
                    borderColor: "#4F46E5",
                    color: "#4F46E5",
                    background: "#FFFFFF",
                  }}
                >
                  Keep browsing
                </Link>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div
                  className="flex items-start gap-2 rounded-xl border p-3"
                  style={{ borderColor: "#E0DEFB", background: "#FFFFFF" }}
                >
                  <Truck
                    className="mt-0.5 h-4 w-4"
                    style={{ color: "#4F46E5" }}
                  />
                  <p className="text-xs leading-5" style={{ color: "#3D3D4E" }}>
                    Fast local shipping with secure delivery tracking.
                  </p>
                </div>

                <div
                  className="flex items-start gap-2 rounded-xl border p-3"
                  style={{ borderColor: "#E0DEFB", background: "#FFFFFF" }}
                >
                  <ShieldCheck
                    className="mt-0.5 h-4 w-4"
                    style={{ color: "#4F46E5" }}
                  />
                  <p className="text-xs leading-5" style={{ color: "#3D3D4E" }}>
                    Verified vendor and secure checkout protection.
                  </p>
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
