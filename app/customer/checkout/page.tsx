"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { useCartStore } from "@/lib/store";
import { authFetch } from "@/lib/auth-fetch";
import { ChevronRight, Package, Loader2, Clock3 } from "lucide-react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";
const PAYMENT_WINDOW_SECONDS = 15 * 60;

type ApiProfile = {
  id?: string;
  email?: string;
  name?: string;
  phone?: string | number | null;
};

type ApiProfileResponse = {
  status?: string;
  data?: ApiProfile | { user?: ApiProfile };
  user?: ApiProfile;
};

type LastShippingAddress = {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
};

type LastShippingAddressResponse = {
  status?: string;
  data?: LastShippingAddress;
};

type CheckoutItem = {
  productId?: string;
  quantity?: number;
  price?: number;
};

type CheckoutOrder = {
  id?: string;
  totalAmount?: number;
  status?: string;
  items?: CheckoutItem[];
};

type CheckoutResponse = {
  status?: string;
  message?: string;
  data?: CheckoutOrder[] | { orders?: CheckoutOrder[] };
};

type PaymentIntent = {
  orderId: string;
  paymentId?: string;
  gatewayRef?: string;
  amount?: number;
  mockCheckoutUrl?: string;
};

type PaymentIntentResponse = {
  success?: boolean;
  message?: string;
  data?: PaymentIntent;
};

type InvoiceLineItem = {
  key: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
};

const readErrorMessage = async (response: Response) => {
  const payload = await response
    .clone()
    .json()
    .catch(() => ({}));
  return (
    payload?.message ||
    payload?.error ||
    payload?.statusMessage ||
    "Unable to place order"
  );
};

const formatTimer = (secondsLeft: number) => {
  const safeSeconds = Math.max(0, secondsLeft);
  const minutes = Math.floor(safeSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (safeSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
};

export default function CheckoutPage() {
  const items = useCartStore((state) => state.items);
  const cartLoading = useCartStore((state) => state.isLoading);
  const fetchCart = useCartStore((state) => state.fetchCart);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);

  const [step, setStep] = useState<1 | 2>(1);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [initiatingPayment, setInitiatingPayment] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutOrders, setCheckoutOrders] = useState<CheckoutOrder[]>([]);
  const [sessionSecondsLeft, setSessionSecondsLeft] = useState(
    PAYMENT_WINDOW_SECONDS,
  );

  useEffect(() => {
    void fetchCart();
  }, [fetchCart]);

  const [shipping, setShipping] = useState({
    fullName: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
  });

  useEffect(() => {
    let isMounted = true;

    const hydrateLastShippingAddress = async () => {
      const addressEndpoints = [
        `${API_BASE_URL}/orders/my-orders/last-shipping-address`,
        `${API_BASE_URL}/my-orders/last-shipping-address`,
      ];

      for (const endpoint of addressEndpoints) {
        try {
          const response = await authFetch(endpoint, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) {
            continue;
          }

          const payload: LastShippingAddressResponse = await response
            .json()
            .catch(() => ({}));

          const address = payload?.data;
          if (!address || !isMounted) {
            return;
          }

          setShipping((prev) => ({
            ...prev,
            fullName: address.fullName || prev.fullName,
            email: address.email || prev.email,
            phone: address.phoneNumber || prev.phone,
            addressLine1: address.addressLine1 || prev.addressLine1,
            addressLine2: address.addressLine2 || prev.addressLine2,
            city: address.city || prev.city,
            state: address.state || prev.state,
            postalCode: address.postalCode || prev.postalCode,
          }));

          return;
        } catch {
          // Try the next endpoint variant.
        }
      }
    };

    const hydrateProfile = async () => {
      const profileEndpoints = [
        `${API_BASE_URL}/users/profile`,
        `${API_BASE_URL}/profile`,
      ];

      for (const endpoint of profileEndpoints) {
        try {
          const response = await authFetch(endpoint, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) {
            continue;
          }

          const payload: ApiProfileResponse = await response
            .json()
            .catch(() => ({}));

          const profileData = payload?.data;
          const profile =
            (profileData && "user" in profileData
              ? profileData.user
              : profileData) ||
            payload?.user ||
            null;

          if (!profile || !isMounted) {
            return;
          }

          const resolvedProfile = profile as ApiProfile;

          setShipping((prev) => ({
            ...prev,
            fullName: prev.fullName || resolvedProfile.name || "",
            email: prev.email || resolvedProfile.email || "",
            phone: prev.phone
              ? prev.phone
              : typeof resolvedProfile.phone === "number"
                ? String(resolvedProfile.phone)
                : (resolvedProfile.phone ?? ""),
          }));

          return;
        } catch {
          // Try the next endpoint variant.
        }
      }
    };

    void (async () => {
      await hydrateLastShippingAddress();
      await hydrateProfile();
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (step !== 2) {
      return;
    }

    const timer = window.setInterval(() => {
      setSessionSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [step]);

  const totalPrice = getTotalPrice();
  const paymentSessionExpired = sessionSecondsLeft <= 0;

  const invoiceLineItems = useMemo<InvoiceLineItem[]>(() => {
    const productNameById = new Map(
      items.map((item) => [item.productId, item.product?.name || "Product"]),
    );

    return checkoutOrders.flatMap((order, orderIndex) =>
      (order.items || []).map((item, itemIndex) => {
        const quantity = Math.max(1, Number(item.quantity || 1));
        const price = Number(item.price || 0);
        const productId = item.productId || `${orderIndex}-${itemIndex}`;
        return {
          key: `${order.id || orderIndex}-${productId}-${itemIndex}`,
          productName: productNameById.get(productId) || "Product",
          quantity,
          price,
          subtotal: quantity * price,
        };
      }),
    );
  }, [checkoutOrders, items]);

  const invoiceTotal = useMemo(
    () => invoiceLineItems.reduce((sum, item) => sum + item.subtotal, 0),
    [invoiceLineItems],
  );

  const handleShippingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlacingOrder(true);
    setCheckoutError("");

    const shippingAddress = {
      fullName: shipping.fullName.trim(),
      email: shipping.email.trim(),
      phoneNumber: shipping.phone.trim(),
      addressLine1: shipping.addressLine1.trim(),
      ...(shipping.addressLine2.trim().length > 0
        ? { addressLine2: shipping.addressLine2.trim() }
        : {}),
      city: shipping.city.trim(),
      state: shipping.state.trim(),
      postalCode: shipping.postalCode.trim(),
    };

    try {
      const response = await authFetch(`${API_BASE_URL}/orders/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ shippingAddress }),
      });

      if (!response.ok) {
        setCheckoutError(await readErrorMessage(response));
        setPlacingOrder(false);
        return;
      }

      const payload: CheckoutResponse = await response.json().catch(() => ({}));

      const orders = Array.isArray(payload?.data)
        ? payload.data
        : payload?.data?.orders;

      if (!Array.isArray(orders) || orders.length === 0) {
        setCheckoutError("Order created but invoice data is missing.");
        setPlacingOrder(false);
        return;
      }

      setCheckoutOrders(orders);
      setSessionSecondsLeft(PAYMENT_WINDOW_SECONDS);
      setStep(2);
      void fetchCart();
      setPlacingOrder(false);
    } catch {
      setCheckoutError("Unable to place order");
      setPlacingOrder(false);
    }
  };

  const handleProceedToPay = async () => {
    if (paymentSessionExpired || initiatingPayment) {
      return;
    }

    const orderIds = checkoutOrders
      .map((order) => order.id)
      .filter((orderId): orderId is string => Boolean(orderId));

    if (orderIds.length === 0) {
      setCheckoutError("No valid order IDs found for payment initiation.");
      return;
    }

    setInitiatingPayment(true);
    setCheckoutError("");

    try {
      const intents: PaymentIntent[] = [];

      for (const orderId of orderIds) {
        const response = await authFetch(
          `${API_BASE_URL}/payments/${orderId}/intent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        if (!response.ok) {
          const message = await readErrorMessage(response);
          throw new Error(
            message || `Failed to initiate payment for ${orderId}`,
          );
        }

        const payload: PaymentIntentResponse = await response
          .json()
          .catch(() => ({}));

        if (!payload?.data) {
          throw new Error("Payment intent response is missing data");
        }

        intents.push({
          orderId,
          paymentId: payload.data.paymentId,
          gatewayRef: payload.data.gatewayRef,
          amount: Number(payload.data.amount || 0),
          mockCheckoutUrl: payload.data.mockCheckoutUrl,
        });
      }

      sessionStorage.setItem(
        "marketflow-payment-session",
        JSON.stringify({
          createdAt: Date.now(),
          expiresInSeconds: sessionSecondsLeft,
          intents,
        }),
      );

      window.location.assign("/customer/checkout/gateway");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Payment initiation failed";
      setCheckoutError(message);
    } finally {
      setInitiatingPayment(false);
    }
  };

  if (cartLoading && items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3 text-primary" />
          <p className="text-muted-foreground">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (!cartLoading && items.length === 0 && step === 1) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-card border border-border rounded-lg p-8 text-center space-y-4">
            <h1 className="font-heading text-3xl leading-tight text-foreground">
              Your cart is empty
            </h1>
            <p className="text-muted-foreground">
              Add products to your cart before checkout.
            </p>
            <div className="flex justify-center gap-3">
              <Link
                href="/customer/cart"
                className="px-5 py-2 bg-primary text-white rounded-lg hover:opacity-90 font-medium"
              >
                Go to Cart
              </Link>
              <Link
                href="/products"
                className="px-5 py-2 border border-border rounded-lg hover:bg-secondary font-medium"
              >
                Browse Products
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-heading text-4xl sm:text-5xl leading-[1.05] tracking-[0.015em] text-foreground mb-8">
          Checkout
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex gap-4 mb-8">
              {[
                { num: 1, label: "Shipping" },
                { num: 2, label: "Invoice" },
              ].map((s) => (
                <div key={s.num} className="flex items-center gap-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      s.num <= step
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {s.num < step ? "✓" : s.num}
                  </div>
                  {s.num < 2 && (
                    <div
                      className={`w-8 h-1 ${s.num < step ? "bg-primary" : "bg-secondary"}`}
                    ></div>
                  )}
                </div>
              ))}
            </div>

            {step === 1 && (
              <form onSubmit={handleShippingSubmit} className="space-y-6">
                <div className="bg-card border border-border rounded-lg p-6">
                  <h2 className="font-heading text-2xl leading-tight text-foreground mb-4">
                    Shipping Address
                  </h2>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={shipping.fullName}
                          onChange={(e) =>
                            setShipping({
                              ...shipping,
                              fullName: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          value={shipping.email}
                          onChange={(e) =>
                            setShipping({ ...shipping, email: e.target.value })
                          }
                          className="w-full px-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={shipping.phone}
                        onChange={(e) =>
                          setShipping({ ...shipping, phone: e.target.value })
                        }
                        className="w-full px-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Address Line 1 *
                      </label>
                      <input
                        type="text"
                        value={shipping.addressLine1}
                        onChange={(e) =>
                          setShipping({
                            ...shipping,
                            addressLine1: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="House No., Building Name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Address Line 2
                      </label>
                      <input
                        type="text"
                        value={shipping.addressLine2}
                        onChange={(e) =>
                          setShipping({
                            ...shipping,
                            addressLine2: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Apartment, Street, Sector, Village"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          City *
                        </label>
                        <input
                          type="text"
                          value={shipping.city}
                          onChange={(e) =>
                            setShipping({ ...shipping, city: e.target.value })
                          }
                          className="w-full px-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          State *
                        </label>
                        <input
                          type="text"
                          value={shipping.state}
                          onChange={(e) =>
                            setShipping({ ...shipping, state: e.target.value })
                          }
                          className="w-full px-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Postal Code *
                        </label>
                        <input
                          type="text"
                          value={shipping.postalCode}
                          onChange={(e) =>
                            setShipping({
                              ...shipping,
                              postalCode: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {checkoutError && (
                    <p className="mt-4 text-sm text-destructive">
                      {checkoutError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={placingOrder}
                    className="mt-6 w-full px-6 py-3 bg-primary text-white rounded-lg hover:opacity-90 font-medium flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {placingOrder ? "Placing Order..." : "Checkout"}
                    {!placingOrder && <ChevronRight className="w-5 h-5" />}
                  </button>
                </div>
              </form>
            )}

            {step === 2 && (
              <div className="bg-card border border-border rounded-lg p-6 space-y-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-heading text-2xl leading-tight text-foreground">
                      Order Invoice
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your order is placed with status payment pending.
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-foreground">
                    Payment Pending
                  </span>
                </div>

                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/60">
                      <tr className="text-left text-muted-foreground">
                        <th className="px-4 py-3 font-medium">Product</th>
                        <th className="px-4 py-3 font-medium">Qty</th>
                        <th className="px-4 py-3 font-medium">Price</th>
                        <th className="px-4 py-3 font-medium text-right">
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceLineItems.map((line) => (
                        <tr key={line.key} className="border-t border-border">
                          <td className="px-4 py-3 text-foreground">
                            {line.productName}
                          </td>
                          <td className="px-4 py-3">{line.quantity}</td>
                          <td className="px-4 py-3">
                            ₹{line.price.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-foreground">
                            ₹{line.subtotal.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="rounded-lg bg-secondary/50 p-4 space-y-2">
                  <p className="text-sm text-muted-foreground">Shipping To</p>
                  <p className="text-sm text-foreground font-medium">
                    {shipping.fullName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {shipping.email} | {shipping.phone}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {shipping.addressLine1}
                    {shipping.addressLine2
                      ? `, ${shipping.addressLine2}`
                      : ""}, {shipping.city}, {shipping.state} -{" "}
                    {shipping.postalCode}
                  </p>
                </div>

                <div className="border-t border-border pt-4 flex items-center justify-between">
                  <span className="font-semibold text-foreground">
                    Invoice Total
                  </span>
                  <span className="text-xl font-bold text-primary">
                    ₹{invoiceTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            {step === 1 ? (
              <div className="bg-card border border-border rounded-lg p-6 sticky top-24">
                <h2 className="font-heading text-2xl leading-tight text-foreground mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Order Summary
                </h2>

                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {items.map((item) => (
                    <div
                      key={item.productId}
                      className="flex justify-between text-sm"
                    >
                      <span className="text-muted-foreground">
                        {item.product?.name || "Product"} x{item.quantity}
                      </span>
                      <span className="font-medium">
                        ₹{(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>₹{totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span className="text-green-600 dark:text-green-400">
                      Free
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                    <span>Total</span>
                    <span className="text-primary">
                      ₹{totalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-lg p-6 sticky top-24 space-y-5">
                <h2 className="font-heading text-2xl leading-tight text-foreground">
                  Payment Session
                </h2>

                <div className="rounded-lg border border-border p-4 bg-secondary/40">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                    Time Remaining
                  </p>
                  <p
                    className={`text-3xl font-bold tabular-nums ${paymentSessionExpired ? "text-destructive" : "text-foreground"}`}
                  >
                    {formatTimer(sessionSecondsLeft)}
                  </p>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  After 15 minutes, your reserved products will be added back to
                  stock if payment is not completed.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    void handleProceedToPay();
                  }}
                  disabled={paymentSessionExpired || initiatingPayment}
                  className="w-full px-5 py-3 bg-primary text-white rounded-lg hover:opacity-90 font-semibold disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                >
                  <Clock3 className="w-4 h-4" />
                  {initiatingPayment
                    ? "Connecting Gateway..."
                    : "Proceed to Pay"}
                </button>

                {checkoutOrders.length > 0 && (
                  <div className="rounded-lg border border-border p-3 text-xs text-muted-foreground space-y-1">
                    <p className="font-semibold text-foreground">Order IDs</p>
                    {checkoutOrders.map((order, index) => (
                      <p
                        key={order.id || `order-${index}`}
                        className="font-mono"
                      >
                        {order.id || `Order ${index + 1}`}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
