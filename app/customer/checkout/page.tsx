'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { useCartStore } from '@/lib/store'
import { ChevronRight, Package, Lock, Check } from 'lucide-react'

export default function CheckoutPage() {
  const router = useRouter()
  const items = useCartStore((state) => state.items)
  const getTotalPrice = useCartStore((state) => state.getTotalPrice)
  const clearCart = useCartStore((state) => state.clearCart)
  const [step, setStep] = useState(1) // 1: Shipping, 2: Payment, 3: Confirmation
  const [loading, setLoading] = useState(false)

  // Form states
  const [shipping, setShipping] = useState({
    fullName: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
  })

  const [payment, setPayment] = useState({
    method: 'card',
    cardName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
  })

  const totalPrice = getTotalPrice()

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setStep(2)
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000))

    clearCart()
    setStep(3)
    setLoading(false)
  }

  if (step === 3) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-card border border-border rounded-lg p-8 text-center space-y-6 animate-fade-in">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
              <p className="text-muted-foreground">Thank you for your purchase</p>
            </div>

            <div className="bg-secondary p-4 rounded-lg text-left space-y-2">
              <p className="text-sm text-muted-foreground">Order ID</p>
              <p className="font-mono font-bold text-lg">ORD-{Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p>You will receive an order confirmation email shortly</p>
              <p>Track your order in your dashboard</p>
            </div>

            <div className="flex gap-3 justify-center pt-4">
              <Link
                href="/customer/orders"
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium"
              >
                View My Orders
              </Link>
              <Link
                href="/products"
                className="px-6 py-2 border border-border rounded-lg hover:bg-secondary font-medium"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Progress Steps */}
            <div className="flex gap-4 mb-8">
              {[
                { num: 1, label: 'Shipping' },
                { num: 2, label: 'Payment' },
                { num: 3, label: 'Confirmation' },
              ].map((s) => (
                <div key={s.num} className="flex items-center gap-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      s.num <= step
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {s.num < step ? '✓' : s.num}
                  </div>
                  {s.num < 3 && (
                    <div
                      className={`w-8 h-1 ${s.num < step ? 'bg-primary' : 'bg-secondary'}`}
                    ></div>
                  )}
                </div>
              ))}
            </div>

            {/* Shipping Address Form */}
            {step === 1 && (
              <form onSubmit={handleShippingSubmit} className="space-y-6">
                <div className="bg-card border border-border rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-4">Shipping Address</h2>

                  <div className="space-y-4">
                    {/* Name & Email Row */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Full Name *</label>
                        <input
                          type="text"
                          value={shipping.fullName}
                          onChange={(e) => setShipping({ ...shipping, fullName: e.target.value })}
                          className="w-full px-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Email *</label>
                        <input
                          type="email"
                          value={shipping.email}
                          onChange={(e) => setShipping({ ...shipping, email: e.target.value })}
                          className="w-full px-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Phone Number *</label>
                      <input
                        type="tel"
                        value={shipping.phone}
                        onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                        className="w-full px-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>

                    {/* Address */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Address Line 1 *</label>
                      <input
                        type="text"
                        value={shipping.addressLine1}
                        onChange={(e) => setShipping({ ...shipping, addressLine1: e.target.value })}
                        className="w-full px-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="House No., Building Name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Address Line 2</label>
                      <input
                        type="text"
                        value={shipping.addressLine2}
                        onChange={(e) => setShipping({ ...shipping, addressLine2: e.target.value })}
                        className="w-full px-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Apartment, Street, Sector, Village"
                      />
                    </div>

                    {/* City, State, Postal Code */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">City *</label>
                        <input
                          type="text"
                          value={shipping.city}
                          onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                          className="w-full px-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">State *</label>
                        <input
                          type="text"
                          value={shipping.state}
                          onChange={(e) => setShipping({ ...shipping, state: e.target.value })}
                          className="w-full px-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Postal Code *</label>
                        <input
                          type="text"
                          value={shipping.postalCode}
                          onChange={(e) => setShipping({ ...shipping, postalCode: e.target.value })}
                          className="w-full px-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="mt-6 w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium flex items-center justify-center gap-2"
                  >
                    Continue to Payment
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </form>
            )}

            {/* Payment Form */}
            {step === 2 && (
              <form onSubmit={handlePaymentSubmit} className="space-y-6">
                <div className="bg-card border border-border rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-4">Payment Method</h2>

                  <div className="space-y-3 mb-6">
                    {[
                      { value: 'card', label: 'Credit/Debit Card', icon: '💳' },
                      { value: 'wallet', label: 'Digital Wallet', icon: '📱' },
                      { value: 'upi', label: 'UPI', icon: '🏦' },
                      { value: 'cod', label: 'Cash on Delivery', icon: '💵' },
                    ].map((method) => (
                      <label
                        key={method.value}
                        className="flex items-center p-4 border border-border rounded-lg cursor-pointer hover:bg-secondary transition-colors"
                      >
                        <input
                          type="radio"
                          name="payment-method"
                          value={method.value}
                          checked={payment.method === method.value}
                          onChange={(e) => setPayment({ ...payment, method: e.target.value })}
                          className="mr-3"
                        />
                        <span className="text-lg mr-3">{method.icon}</span>
                        <span>{method.label}</span>
                      </label>
                    ))}
                  </div>

                  {/* Card Details (only if card selected) */}
                  {payment.method === 'card' && (
                    <div className="space-y-4 p-4 bg-secondary rounded-lg">
                      <div>
                        <label className="block text-sm font-medium mb-2">Cardholder Name *</label>
                        <input
                          type="text"
                          value={payment.cardName}
                          onChange={(e) => setPayment({ ...payment, cardName: e.target.value })}
                          className="w-full px-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Card Number *</label>
                        <input
                          type="text"
                          value={payment.cardNumber}
                          onChange={(e) => setPayment({ ...payment, cardNumber: e.target.value })}
                          placeholder="1234 5678 9012 3456"
                          className="w-full px-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Expiry Date *</label>
                          <input
                            type="text"
                            value={payment.expiryDate}
                            onChange={(e) => setPayment({ ...payment, expiryDate: e.target.value })}
                            placeholder="MM/YY"
                            className="w-full px-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">CVV *</label>
                          <input
                            type="text"
                            value={payment.cvv}
                            onChange={(e) => setPayment({ ...payment, cvv: e.target.value })}
                            placeholder="123"
                            className="w-full px-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 px-6 py-3 border border-border rounded-lg hover:bg-secondary font-medium"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Lock className="w-5 h-5" />
                      {loading ? 'Processing...' : 'Complete Order'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg p-6 sticky top-24">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Summary
              </h2>

              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.product?.name || 'Product'} x{item.quantity}
                    </span>
                    <span className="font-medium">₹{(item.price * item.quantity).toLocaleString()}</span>
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
                  <span className="text-green-600 dark:text-green-400">Free</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                  <span>Total</span>
                  <span className="text-primary">₹{totalPrice.toLocaleString()}</span>
                </div>
              </div>

              {/* Security Badge */}
              <div className="mt-6 p-4 bg-secondary rounded-lg text-center text-xs text-muted-foreground space-y-1">
                <p className="font-medium">🔒 Secure Checkout</p>
                <p>Your payment is encrypted and secure</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
