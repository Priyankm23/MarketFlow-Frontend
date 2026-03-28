"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  CheckCircle2, 
  Circle, 
  Loader2, 
  Package, 
  ChevronRight, 
  ArrowLeft,
  Clock3,
  MapPin,
  Truck,
  ShieldCheck,
  ShoppingBag
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { authFetch } from "@/lib/auth-fetch";
import { API_BASE_URL } from "@/lib/config";

type OrderItem = {
  id?: string;
  productId?: string;
  quantity?: number;
  price?: number;
  product?: {
    name?: string;
    imageUrl?: string | null;
  };
};

type OrderEvent = {
  id?: string;
  status?: string;
  note?: string;
  createdAt?: string;
};

type OrderDetails = {
  id?: string;
  status?: string;
  totalAmount?: number;
  shippingFullName?: string;
  shippingEmail?: string;
  shippingPhoneNumber?: string;
  shippingAddressLine1?: string;
  shippingAddressLine2?: string | null;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  vendor?: {
    businessName?: string;
  };
  items?: OrderItem[];
  events?: OrderEvent[];
  createdAt?: string;
};

type OrderDetailsResponse = {
  status?: string;
  message?: string;
  data?: OrderDetails;
};

const TRACKING_STEPS = [
  "Order Confirmed",
  "Sent to Vendor",
  "Vendor Packed",
  "Out for Delivery",
  "Delivered",
] as const;

const normalizeStatus = (status?: string) =>
  (status || "PENDING").trim().toUpperCase();

const statusToStepIndex = (status?: string) => {
  const normalized = normalizeStatus(status);
  if (["DELIVERED"].includes(normalized)) return 5;
  if (["OUT_FOR_DELIVERY", "IN_TRANSIT", "SHIPPED"].includes(normalized)) return 4;
  if (["PACKED"].includes(normalized)) return 3;
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

export default function OrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const orderId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      setError("Order ID is missing");
      return;
    }

    const fetchOrder = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await authFetch(`${API_BASE_URL}/orders/${orderId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload?.message || "Unable to load order details");
        }
        const payload: OrderDetailsResponse = await response.json().catch(() => ({}));
        if (!payload?.data) throw new Error("Order details are missing");
        setOrder(payload.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load order");
      } finally {
        setLoading(false);
      }
    };
    void fetchOrder();
  }, [orderId]);

  const stepIndex = useMemo(() => statusToStepIndex(order?.status), [order?.status]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)]">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-24 text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-[var(--brand-accent)]" />
          <p className="text-sm font-black uppercase tracking-widest text-black">Loading Order Details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)]">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 py-24">
          <div className="bg-white border border-[var(--border-default)] rounded-xl p-12 text-center space-y-6 shadow-sm">
            <Package className="w-12 h-12 mx-auto text-zinc-300" />
            <h1 className="text-2xl font-black text-black uppercase tracking-tight">Order Not Found</h1>
            <p className="text-zinc-500 text-sm">{error || "This order details could not be retrieved."}</p>
            <Link
              href="/customer/orders"
              className="inline-block px-8 py-3 bg-black text-white rounded-full font-black text-xs uppercase tracking-widest hover:bg-[var(--brand-accent)] transition-colors"
            >
              Back to My Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isOrderCancelled = normalizeStatus(order.status) === "CANCELLED" || normalizeStatus(order.status) === "FAILED";

  return (
    <div className="min-h-screen bg-[var(--bg-base)] pb-20">
      <Navbar />
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 mb-8 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
          <Link href="/" className="hover:text-black">Home</Link>
          <ChevronRight size={12} />
          <Link href="/customer/orders" className="hover:text-black">My Orders</Link>
          <ChevronRight size={12} />
          <span className="text-black">Order Details</span>
        </div>

        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="min-w-0">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-black tracking-tighter mb-4 leading-tight">
              {order.items?.map(it => it.product?.name).filter(Boolean).join(", ") || "Order Tracking"}
            </h1>
            <div className="flex flex-wrap items-center gap-4">
              <div className="px-3 py-1 bg-black text-white text-[9px] font-black uppercase tracking-widest rounded-md">ID: {order.id?.slice(-12).toUpperCase()}</div>
              <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Clock3 size={14} className="text-[var(--brand-accent)]" />
                Placed on {formatDate(order.createdAt)}
              </span>
            </div>
          </div>
          <div className={`px-6 py-3 border rounded-xl shadow-sm flex flex-col items-end shrink-0 ${
            isOrderCancelled
              ? "bg-red-50 border-red-100 text-red-600"
              : "bg-white border-[var(--border-default)] text-black"
          }`}>
            <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${
              isOrderCancelled ? "text-red-400" : "text-zinc-400"
            }`}>Status</span>
            <span className="text-base font-black uppercase tracking-widest">
              {(order.status || "-").replaceAll("_", " ")}
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-8">
            {/* Tracking Progress (Only if not cancelled) */}
            {!isOrderCancelled && (
              <section className="bg-black rounded-xl p-8 sm:p-10 shadow-2xl text-white overflow-hidden relative">
                <div className="flex items-center gap-3 mb-10">
                  <Truck size={20} className="text-[var(--brand-accent)]" />
                  <h2 className="text-sm font-black uppercase tracking-[0.2em]">Delivery Progress</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-y-10 relative">
                  {/* Mobile Vertical Connector */}
                  <div className="sm:hidden absolute left-[11px] top-2 bottom-2 w-[2px] bg-zinc-800 z-0">
                    <div 
                      className="w-full bg-[var(--brand-accent)] transition-all duration-1000" 
                      style={{ height: `${Math.max(0, Math.min(100, (stepIndex - 1) / (TRACKING_STEPS.length - 1) * 100))}%` }}
                    />
                  </div>

                  {TRACKING_STEPS.map((step, index) => {
                    const completed = index + 1 <= stepIndex;
                    const isCurrent = index + 1 === stepIndex;
                    return (
                      <div key={step} className="relative group/step z-10">
                        {/* Desktop Horizontal Connector */}
                        {index < TRACKING_STEPS.length - 1 && (
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
              </section>
            )}

            {/* Order Items */}
            <section className="bg-white border border-[var(--border-default)] rounded-xl shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-[var(--border-default)] flex items-center justify-between">
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-black flex items-center gap-3">
                  <Package size={18} className="text-[var(--brand-accent)]" />
                  Order Items
                </h2>
                <span className="text-xs font-black uppercase text-zinc-400">{order.items?.length} items</span>
              </div>
              <div className="divide-y divide-[var(--border-default)]">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="p-6 flex flex-col sm:flex-row items-center gap-6 group hover:bg-[var(--bg-sunken)] transition-colors">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-[var(--bg-sunken)] border border-[var(--border-default)] shrink-0">
                      <img src={item.product?.imageUrl || "/placeholder-product-1.jpg"} alt={item.product?.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-black uppercase tracking-tight text-black line-clamp-1">{item.product?.name}</h3>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase mt-1">Vendor: {order.vendor?.businessName}</p>
                    </div>
                    <div className="flex items-center gap-10">
                      <div className="text-center">
                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Price</p>
                        <p className="text-sm font-black text-black">₹{Number(item.price).toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Qty</p>
                        <p className="text-sm font-black text-black">x{item.quantity}</p>
                      </div>
                      <div className="text-right min-w-[80px]">
                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Subtotal</p>
                        <p className="text-sm font-black text-black">₹{Number((item.price || 0) * (item.quantity || 0)).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-8 bg-[var(--bg-sunken)] flex items-center justify-between">
                <span className="text-sm font-black uppercase tracking-widest text-zinc-400">Total Order Amount</span>
                <span className="text-3xl font-black text-black tracking-tighter">₹{Number(order.totalAmount).toLocaleString()}</span>
              </div>
            </section>

            {/* Events Timeline */}
            <section className="bg-white border border-[var(--border-default)] rounded-xl p-8 shadow-sm">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-black mb-8 flex items-center gap-3">
                <Clock3 size={18} className="text-[var(--brand-accent)]" />
                Detailed Log
              </h2>
              <div className="space-y-6">
                {order.events?.map((event, idx) => (
                  <div key={idx} className="flex gap-6 relative group">
                    {idx < (order.events?.length || 0) - 1 && (
                      <div className="absolute left-[11px] top-6 bottom-0 w-[2px] bg-[var(--border-default)]" />
                    )}
                    <div className="w-6 h-6 rounded-full bg-[var(--bg-sunken)] border-2 border-[var(--border-default)] flex items-center justify-center shrink-0 z-10 group-hover:border-[var(--brand-accent)] transition-colors">
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 group-hover:bg-[var(--brand-accent)] transition-colors" />
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-black uppercase tracking-tight text-black">{event.status?.replaceAll("_", " ")}</p>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">{formatDate(event.createdAt)}</span>
                      </div>
                      {event.note && <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-tighter leading-relaxed">{event.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-8 bg-white border border-[var(--border-default)] rounded-xl shadow-xl space-y-8">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <MapPin size={18} className="text-[var(--brand-accent)]" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-black">Delivery Destination</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-black text-black uppercase">{order.shippingFullName}</p>
                  <p className="text-xs font-bold text-zinc-500 leading-relaxed uppercase tracking-tighter">
                    {order.shippingAddressLine1}, {order.shippingAddressLine2 ? order.shippingAddressLine2 + ', ' : ''}
                    {order.shippingCity}, {order.shippingState} - {order.shippingPostalCode}
                  </p>
                </div>
                <div className="pt-4 border-t border-[var(--border-default)] space-y-2">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-2">
                    <ShieldCheck size={12} className="text-emerald-500" />
                    Verified Delivery Address
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8 bg-black rounded-xl text-white shadow-xl space-y-6 border border-zinc-800">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--brand-accent)]">Customer Support</h3>
              <p className="text-xs font-bold text-zinc-400 leading-relaxed uppercase tracking-tighter">
                Having issues with this order? Our support team is available 24/7 to assist you with delivery and quality concerns.
              </p>
              <Link
                href="/support"
                className="flex items-center justify-center w-full h-12 bg-white text-black rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-[var(--brand-accent)] hover:text-white transition-all shadow-lg"
              >
                Help Center
              </Link>
            </div>

            <Link
              href="/products"
              className="flex items-center justify-center w-full h-14 bg-[var(--bg-sunken)] border border-[var(--border-default)] text-black rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-sm gap-3"
            >
              <ShoppingBag size={16} />
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
