"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { PageLoader } from "@/components/ui/page-loader";
import { useCartStore } from "@/lib/store";
import { authFetch } from "@/lib/auth-fetch";
import {
  ChevronRight,
  Package,
  Loader2,
  Clock3,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  User,
  CreditCard,
  TicketPercent,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/config";

const PAYMENT_WINDOW_SECONDS = 15 * 60;
const APPLIED_OFFERS_STORAGE_KEY = "markivo-applied-offers";
const MANDATORY_DELIVERY_FEE = 40;

type PriceSummary = {
  subtotal: number;
  platformFee: number;
  deliveryFee: number;
  gst: number;
  offerDiscount: number;
  grandTotal: number;
};

type CartResponse = {
  status?: string;
  data?: {
    pricing?: Partial<PriceSummary>;
  };
};

type CartOffer = {
  id: string;
  productId: string;
  offerName?: string;
  discountPercentage?: number;
  couponCode?: string;
  termsAndConditions?: string;
};

type CartOffersResponse = {
  status?: string;
  data?: Record<string, CartOffer[]>;
};

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
  clientSecret?: string;
  stripeClientSecret?: string;
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

type AppliedOfferInput = {
  productId: string;
  offerId?: string;
  couponCode?: string;
};

type PaymentMode = "ONLINE" | "COD";

const EMPTY_PRICING: PriceSummary = {
  subtotal: 0,
  platformFee: 0,
  deliveryFee: 0,
  gst: 0,
  offerDiscount: 0,
  grandTotal: 0,
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

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: Number.isInteger(price) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(price);

const toPricing = (pricing?: Partial<PriceSummary>): PriceSummary => ({
  subtotal: Number(pricing?.subtotal || 0),
  platformFee: Number(pricing?.platformFee || 0),
  deliveryFee: Number(pricing?.deliveryFee || 0),
  gst: Number(pricing?.gst || 0),
  offerDiscount: Number(pricing?.offerDiscount || 0),
  grandTotal: Number(pricing?.grandTotal || 0),
});

export default function CheckoutPage() {
  const items = useCartStore((state) => state.items);
  const cartLoading = useCartStore((state) => state.isLoading);
  const fetchCart = useCartStore((state) => state.fetchCart);

  const [step, setStep] = useState<1 | 2>(1);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [initiatingPayment, setInitiatingPayment] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutOrders, setCheckoutOrders] = useState<CheckoutOrder[]>([]);
  const [sessionSecondsLeft, setSessionSecondsLeft] = useState(
    PAYMENT_WINDOW_SECONDS,
  );

  const [pricing, setPricing] = useState<PriceSummary>(EMPTY_PRICING);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [offersLoading, setOffersLoading] = useState(false);
  const [offersByProduct, setOffersByProduct] = useState<
    Record<string, CartOffer[]>
  >({});
  const [appliedOffers, setAppliedOffers] = useState<
    Record<string, AppliedOfferInput>
  >({});

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
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("ONLINE");

  useEffect(() => {
    void fetchCart();
  }, [fetchCart]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const raw = sessionStorage.getItem(APPLIED_OFFERS_STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as AppliedOfferInput[];
      if (!Array.isArray(parsed)) {
        return;
      }

      const mapped = parsed.reduce<Record<string, AppliedOfferInput>>(
        (acc, entry) => {
          if (!entry?.productId) {
            return acc;
          }

          acc[entry.productId] = {
            productId: entry.productId,
            offerId: entry.offerId,
            couponCode: entry.couponCode,
          };
          return acc;
        },
        {},
      );

      setAppliedOffers(mapped);
    } catch {
      // Ignore invalid persisted state.
    }
  }, []);

  const appliedOffersList = useMemo(
    () =>
      Object.values(appliedOffers).filter((entry) => Boolean(entry.productId)),
    [appliedOffers],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    sessionStorage.setItem(
      APPLIED_OFFERS_STORAGE_KEY,
      JSON.stringify(appliedOffersList),
    );
  }, [appliedOffersList]);

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
    let isMounted = true;

    const fetchPricingAndOffers = async () => {
      setPricingLoading(true);
      setOffersLoading(true);

      try {
        const cartResponse = await authFetch(`${API_BASE_URL}/cart`, {
          method: "GET",
        });

        if (cartResponse.ok) {
          const payload: CartResponse = await cartResponse
            .json()
            .catch(() => ({}));

          if (isMounted) {
            setPricing(toPricing(payload?.data?.pricing));
          }
        }

        const offersResponse = await authFetch(`${API_BASE_URL}/cart/offers`, {
          method: "GET",
        });

        if (offersResponse.ok) {
          const offersPayload: CartOffersResponse = await offersResponse
            .json()
            .catch(() => ({}));
          const offersMap = offersPayload?.data || {};

          if (isMounted) {
            setOffersByProduct(offersMap);
            setAppliedOffers((prev) => {
              const sanitized: Record<string, AppliedOfferInput> = {};

              Object.values(prev).forEach((entry) => {
                const available = offersMap[entry.productId] || [];
                const matched = available.find(
                  (offer) => offer.id === entry.offerId,
                );

                if (matched) {
                  sanitized[entry.productId] = {
                    productId: entry.productId,
                    offerId: matched.id,
                    couponCode: matched.couponCode,
                  };
                }
              });

              return sanitized;
            });
          }
        }
      } finally {
        if (isMounted) {
          setPricingLoading(false);
          setOffersLoading(false);
        }
      }
    };

    void fetchPricingAndOffers();

    return () => {
      isMounted = false;
    };
  }, [items.length]);

  useEffect(() => {
    if (step !== 2 || paymentMode !== "ONLINE") {
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
  }, [step, paymentMode]);

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

  const invoiceTotalFromOrders = useMemo(
    () =>
      checkoutOrders.reduce(
        (sum, order) => sum + Number(order.totalAmount || 0),
        0,
      ),
    [checkoutOrders],
  );

  const invoiceTotal =
    invoiceTotalFromOrders > 0
      ? invoiceTotalFromOrders
      : invoiceLineItems.reduce((sum, item) => sum + item.subtotal, 0);

  const itemSubtotal = invoiceLineItems.reduce(
    (sum, item) => sum + item.subtotal,
    0,
  );

  const cartSubtotal =
    pricing.subtotal > 0
      ? pricing.subtotal
      : items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const effectiveDeliveryFee = Math.max(
    MANDATORY_DELIVERY_FEE,
    Number(pricing.deliveryFee || 0),
  );

  const cartTotalPayable = Math.max(
    0,
    cartSubtotal +
      pricing.platformFee +
      effectiveDeliveryFee -
      pricing.offerDiscount,
  );

  const reviewSubtotal = itemSubtotal > 0 ? itemSubtotal : invoiceTotal;

  const reviewTotalPayable = Math.max(
    0,
    reviewSubtotal +
      pricing.platformFee +
      effectiveDeliveryFee -
      pricing.offerDiscount,
  );

  const createdOrderIds = checkoutOrders
    .map((order) => order.id)
    .filter((orderId): orderId is string => Boolean(orderId));
  const primaryOrderId = createdOrderIds[0] || "Will appear in My Orders";
  const createdOrderCount = createdOrderIds.length || 1;
  const codDisplayTotal =
    invoiceTotalFromOrders > 0 ? invoiceTotalFromOrders : cartTotalPayable;
  const isCodSuccess = step === 2 && paymentMode === "COD";

  const handleOfferSelect = (productId: string, offer: CartOffer) => {
    setAppliedOffers((prev) => {
      const current = prev[productId];
      if (current?.offerId === offer.id) {
        const updated = { ...prev };
        delete updated[productId];
        return updated;
      }

      return {
        ...prev,
        [productId]: {
          productId,
          offerId: offer.id,
          couponCode: offer.couponCode,
        },
      };
    });
  };

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
          paymentMode,
          appliedOffers: appliedOffersList,
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

      if (Array.isArray(orders)) {
        setCheckoutOrders(orders);
      }

      if (paymentMode === "COD") {
        setStep(2);
        void fetchCart();
        setPlacingOrder(false);
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
        return;
      }

      if (!Array.isArray(orders) || orders.length === 0) {
        setCheckoutError("Order created but invoice data is missing.");
        setPlacingOrder(false);
        return;
      }

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
          clientSecret: payload.data.clientSecret,
          stripeClientSecret: payload.data.stripeClientSecret,
        });
      }

      sessionStorage.setItem(
        "markivo-payment-session",
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

  const hasAnyOffers = Object.values(offersByProduct).some(
    (offers) => Array.isArray(offers) && offers.length > 0,
  );

  if (cartLoading && items.length === 0) {
    return (
      <PageLoader
        message="Initializing Checkout"
        subtext="Securing your items, delivery options, and payment session..."
      />
    );
  }

  if (!cartLoading && items.length === 0 && step === 1) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)]">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="bg-white border border-[var(--border-default)] rounded-md p-12 text-center space-y-6 shadow-sm">
            <h1 className="text-2xl sm:text-3xl font-bold text-black tracking-tight">
              Your cart is empty
            </h1>
            <p className="text-zinc-500 text-sm max-w-xs mx-auto">
              Add products to your bag before you can proceed to checkout.
            </p>
            <div className="flex justify-center gap-4 pt-4">
              <Link
                href="/customer/cart"
                className="px-6 py-2.5 bg-black text-white rounded-md font-bold text-xs hover:bg-zinc-800 transition-colors"
              >
                Go to Bag
              </Link>
              <Link
                href="/products"
                className="px-6 py-2.5 border border-[var(--border-default)] text-black rounded-md font-bold text-xs hover:bg-zinc-50 transition-colors"
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
        <div className="flex items-center gap-2 mb-6 text-xs font-semibold text-zinc-500">
          <Link href="/" className="hover:text-black transition-colors">
            Home
          </Link>
          <ChevronRight size={13} />
          <Link href="/customer/cart" className="hover:text-black transition-colors">
            Cart
          </Link>
          <ChevronRight size={13} />
          <span className="text-black font-bold">Checkout</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-black tracking-tight mb-8">
          Secure Checkout
        </h1>

        <div className="grid lg:grid-cols-12 gap-8">
          <div className={isCodSuccess ? "lg:col-span-12" : "lg:col-span-8"}>
            <div className="flex gap-8 mb-8 border-b border-[var(--border-default)] pb-5">
              {[
                { num: 1, label: "Shipping Address" },
                {
                  num: 2,
                  label: isCodSuccess ? "Order Placed" : "Order Confirmation",
                },
              ].map((s) => (
                <div key={s.num} className="flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      s.num === step
                        ? "bg-black text-white"
                        : s.num < step
                          ? "bg-[var(--brand-accent)] text-white"
                          : "bg-zinc-100 text-zinc-400"
                    }`}
                  >
                    {s.num < step ? "✓" : s.num}
                  </div>
                  <span
                    className={`text-xs sm:text-sm font-semibold ${s.num === step ? "text-black font-bold" : "text-zinc-400"}`}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            {step === 1 && (
              <form
                id="checkout-shipping-form"
                onSubmit={handleShippingSubmit}
                className="space-y-8"
              >
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-1">
                    <User size={18} className="text-[var(--brand-accent)]" />
                    <h2 className="text-base sm:text-lg font-bold text-black">
                      Contact Details
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-700">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={shipping.fullName}
                        onChange={(e) =>
                          setShipping({ ...shipping, fullName: e.target.value })
                        }
                        className="w-full h-11 px-3.5 bg-white border border-[var(--border-default)] rounded-md text-sm font-medium focus:border-black focus:ring-1 focus:ring-black/10 outline-none transition-colors"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-700">
                        Email *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                          type="email"
                          value={shipping.email}
                          onChange={(e) =>
                            setShipping({ ...shipping, email: e.target.value })
                          }
                          className="w-full h-11 pl-10 pr-3.5 bg-white border border-[var(--border-default)] rounded-md text-sm font-medium focus:border-black focus:ring-1 focus:ring-black/10 outline-none transition-colors"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-700">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <input
                        type="tel"
                        value={shipping.phone}
                        onChange={(e) =>
                          setShipping({ ...shipping, phone: e.target.value })
                        }
                        className="w-full h-11 pl-10 pr-3.5 bg-white border border-[var(--border-default)] rounded-md text-sm font-medium focus:border-black focus:ring-1 focus:ring-black/10 outline-none transition-colors"
                        placeholder="+91"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-2 space-y-6">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin
                        size={18}
                        className="text-[var(--brand-accent)]"
                      />
                      <h2 className="text-base sm:text-lg font-bold text-black">
                        Shipping Address
                      </h2>
                    </div>

                    <div className="space-y-5">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-zinc-700">
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
                          className="w-full h-11 px-3.5 bg-white border border-[var(--border-default)] rounded-md text-sm font-medium focus:border-black focus:ring-1 focus:ring-black/10 outline-none transition-colors"
                          placeholder="House No., Building Name"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-zinc-700">
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
                          className="w-full h-11 px-3.5 bg-white border border-[var(--border-default)] rounded-md text-sm font-medium focus:border-black focus:ring-1 focus:ring-black/10 outline-none transition-colors"
                          placeholder="Apartment, Street, Village"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-zinc-700">
                            City *
                          </label>
                          <input
                            type="text"
                            value={shipping.city}
                            onChange={(e) =>
                              setShipping({ ...shipping, city: e.target.value })
                            }
                            className="w-full h-11 px-3.5 bg-white border border-[var(--border-default)] rounded-md text-sm font-medium focus:border-black focus:ring-1 focus:ring-black/10 outline-none transition-colors"
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-zinc-700">
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
                            className="w-full h-11 px-3.5 bg-white border border-[var(--border-default)] rounded-md text-sm font-medium focus:border-black focus:ring-1 focus:ring-black/10 outline-none transition-colors"
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-zinc-700">
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
                            className="w-full h-11 px-3.5 bg-white border border-[var(--border-default)] rounded-md text-sm font-medium focus:border-black focus:ring-1 focus:ring-black/10 outline-none transition-colors"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-[var(--bg-sunken)] rounded-xl border border-dashed border-[var(--border-default)] space-y-4">
                    <div className="flex items-center gap-2 text-black">
                      <TicketPercent
                        size={18}
                        className="text-[var(--brand-accent)]"
                      />
                      <span className="text-xs font-black uppercase tracking-widest">
                        Offers by Product
                      </span>
                    </div>

                    {offersLoading ? (
                      <p className="text-[10px] font-bold text-[var(--text-muted)]">
                        Loading available offers...
                      </p>
                    ) : !hasAnyOffers ? (
                      <p className="text-[10px] font-bold text-[var(--text-muted)]">
                        No active offers available for the current cart items.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {items.map((item) => {
                          const offers = offersByProduct[item.productId] || [];
                          if (offers.length === 0) {
                            return null;
                          }

                          return (
                            <div
                              key={`offers-${item.productId}`}
                              className="bg-white border border-[var(--border-default)] rounded-xl p-4 space-y-3"
                            >
                              <p className="text-[10px] font-black uppercase tracking-widest text-black">
                                {item.product?.name || "Product"}
                              </p>
                              <div className="space-y-2.5">
                                {offers.map((offer) => {
                                  const isSelected =
                                    appliedOffers[item.productId]?.offerId ===
                                    offer.id;

                                  return (
                                    <button
                                      key={offer.id}
                                      type="button"
                                      onClick={() =>
                                        handleOfferSelect(item.productId, offer)
                                      }
                                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                                        isSelected
                                          ? "bg-red-50 border-red-200"
                                          : "bg-white border-[var(--border-default)] hover:border-red-200"
                                      }`}
                                    >
                                      <div className="flex items-start justify-between gap-3">
                                        <div>
                                          <p className="text-[11px] font-black uppercase tracking-wide text-black leading-snug">
                                            {offer.offerName || "Special Offer"}
                                          </p>
                                          {offer.discountPercentage ? (
                                            <p className="text-[10px] font-bold text-[var(--text-muted)] mt-1">
                                              {offer.discountPercentage}% off
                                              {offer.couponCode
                                                ? ` • Code: ${offer.couponCode}`
                                                : ""}
                                            </p>
                                          ) : (
                                            <p className="text-[10px] font-bold text-[var(--text-muted)] mt-1">
                                              {offer.couponCode
                                                ? `Code: ${offer.couponCode}`
                                                : "Offer available"}
                                            </p>
                                          )}
                                        </div>
                                        {isSelected && (
                                          <span className="text-[9px] font-black uppercase tracking-widest text-red-600">
                                            Selected
                                          </span>
                                        )}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
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
                  disabled={placingOrder || pricingLoading}
                  className="hidden lg:flex w-full h-12 bg-black hover:bg-zinc-800 text-white rounded-md font-bold text-sm transition-all items-center justify-center gap-2 disabled:opacity-60 shadow-sm cursor-pointer"
                >
                  {placingOrder ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {paymentMode === "COD"
                        ? "Place COD Order"
                        : "Proceed to Review"}
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            )}

            {step === 2 && paymentMode === "COD" && (
              <div className="max-w-5xl mx-auto">
                <div className="p-6 sm:p-8 bg-white border border-[var(--border-default)] rounded-md shadow-sm space-y-6 sm:space-y-8">
                  <div className="text-center space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-accent)]">
                      Cash On Delivery
                    </p>
                    <h2 className="text-2xl sm:text-4xl font-bold text-black tracking-tight">
                      Order Placed Successfully
                    </h2>
                    <p className="max-w-2xl mx-auto text-sm text-zinc-600 leading-relaxed">
                      Your order has been confirmed. Payment will be collected at delivery.
                    </p>
                  </div>

                  <div className="rounded-md border border-[var(--border-default)] bg-zinc-50/70 p-5 sm:p-6">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                      <div className="space-y-1.5">
                        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                          Order Reference
                        </p>
                        <h3 className="text-xl sm:text-2xl font-bold text-black">
                          COD Invoice Summary
                        </h3>
                        <p className="text-sm font-semibold text-black break-all">
                          {primaryOrderId}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 lg:min-w-[320px]">
                        <div className="rounded-md border border-[var(--border-default)] bg-white p-3.5 space-y-1">
                          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                            Payment Mode
                          </p>
                          <p className="text-base font-bold text-black">COD</p>
                        </div>
                        <div className="rounded-md border border-[var(--border-default)] bg-white p-3.5 space-y-1">
                          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                            Orders Created
                          </p>
                          <p className="text-base font-bold text-black">
                            {createdOrderCount}
                          </p>
                        </div>
                        <div className="col-span-2 rounded-md border border-[var(--border-default)] bg-white p-3.5 space-y-1">
                          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                            Amount Payable
                          </p>
                          <p className="text-xl font-bold text-black tracking-tight">
                            ₹{formatPrice(codDisplayTotal)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <div className="rounded-md border border-[var(--border-default)] p-5 space-y-2 bg-white">
                      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        Deliver To
                      </p>
                      <p className="text-base font-bold text-black">
                        {shipping.fullName}
                      </p>
                      <p className="text-sm text-zinc-600 leading-relaxed">
                        {shipping.addressLine1},{" "}
                        {shipping.addressLine2
                          ? `${shipping.addressLine2}, `
                          : ""}
                        {shipping.city}, {shipping.state} -{" "}
                        {shipping.postalCode}
                      </p>
                    </div>

                    <div className="rounded-md border border-[var(--border-default)] p-5 space-y-2 bg-white">
                      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        Contact
                      </p>
                      <p className="text-sm font-medium text-zinc-700">
                        {shipping.email}
                      </p>
                      <p className="text-sm font-medium text-zinc-700">
                        {shipping.phone}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-center">
                    <Link
                      href="/products"
                      className="w-full sm:w-auto sm:min-w-[200px] h-11 bg-black text-white rounded-md font-bold text-sm hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 text-center"
                    >
                      Continue Shopping
                    </Link>
                    <Link
                      href="/customer/orders"
                      className="w-full sm:w-auto sm:min-w-[200px] h-11 border border-[var(--border-default)] text-black rounded-md font-bold text-sm hover:bg-zinc-50 transition-all flex items-center justify-center gap-2 text-center"
                    >
                      View My Orders
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && paymentMode === "ONLINE" && (
              <div className="space-y-8">
                <div className="p-6 sm:p-8 bg-white border border-[var(--border-default)] rounded-md shadow-sm space-y-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-black tracking-tight">
                        Order Confirmation
                      </h2>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Order placed successfully • Awaiting Payment
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-md text-xs font-bold border border-amber-200">
                      Pending Payment
                    </span>
                  </div>

                  <div className="rounded-md border border-[var(--border-default)] overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-zinc-50">
                        <tr className="text-xs font-semibold text-zinc-500 border-b border-[var(--border-default)]">
                          <th className="px-5 py-3">Product</th>
                          <th className="px-5 py-3 text-center">Qty</th>
                          <th className="px-5 py-3 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-default)]">
                        {invoiceLineItems.map((line) => (
                          <tr key={line.key} className="text-sm font-medium">
                            <td className="px-5 py-3.5 text-black font-semibold">
                              {line.productName}
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              {line.quantity}
                            </td>
                            <td className="px-5 py-3.5 text-right font-bold text-black">
                              ₹{formatPrice(line.subtotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        Shipping Details
                      </h4>
                      <p className="text-sm font-bold text-black">
                        {shipping.fullName}
                      </p>
                      <p className="text-xs text-zinc-600 leading-relaxed">
                        {shipping.addressLine1},{" "}
                        {shipping.addressLine2
                          ? shipping.addressLine2 + ", "
                          : ""}
                        {shipping.city}, {shipping.state} -{" "}
                        {shipping.postalCode}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        Contact Info
                      </h4>
                      <p className="text-xs font-medium text-zinc-700">
                        {shipping.email}
                      </p>
                      <p className="text-xs font-medium text-zinc-700">
                        {shipping.phone}
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-[var(--border-default)] space-y-3">
                    <div className="flex justify-between items-center text-xs text-zinc-600 font-medium">
                      <span>Subtotal</span>
                      <span>₹{formatPrice(reviewSubtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-zinc-600 font-medium">
                      <span>Platform Fee</span>
                      <span className="text-black font-semibold">
                        ₹{formatPrice(pricing.platformFee)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-zinc-600 font-medium">
                      <span>Delivery Fee</span>
                      <span className="text-black font-semibold">
                        ₹{formatPrice(effectiveDeliveryFee)}
                      </span>
                    </div>
                    {pricing.offerDiscount > 0 && (
                      <div className="flex justify-between items-center text-xs font-semibold text-emerald-600">
                        <span>Offer Discount</span>
                        <span>-₹{formatPrice(pricing.offerDiscount)}</span>
                      </div>
                    )}
                    <div className="pt-3 border-t border-[var(--border-default)] flex items-center justify-between">
                      <span className="text-sm font-bold text-black">
                        Total Payable
                      </span>
                      <span className="text-2xl font-bold text-black tracking-tight">
                        {pricingLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>₹{formatPrice(reviewTotalPayable)}</>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {!isCodSuccess && (
            <div className="lg:col-span-4">
              {step === 1 ? (
                <div className="sticky top-24 space-y-5">
                  <div className="p-6 bg-white border border-[var(--border-default)] rounded-md shadow-sm space-y-5">
                    <h2 className="text-base font-bold text-black flex items-center gap-2">
                      <Package className="w-4 h-4 text-[var(--brand-accent)]" />
                      Order Summary
                    </h2>

                    <div className="space-y-3 max-h-64 overflow-y-auto pr-1 scrollbar-hide">
                      {items.map((item) => (
                        <div
                          key={item.productId}
                          className="flex justify-between gap-3 text-xs"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-black line-clamp-1">
                              {item.product?.name || "Product"}
                            </p>
                            <p className="text-zinc-400 mt-0.5">
                              Qty: {item.quantity}
                            </p>
                          </div>
                          <span className="font-bold text-black shrink-0">
                            ₹{formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-[var(--border-default)] pt-4 space-y-3">
                      <div className="flex justify-between items-center text-xs text-zinc-600">
                        <span>Subtotal</span>
                        <span className="font-medium text-black">₹{formatPrice(cartSubtotal)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-zinc-600">
                        <span>Platform Fee</span>
                        <span className="font-medium text-black">
                          ₹{formatPrice(pricing.platformFee)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-zinc-600">
                        <span>Delivery Fee</span>
                        <span className="font-medium text-black">
                          ₹{formatPrice(effectiveDeliveryFee)}
                        </span>
                      </div>
                      {pricing.offerDiscount > 0 && (
                        <div className="flex justify-between items-center text-xs font-semibold text-emerald-600">
                          <span>Offer Discount</span>
                          <span>-₹{formatPrice(pricing.offerDiscount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-3 border-t border-[var(--border-default)]">
                        <span className="text-sm font-bold text-black">
                          Total Payable
                        </span>
                        <span className="text-xl font-bold text-black tracking-tight">
                          {pricingLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <>₹{formatPrice(cartTotalPayable)}</>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-white border border-[var(--border-default)] rounded-md shadow-sm space-y-4">
                    <div className="flex items-center gap-2">
                      <CreditCard
                        size={16}
                        className="text-[var(--brand-accent)]"
                      />
                      <h2 className="text-sm font-bold text-black">
                        Payment Method
                      </h2>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {[
                        {
                          value: "ONLINE" as const,
                          title: "Online Payment",
                          detail: "Gateway",
                        },
                        {
                          value: "COD" as const,
                          title: "Cash on Delivery",
                          detail: "Pay later",
                        },
                      ].map((option) => {
                        const selected = paymentMode === option.value;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setPaymentMode(option.value)}
                            className={`rounded-md border p-3 text-left transition-all ${
                              selected
                                ? "border-red-600 bg-red-600 text-white"
                                : "border-[var(--border-default)] bg-white text-black hover:border-red-300"
                            }`}
                          >
                            <div className="flex h-full items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-xs font-bold leading-tight">
                                  {option.title}
                                </p>
                                <p
                                  className={`mt-1 text-[11px] font-medium ${
                                    selected
                                      ? "text-white/85"
                                      : "text-zinc-400"
                                  }`}
                                >
                                  {option.detail}
                                </p>
                              </div>
                              <div
                                className={`mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 ${
                                  selected
                                    ? "border-white bg-white"
                                    : "border-zinc-300"
                                }`}
                              >
                                <div
                                  className={`m-[2px] h-1.5 w-1.5 rounded-full ${
                                    selected ? "bg-red-600" : "bg-transparent"
                                  }`}
                                />
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="submit"
                    form="checkout-shipping-form"
                    disabled={placingOrder || pricingLoading}
                    className="lg:hidden w-full h-12 bg-black hover:bg-zinc-800 text-white rounded-md font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm cursor-pointer"
                  >
                    {placingOrder ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        {paymentMode === "COD"
                          ? "Place COD Order"
                          : "Proceed to Review"}
                        <ChevronRight className="w-5 h-5" />
                      </>
                    )}
                  </button>

                  <div className="p-5 bg-zinc-200/70 rounded-md space-y-2.5 border border-zinc-300 shadow-sm">
                    <div className="flex items-center gap-2">
                      <ShieldCheck
                        size={16}
                        className="text-black"
                      />
                      <span className="text-xs font-bold text-black">
                        {paymentMode === "COD"
                          ? "Cash On Delivery Selected"
                          : "Secure Payment Gateway"}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-900 font-medium leading-relaxed">
                      {paymentMode === "COD"
                        ? "Your order will be confirmed immediately after checkout and payment will be collected at delivery."
                        : "Your transactions are protected with military-grade SSL encryption and fraud prevention systems."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="sticky top-24 space-y-5">
                  <div className="p-6 bg-white border border-[var(--border-default)] rounded-md shadow-sm space-y-6">
                    <h2 className="text-base font-bold text-black flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[var(--brand-accent)]" />
                      Final Payment Step
                    </h2>

                    <div className="p-5 bg-zinc-50 rounded-md border border-[var(--border-default)] text-center space-y-2">
                      <p className="text-xs font-semibold text-zinc-500">
                        Payment Window Expires In
                      </p>
                      <div className="flex items-center justify-center gap-2 text-3xl font-bold text-black tracking-tight tabular-nums">
                        <Clock3 className="w-5 h-5 text-[var(--brand-accent)]" />
                        {formatTimer(sessionSecondsLeft)}
                      </div>
                    </div>

                    <p className="text-xs text-zinc-500 leading-relaxed text-center">
                      Please complete your payment within 15 minutes to secure your items and current pricing.
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        void handleProceedToPay();
                      }}
                      disabled={paymentSessionExpired || initiatingPayment}
                      className="w-full h-12 bg-black hover:bg-zinc-800 text-white rounded-md font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm cursor-pointer"
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

                  <div className="p-4 bg-white border border-[var(--border-default)] rounded-md shadow-sm">
                    <p className="text-xs font-semibold text-red-600 leading-relaxed text-center">
                      Payment not completed within window time will result in order cancellation.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
