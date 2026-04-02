"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { useCartStore } from "@/lib/store";
import { authFetch } from "@/lib/auth-fetch";
import {
  ChevronRight,
  Package,
  Loader2,
  Clock3,
  ArrowLeft,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  User,
  CreditCard,
  Hash,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/config";

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
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [sessionSecondsLeft, setSessionSecondsLeft] = useState(
    PAYMENT_WINDOW_SECONDS,
  );

  const mockOffers = [
    {
      id: "summer-299",
      type: "flat" as const,
      value: 299,
    },
    {
      id: "delivery-first-3",
      type: "delivery" as const,
      value: 0,
    },
    {
      id: "welcome-100",
      type: "flat" as const,
      value: 100,
    },
    {
      id: "save10-max500",
      type: "percent" as const,
      value: 10,
      maxDiscount: 500,
    },
  ];

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
    const persistedOfferId = sessionStorage.getItem(
      "marketflow-selected-offer",
    );
    setSelectedOfferId(persistedOfferId);
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
  const selectedOffer = mockOffers.find(
    (offer) => offer.id === selectedOfferId,
  );
  const discountAmount = (() => {
    if (!selectedOffer) return 0;
    if (selectedOffer.type === "flat") {
      return Math.min(selectedOffer.value, totalPrice);
    }
    if (selectedOffer.type === "percent") {
      const computed = (totalPrice * selectedOffer.value) / 100;
      return Math.min(
        computed,
        selectedOffer.maxDiscount || computed,
        totalPrice,
      );
    }
    return 0;
  })();
  const platformFee = 29;
  const gstFee = 39;
  const deliveryFee = 50;
  const appliedDeliveryFee = 0;
  const finalTotal = Math.max(
    0,
    totalPrice - discountAmount + platformFee + gstFee + appliedDeliveryFee,
  );
  const paymentSessionExpired = sessionSecondsLeft <= 0;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 0,
    }).format(price);

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
        body: JSON.stringify({
          shippingAddress,
          platformFee,
          deliveryFee: appliedDeliveryFee,
          gst: gstFee,
          offerDiscount: discountAmount,
        }),
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
      <div className="min-h-screen bg-[var(--bg-base)]">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-[var(--brand-accent)]" />
          <p className="text-xs font-black uppercase tracking-widest text-black">
            Initializing Checkout...
          </p>
        </div>
      </div>
    );
  }

  if (!cartLoading && items.length === 0 && step === 1) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)]">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="bg-white border border-[var(--border-default)] rounded-xl p-12 text-center space-y-6 shadow-sm">
            <h1 className="text-3xl font-black text-black uppercase tracking-tight">
              Your cart is empty
            </h1>
            <p className="text-zinc-500 text-sm max-w-xs mx-auto">
              Add products to your bag before you can proceed to checkout.
            </p>
            <div className="flex justify-center gap-4 pt-4">
              <Link
                href="/customer/cart"
                className="px-8 py-3 bg-black text-white rounded-full font-black text-xs uppercase tracking-widest hover:bg-[var(--brand-accent)] transition-colors"
              >
                Go to Bag
              </Link>
              <Link
                href="/products"
                className="px-8 py-3 border border-[var(--border-default)] text-black rounded-full font-black text-xs uppercase tracking-widest hover:bg-[var(--bg-sunken)] transition-colors"
              >
                Catalogue
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] pb-20">
      <Navbar />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-2 mb-8 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
          <Link href="/" className="hover:text-black">
            Home
          </Link>
          <ChevronRight size={12} />
          <Link href="/customer/cart" className="hover:text-black">
            Bag
          </Link>
          <ChevronRight size={12} />
          <span className="text-black">Checkout</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-black text-red-600 uppercase tracking-tighter mb-10">
          Secure Checkout
        </h1>

        <div className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8">
            {/* Step Indicators */}
            <div className="flex gap-10 mb-12 border-b border-[var(--border-default)] pb-6">
              {[
                { num: 1, label: "Shipping" },
                { num: 2, label: "Confirmation" },
              ].map((s) => (
                <div key={s.num} className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-colors ${
                      s.num === step
                        ? "bg-black text-white"
                        : s.num < step
                          ? "bg-[var(--brand-accent)] text-white"
                          : "bg-[var(--bg-sunken)] text-zinc-400"
                    }`}
                  >
                    {s.num < step ? "✓" : s.num}
                  </div>
                  <span
                    className={`text-xs font-black uppercase tracking-widest ${s.num === step ? "text-black" : "text-zinc-400"}`}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            {step === 1 && (
              <form onSubmit={handleShippingSubmit} className="space-y-10">
                <div className="space-y-8">
                  <div className="flex items-center gap-3 mb-2">
                    <User size={18} className="text-[var(--brand-accent)]" />
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-black">
                      Contact Details
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={shipping.fullName}
                        onChange={(e) =>
                          setShipping({ ...shipping, fullName: e.target.value })
                        }
                        className="w-full h-12 px-4 bg-white border border-[var(--border-default)] rounded-xl text-sm font-bold focus:border-black outline-none transition-colors"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">
                        Email *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
                        <input
                          type="email"
                          value={shipping.email}
                          onChange={(e) =>
                            setShipping({ ...shipping, email: e.target.value })
                          }
                          className="w-full h-12 pl-11 pr-4 bg-white border border-[var(--border-default)] rounded-xl text-sm font-bold focus:border-black outline-none transition-colors"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
                      <input
                        type="tel"
                        value={shipping.phone}
                        onChange={(e) =>
                          setShipping({ ...shipping, phone: e.target.value })
                        }
                        className="w-full h-12 pl-11 pr-4 bg-white border border-[var(--border-default)] rounded-xl text-sm font-bold focus:border-black outline-none transition-colors"
                        placeholder="+91"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-4 space-y-8">
                    <div className="flex items-center gap-3 mb-2">
                      <MapPin
                        size={18}
                        className="text-[var(--brand-accent)]"
                      />
                      <h2 className="text-sm font-black uppercase tracking-[0.2em] text-black">
                        Shipping Address
                      </h2>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">
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
                          className="w-full h-12 px-4 bg-white border border-[var(--border-default)] rounded-xl text-sm font-bold focus:border-black outline-none transition-colors"
                          placeholder="House No., Building Name"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">
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
                          className="w-full h-12 px-4 bg-white border border-[var(--border-default)] rounded-xl text-sm font-bold focus:border-black outline-none transition-colors"
                          placeholder="Apartment, Street, Village"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">
                            City *
                          </label>
                          <input
                            type="text"
                            value={shipping.city}
                            onChange={(e) =>
                              setShipping({ ...shipping, city: e.target.value })
                            }
                            className="w-full h-12 px-4 bg-white border border-[var(--border-default)] rounded-xl text-sm font-bold focus:border-black outline-none transition-colors"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">
                            State *
                          </label>
                          <input
                            type="text"
                            value={shipping.state}
                            onChange={(e) =>
                              setShipping({
                                ...shipping,
                                state: e.target.value,
                              })
                            }
                            className="w-full h-12 px-4 bg-white border border-[var(--border-default)] rounded-xl text-sm font-bold focus:border-black outline-none transition-colors"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] ml-1">
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
                            className="w-full h-12 px-4 bg-white border border-[var(--border-default)] rounded-xl text-sm font-bold focus:border-black outline-none transition-colors"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {checkoutError && (
                  <div className="p-4 bg-red-50 rounded-xl border border-red-100 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <p className="text-xs font-bold text-red-600 uppercase tracking-widest">
                      {checkoutError}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={placingOrder}
                  className="w-full h-14 bg-black text-white rounded-full font-black text-xs uppercase tracking-widest hover:bg-[var(--brand-accent)] transition-all flex items-center justify-center gap-3 disabled:opacity-60 shadow-xl"
                >
                  {placingOrder ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Proceed to Review
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            )}

            {step === 2 && (
              <div className="space-y-10">
                <div className="p-8 bg-white border border-[var(--border-default)] rounded-xl shadow-sm space-y-8">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-black text-black uppercase tracking-tight">
                        Order Confirmation
                      </h2>
                      <p className="text-xs font-bold text-zinc-400 mt-1 uppercase tracking-widest">
                        Order placed successfully • Awaiting Payment
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-[var(--bg-sunken)] rounded-full text-[10px] font-black uppercase tracking-widest text-black border border-[var(--border-default)]">
                      Pending
                    </span>
                  </div>

                  <div className="rounded-xl border border-[var(--border-default)] overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-[var(--bg-sunken)]">
                        <tr className="text-[10px] font-black uppercase tracking-widest text-zinc-500 border-b border-[var(--border-default)]">
                          <th className="px-6 py-4">Product</th>
                          <th className="px-6 py-4 text-center">Qty</th>
                          <th className="px-6 py-4 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-default)]">
                        {invoiceLineItems.map((line) => (
                          <tr key={line.key} className="text-sm font-bold">
                            <td className="px-6 py-4 text-black uppercase tracking-tight">
                              {line.productName}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {line.quantity}
                            </td>
                            <td className="px-6 py-4 text-right font-black">
                              ₹{formatPrice(line.subtotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                        Shipping Details
                      </h4>
                      <p className="text-sm font-black text-black uppercase">
                        {shipping.fullName}
                      </p>
                      <p className="text-xs font-bold text-zinc-500 leading-relaxed">
                        {shipping.addressLine1},{" "}
                        {shipping.addressLine2
                          ? shipping.addressLine2 + ", "
                          : ""}
                        {shipping.city}, {shipping.state} -{" "}
                        {shipping.postalCode}
                      </p>
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                        Contact Info
                      </h4>
                      <p className="text-xs font-bold text-zinc-500">
                        {shipping.email}
                      </p>
                      <p className="text-xs font-bold text-zinc-500">
                        {shipping.phone}
                      </p>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-[var(--border-default)] flex items-center justify-between">
                    <span className="text-sm font-black text-zinc-400 uppercase tracking-widest">
                      Total Invoice
                    </span>
                    <span className="text-3xl font-black text-black tracking-tighter">
                      ₹{formatPrice(invoiceTotal)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-4">
            {step === 1 ? (
              <div className="sticky top-24 space-y-6">
                <div className="p-8 bg-white border border-[var(--border-default)] rounded-xl shadow-xl space-y-6">
                  <h2 className="text-xl font-black text-black uppercase tracking-tight flex items-center gap-3">
                    <Package className="w-5 h-5 text-[var(--brand-accent)]" />
                    Order Summary
                  </h2>

                  <div className="space-y-4 max-h-64 overflow-y-auto pr-2 scrollbar-hide">
                    {items.map((item) => (
                      <div
                        key={item.productId}
                        className="flex justify-between gap-4"
                      >
                        <div className="flex-1">
                          <p className="text-xs font-black text-black uppercase leading-tight line-clamp-1">
                            {item.product?.name || "Product"}
                          </p>
                          <p className="text-[10px] font-bold text-zinc-400 mt-1 uppercase tracking-tighter">
                            Qty: {item.quantity}
                          </p>
                        </div>
                        <span className="text-xs font-black text-black">
                          ₹{formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-[var(--border-default)] pt-6 space-y-4">
                    <div className="flex justify-between items-center text-xs font-bold text-zinc-500 uppercase tracking-widest">
                      <span>Bag Total</span>
                      <span>₹{formatPrice(totalPrice)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between items-center text-xs font-bold text-green-600 uppercase tracking-widest">
                        <span>Offer Discount</span>
                        <span>-₹{formatPrice(discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-xs font-bold text-zinc-500 uppercase tracking-widest">
                      <span>Platform Fee</span>
                      <span className="text-black">
                        ₹{formatPrice(platformFee)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold text-zinc-500 uppercase tracking-widest">
                      <span>Delivery Fee</span>
                      <span>
                        <span className="text-zinc-400 line-through mr-2">
                          ₹{formatPrice(deliveryFee)}
                        </span>
                        <span className="text-green-600">Free</span>
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold text-zinc-500 uppercase tracking-widest">
                      <span>GST</span>
                      <span className="text-black">₹{formatPrice(gstFee)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-[var(--border-default)]">
                      <span className="text-sm font-black text-black uppercase tracking-widest">
                        Order Total
                      </span>
                      <span className="text-2xl font-black text-black tracking-tighter">
                        ₹{formatPrice(finalTotal)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-black rounded-xl text-white space-y-4 border border-zinc-800 shadow-xl">
                  <div className="flex items-center gap-3">
                    <ShieldCheck
                      size={18}
                      className="text-[var(--brand-accent)]"
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      Secure Payment Gateway
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-400 font-bold leading-relaxed">
                    Your transactions are protected with military-grade 256-bit
                    SSL encryption and fraud prevention systems.
                  </p>
                </div>
              </div>
            ) : (
              <div className="sticky top-24 space-y-6">
                <div className="p-8 bg-white border border-[var(--border-default)] rounded-xl shadow-xl space-y-8">
                  <h2 className="text-xl font-black text-black uppercase tracking-tight flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-[var(--brand-accent)]" />
                    Final Step
                  </h2>

                  <div className="p-6 bg-[var(--bg-sunken)] rounded-xl border border-[var(--border-default)] text-center space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                      Payment Window Expires In
                    </p>
                    <div className="flex items-center justify-center gap-3 text-4xl font-black text-black tracking-tighter tabular-nums">
                      <Clock3 className="w-6 h-6 text-[var(--brand-accent)]" />
                      {formatTimer(sessionSecondsLeft)}
                    </div>
                  </div>

                  <p className="text-[10px] text-zinc-400 font-bold leading-relaxed text-center uppercase tracking-tighter">
                    Please complete your payment within 15 minutes to secure
                    your items and current pricing.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      void handleProceedToPay();
                    }}
                    disabled={paymentSessionExpired || initiatingPayment}
                    className="w-full h-14 bg-black text-white rounded-full font-black text-xs uppercase tracking-widest hover:bg-[var(--brand-accent)] transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg"
                  >
                    {initiatingPayment ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Proceed to Payment
                        <ChevronRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>

                {checkoutOrders.length > 0 && (
                  <div className="p-6 bg-white border border-[var(--border-default)] rounded-xl shadow-sm space-y-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-black flex items-center gap-2">
                          <Hash className="w-3.5 h-3.5 text-[var(--brand-accent)]" />
                          Reference IDs
                        </h4>
                        <p className="text-[10px] font-bold text-zinc-500">
                          Keep these IDs handy for payment verification or
                          support.
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-[var(--bg-sunken)] border border-[var(--border-default)] text-[9px] font-black uppercase tracking-widest text-zinc-500">
                        {checkoutOrders.length} order
                        {checkoutOrders.length > 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {checkoutOrders.map((order, index) => (
                        <div
                          key={order.id || `order-${index}`}
                          className="flex items-center justify-between gap-3 rounded-lg bg-[var(--bg-sunken)] border border-[var(--border-default)] px-3 py-2.5"
                        >
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                            Order #{index + 1}
                          </span>
                          <span className="font-mono text-[11px] font-black tracking-wide text-black">
                            {order.id?.slice(-12) || "---"}
                          </span>
                        </div>
                      ))}
                    </div>
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
