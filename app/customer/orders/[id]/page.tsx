"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle2, Circle, Loader2, Package } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { authFetch } from "@/lib/auth-fetch";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

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

const statusToStepIndex = (status?: string) => {
  const normalized = (status || "").toUpperCase();

  if (["DELIVERED"].includes(normalized)) {
    return 5;
  }

  if (["OUT_FOR_DELIVERY", "IN_TRANSIT", "SHIPPED"].includes(normalized)) {
    return 4;
  }

  if (["PACKED"].includes(normalized)) {
    return 3;
  }

  if (["PAID", "CONFIRMED"].includes(normalized)) {
    return 2;
  }

  if (["PAYMENT_PENDING", "PENDING"].includes(normalized)) {
    return 1;
  }

  return 1;
};

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
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
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload?.message || "Unable to load order details");
        }

        const payload: OrderDetailsResponse = await response
          .json()
          .catch(() => ({}));

        if (!payload?.data) {
          throw new Error("Order details are missing in response");
        }

        setOrder(payload.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load order");
      } finally {
        setLoading(false);
      }
    };

    void fetchOrder();
  }, [orderId]);

  const stepIndex = useMemo(
    () => statusToStepIndex(order?.status),
    [order?.status],
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3 text-primary" />
          <p className="text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="bg-card border border-border rounded-lg p-8 text-center space-y-4">
            <h1 className="font-heading text-3xl text-foreground">
              Unable to Load Order
            </h1>
            <p className="text-muted-foreground">
              {error || "Order not found"}
            </p>
            <Link
              href="/customer/orders"
              className="inline-flex px-5 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium"
            >
              Back to My Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="font-heading text-3xl sm:text-5xl leading-[1.05] tracking-[0.015em] text-foreground">
              Order Tracking
            </h1>
            <p className="text-muted-foreground mt-2 break-all text-sm sm:text-base">
              Order ID: {order.id}
            </p>
          </div>
          <span className="inline-flex w-full sm:w-auto justify-center rounded-full bg-secondary px-4 py-2 text-xs sm:text-sm font-semibold text-foreground">
            Current Status: {(order.status || "-").replaceAll("_", " ")}
          </span>
        </div>

        <div className="grid lg:grid-cols-3 gap-5 sm:gap-8">
          <section className="lg:col-span-2 bg-card border border-border rounded-xl p-4 sm:p-6">
            <h2 className="font-heading text-2xl text-foreground mb-6">
              Progress
            </h2>
            <div className="space-y-5">
              {TRACKING_STEPS.map((step, index) => {
                const completed = index + 1 <= stepIndex;
                return (
                  <div key={step} className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {completed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p
                        className={`font-medium ${completed ? "text-foreground" : "text-muted-foreground"}`}
                      >
                        {step}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 border-t border-border pt-6">
              <h3 className="font-heading text-xl text-foreground mb-3">
                Order Events
              </h3>
              <div className="space-y-3">
                {(order.events || []).map((event, idx) => (
                  <div
                    key={event.id || idx}
                    className="rounded-lg bg-secondary/50 p-3"
                  >
                    <p className="text-sm font-semibold text-foreground">
                      {(event.status || "UNKNOWN").replaceAll("_", " ")}
                    </p>
                    {event.note && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {event.note}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(event.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="lg:col-span-1 space-y-4 sm:space-y-5">
            <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
              <h2 className="font-heading text-2xl text-foreground mb-4">
                Order Summary
              </h2>
              <div className="space-y-3">
                {(order.items || []).map((item, idx) => (
                  <div
                    key={item.id || `${item.productId}-${idx}`}
                    className="flex gap-3"
                  >
                    <div className="w-12 h-12 rounded bg-secondary overflow-hidden shrink-0">
                      <img
                        src={
                          item.product?.imageUrl || "/placeholder-product-1.jpg"
                        }
                        alt={item.product?.name || "Product"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {item.product?.name || "Product"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Qty {item.quantity || 0} x ₹
                        {Number(item.price || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-border mt-4 pt-4 flex items-center justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-bold text-primary text-xl">
                  ₹{Number(order.totalAmount || 0).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
              <h3 className="font-heading text-xl text-foreground mb-3">
                Shipping Address
              </h3>
              <p className="text-sm font-medium text-foreground">
                {order.shippingFullName || "-"}
              </p>
              <p className="text-sm text-muted-foreground">
                {order.shippingEmail || "-"}
              </p>
              <p className="text-sm text-muted-foreground">
                {order.shippingPhoneNumber || "-"}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {order.shippingAddressLine1 || ""}
                {order.shippingAddressLine2
                  ? `, ${order.shippingAddressLine2}`
                  : ""}
                , {order.shippingCity || ""}, {order.shippingState || ""} -{" "}
                {order.shippingPostalCode || ""}
              </p>
              <p className="text-xs text-muted-foreground mt-3">
                Vendor: {order.vendor?.businessName || "-"}
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
              <h3 className="font-heading text-xl text-foreground mb-2">
                Need More Orders?
              </h3>
              <Link
                href="/products"
                className="inline-flex w-full justify-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium"
              >
                Continue Shopping
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
