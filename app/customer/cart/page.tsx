"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { useCartStore } from "@/lib/store";
import { 
  Trash2, 
  Plus, 
  Minus, 
  ArrowLeft, 
  ArrowRight,
  Loader2, 
  ShoppingCart, 
  ShieldCheck, 
  Truck, 
  RotateCcw,
  ChevronRight,
  TicketPercent
} from "lucide-react";

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const cartLoading = useCartStore((state) => state.isLoading);
  const fetchCart = useCartStore((state) => state.fetchCart);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    void fetchCart();
  }, [fetchCart]);

  const totalPrice = getTotalPrice();
  const discountAmount = (totalPrice * discount) / 100;
  const finalTotal = totalPrice - discountAmount;

  const handleApplyPromo = () => {
    if (promoCode === "SAVE10") {
      setDiscount(10);
    } else if (promoCode === "WELCOME20") {
      setDiscount(20);
    } else {
      setDiscount(0);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 0,
    }).format(price);

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <Navbar />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 mb-8 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
          <Link href="/" className="hover:text-black">Home</Link>
          <ChevronRight size={12} />
          <Link href="/products" className="hover:text-black">Catalogue</Link>
          <ChevronRight size={12} />
          <span className="text-black">Your Cart</span>
        </div>

        <div className="flex items-baseline gap-4 mb-10">
          <h1 className="text-4xl sm:text-5xl font-black text-black uppercase tracking-tighter">
            Your Bag
          </h1>
          <span className="text-xl font-bold text-[var(--text-muted)]">({items.length} items)</span>
        </div>

        {cartLoading && items.length === 0 ? (
          <div className="text-center py-24 bg-white border border-[var(--border-default)] rounded-xl shadow-sm">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[var(--brand-accent)]" />
            <p className="text-sm font-black uppercase tracking-widest text-black">Syncing your bag...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-24 bg-white border border-[var(--border-default)] rounded-xl shadow-sm space-y-6">
            <div className="w-20 h-20 bg-[var(--bg-sunken)] rounded-full flex items-center justify-center mx-auto">
              <ShoppingCart size={32} className="text-zinc-300" />
            </div>
            <div>
              <h2 className="text-xl font-black text-black uppercase tracking-tight">Your bag is empty</h2>
              <p className="text-zinc-500 text-sm mt-2">Looks like you haven&apos;t added anything to your bag yet.</p>
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
            {/* Cart Items List */}
            <div className="lg:col-span-8 space-y-6">
              <div className="space-y-4">
                {items.map((item) => (
                  <div 
                    key={item.productId}
                    className="group relative flex flex-col sm:flex-row gap-6 p-5 bg-white border border-[var(--border-default)] rounded-xl transition-all hover:shadow-xl hover:border-black/5"
                  >
                    {/* Product Image */}
                    <div className="w-full sm:w-32 aspect-square rounded-lg overflow-hidden bg-[var(--bg-sunken)] border border-[var(--border-default)] shrink-0">
                      <img
                        src={item.product?.images?.[0] || "/placeholder-product-1.jpg"}
                        alt={item.product?.name || "Product image"}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--brand-accent)] mb-1">
                              {item.product?.vendorName || "Verified Seller"}
                            </p>
                            <h3 className="text-lg font-black text-black leading-tight tracking-tight line-clamp-2 max-w-md">
                              {item.product?.name || `Product ${item.productId}`}
                            </h3>
                          </div>
                          <p className="text-xl font-black text-black tracking-tighter">
                            ₹{formatPrice(item.price)}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-4">
                          <div className="flex items-center border border-[var(--border-default)] rounded-lg bg-[var(--bg-sunken)] overflow-hidden">
                            <button
                              onClick={() => void updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
                              className="p-2 hover:bg-white transition-colors"
                            >
                              <Minus size={14} className="text-black" />
                            </button>
                            <span className="w-10 text-center text-xs font-black text-black">{item.quantity}</span>
                            <button
                              onClick={() => void updateQuantity(item.productId, item.quantity + 1)}
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
                        <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Subtotal</span>
                        <span className="text-sm font-black text-black">₹{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Promo Section */}
              <div className="p-6 bg-[var(--bg-sunken)] rounded-xl border border-dashed border-[var(--border-default)] space-y-4">
                <div className="flex items-center gap-2 text-black">
                  <TicketPercent size={18} className="text-[var(--brand-accent)]" />
                  <span className="text-xs font-black uppercase tracking-widest">Offers & Coupons</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Enter Coupon Code"
                    className="flex-1 h-12 px-4 bg-white border border-[var(--border-default)] rounded-xl text-xs font-bold uppercase tracking-widest outline-none focus:border-black"
                  />
                  <button
                    onClick={handleApplyPromo}
                    className="px-8 h-12 bg-black text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[var(--brand-accent)] transition-all"
                  >
                    Apply
                  </button>
                </div>
                <p className="text-[10px] font-bold text-zinc-400">Try WELCOME20 for 20% off on your first order</p>
              </div>
            </div>

            {/* Summary Sidebar */}
            <div className="lg:col-span-4">
              <div className="sticky top-24 space-y-6">
                <div className="p-8 bg-white border border-[var(--border-default)] rounded-xl shadow-xl space-y-6">
                  <h2 className="text-xl font-black text-black uppercase tracking-tight">Order Summary</h2>
                  
                  <div className="space-y-4 border-b border-[var(--border-default)] pb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Bag Total</span>
                      <span className="text-sm font-black text-black">₹{formatPrice(totalPrice)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Shipping</span>
                      <span className="text-xs font-black text-green-600 uppercase tracking-widest">Free</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-green-600 uppercase tracking-widest">Discount ({discount}%)</span>
                        <span className="text-sm font-black text-green-600">-₹{formatPrice(discountAmount)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm font-black text-black uppercase tracking-widest">Order Total</span>
                    <span className="text-2xl font-black text-black tracking-tighter">₹{formatPrice(finalTotal)}</span>
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
