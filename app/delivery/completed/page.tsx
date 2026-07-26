"use client";

import React, { useEffect, useState } from "react";
import { authFetch } from "@/lib/auth-fetch";
import { DeliveryHeader } from "@/components/delivery-header";
import { API_BASE_URL } from "@/lib/config";
import {
  CheckCircle2,
  Package,
  ShoppingBag,
  TrendingUp,
  AlertCircle,
  Loader2,
  Zap,
} from "lucide-react";
import Link from "next/link";

const DELIVERY_API_BASE_URL = `${API_BASE_URL}/delivery`;

type CompletedOrder = {
  id: string;
  totalAmount: string;
  shippingFullName: string;
  shippingAddressLine1: string;
  shippingAddressLine2?: string;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  updatedAt: string;
  vendor: {
    businessName: string;
  };
  items: Array<{
    id: string;
    product: {
      name: string;
      imageUrl: string;
    };
    quantity: number;
  }>;
};

export default function CompletedDeliveriesPage() {
  const [deliveries, setDeliveries] = useState<CompletedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await authFetch(
          `${DELIVERY_API_BASE_URL}/deliveries/today`,
          {
            method: "GET",
            credentials: "include",
          },
        );
        if (res.ok) {
          const payload = await res.json();
          if (payload.success) {
            setDeliveries(payload.data || []);
          }
        } else {
          setError("Failed to fetch today's deliveries.");
        }
      } catch {
        setError("Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-black antialiased pb-24">
      <DeliveryHeader
        title="Delivery Records"
        subtitle="Your successful completions today."
      />

      <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        {/* SUMMARY CARD */}
        {!loading && !error && deliveries.length > 0 && (
          <section className="bg-white rounded-md p-6 sm:p-8 shadow-sm border border-[var(--border-default)] text-black relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <p className="text-xs font-bold text-black uppercase tracking-wider">
                  Today&apos;s Summary
                </p>
              </div>
              <div className="h-9 w-9 rounded-md bg-zinc-100 flex items-center justify-center text-black">
                <Zap size={18} />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-bold tracking-tight text-black">
                  ₹{deliveries.length * 40}
                </span>
                <p className="text-xs font-bold text-zinc-500">Payout Earned</p>
              </div>

              <div className="h-8 w-px bg-zinc-200" />

              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-bold tracking-tight text-black">
                  {deliveries.length}
                </span>
                <p className="text-xs font-bold text-zinc-500">Completed</p>
              </div>
            </div>
          </section>
        )}

        {/* LOADING & ERROR STATES */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <Loader2 className="animate-spin mb-3 text-black" size={24} />
            <p className="text-xs font-semibold">Loading delivery log...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start gap-3 text-red-700">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p className="text-xs font-medium">{error}</p>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && deliveries.length === 0 && (
          <div className="bg-white rounded-md p-10 border border-[var(--border-default)] text-center shadow-sm space-y-4">
            <div className="w-14 h-14 rounded-md bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
              <Package size={28} />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-black">No Deliveries Completed Today</h2>
              <p className="text-xs text-zinc-500 font-medium max-w-xs mx-auto">
                Completed delivery tasks for today will appear here as soon as you finish them.
              </p>
            </div>
            <Link
              href="/delivery/dashboard"
              className="inline-flex items-center justify-center h-10 px-5 rounded-md bg-black text-white text-xs font-bold hover:bg-zinc-800 transition-colors shadow-sm"
            >
              Return to Dashboard
            </Link>
          </div>
        )}

        {/* DELIVERIES LIST */}
        {!loading && deliveries.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider px-1">
              Completed Tasks ({deliveries.length})
            </h2>

            {deliveries.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-md border border-[var(--border-default)] p-5 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between gap-2 border-b border-[var(--border-default)] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold rounded-md flex items-center gap-1">
                      <CheckCircle2 size={12} /> Delivered
                    </span>
                    <span className="text-xs font-bold text-black">
                      #{order.id.slice(-6).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-zinc-500">
                    {formatTime(order.updatedAt)}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-zinc-700 font-medium">
                    <ShoppingBag size={14} className="text-black shrink-0" />
                    <span>Vendor: <strong className="text-black">{order.vendor.businessName}</strong></span>
                  </div>
                  <div className="text-zinc-600 font-medium pl-5">
                    Destination: {order.shippingAddressLine1}, {order.shippingCity}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[var(--border-default)] text-xs">
                  <span className="font-semibold text-zinc-500">Earnings</span>
                  <span className="font-bold text-black">₹40.00 Base Fee</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
