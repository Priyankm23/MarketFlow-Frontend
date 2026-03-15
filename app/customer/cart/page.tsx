'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { useCartStore } from '@/lib/store'
import { Trash2, Plus, Minus, ArrowLeft } from 'lucide-react'

export default function CartPage() {
  const items = useCartStore((state) => state.items)
  const removeItem = useCartStore((state) => state.removeItem)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const getTotalPrice = useCartStore((state) => state.getTotalPrice)
  const [promoCode, setPromoCode] = useState('')
  const [discount, setDiscount] = useState(0)

  const totalPrice = getTotalPrice()
  const discountAmount = (totalPrice * discount) / 100
  const finalTotal = totalPrice - discountAmount

  const handleApplyPromo = () => {
    // Mock promo code validation
    if (promoCode === 'SAVE10') {
      setDiscount(10)
    } else if (promoCode === 'WELCOME20') {
      setDiscount(20)
    } else {
      setDiscount(0)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <Link
          href="/products"
          className="flex items-center gap-2 text-primary hover:underline mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Continue Shopping
        </Link>

        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

        {items.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-lg">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">Start shopping to add items to your cart</p>
            <Link
              href="/products"
              className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                {items.map((item, index) => (
                  <div key={item.productId}>
                    <div className="p-4 flex gap-4 hover:bg-secondary/30 transition-colors">
                      {/* Product Image Placeholder */}
                      <div className="w-24 h-24 bg-secondary rounded-lg flex items-center justify-center text-2xl">
                        📦
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{item.product?.name || `Product ${item.productId}`}</h3>
                        <p className="text-sm text-muted-foreground mt-1">SKU: {item.productId}</p>
                        <p className="text-sm font-medium mt-2">₹{item.price}</p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 bg-secondary rounded-lg p-1">
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, Math.max(1, item.quantity - 1))
                          }
                          className="p-1 hover:bg-muted rounded"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="px-3 py-1 font-medium text-sm min-w-8 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="p-1 hover:bg-muted rounded"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Subtotal & Remove */}
                      <div className="text-right flex flex-col items-end justify-between">
                        <div>
                          <p className="font-bold">₹{(item.price * item.quantity).toLocaleString()}</p>
                        </div>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="text-destructive hover:bg-destructive/10 p-2 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {index < items.length - 1 && <div className="border-t border-border"></div>}
                  </div>
                ))}
              </div>

              {/* Promo Code */}
              <div className="mt-6 p-4 bg-secondary rounded-lg">
                <label className="block text-sm font-medium mb-2">Promo Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Enter promo code"
                    className="flex-1 px-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={handleApplyPromo}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium"
                  >
                    Apply
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Try: SAVE10 or WELCOME20
                </p>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card border border-border rounded-lg p-6 sticky top-24 space-y-4">
                <h2 className="text-xl font-bold">Order Summary</h2>

                <div className="space-y-2 border-b border-border pb-4">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>₹{totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span className="text-green-600 dark:text-green-400">Free</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                      <span>Discount ({discount}%)</span>
                      <span>-₹{discountAmount.toFixed(0)}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">₹{finalTotal.toFixed(0)}</span>
                </div>

                <Link
                  href="/customer/checkout"
                  className="w-full block text-center px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium transition-opacity"
                >
                  Proceed to Checkout
                </Link>

                <button className="w-full px-4 py-2 border border-border rounded-lg hover:bg-secondary text-sm font-medium transition-colors">
                  Continue Shopping
                </button>

                {/* Trust Badges */}
                <div className="pt-4 border-t border-border space-y-2 text-xs text-muted-foreground">
                  <p>✓ Secure Checkout</p>
                  <p>✓ Easy Returns</p>
                  <p>✓ Buyer Protection</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
