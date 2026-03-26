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
  return date.toLocaleString();
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
        label: "Active Orders",
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
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-heading text-3xl sm:text-5xl leading-[1.05] tracking-[0.015em] text-foreground mb-2">
            My Orders
          </h1>
          <p className="text-muted-foreground">
            Track and manage your purchases
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-card border border-border rounded-lg p-3 sm:p-4"
            >
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-secondary mb-2">
                <stat.Icon className="h-5 w-5 text-primary" />
              </div>
              <p className="text-muted-foreground text-sm leading-tight">
                {stat.label}
              </p>
              <p className="text-2xl font-semibold leading-tight mt-1">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="flex gap-1 sm:gap-2 mb-6 border-b border-border overflow-x-auto">
          {[
            { value: "all" as const, label: "All Orders" },
            { value: "active" as const, label: "Active" },
            { value: "delivered" as const, label: "Delivered" },
            { value: "cancelled" as const, label: "Cancelled" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSelectedStatus(tab.value)}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                selectedStatus === tab.value
                  ? "text-primary border-primary"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16 bg-card border border-border rounded-lg">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3 text-primary" />
            <p className="text-muted-foreground">Loading your orders...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-card border border-border rounded-lg">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Could not load orders
            </h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-lg">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No orders found</h3>
            <p className="text-muted-foreground mb-6">
              Start shopping to place your first order
            </p>
            <Link
              href="/products"
              className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredOrders.map((order) => {
              const status = normalizeStatus(order.status);
              const stepIndex = getTimelineStepIndex(order.status);

              return (
                <div
                  key={order.id}
                  className="bg-card border border-border rounded-xl p-4 sm:p-5 space-y-4 shadow-sm"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1 min-w-0">
                      <p className="text-sm text-muted-foreground">Order ID</p>
                      <p className="font-mono text-foreground text-sm sm:text-base break-all">
                        {order.id}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Vendor: {order.vendor?.businessName || "-"}
                      </p>
                    </div>
                    <div className="space-y-2 sm:text-right">
                      <div className="flex items-center justify-between sm:block sm:space-y-2">
                        <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-foreground uppercase tracking-wide">
                          {status.replaceAll("_", " ")}
                        </span>
                        <p className="text-2xl sm:text-3xl font-semibold text-foreground leading-none">
                          ₹{Number(order.totalAmount || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {(order.items || []).slice(0, 2).map((item, itemIndex) => (
                      <div
                        key={item.id || `${item.productId}-${itemIndex}`}
                        className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-border/70 bg-secondary/30 p-2.5 text-sm"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-14 h-14 rounded-md overflow-hidden bg-secondary shrink-0 border border-border/60">
                            <img
                              src={
                                item.product?.imageUrl ||
                                "/placeholder-product-1.jpg"
                              }
                              alt={item.product?.name || "Product"}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(event) => {
                                event.currentTarget.src =
                                  "/placeholder-product-1.jpg";
                              }}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-foreground truncate font-medium">
                              {item.product?.name || "Product"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Qty {Number(item.quantity || 0)}
                            </p>
                          </div>
                        </div>
                        <span className="text-foreground font-medium tabular-nums self-end sm:self-auto">
                          ₹{Number(item.price || 0).toLocaleString()}
                        </span>
                      </div>
                    ))}
                    {(order.items || []).length > 2 && (
                      <p className="text-xs text-muted-foreground">
                        +{(order.items || []).length - 2} more item(s)
                      </p>
                    )}
                  </div>

                  {shouldShowTimeline(order.status) && (
                    <div className="rounded-lg bg-secondary/50 p-4">
                      <p className="text-sm font-semibold text-foreground mb-3">
                        Order Status Timeline
                      </p>
                      <div className="md:hidden space-y-2.5">
                        {TIMELINE_STEPS.map((step, index) => {
                          const completed = index + 1 <= stepIndex;
                          const isCurrent = index + 1 === stepIndex;
                          return (
                            <div key={step} className="flex items-center gap-2">
                              {completed ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                              ) : (
                                <Circle className="w-5 h-5 text-muted-foreground" />
                              )}
                              <span
                                className={`text-sm ${
                                  completed
                                    ? "text-foreground font-medium"
                                    : "text-muted-foreground"
                                } ${isCurrent ? "underline underline-offset-4" : ""}`}
                              >
                                {step}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="hidden md:block overflow-x-auto pb-1">
                        <div className="min-w-170 grid grid-cols-5 gap-3 items-start">
                          {TIMELINE_STEPS.map((step, index) => {
                            const completed = index + 1 <= stepIndex;
                            const isCurrent = index + 1 === stepIndex;
                            return (
                              <div key={step} className="relative pr-3">
                                {index < TIMELINE_STEPS.length - 1 && (
                                  <div
                                    className={`absolute top-2.25 left-6 -right-2.5 h-0.5 ${
                                      index + 1 < stepIndex
                                        ? "bg-green-600"
                                        : "bg-border"
                                    }`}
                                  />
                                )}
                                <div className="relative z-10 flex items-center gap-2">
                                  {completed ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                  ) : (
                                    <Circle className="w-5 h-5 text-muted-foreground" />
                                  )}
                                </div>
                                <p
                                  className={`mt-2 text-xs leading-snug ${
                                    completed
                                      ? "text-foreground font-medium"
                                      : "text-muted-foreground"
                                  } ${isCurrent ? "underline underline-offset-4" : ""}`}
                                >
                                  {step}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <Link
                      href={`/customer/orders/${order.id}`}
                      className="inline-flex text-sm font-medium text-primary hover:underline"
                    >
                      View order details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
