"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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

const APPLIED_OFFERS_STORAGE_KEY = "marketflow-applied-offers";

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
          setPricing(EMPTY_PRICING);
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
  }, [fetchCart, items.length, user]);

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

        <div className="flex items-baseline gap-4 mb-10">
          <h1 className="text-4xl sm:text-5xl font-black text-red-600 uppercase tracking-tighter">
            Your Bag
          </h1>
          <span className="text-xl font-bold text-[var(--text-muted)]">
            ({items.length} items)
          </span>
        </div>

        {cartLoading && items.length === 0 ? (
          <div className="text-center py-24 bg-white border border-[var(--border-default)] rounded-xl shadow-sm">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[var(--brand-accent)]" />
            <p className="text-sm font-black uppercase tracking-widest text-black">
              Syncing your bag...
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-24 bg-white border border-[var(--border-default)] rounded-xl shadow-sm space-y-6">
            <div className="w-20 h-20 bg-[var(--bg-sunken)] rounded-full flex items-center justify-center mx-auto">
              <ShoppingCart size={32} className="text-zinc-300" />
            </div>
            <div>
              <h2 className="text-xl font-black text-black uppercase tracking-tight">
                Your bag is empty
              </h2>
              <p className="text-zinc-500 text-sm mt-2">
                Looks like you haven&apos;t added anything to your bag yet.
              </p>
            </div>
            <Link
              href="/products"
              className="inline-block px-8 py-3 bg-black text-white rounded-full font-black text-xs uppercase tracking-widest hover:bg-[var(--brand-accent)] transition-colors shadow-lg"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8 space-y-6">
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.productId}
                    className="group relative flex flex-col sm:flex-row gap-6 p-5 bg-white border border-[var(--border-default)] rounded-xl transition-all hover:shadow-xl hover:border-black/5"
                  >
                    <div className="w-full sm:w-32 aspect-square rounded-lg overflow-hidden bg-[var(--bg-sunken)] border border-[var(--border-default)] shrink-0">
                      <img
                        src={
                          item.product?.images?.[0] ||
                          "/placeholder-product-1.jpg"
                        }
                        alt={item.product?.name || "Product image"}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    </div>

                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--brand-accent)] mb-1">
                              {item.product?.vendorName || "Verified Seller"}
                            </p>
                            <h3 className="text-lg font-black text-black leading-tight tracking-tight line-clamp-2 max-w-md">
                              {item.product?.name ||
                                `Product ${item.productId}`}
                            </h3>
                          </div>
                          <p className="text-xl font-black text-black tracking-tighter">
                            ₹{formatPrice(item.price)}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 mt-4">
                          <div className="flex items-center border border-[var(--border-default)] rounded-lg bg-[var(--bg-sunken)] overflow-hidden">
                            <button
                              onClick={() =>
                                void updateQuantity(
                                  item.productId,
                                  Math.max(1, item.quantity - 1),
                                )
                              }
                              className="p-2 hover:bg-white transition-colors"
                            >
                              <Minus size={14} className="text-black" />
                            </button>
                            <span className="w-10 text-center text-xs font-black text-black">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                void updateQuantity(
                                  item.productId,
                                  item.quantity + 1,
                                )
                              }
                              className="p-2 hover:bg-white transition-colors"
                            >
                              <Plus size={14} className="text-black" />
                            </button>
                          </div>

                          <button
                            onClick={() => void removeItem(item.productId)}
                            className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-red-600 transition-colors flex items-center gap-1.5"
                          >
                            <Trash2 size={12} />
                            Remove
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 sm:mt-0 pt-4 border-t border-zinc-50 flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                          Subtotal
                        </span>
                        <span className="text-sm font-black text-black">
                          ₹{formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
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

            <div className="lg:col-span-4">
              <div className="sticky top-24 space-y-6">
                <div className="p-8 bg-white border border-[var(--border-default)] rounded-xl shadow-xl space-y-6">
                  <h2 className="text-xl font-black text-black uppercase tracking-tight">
                    Order Summary
                  </h2>

                  {pricingError && (
                    <div className="p-3 rounded-lg border border-red-100 bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-widest">
                      {pricingError}
                    </div>
                  )}

                  <div className="space-y-4 border-b border-[var(--border-default)] pb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                        Subtotal
                      </span>
                      <span className="text-sm font-black text-black">
                        ₹{formatPrice(pricing.subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                        Platform Fee
                      </span>
                      <span className="text-sm font-black text-black">
                        ₹{formatPrice(pricing.platformFee)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                        Delivery Fee
                      </span>
                      <span className="text-sm font-black text-black">
                        ₹{formatPrice(pricing.deliveryFee)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                        GST
                      </span>
                      <span className="text-sm font-black text-black">
                        ₹{formatPrice(pricing.gst)}
                      </span>
                    </div>
                    {pricing.offerDiscount > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-green-600 uppercase tracking-widest">
                          Offer Discount
                        </span>
                        <span className="text-sm font-black text-green-600">
                          -₹{formatPrice(pricing.offerDiscount)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm font-black text-black uppercase tracking-widest">
                      Total Payable
                    </span>
                    <span className="text-2xl font-black text-black tracking-tighter">
                      {pricingLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>₹{formatPrice(pricing.grandTotal)}</>
                      )}
                    </span>
                  </div>

                  <div className="space-y-3 pt-4">
                    <Link
                      href="/customer/checkout"
                      className="w-full h-14 flex items-center justify-center gap-3 bg-black text-white rounded-full font-black text-xs uppercase tracking-widest hover:bg-[var(--brand-accent)] transition-all shadow-lg"
                    >
                      Proceed to Checkout
                      <ArrowRight size={16} />
                    </Link>
                    <Link
                      href="/products"
                      className="w-full h-12 flex items-center justify-center text-black font-black text-[10px] uppercase tracking-widest hover:underline"
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
