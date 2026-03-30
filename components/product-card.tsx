"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, ShoppingCart, Heart } from "lucide-react";
import { Product } from "@/lib/types";
import { useCartStore } from "@/lib/store";

interface ProductCardProps {
  product: Product;
  variant?: "default" | "compact";
}

export function ProductCard({
  product,
  variant = "default",
}: ProductCardProps) {
  const [liked, setLiked] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      productId: product.id,
      quantity: 1,
      price: product.price,
      product,
    });
  };

  const discountPercent = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100,
      )
    : 0;

  if (variant === "compact") {
    return (
      <Link href={`/products/${product.id}`}>
        <div className="bg-card border border-border rounded-lg overflow-hidden transition-shadow duration-300 h-full flex flex-col cursor-pointer group transform-gpu motion-safe:transition-transform motion-safe:duration-300 hover:-translate-y-0.5 hover:shadow-lg">
          <div className="relative aspect-square bg-white overflow-hidden">
            {product.images[0] && (
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                onLoadingComplete={() => setImageLoading(false)}
              />
            )}
            {discountPercent > 0 && (
              <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-destructive text-destructive-foreground px-2 py-1 rounded text-xs font-bold">
                -{discountPercent}%
              </div>
            )}
          </div>
          <div className="p-4 sm:p-4 flex-1 flex flex-col justify-between gap-3 sm:gap-2">
            <h3
              className="font-normal text-lg sm:text-base line-clamp-2 leading-tight"
              style={{ fontFamily: "var(--font-instrument-serif)" }}
            >
              {product.name}
            </h3>
            <div>
              <div className="flex items-center gap-1 mt-1">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < Math.floor(product.rating)
                          ? "fill-primary text-primary"
                          : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  ({product.reviewCount})
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="font-bold text-xl text-primary">
                  ₹{product.price}
                </span>
                {product.originalPrice && (
                  <span className="line-through text-sm text-muted-foreground">
                    ₹{product.originalPrice}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/products/${product.id}`}>
      <div className="bg-card border border-border rounded-lg overflow-hidden transition-shadow duration-300 h-full flex flex-col cursor-pointer group transform-gpu motion-safe:transition-transform motion-safe:duration-300 hover:-translate-y-1 hover:shadow-xl">
        {/* Image Section */}
        <div className="relative aspect-square bg-white overflow-hidden">
          {product.images[0] && (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              onLoadingComplete={() => setImageLoading(false)}
            />
          )}

          {/* Discount Badge */}
          {discountPercent > 0 && (
            <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-sm font-bold">
              -{discountPercent}%
            </div>
          )}

          {/* Action Buttons */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button
              onClick={handleAddToCart}
              className="p-3 bg-primary text-primary-foreground rounded-full hover:scale-110 transition-transform duration-200 shadow-lg"
              title="Add to cart"
            >
              <ShoppingCart className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                setLiked(!liked);
              }}
              className="p-3 bg-card text-foreground rounded-full hover:scale-110 transition-transform duration-200 shadow-lg"
              title="Add to wishlist"
            >
              <Heart
                className={`w-5 h-5 ${liked ? "fill-destructive text-destructive" : ""}`}
              />
            </button>
          </div>

          {/* Stock Info */}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white font-bold text-xl">Out of Stock</span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3 sm:gap-4">
          {/* Vendor Info */}
          <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
            {product.vendorName}
          </div>

          {/* Product Name */}
          <h3
            className="font-normal text-lg sm:text-xl line-clamp-2 leading-tight group-hover:text-primary transition-colors"
            style={{ fontFamily: "var(--font-instrument-serif)" }}
          >
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(product.rating)
                      ? "fill-primary text-primary"
                      : "text-muted-foreground"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-bold text-foreground">
              {product.rating.toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground">
              ({product.reviewCount} reviews)
            </span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2.5">
            <span className="text-xl font-bold text-primary">
              ₹{product.price}
            </span>
            {product.originalPrice && (
              <span className="line-through text-sm text-muted-foreground">
                ₹{product.originalPrice}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
