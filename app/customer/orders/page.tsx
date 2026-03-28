"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { authFetch } from "@/lib/auth-fetch";
import {
  CheckCircle2,
  Circle,
  Clock3,
  Loader2,
  Package,
  ShoppingBag,
  ChevronRight,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/config";

const ORDERS_API_BASE_URL = API_BASE_URL;

type OrderStatusFilter = "all" | "active" | "delivered" | "cancelled";

type ApiOrderItem = {
  id?: string;
  productId?: string;
  quantity?: number;
  price?: number;
  product?: {
    name?: string;
    imageUrl?: string | null;
  };
};

type ApiOrder = {
  id: string;
  totalAmount?: number;
  status?: string;
  createdAt?: string;
  vendor?: { businessName?: string };
  items?: ApiOrderItem[];
};

type ApiOrdersResponse = {
  status?: string;
  message?: string;
  data?: ApiOrder[];
};

const TIMELINE_STEPS = [
  "Order Confirmed",
  "Sent to Vendor",
  "Vendor Packed",
  "Out for Delivery",
  "Delivered",
] as const;

const normalizeStatus = (status?: string) =>
  (status || "PENDING").trim().toUpperCase();

const isDelivered = (status?: string) =>
  normalizeStatus(status) === "DELIVERED";

const isCancelled = (status?: string) => {
  const normalized = normalizeStatus(status);
  return normalized === "CANCELLED" || normalized === "FAILED";
};

const shouldShowTimeline = (status?: string) => {
  const normalized = normalizeStatus(status);
  return (
    normalized !== "DELIVERED" &&
    [
      "PAID",
      "CONFIRMED",
      "PACKED",
      "OUT_FOR_DELIVERY",
      "IN_TRANSIT",
      "SHIPPED",
    ].includes(normalized)
  );
};

const getTimelineStepIndex = (status?: string) => {
  const normalized = normalizeStatus(status);

  if (normalized === "DELIVERED") return 5;
  if (["OUT_FOR_DELIVERY", "IN_TRANSIT", "SHIPPED"].includes(normalized))
    return 4;
  if (normalized === "PACKED") return 3;
  if (["PAID", "CONFIRMED"].includes(normalized)) return 2;
  return 1;
};

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function OrdersPage() {
  const [selectedStatus, setSelectedStatus] =
    useState<OrderStatusFilter>("all");
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError("");

      try {
        const endpoints = [
          `${ORDERS_API_BASE_URL}/orders/my-orders`,
          `${ORDERS_API_BASE_URL}/my-orders`,
          `${API_BASE_URL}/orders/my-orders`,
        ];

        let loaded = false;
        let lastError = "Unable to load your orders";

        for (const endpoint of endpoints) {
          const response = await authFetch(endpoint, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            lastError = payload?.message || "Unable to load your orders";
            continue;
          }

          const payload: ApiOrdersResponse = await response
            .json()
            .catch(() => ({}));

          setOrders(Array.isArray(payload?.data) ? payload.data : []);
          loaded = true;
          break;
        }

        if (!loaded) {
          throw new Error(lastError);
        }
      } catch (fetchError) {
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to load orders",
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    if (selectedStatus === "all") {
      return orders;
    }

    if (selectedStatus === "active") {
      return orders.filter(
        (order) => !isDelivered(order.status) && !isCancelled(order.status),
      );
    }

    if (selectedStatus === "delivered") {
      return orders.filter((order) => isDelivered(order.status));
    }

    return orders.filter((order) => isCancelled(order.status));
  }, [orders, selectedStatus]);

  const stats = useMemo(
    () => [
      { label: "Total Orders", value: orders.length, Icon: ShoppingBag },
      {
        label: "Active",
        value: orders.filter(
          (order) => !isDelivered(order.status) && !isCancelled(order.status),
        ).length,
        Icon: Clock3,
      },
      {
        label: "Delivered",
        value: orders.filter((order) => isDelivered(order.status)).length,
        Icon: CheckCircle2,
      },
    ],
    [orders],
  );

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <Navbar />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-2 mb-8 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
          <Link href="/" className="hover:text-black">Home</Link>
          <ChevronRight size={12} />
          <span className="text-black">My Orders</span>
        </div>

        <div className="mb-10">
          <h1 className="text-4xl sm:text-5xl font-black text-black uppercase tracking-tighter mb-2">
            Purchase History
          </h1>
          <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">
            Track, manage and reorder your favorite items
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-10">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white border border-[var(--border-default)] rounded-xl p-3 sm:p-6 shadow-sm group hover:border-[var(--brand-accent)] transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:mb-4">
                <div className="inline-flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-[var(--bg-sunken)] group-hover:bg-[var(--brand-accent-soft)] transition-colors">
                  <stat.Icon className="h-4 w-4 sm:h-5 sm:w-5 text-black group-hover:text-[var(--brand-accent)] transition-colors" />
                </div>
                <span className="text-lg sm:text-2xl font-black text-black tracking-tighter">
                  {stat.value}
                </span>
              </div>
              <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-wider sm:tracking-[0.2em] text-[var(--text-muted)] truncate">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-8 border-b border-[var(--border-default)] overflow-x-auto scrollbar-hide">
          {[
            { value: "all" as const, label: "All Orders" },
            { value: "active" as const, label: "Active" },
            { value: "delivered" as const, label: "Delivered" },
            { value: "cancelled" as const, label: "Cancelled" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSelectedStatus(tab.value)}
              className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest whitespace-nowrap border-b-2 transition-all ${
                selectedStatus === tab.value
                  ? "text-black border-black"
                  : "text-zinc-400 border-transparent hover:text-black"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-24 bg-white border border-[var(--border-default)] rounded-xl shadow-sm">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[var(--brand-accent)]" />
            <p className="text-sm font-black uppercase tracking-widest text-black">Fetching your orders...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-white border border-[var(--border-default)] rounded-xl shadow-sm">
            <Package className="w-12 h-12 mx-auto text-zinc-300 mb-4" />
            <h3 className="text-lg font-black text-black uppercase tracking-tight">Could not load orders</h3>
            <p className="text-zinc-500 text-sm mt-2">{error}</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-white border border-[var(--border-default)] rounded-xl shadow-sm">
            <div className="w-20 h-20 bg-[var(--bg-sunken)] rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag size={32} className="text-zinc-300" />
            </div>
            <h3 className="text-xl font-black text-black uppercase tracking-tight">No orders found</h3>
            <p className="text-zinc-500 text-sm mt-2 max-w-xs mx-auto">You haven&apos;t placed any orders in this category yet.</p>
            <Link
              href="/products"
              className="mt-8 inline-block px-8 py-3 bg-black text-white rounded-full font-black text-xs uppercase tracking-widest hover:bg-[var(--brand-accent)] transition-colors shadow-lg"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredOrders.map((order) => {
              const status = normalizeStatus(order.status);
              const stepIndex = getTimelineStepIndex(order.status);

              return (
                <Link
                  key={order.id}
                  href={`/customer/orders/${order.id}`}
                  className="group block bg-white border border-[var(--border-default)] rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:border-black/5 transition-all relative cursor-pointer"
                >
                  {/* ABSOLUTE PRICE AND STATUS FOR TOP RIGHT POS */}
                  <div className="absolute top-6 right-6 sm:top-8 sm:right-8 flex flex-col items-end gap-2 z-20 text-right">
                    <p className="text-2xl sm:text-3xl font-black text-black tracking-tighter leading-none">
                      ₹{Number(order.totalAmount || 0).toLocaleString()}
                    </p>
                    <span className={`inline-flex items-center px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest border ${
                      isCancelled(order.status) 
                        ? "bg-red-50 text-red-600 border-red-100" 
                        : isDelivered(order.status)
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : "bg-[var(--bg-sunken)] text-black border-[var(--border-default)]"
                    }`}>
                      {status.replaceAll("_", " ")}
                    </span>
                  </div>

                  <div className="p-6 sm:p-8 space-y-10">
                    {/* Products List - each product full size */}
                    <div className="space-y-8 pr-0 sm:pr-32"> {/* padding right to avoid overlap with absolute price */}
                      {order.items?.map((item, itemIdx) => (
                        <div key={itemIdx} className="flex flex-col sm:flex-row sm:items-start gap-6 group/item">
                          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-[var(--bg-sunken)] shrink-0 border border-[var(--border-default)]">
                            <img
                              src={item.product?.imageUrl || "/placeholder-product-1.jpg"}
                              alt="Product"
                              className="w-full h-full object-cover transition-transform duration-700 group-hover/item:scale-110"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="px-2 py-0.5 bg-[var(--brand-accent-soft)] text-[8px] font-black text-[var(--brand-accent)] uppercase tracking-widest rounded">Assured</span>
                              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                                Vendor: <span className="text-black">{order.vendor?.businessName || "Verified Vendor"}</span>
                              </span>
                            </div>
                            <h3 className="text-xl sm:text-2xl font-black text-black leading-tight tracking-tight uppercase mb-2 max-w-[80%] sm:max-w-none">
                              {item.product?.name || "Product Name"}
                            </h3>
                            
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3">
                              <span className="text-xs font-medium text-[var(--brand-accent)] uppercase tracking-widest">
                                Order ID: {order.id.slice(-12).toUpperCase()}
                              </span>
                              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Clock3 size={12} className="text-zinc-300" />
                                {formatDate(order.createdAt)}
                              </span>
                            </div>

                            <span className="text-xs font-bold text-zinc-400 uppercase">Qty: {item.quantity}</span>
                          </div>
                        </div>
                      ))}
                    </div>


                    {shouldShowTimeline(order.status) && (
                      <div className="rounded-xl bg-black p-6 sm:p-8 overflow-hidden">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--brand-accent)] mb-6">
                          Track Progress
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-y-8 relative">
                          {/* Mobile Vertical Connector Line (placed behind circles) */}
                          <div className="sm:hidden absolute left-[11px] top-2 bottom-2 w-[2px] bg-zinc-800 z-0">
                            <div 
                              className="w-full bg-[var(--brand-accent)] transition-all duration-1000" 
                              style={{ height: `${Math.max(0, Math.min(100, (stepIndex - 1) / (TIMELINE_STEPS.length - 1) * 100))}%` }}
                            />
                          </div>

                          {TIMELINE_STEPS.map((step, index) => {
                            const completed = index + 1 <= stepIndex;
                            const isCurrent = index + 1 === stepIndex;
                            return (
                              <div key={step} className="relative group/step z-10">
                                {/* Desktop Horizontal Connector Line */}
                                {index < TIMELINE_STEPS.length - 1 && (
                                  <div className="hidden sm:block absolute top-[12px] left-6 w-full h-[2px] bg-zinc-800 z-0">
                                    <div className={`h-full bg-[var(--brand-accent)] transition-all duration-1000 ${index + 1 < stepIndex ? 'w-full' : 'w-0'}`} />
                                  </div>
                                )}
                                <div className="flex sm:flex-col items-center gap-4 sm:gap-4 relative z-10">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all duration-500 shrink-0 ${
                                    completed 
                                      ? 'bg-[var(--brand-accent)] border-[var(--brand-accent)] shadow-[0_0_15px_rgba(255,0,0,0.3)]' 
                                      : 'bg-black border-zinc-800'
                                  }`}>
                                    {completed && <CheckCircle2 size={14} className="text-white" />}
                                  </div>
                                  <span className={`text-[12px] sm:text-sm font-black uppercase tracking-tighter sm:text-center transition-colors ${
                                    completed ? 'text-white' : 'text-zinc-600'
                                  } ${isCurrent ? 'text-[var(--brand-accent)]' : ''}`}>
                                    {step}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-between border-t border-[var(--border-default)] mt-4 pt-6">
                      <div className="group flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-black group-hover:text-[var(--brand-accent)] transition-colors">
                        View Detailed Order Summary
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
