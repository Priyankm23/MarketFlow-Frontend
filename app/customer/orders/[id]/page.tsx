"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  CheckCircle2,
  Loader2,
  Package,
  ChevronRight,
  Clock3,
  MapPin,
  Truck,
  ShieldCheck,
  ShoppingBag,
  CreditCard,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { authFetch } from "@/lib/auth-fetch";
import { API_BASE_URL } from "@/lib/config";

const PAYMENT_WINDOW_SECONDS = 15 * 60;

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
  paymentStatus?: string;
  paymentMode?: string;
  paymentExpiresAt?: string;
  expiresAt?: string;
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

type PaymentIntent = {
  paymentId?: string;
  gatewayRef?: string;
  amount?: number | string;
  clientSecret?: string;
  stripeClientSecret?: string;
  mockCheckoutUrl?: string;
};

type PaymentIntentResponse = {
  success?: boolean;
  message?: string;
  data?: PaymentIntent;
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
  if (["OUT_FOR_DELIVERY", "IN_TRANSIT", "SHIPPED"].includes(normalized))
    return 4;
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

const formatCurrency = (value?: number) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const parseIsoDate = (value?: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const getPaymentExpiry = (order: OrderDetails) => {
  const explicitExpiry = parseIsoDate(
    order.paymentExpiresAt || order.expiresAt,
  );
  if (explicitExpiry) {
    return explicitExpiry;
  }

  const createdAt = parseIsoDate(order.createdAt);
  if (!createdAt) {
    return null;
  }

  return new Date(createdAt.getTime() + PAYMENT_WINDOW_SECONDS * 1000);
};

const getPaymentSecondsLeft = (order: OrderDetails, nowMs = Date.now()) => {
  const expiresAt = getPaymentExpiry(order);
  if (!expiresAt) {
    return 0;
  }

  return Math.max(0, Math.floor((expiresAt.getTime() - nowMs) / 1000));
};

const formatTimer = (secondsLeft: number) => {
  const minutes = Math.floor(secondsLeft / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (secondsLeft % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const isPendingPayment = (order: OrderDetails) => {
  const paymentStatus = (order.paymentStatus || "").trim().toUpperCase();
  if (
    ["PENDING", "UNPAID", "REQUIRES_PAYMENT", "AWAITING_PAYMENT"].includes(
      paymentStatus,
    )
  ) {
    return true;
  }

  const normalizedOrderStatus = normalizeStatus(order.status).replaceAll(
    " ",
    "_",
  );
  return ["PENDING", "PAYMENT_PENDING", "AWAITING_PAYMENT", "UNPAID"].includes(
    normalizedOrderStatus,
  );
};

const isOnlinePaymentMode = (order: OrderDetails) => {
  const paymentMode = (order.paymentMode || "").trim().toUpperCase();

  if (!paymentMode) {
    return true;
  }

  if (["COD", "CASH_ON_DELIVERY", "CASH"].includes(paymentMode)) {
    return false;
  }

  return true;
};

export default function OrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const orderId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [nowMs, setNowMs] = useState(Date.now());

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
        const payload: OrderDetailsResponse = await response
          .json()
          .catch(() => ({}));
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

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, []);

  const stepIndex = useMemo(
    () => statusToStepIndex(order?.status),
    [order?.status],
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)]">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-24 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-black" />
          <p className="text-sm font-semibold text-zinc-600">
            Loading order details...
          </p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)]">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-24">
          <div className="bg-white border border-[var(--border-default)] rounded-md p-10 text-center space-y-5 shadow-sm">
            <Package className="w-10 h-10 mx-auto text-zinc-400" />
            <h1 className="text-2xl font-bold text-black tracking-tight">
              Order Not Found
            </h1>
            <p className="text-zinc-600 text-sm">
              {error || "This order details could not be retrieved."}
            </p>
            <Link
              href="/customer/orders"
              className="inline-block px-6 py-2.5 bg-black text-white rounded-md font-bold text-sm hover:bg-zinc-800 transition-colors shadow-sm"
            >
              Back to My Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isOrderCancelled =
    normalizeStatus(order.status) === "CANCELLED" ||
    normalizeStatus(order.status) === "FAILED";
  const paymentSecondsLeft = getPaymentSecondsLeft(order, nowMs);
  const canResumePayment =
    !isOrderCancelled &&
    isOnlinePaymentMode(order) &&
    isPendingPayment(order) &&
    paymentSecondsLeft > 0;

  const handleCompletePayment = async () => {
    if (!order.id || paying) {
      return;
    }

    setPaying(true);
    setPaymentError("");

    try {
      const response = await authFetch(
        `${API_BASE_URL}/payments/${order.id}/intent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );

      const payload: PaymentIntentResponse = await response
        .clone()
        .json()
        .catch(() => ({}));

      if (!response.ok || !payload?.data) {
        throw new Error(
          payload?.message || "Unable to initiate payment for this order",
        );
      }

      sessionStorage.setItem(
        "markivo-payment-session",
        JSON.stringify({
          createdAt: Date.now(),
          expiresInSeconds: paymentSecondsLeft,
          intents: [
            {
              orderId: order.id,
              paymentId: payload.data.paymentId,
              gatewayRef: payload.data.gatewayRef,
              amount: Number(payload.data.amount || order.totalAmount || 0),
              mockCheckoutUrl: payload.data.mockCheckoutUrl,
              clientSecret: payload.data.clientSecret,
              stripeClientSecret: payload.data.stripeClientSecret,
            },
          ],
        }),
      );

      window.location.assign("/customer/checkout/gateway");
    } catch (paymentErr) {
      setPaymentError(
        paymentErr instanceof Error
          ? paymentErr.message
          : "Unable to resume payment for this order",
      );
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] pb-20 antialiased">
      <Navbar />
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 mb-6 text-sm text-zinc-600 font-medium">
          <Link href="/" className="hover:text-black transition-colors">
            Home
          </Link>
          <ChevronRight size={14} className="text-zinc-400" />
          <Link href="/customer/orders" className="hover:text-black transition-colors">
            My Orders
          </Link>
          <ChevronRight size={14} className="text-zinc-400" />
          <span className="text-black font-semibold">Order Details</span>
        </div>

        {/* Top Title Banner */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--border-default)]">
          <div className="min-w-0">
            <h1 className="text-3xl sm:text-4xl font-bold text-black tracking-tight mb-2.5">
              {order.items
                ?.map((it) => it.product?.name)
                .filter(Boolean)
                .join(", ") || "Order Tracking"}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 bg-zinc-100 text-zinc-800 text-sm font-semibold rounded-md border border-zinc-200">
                ID: #{order.id?.slice(-12).toUpperCase()}
              </span>
              <span className="text-sm text-zinc-600 font-medium flex items-center gap-1.5">
                <Clock3 size={15} className="text-zinc-500" />
                Placed on {formatDate(order.createdAt)}
              </span>
            </div>
          </div>
          <div
            className={`px-6 py-3.5 border rounded-md shadow-sm flex flex-col items-start md:items-end shrink-0 ${
              isOrderCancelled
                ? "bg-red-50 border-red-200 text-red-700"
                : "bg-white border-[var(--border-default)] text-black"
            }`}
          >
            <span className="text-xs font-medium text-zinc-500 mb-0.5">
              Status
            </span>
            <span className="text-base font-bold tracking-tight">
              {(order.status || "-").replaceAll("_", " ")}
            </span>
            {canResumePayment && (
              <button
                type="button"
                onClick={() => {
                  void handleCompletePayment();
                }}
                disabled={paying}
                className="mt-3 inline-flex items-center gap-2 h-10 px-5 rounded-md bg-black text-white text-sm font-bold hover:bg-zinc-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm cursor-pointer"
              >
                {paying ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <CreditCard size={14} />
                )}
                {paying
                  ? "Opening Payment..."
                  : `Complete Payment (${formatTimer(paymentSecondsLeft)})`}
              </button>
            )}
            {paymentError && (
              <p className="mt-2 text-xs font-medium text-red-600 text-right max-w-[240px]">
                {paymentError}
              </p>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Main Content Column */}
          <div className="lg:col-span-8 space-y-6">
            {/* Tracking Progress Section */}
            {!isOrderCancelled && (
              <section className="bg-white border border-[var(--border-default)] rounded-md p-6 sm:p-8 shadow-sm">
                <div className="mb-6">
                  <div className="flex items-center gap-2.5">
                    <Truck size={20} className="text-black" />
                    <h2 className="text-base sm:text-lg font-bold text-black">
                      Delivery Progress
                    </h2>
                  </div>
                  <p className="mt-1 text-sm text-zinc-600">
                    Track current status and fulfillment timeline.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-y-6 sm:gap-x-2 relative">
                  <div className="sm:hidden absolute left-[15px] top-2 bottom-2 w-[2px] bg-zinc-200 z-0">
                    <div
                      className="w-full bg-black transition-all duration-1000"
                      style={{
                        height: `${Math.max(0, Math.min(100, ((stepIndex - 1) / (TRACKING_STEPS.length - 1)) * 100))}%`,
                      }}
                    />
                  </div>

                  {TRACKING_STEPS.map((step, index) => {
                    const completed = index + 1 <= stepIndex;
                    const isCurrent = index + 1 === stepIndex;
                    return (
                      <div key={step} className="relative z-10">
                        {index < TRACKING_STEPS.length - 1 && (
                          <div className="hidden sm:block absolute top-[14px] left-6 w-full h-[2px] bg-zinc-200 z-0">
                            <div
                              className={`h-full bg-black transition-all duration-1000 ${
                                index + 1 < stepIndex ? "w-full" : "w-0"
                              }`}
                            />
                          </div>
                        )}
                        <div className="flex items-start sm:flex-col sm:items-center gap-3 relative z-10">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all shrink-0 ${
                              completed
                                ? "bg-black border-black text-white"
                                : "bg-white border-zinc-300"
                            }`}
                          >
                            {completed ? (
                              <CheckCircle2 size={16} className="text-white" />
                            ) : (
                              <div className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
                            )}
                          </div>
                          <div className="min-w-0 sm:text-center">
                            <p
                              className={`text-sm font-bold leading-tight ${
                                isCurrent
                                  ? "text-black"
                                  : completed
                                    ? "text-zinc-800"
                                    : "text-zinc-400"
                              }`}
                            >
                              {step}
                            </p>
                            <p className="mt-1 text-xs font-medium text-zinc-500">
                              {index + 1 < stepIndex
                                ? "Completed"
                                : isCurrent
                                  ? "Current step"
                                  : "Pending"}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Order Items Section */}
            <section className="bg-white border border-[var(--border-default)] rounded-md shadow-sm overflow-hidden">
              <div className="px-6 py-4.5 border-b border-[var(--border-default)] flex items-center justify-between gap-4">
                <h2 className="text-base sm:text-lg font-bold text-black flex items-center gap-2.5">
                  <Package size={20} className="text-black" />
                  Order Items
                </h2>
                <span className="text-sm font-semibold text-zinc-600">
                  {order.items?.length} {order.items?.length === 1 ? "item" : "items"}
                </span>
              </div>
              <div className="divide-y divide-[var(--border-default)]">
                {order.items?.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-6 sm:p-7 flex flex-col lg:flex-row lg:items-center gap-6 hover:bg-zinc-50/50 transition-colors"
                  >
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-md overflow-hidden bg-zinc-50 border border-[var(--border-default)] shrink-0">
                      <img
                        src={
                          item.product?.imageUrl || "/placeholder-product-1.jpg"
                        }
                        alt={item.product?.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-black line-clamp-2">
                        {item.product?.name}
                      </h3>
                      {order.vendor?.businessName && (
                        <p className="text-sm text-zinc-600 mt-1.5 font-medium">
                          Vendor: {order.vendor.businessName}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-5 w-full lg:w-auto lg:min-w-[340px] pt-4 lg:pt-0 border-t lg:border-t-0 border-zinc-100">
                      <div className="text-left lg:text-center">
                        <p className="text-xs font-semibold text-zinc-500 mb-1">
                          Price
                        </p>
                        <p className="text-base sm:text-lg font-bold text-black">
                          {formatCurrency(item.price)}
                        </p>
                      </div>
                      <div className="text-left lg:text-center">
                        <p className="text-xs font-semibold text-zinc-500 mb-1">
                          Qty
                        </p>
                        <p className="text-base sm:text-lg font-bold text-black">
                          x{item.quantity}
                        </p>
                      </div>
                      <div className="text-left lg:text-right min-w-[90px]">
                        <p className="text-xs font-semibold text-zinc-500 mb-1">
                          Subtotal
                        </p>
                        <p className="text-base sm:text-lg font-bold text-black">
                          {formatCurrency(
                            (item.price || 0) * (item.quantity || 0),
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-6 bg-zinc-50 border-t border-[var(--border-default)] flex items-center justify-between gap-3">
                <span className="text-base font-bold text-zinc-700">
                  Total Order Amount
                </span>
                <span className="text-3xl sm:text-4xl font-bold text-black tracking-tight">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
            </section>

            {/* Events Timeline Log */}
            <section className="bg-white border border-[var(--border-default)] rounded-md p-6 sm:p-8 shadow-sm">
              <h2 className="text-base sm:text-lg font-bold text-black mb-6 flex items-center gap-2.5">
                <Clock3 size={20} className="text-black" />
                Detailed Log
              </h2>
              <div className="space-y-6">
                {order.events?.map((event, idx) => (
                  <div key={idx} className="flex gap-4 relative">
                    {idx < (order.events?.length || 0) - 1 && (
                      <div className="absolute left-[10px] top-6 bottom-0 w-[2px] bg-zinc-200" />
                    )}
                    <div className="w-5 h-5 rounded-full bg-zinc-100 border border-zinc-300 flex items-center justify-center shrink-0 z-10 mt-1">
                      <div className="w-2 h-2 rounded-full bg-zinc-700" />
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                        <p className="text-sm font-bold text-black">
                          {event.status?.replaceAll("_", " ")}
                        </p>
                        <span className="text-xs font-medium text-zinc-500">
                          {formatDate(event.createdAt)}
                        </span>
                      </div>
                      {event.note && (
                        <p className="text-sm text-zinc-700 font-medium leading-relaxed">
                          {event.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar Column */}
          <div className="lg:col-span-4 space-y-6">
            {/* Delivery Address Card */}
            <div className="p-6 sm:p-7 bg-white border border-[var(--border-default)] rounded-md shadow-sm space-y-4">
              <div className="flex items-center gap-2.5">
                <MapPin size={20} className="text-black" />
                <h3 className="text-base font-bold text-black">
                  Delivery Destination
                </h3>
              </div>
              <div className="space-y-2">
                <p className="text-lg font-bold text-black">
                  {order.shippingFullName}
                </p>
                <p className="text-sm text-zinc-700 font-medium leading-relaxed">
                  {order.shippingAddressLine1},{" "}
                  {order.shippingAddressLine2
                    ? order.shippingAddressLine2 + ", "
                    : ""}
                  {order.shippingCity}, {order.shippingState} -{" "}
                  {order.shippingPostalCode}
                </p>
              </div>
              <div className="pt-3 border-t border-[var(--border-default)]">
                <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                  <ShieldCheck size={15} />
                  Verified Delivery Address
                </p>
              </div>
            </div>

            {/* Customer Support Card */}
            <div className="p-6 sm:p-7 bg-zinc-900 rounded-md text-white shadow-sm space-y-4 border border-zinc-800">
              <h3 className="text-sm font-bold uppercase tracking-wide text-white">
                Customer Support
              </h3>
              <p className="text-sm text-zinc-200 font-medium leading-relaxed">
                Having issues with this order? Our support team is available
                24/7 to assist you with delivery and quality concerns.
              </p>
              <Link
                href="/support"
                className="flex items-center justify-center w-full h-11 bg-white text-black rounded-md font-bold text-sm hover:bg-zinc-100 transition-colors shadow-sm"
              >
                Help Center
              </Link>
            </div>

            {/* Continue Shopping Action */}
            <Link
              href="/products"
              className="flex items-center justify-center w-full h-12 bg-white border border-[var(--border-default)] text-black rounded-md font-bold text-sm hover:bg-zinc-50 transition-colors shadow-sm gap-2.5"
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
