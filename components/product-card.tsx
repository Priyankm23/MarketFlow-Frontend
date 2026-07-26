"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
  compact?: boolean;
}

export function ProductCard({ product, compact = false }: ProductCardProps) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex flex-col transition-all duration-300"
    >
      {/* Image & Rating Overlay */}
      <div
        className={`${
          compact ? "aspect-square" : "aspect-[3/4]"
        } relative overflow-hidden bg-white rounded-lg border border-zinc-200/60 shadow-sm group-hover:shadow-lg transition-all duration-500`}
      >
        <Image
          src={product.images[0] || "/placeholder-product-1.jpg"}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* Rating Badge Overlay (Bottom Left) */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-0.5 bg-white/90 backdrop-blur-sm rounded-md shadow-sm border border-zinc-100">
          <span className="text-[10px] font-black text-black">
            {product.rating.toFixed(1)}
          </span>
          <Star
            size={10}
            className="fill-[var(--brand-accent)] text-[var(--brand-accent)]"
          />
          <div className="w-px h-2 bg-zinc-300 mx-0.5" />
          <span className="text-[9px] font-bold text-zinc-500">
            {product.reviewCount > 1000
              ? (product.reviewCount / 1000).toFixed(1) + "k"
              : product.reviewCount}
          </span>
        </div>

        {/* Stock Warning Badge */}
        {product.stock < 5 && product.stock > 0 && (
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-red-600 text-[8px] font-black text-white uppercase tracking-tighter rounded shadow-sm">
            Low Stock
          </div>
        )}

        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
            <span className="text-white font-black text-xs uppercase tracking-widest">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Info Container */}
      <div className={`${compact ? "mt-2.5 px-0.5" : "mt-4 px-1"} flex flex-col gap-0.5`}>
        <h4 className={`${compact ? "text-[13px]" : "text-[14px]"} font-black text-black tracking-tight truncate group-hover:text-[var(--brand-accent)] transition-colors`}>
          {product.vendorName}
        </h4>

        <p className={`${compact ? "text-[12px]" : "text-[13px]"} font-medium text-zinc-500 line-clamp-1 mb-0.5 leading-tight`}>
          {product.name}
        </p>

        <div className="flex items-baseline gap-2 mt-0.5">
          <span className={`${compact ? "text-[13px]" : "text-[14px]"} font-black text-black`}>
            ₹{product.price.toLocaleString()}
          </span>
        </div>
      </div>
    </Link>
  );
}
