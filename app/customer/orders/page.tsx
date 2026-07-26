"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { authFetch } from "@/lib/auth-fetch";
import {
  CheckCircle2,
  Clock3,
  Loader2,
  Package,
  ShoppingBag,
  ChevronRight,
  ArrowRight,
  CreditCard,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/config";

const ORDERS_API_BASE_URL = API_BASE_URL;
const PAYMENT_WINDOW_SECONDS = 15 * 60;

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
  paymentStatus?: string;
  paymentMode?: string;
  paymentExpiresAt?: string;
  expiresAt?: string;
  vendor?: { businessName?: string };
  items?: ApiOrderItem[];
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

const parseIsoDate = (value?: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const getPaymentExpiry = (order: ApiOrder) => {
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

const getPaymentSecondsLeft = (order: ApiOrder, nowMs = Date.now()) => {
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

const isPendingPayment = (order: ApiOrder) => {
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

const isOnlinePaymentMode = (order: ApiOrder) => {
  const paymentMode = (order.paymentMode || "").trim().toUpperCase();

  if (!paymentMode) {
    return true;
  }

  if (["COD", "CASH_ON_DELIVERY", "CASH"].includes(paymentMode)) {
    return false;
  }

  return true;
};

export default function OrdersPage() {
  const [selectedStatus, setSelectedStatus] =
    useState<OrderStatusFilter>("all");
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  const [paymentErrors, setPaymentErrors] = useState<Record<string, string>>(
    {},
  );

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

  const handleCompletePayment = async (
    order: ApiOrder,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (!order.id || payingOrderId) {
      return;
    }

    setPayingOrderId(order.id);
    setPaymentErrors((prev) => ({ ...prev, [order.id]: "" }));

    try {
      const response = await authFetch(
        `${API_BASE_URL}/payments/${order.id}/intent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
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

      const secondsLeft = getPaymentSecondsLeft(order);

      sessionStorage.setItem(
        "markivo-payment-session",
        JSON.stringify({
          createdAt: Date.now(),
          expiresInSeconds: secondsLeft,
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
    } catch (paymentError) {
      setPaymentErrors((prev) => ({
        ...prev,
        [order.id]:
          paymentError instanceof Error
            ? paymentError.message
            : "Unable to resume payment for this order",
      }));
    } finally {
      setPayingOrderId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] antialiased pb-20">
      <Navbar />

      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-xs text-zinc-500 font-medium">
          <Link href="/" className="hover:text-black transition-colors">
            Home
          </Link>
          <ChevronRight size={12} className="text-zinc-400" />
          <span className="text-black font-semibold">My Orders</span>
        </div>

        {/* Page Title */}
        <div className="mb-8 border-b border-[var(--border-default)] pb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-black tracking-tight mb-1.5">
            Purchase History
          </h1>
          <p className="text-xs text-zinc-500 font-medium">
            Track, manage and review your order details
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-3 gap-3 sm:gap-5 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white border border-[var(--border-default)] rounded-md p-5 sm:p-6 shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="inline-flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-md bg-zinc-100 text-black shrink-0">
                  <stat.Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-black tracking-tight">
                  {stat.value}
                </span>
              </div>
              <p className="text-sm sm:text-base font-bold text-zinc-600">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-2 mb-6 border-b border-[var(--border-default)] overflow-x-auto scrollbar-hide">
          {[
            { value: "all" as const, label: "All Orders" },
            { value: "active" as const, label: "Active" },
            { value: "delivered" as const, label: "Delivered" },
            { value: "cancelled" as const, label: "Cancelled" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSelectedStatus(tab.value)}
              className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                selectedStatus === tab.value
                  ? "text-black border-black"
                  : "text-zinc-500 border-transparent hover:text-black"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-20 bg-white border border-[var(--border-default)] rounded-md shadow-sm">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-black" />
            <p className="text-xs font-semibold text-zinc-500">
              Fetching your orders...
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-white border border-[var(--border-default)] rounded-md shadow-sm">
            <Package className="w-10 h-10 mx-auto text-zinc-400 mb-3" />
            <h3 className="text-base font-bold text-black tracking-tight">
              Could not load orders
            </h3>
            <p className="text-zinc-500 text-xs mt-1">{error}</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16 bg-white border border-[var(--border-default)] rounded-md shadow-sm">
            <div className="w-16 h-16 bg-zinc-100 rounded-md flex items-center justify-center mx-auto mb-4">
              <ShoppingBag size={28} className="text-zinc-400" />
            </div>
            <h3 className="text-base font-bold text-black tracking-tight">
              No orders found
            </h3>
            <p className="text-zinc-500 text-xs mt-1 max-w-xs mx-auto">
              You haven&apos;t placed any orders in this category yet.
            </p>
            <Link
              href="/products"
              className="mt-6 inline-block px-6 py-2.5 bg-black text-white rounded-md font-bold text-xs hover:bg-zinc-800 transition-colors shadow-sm"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid gap-5">
            {filteredOrders.map((order) => {
              const status = normalizeStatus(order.status);
              const stepIndex = getTimelineStepIndex(order.status);
              const paymentSecondsLeft = getPaymentSecondsLeft(order);
              const canResumePayment =
                isOnlinePaymentMode(order) &&
                isPendingPayment(order) &&
                paymentSecondsLeft > 0;
              const isPayingThisOrder = payingOrderId === order.id;

              return (
                <Link
                  key={order.id}
                  href={`/customer/orders/${order.id}`}
                  className="group block bg-white border border-[var(--border-default)] rounded-md overflow-hidden shadow-sm hover:border-zinc-300 transition-all relative cursor-pointer"
                >
                  {/* Price and Status Header */}
                  <div className="absolute top-5 right-5 sm:top-6 sm:right-6 flex flex-col items-end gap-1.5 z-20 text-right">
                    <p className="text-xl sm:text-2xl font-bold text-black tracking-tight leading-none">
                      ₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}
                    </p>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${
                        isCancelled(order.status)
                          ? "bg-red-50 text-red-700 border-red-200"
                          : isDelivered(order.status)
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-zinc-100 text-zinc-800 border-zinc-200"
                      }`}
                    >
                      {status.replaceAll("_", " ")}
                    </span>
                  </div>

                  <div className="p-5 sm:p-6 space-y-6">
                    {/* Products List */}
                    <div className="space-y-6 pr-0 sm:pr-36">
                      {order.items?.map((item, itemIdx) => (
                        <div
                          key={itemIdx}
                          className="flex flex-col sm:flex-row sm:items-start gap-4 group/item"
                        >
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-md overflow-hidden bg-zinc-50 shrink-0 border border-[var(--border-default)]">
                            <img
                              src={
                                item.product?.imageUrl ||
                                "/placeholder-product-1.jpg"
                              }
                              alt="Product"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2 py-0.5 bg-zinc-100 border border-zinc-200 text-[10px] font-semibold text-zinc-700 rounded-md">
                                Assured
                              </span>
                              <span className="text-xs font-medium text-zinc-500">
                                Vendor:{" "}
                                <span className="text-black font-semibold">
                                  {order.vendor?.businessName ||
                                    "Verified Vendor"}
                                </span>
                              </span>
                            </div>
                            <h3 className="text-base sm:text-lg font-bold text-black leading-snug tracking-tight mb-1 max-w-[85%] sm:max-w-none">
                              {item.product?.name || "Product Name"}
                            </h3>

                            <div className="flex flex-wrap items-center gap-3 mb-1.5">
                              <span className="text-xs font-semibold text-zinc-700">
                                Order ID: #{order.id.slice(-12).toUpperCase()}
                              </span>
                              <span className="text-xs font-medium text-zinc-500 flex items-center gap-1">
                                <Clock3 size={13} className="text-zinc-400" />
                                {formatDate(order.createdAt)}
                              </span>
                            </div>

                            <span className="text-xs font-semibold text-zinc-600">
                              Qty: {item.quantity}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Active Track Progress Timeline */}
                    {shouldShowTimeline(order.status) && (
                      <div className="rounded-md bg-zinc-900 p-5 sm:p-6 overflow-hidden text-white border border-zinc-800">
                        <p className="text-xs font-bold uppercase tracking-wider text-white mb-5">
                          Track Progress
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-y-6 relative">
                          <div className="sm:hidden absolute left-[11px] top-2 bottom-2 w-[2px] bg-zinc-800 z-0">
                            <div
                              className="w-full bg-white transition-all duration-1000"
                              style={{
                                height: `${Math.max(0, Math.min(100, ((stepIndex - 1) / (TIMELINE_STEPS.length - 1)) * 100))}%`,
                              }}
                            />
                          </div>

                          {TIMELINE_STEPS.map((step, index) => {
                            const completed = index + 1 <= stepIndex;
                            const isCurrent = index + 1 === stepIndex;
                            return (
                              <div
                                key={step}
                                className="relative group/step z-10"
                              >
                                {index < TIMELINE_STEPS.length - 1 && (
                                  <div className="hidden sm:block absolute top-[11px] left-5 w-full h-[2px] bg-zinc-800 z-0">
                                    <div
                                      className={`h-full bg-white transition-all duration-1000 ${index + 1 < stepIndex ? "w-full" : "w-0"}`}
                                    />
                                  </div>
                                )}
                                <div className="flex sm:flex-col items-center gap-3 sm:gap-3 relative z-10">
                                  <div
                                    className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all shrink-0 ${
                                      completed
                                        ? "bg-white border-white text-black"
                                        : "bg-zinc-900 border-zinc-700"
                                    }`}
                                  >
                                    {completed && (
                                      <CheckCircle2
                                        size={12}
                                        className="text-black"
                                      />
                                    )}
                                  </div>
                                  <span
                                    className={`text-xs font-bold sm:text-center transition-colors ${
                                      completed ? "text-white" : "text-zinc-500"
                                    } ${isCurrent ? "text-white" : ""}`}
                                  >
                                    {step}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Bottom Action Footer */}
                    <div className="flex items-center justify-between border-t border-[var(--border-default)] pt-4">
                      <div className="flex items-center gap-3">
                        {canResumePayment && (
                          <button
                            type="button"
                            onClick={(event) => {
                              void handleCompletePayment(order, event);
                            }}
                            disabled={Boolean(payingOrderId)}
                            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-black text-white text-xs font-bold hover:bg-zinc-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm cursor-pointer"
                          >
                            {isPayingThisOrder ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <CreditCard size={13} />
                            )}
                            {isPayingThisOrder
                              ? "Opening Payment..."
                              : `Complete Payment (${formatTimer(paymentSecondsLeft)})`}
                          </button>
                        )}
                        {paymentErrors[order.id] && (
                          <p className="text-xs font-medium text-red-600">
                            {paymentErrors[order.id]}
                          </p>
                        )}
                      </div>
                      <div className="group flex items-center gap-1.5 text-xs font-bold text-black group-hover:text-zinc-600 transition-colors">
                        View Detailed Order Summary
                        <ArrowRight
                          size={14}
                          className="group-hover:translate-x-0.5 transition-transform"
                        />
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
