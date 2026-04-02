"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { FlashDealCard } from "@/components/flash-deal-card";
import { FlashDeal } from "@/lib/types";
import { API_BASE_URL } from "@/lib/config";

export default function DealsPage() {
  const [flashDeals, setFlashDeals] = useState<FlashDeal[]>([]);
  const [flashDealsLoading, setFlashDealsLoading] = useState(true);

  useEffect(() => {
    const fetchFlashDeals = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/flash-deals?limit=10`);
        const payload = await response.json().catch(() => ({}));

        if (response.ok && payload.status === "success") {
          setFlashDeals(payload.data || []);
        } else {
          setFlashDeals([]);
        }
      } catch {
        setFlashDeals([]);
      } finally {
        setFlashDealsLoading(false);
      }
    };

    void fetchFlashDeals();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-350 mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-2 mb-8 text-[10px] font-black uppercase tracking-widest text-(--text-muted)">
          <Link href="/" className="hover:text-black">
            Home
          </Link>
          <ChevronRight size={12} />
          <span className="text-black">Today&apos;s Deals</span>
        </div>

        <section className="py-2 sm:py-4">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl sm:text-6xl font-black text-black uppercase tracking-tighter leading-none">
                Flash{" "}
                <span className="text-red-600 underline decoration-black decoration-4 underline-offset-8">
                  Deals
                </span>
              </h1>
              <p className="text-(--text-muted) text-[10px] font-bold uppercase tracking-widest mt-6">
                Limited time offers from the home page flash deals section
              </p>
            </div>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
            {flashDealsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-none w-[185px] h-[320px] bg-[var(--bg-sunken)] animate-pulse rounded-none"
                />
              ))
            ) : flashDeals.length > 0 ? (
              flashDeals.map((deal) => (
                <div key={deal.id} className="flex-none w-[185px]">
                  <FlashDealCard deal={deal} />
                </div>
              ))
            ) : (
              <div className="w-full py-10 text-center text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] border-2 border-dashed border-[var(--border-default)]">
                No active flash deals at the moment.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
