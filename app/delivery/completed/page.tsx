"use client";

import React, { useEffect, useState, useMemo } from "react";
import { authFetch } from "@/lib/auth-fetch";
import { DeliveryHeader } from "@/components/delivery-header";
import { API_BASE_URL } from "@/lib/config";
import {
  CheckCircle2,
  Package,
  ShoppingBag,
  User,
  TrendingUp,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  Loader2,
  Zap,
  Target,
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
      } catch (err) {
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
    <div
      className="min-h-screen bg-slate-50 font-body pb-24"
      style={{ fontFamily: "var(--font-dm-sans)" }}
    >
      <DeliveryHeader
        title="Delivery Records"
        subtitle="Your successful completions today."
      />

      <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        {/* COMPACT HIGH-PROMINENCE SUMMARY CARD */}
        {!loading && !error && deliveries.length > 0 && (
          <section className="bg-slate-950 rounded-[2rem] p-6 sm:p-8 shadow-xl shadow-orange-900/20 text-white relative overflow-hidden group">
            {/* Resized Static Orange Architectural Element */}
            <div className="absolute right-0 top-0 w-28 h-28 sm:w-40 sm:h-40 bg-orange-600 rounded-bl-[5rem] sm:rounded-bl-[8rem] z-0 shadow-[-10px_10px_30px_rgba(0,0,0,0.3)]" />
            
            <div className="absolute right-6 top-6 sm:right-8 sm:top-8 z-20">
               <Zap className="text-white fill-white/20 w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2.5 mb-6">
                <div className="h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(234,88,12,1)]" />
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-orange-500">Fleet Performance</p>
              </div>
              
              <div className="flex items-center gap-4 sm:gap-5">
                <span className="text-5xl sm:text-6xl font-black tracking-tighter text-white drop-shadow-xl">
                  {deliveries.length}
                </span>
                <div className="h-10 sm:h-12 w-0.5 bg-orange-600/30 rounded-full" />
                <div className="flex flex-col">
                   <p className="text-base sm:text-lg font-black uppercase tracking-tight text-orange-600">Completions</p>
                   <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">Delivered Today</p>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3">
                 <div className="bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-xl backdrop-blur-md flex items-center gap-2.5">
                    <ShieldCheck size={12} className="text-emerald-500" />
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Security-Synced Records</p>
                 </div>
              </div>
            </div>
          </section>
        )}

        {loading ? (
          <div className="flex flex-col items-center py-20 text-slate-400">
            <Loader2 className="animate-spin mb-3 text-orange-600" size={32} />
            <p className="text-xs font-bold uppercase tracking-widest italic">Syncing Ledger...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-100 rounded-[2rem] p-8 text-center text-rose-700 shadow-sm flex flex-col items-center gap-4">
            <AlertCircle size={32} className="opacity-40" />
            <p className="text-sm font-black uppercase tracking-widest">{error}</p>
          </div>
        ) : deliveries.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-12 text-center border border-dashed border-slate-200 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-slate-100 shadow-inner">
              <Package size={40} className="text-slate-200" />
            </div>
            <p className="text-base font-black text-slate-900 uppercase tracking-tight">Ledger Empty</p>
            <p className="text-xs text-slate-400 mt-2 max-w-[220px] mx-auto font-medium leading-relaxed italic">
              New successful deliveries will manifest here in real-time.
            </p>
            <Link
              href="/delivery/dashboard"
              className="mt-8 inline-flex items-center gap-3 rounded-[1.25rem] bg-orange-600 px-8 py-4 text-xs font-black text-white uppercase tracking-widest hover:bg-orange-700 transition-all shadow-xl shadow-orange-100 active:scale-95"
            >
              Enter Dashboard <ChevronRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {deliveries.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-[2.5rem] border border-border shadow-sm overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500"
              >
                <div className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm group-hover:scale-110 transition-transform duration-500">
                        <CheckCircle2 size={24} />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Timestamp</p>
                        <p className="text-base font-black text-slate-950">
                          {formatTime(order.updatedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex flex-col items-end gap-0.5">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Commission</p>
                        <p className="text-2xl font-black text-emerald-600 tracking-tighter">₹40</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Order ₹{parseFloat(order.totalAmount).toLocaleString("en-IN")}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="relative pl-10 space-y-6">
                      <div className="absolute left-4 top-2 bottom-2 w-px border-l-2 border-dashed border-slate-100" />
                      
                      <div className="relative">
                        <div className="absolute -left-10 top-0 h-8 w-8 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                           <ShoppingBag size={14} />
                        </div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pickup Origin</p>
                        <p className="text-sm font-black text-slate-900 truncate">
                          {order.vendor.businessName}
                        </p>
                      </div>

                      <div className="relative">
                        <div className="absolute -left-10 top-0 h-8 w-8 rounded-xl bg-slate-950 text-white flex items-center justify-center shadow-lg">
                           <User size={14} />
                        </div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Customer Link</p>
                        <p className="text-sm font-black text-slate-900 truncate">
                          {order.shippingFullName}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-1 font-medium italic opacity-70">
                          {order.shippingAddressLine1}, {order.shippingCity}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-between pt-8 border-t border-slate-50">
                    <div className="flex items-center gap-4">
                       <div className="flex -space-x-3">
                        {order.items.slice(0, 3).map((item, idx) => (
                          <div
                            key={item.id}
                            className="h-10 w-10 rounded-xl border-4 border-white bg-slate-100 overflow-hidden shadow-sm hover:z-10 hover:scale-110 transition-all cursor-pointer"
                          >
                            {item.product.imageUrl ? (
                              <img
                                src={item.product.imageUrl}
                                alt={item.product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-[10px] text-slate-400">
                                ?
                              </div>
                            )}
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <div className="h-10 w-10 rounded-xl border-4 border-white bg-slate-950 flex items-center justify-center text-[10px] font-black text-white shadow-sm hover:z-10 hover:scale-110 transition-all cursor-pointer">
                            +{order.items.length - 3}
                          </div>
                        )}
                       </div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {order.items.reduce((acc, i) => acc + i.quantity, 0)} Units Logged
                      </p>
                    </div>

                    <div className="hidden sm:flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ref:</span>
                      <span className="text-[10px] font-black text-slate-900">{order.id.slice(-8).toUpperCase()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PERFORMANCE BADGE */}
        {!loading && deliveries.length > 0 && (
           <div className="bg-orange-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-orange-100">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              <div className="relative z-10 flex items-start gap-5">
                 <div className="bg-white/20 p-3 rounded-2xl">
                    <Target size={24} className="text-white" />
                 </div>
                 <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-200 mb-1">Status Mastery</p>
                    <p className="text-sm font-bold leading-relaxed">Your delivery performance is in the top 5% today. Consistent precision unlocks "Swift-Carrier" perks.</p>
                 </div>
              </div>
           </div>
        )}
      </div>
    </div>
  );
}
