"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { useCartStore, useAuthStore } from "@/lib/store";
import { authFetch } from "@/lib/auth-fetch";
import { API_BASE_URL } from "@/lib/config";
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Loader2,
  ShoppingCart,
  ChevronRight,
  TicketPercent,
} from "lucide-react";

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

type AppliedOfferInput = {
  productId: string;
  offerId?: string;
  couponCode?: string;
};

const APPLIED_OFFERS_STORAGE_KEY = "markivo-applied-offers";

const EMPTY_PRICING: PriceSummary = {
  subtotal: 0,
  platformFee: 0,
  deliveryFee: 0,
  gst: 0,
  offerDiscount: 0,
  grandTotal: 0,
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

export default function CartPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const items = useCartStore((state) => state.items);
  const cartLoading = useCartStore((state) => state.isLoading);
  const fetchCart = useCartStore((state) => state.fetchCart);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);

  const [pricingLoading, setPricingLoading] = useState(false);
  const [offersLoading, setOffersLoading] = useState(false);
  const [pricingError, setPricingError] = useState("");
  const [offersByProduct, setOffersByProduct] = useState<
    Record<string, CartOffer[]>
  >({});
  const [appliedOffers, setAppliedOffers] = useState<
    Record<string, AppliedOfferInput>
  >({});
  const [pricing, setPricing] = useState<PriceSummary>(EMPTY_PRICING);

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

    const fetchBackendPricingAndOffers = async () => {
      if (!user) {
        if (isMounted) {
          const subtotal = items.reduce(
            (acc, item) => acc + item.price * item.quantity,
            0,
          );
          const platformFee = items.length > 0 ? 10 : 0;
          const deliveryFee = items.length > 0 ? 40 : 0;
          const gst = Math.round(subtotal * 0.05);
          const grandTotal = subtotal + platformFee + deliveryFee + gst;

          setPricing({
            subtotal,
            platformFee,
            deliveryFee,
            gst,
            offerDiscount: 0,
            grandTotal,
          });
          setOffersByProduct({});
        }
        return;
      }

      setPricingLoading(true);
      setOffersLoading(true);
      setPricingError("");

      try {
        const cartEndpoints = [
          `${API_BASE_URL}/cart`,
          `${API_BASE_URL}/cart?userId=${user.id}`,
        ];

        let cartPricing: PriceSummary | null = null;
        for (const endpoint of cartEndpoints) {
          const response = await authFetch(endpoint, { method: "GET" });
          if (!response.ok) {
            continue;
          }

          const payload: CartResponse = await response.json().catch(() => ({}));
          cartPricing = toPricing(payload?.data?.pricing);
          break;
        }

        if (!cartPricing) {
          throw new Error("Unable to load pricing from backend.");
        }

        const offersResponse = await authFetch(`${API_BASE_URL}/cart/offers`, {
          method: "GET",
        });

        let offersMap: Record<string, CartOffer[]> = {};
        if (offersResponse.ok) {
          const offersPayload: CartOffersResponse = await offersResponse
            .json()
            .catch(() => ({}));
          offersMap = offersPayload?.data || {};
        }

        if (!isMounted) {
          return;
        }

        setPricing(cartPricing);
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
      } catch (error) {
        if (isMounted) {
          setPricingError(
            error instanceof Error
              ? error.message
              : "Failed to load pricing details.",
          );
        }
      } finally {
        if (isMounted) {
          setPricingLoading(false);
          setOffersLoading(false);
        }
      }
    };

    void fetchBackendPricingAndOffers();

    return () => {
      isMounted = false;
    };
  }, [fetchCart, items, user]);

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

  const hasAnyOffers = Object.values(offersByProduct).some(
    (offers) => Array.isArray(offers) && offers.length > 0,
  );

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <Navbar />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-2 mb-8 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
          <Link href="/" className="hover:text-black">
            Home
          </Link>
          <ChevronRight size={12} />
          <Link href="/products" className="hover:text-black">
            Catalogue
          </Link>
          <ChevronRight size={12} />
          <span className="text-black">Your Cart</span>
        </div>

        <div className="flex items-baseline gap-3 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-black tracking-tight">
            Shopping Cart
          </h1>
          <span className="text-sm font-medium text-[var(--text-muted)]">
            ({items.length} {items.length === 1 ? "item" : "items"})
          </span>
        </div>

        {cartLoading && items.length === 0 ? (
          <div className="text-center py-16 bg-white border border-[var(--border-default)] rounded-md shadow-sm space-y-3">
            <div className="relative flex items-center justify-center mx-auto mb-2">
              <div className="absolute w-12 h-12 rounded-full bg-zinc-200/50 animate-ping opacity-60" />
              <div className="relative w-10 h-10 rounded-md bg-zinc-50 border border-zinc-200 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-black animate-spin" />
              </div>
            </div>
            <p className="text-sm font-bold text-black">
              Syncing Your Cart...
            </p>
            <p className="text-xs text-zinc-500 font-medium">
              Updating your items and applying applicable offers.
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 bg-white border border-[var(--border-default)] rounded-md shadow-sm space-y-5">
            <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto">
              <ShoppingCart size={28} className="text-zinc-400" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-black">
                Your cart is empty
              </h2>
              <p className="text-zinc-500 text-sm">
                Explore our catalog and add your favorite items to your bag.
              </p>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center justify-center px-6 py-2.5 bg-black text-white rounded-md font-bold text-xs uppercase tracking-wider hover:bg-[var(--brand-accent)] transition-colors shadow-sm"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-5">
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.productId}
                    className="group relative flex flex-row gap-4 sm:gap-6 p-4 sm:p-6 bg-white border border-[var(--border-default)] rounded-md transition-all shadow-sm hover:border-zinc-300"
                  >
                    <div className="w-20 h-20 sm:w-36 sm:h-36 aspect-square rounded-md overflow-hidden bg-zinc-50 border border-[var(--border-default)] shrink-0">
                      <img
                        src={
                          item.product?.images?.[0] ||
                          "/placeholder-product-1.jpg"
                        }
                        alt={item.product?.name || "Product image"}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>

                    <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                      <div>
                        <div className="flex items-start justify-between gap-2 sm:gap-4">
                          <div className="min-w-0">
                            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[var(--brand-accent)] mb-1 sm:mb-1.5 truncate">
                              {item.product?.vendorName || "Verified Seller"}
                            </p>
                            <h3 className="text-sm sm:text-lg font-bold text-black leading-snug line-clamp-2 max-w-lg">
                              {item.product?.name ||
                                `Product ${item.productId}`}
                            </h3>
                          </div>
                          <p className="text-base sm:text-xl font-bold text-black shrink-0">
                            ₹{formatPrice(item.price)}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-3 sm:mt-4">
                          <div className="flex items-center border border-[var(--border-default)] rounded-md bg-zinc-50 overflow-hidden h-8 sm:h-10">
                            <button
                              onClick={() =>
                                void updateQuantity(
                                  item.productId,
                                  Math.max(1, item.quantity - 1),
                                )
                              }
                              className="px-2 sm:px-3 h-full hover:bg-white transition-colors flex items-center justify-center"
                            >
                              <Minus size={13} className="text-black" />
                            </button>
                            <span className="w-7 sm:w-9 text-center text-xs font-bold text-black">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                void updateQuantity(
                                  item.productId,
                                  item.quantity + 1,
                                )
                              }
                              className="px-2 sm:px-3 h-full hover:bg-white transition-colors flex items-center justify-center"
                            >
                              <Plus size={13} className="text-black" />
                            </button>
                          </div>

                          <button
                            onClick={() => void removeItem(item.productId)}
                            className="text-[11px] sm:text-xs font-semibold text-zinc-500 hover:text-red-600 transition-colors flex items-center gap-1"
                          >
                            <Trash2 size={13} />
                            Remove
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 sm:mt-0 pt-3 border-t border-zinc-100 flex items-center justify-between">
                        <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-400">
                          Subtotal
                        </span>
                        <span className="text-xs sm:text-base font-bold text-black">
                          ₹{formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-5 bg-zinc-50/70 rounded-md border border-[var(--border-default)] space-y-3">
                <div className="flex items-center gap-2 text-black">
                  <TicketPercent
                    size={16}
                    className="text-[var(--brand-accent)]"
                  />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Offers by Product
                  </span>
                </div>

                {offersLoading ? (
                  <p className="text-xs text-zinc-500">
                    Loading available offers...
                  </p>
                ) : !hasAnyOffers ? (
                  <p className="text-xs text-zinc-500">
                    No active offers available for the current cart items.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {items.map((item) => {
                      const offers = offersByProduct[item.productId] || [];
                      if (offers.length === 0) {
                        return null;
                      }

                      return (
                        <div
                          key={`offers-${item.productId}`}
                          className="bg-white border border-[var(--border-default)] rounded-md p-3.5 space-y-2.5"
                        >
                          <p className="text-xs font-bold text-black">
                            {item.product?.name || "Product"}
                          </p>
                          <div className="space-y-2">
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
                                  className={`w-full text-left p-2.5 rounded-md border transition-all ${
                                    isSelected
                                      ? "bg-red-50 border-red-200"
                                      : "bg-white border-[var(--border-default)] hover:border-red-200"
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="text-xs font-bold text-black leading-snug">
                                        {offer.offerName || "Special Offer"}
                                      </p>
                                      {offer.discountPercentage ? (
                                        <p className="text-[11px] text-zinc-500 mt-0.5">
                                          {offer.discountPercentage}% off
                                          {offer.couponCode
                                            ? ` • Code: ${offer.couponCode}`
                                            : ""}
                                        </p>
                                      ) : (
                                        <p className="text-[11px] text-zinc-500 mt-0.5">
                                          {offer.couponCode
                                            ? `Code: ${offer.couponCode}`
                                            : "Offer available"}
                                        </p>
                                      )}
                                    </div>
                                    {isSelected && (
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-red-600">
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

            <div className="lg:col-span-4">
              <div className="sticky top-24 space-y-6">
                <div className="p-6 bg-white border border-[var(--border-default)] rounded-md shadow-sm space-y-5">
                  <h2 className="text-lg font-bold text-black tracking-tight border-b border-[var(--border-default)] pb-4">
                    Order Summary
                  </h2>

                  {pricingError && (
                    <div className="p-3 rounded-md border border-red-100 bg-red-50 text-red-600 text-xs font-medium">
                      {pricingError}
                    </div>
                  )}

                  <div className="space-y-3.5 border-b border-[var(--border-default)] pb-5 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-600">Subtotal</span>
                      <span className="font-bold text-black">
                        ₹{formatPrice(pricing.subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-600">Platform Fee</span>
                      <span className="font-bold text-black">
                        ₹{formatPrice(pricing.platformFee)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-600">Delivery Fee</span>
                      <span className="font-bold text-black">
                        ₹{formatPrice(pricing.deliveryFee)}
                      </span>
                    </div>
                    {pricing.offerDiscount > 0 && (
                      <div className="flex justify-between items-center text-green-700">
                        <span>Offer Discount</span>
                        <span className="font-bold">
                          -₹{formatPrice(pricing.offerDiscount)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <span className="text-base font-bold text-black">
                      Total Payable
                    </span>
                    <span className="text-xl font-bold text-black">
                      {pricingLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>₹{formatPrice(pricing.grandTotal)}</>
                      )}
                    </span>
                  </div>

                  <div className="space-y-3 pt-2">
                    <button
                      onClick={() => {
                        if (!user) {
                          router.push(
                            `/login?returnUrl=${encodeURIComponent("/customer/checkout")}`,
                          );
                        } else {
                          router.push("/customer/checkout");
                        }
                      }}
                      className="w-full h-11 flex items-center justify-center gap-2 bg-[var(--brand-accent)] hover:bg-red-700 text-white rounded-md font-bold text-sm transition-all shadow-sm cursor-pointer active:scale-95"
                    >
                      Proceed to Checkout
                      <ArrowRight size={16} />
                    </button>
                    <Link
                      href="/products"
                      className="w-full h-9 flex items-center justify-center text-zinc-600 hover:text-black font-semibold text-xs transition-colors"
                    >
                      Continue Shopping
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
