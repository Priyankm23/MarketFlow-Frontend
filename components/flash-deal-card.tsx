"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, Clock } from "lucide-react";
import { FlashDeal } from "@/lib/types";

interface FlashDealCardProps {
  deal: FlashDeal;
}

export function FlashDealCard({ deal }: FlashDealCardProps) {
  const [timeLeft, setTimeLeft] = useState(deal.timeTillValidSeconds);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return "00:00:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const product = deal.product;
  const imageUrl =
    product.imageUrls?.[0] || product.imageUrl || "/placeholder-product-1.jpg";

  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex flex-col bg-white border border-red-100 rounded-none overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-red-200"
    >
      {/* Image Container */}
      <div className="aspect-[3/4] relative overflow-hidden bg-zinc-50">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-1000 group-hover:scale-110"
        />

        {/* Flash Sale Badge */}
        <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-red-600 text-[10px] font-black text-white uppercase tracking-tighter shadow-md">
          {Math.round(deal.discountPercentage)}% OFF
        </div>

        {/* Timer Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2.5 flex items-center justify-start gap-1.5">
          <Clock size={14} className="text-red-500 stroke-[2.5]" />
          <span className="text-[12px] font-black text-white uppercase tracking-widest flex items-center gap-1.5">
            Ends in:{" "}
            <span className="text-white font-mono tracking-widest text-[13px]">
              {formatTime(timeLeft)}
            </span>
          </span>
        </div>
      </div>

      {/* Info Container */}
      <div className="p-3.5 flex flex-col gap-1 bg-white">
        <h4 className="text-[15px] font-medium text-black tracking-tight truncate group-hover:text-red-600 transition-colors">
          {product.name}
        </h4>

        <p className="text-[13px] font-semibold text-zinc-500 truncate">
          {product.vendorBusinessName || "Verified Vendor"}
        </p>

        <div className="flex items-end justify-between mt-2">
          <div className="flex flex-col gap-1 min-w-0 pr-1">
            <span className="text-[18px] font-black text-black leading-none truncate">
              ₹{product.priceAfterFlashDeal.toLocaleString()}
            </span>
            <span className="text-[13px] text-zinc-400 line-through font-bold truncate">
              ₹{product.originalPrice.toLocaleString()}
            </span>
          </div>

          {/* Rating Badge */}
          <div className="flex items-center gap-1 shrink-0 px-1.5 py-0.5 mb-0.5 text-white bg-black rounded shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
            <span className="text-[11px] font-black">
              {product.rating.toFixed(1)}
            </span>
            <Star size={9} className="fill-red-600 text-red-600" />
          </div>
        </div>
      </div>
    </Link>
  );
}
