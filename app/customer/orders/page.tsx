'use client'

import React, { useState } from 'react'
import { Navbar } from '@/components/navbar'
import { OrderCard } from '@/components/order-card'
import { Order } from '@/lib/types'
import { Package } from 'lucide-react'

export default function OrdersPage() {
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'delivered' | 'cancelled'>('all')

  // Mock orders data
  const allOrders: Order[] = [
    {
      id: 'ORD-001',
      customerId: 'cust-1',
      customerName: 'John Doe',
      vendorId: 'vendor-1',
      vendorName: 'TechHub',
      items: [
        {
          productId: 'prod-1',
          productName: 'Premium Wireless Headphones',
          quantity: 1,
          price: 4999,
          subtotal: 4999,
        },
      ],
      totalAmount: 4999,
      status: 'delivered',
      shippingAddress: {
        fullName: 'John Doe',
        phone: '9876543210',
        addressLine1: '123 Main St',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        country: 'India',
        isDefault: true,
      },
      paymentMethod: 'credit_card',
      paymentStatus: 'paid',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      estimatedDelivery: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'ORD-002',
      customerId: 'cust-1',
      customerName: 'John Doe',
      vendorId: 'vendor-2',
      vendorName: 'StyleWear',
      items: [
        {
          productId: 'prod-2',
          productName: 'Comfortable Cotton T-Shirt',
          quantity: 2,
          price: 599,
          subtotal: 1198,
        },
      ],
      totalAmount: 5899,
      status: 'in-transit',
      shippingAddress: {
        fullName: 'John Doe',
        phone: '9876543210',
        addressLine1: '123 Main St',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        country: 'India',
        isDefault: true,
      },
      paymentMethod: 'debit_card',
      paymentStatus: 'paid',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      estimatedDelivery: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'ORD-003',
      customerId: 'cust-1',
      customerName: 'John Doe',
      vendorId: 'vendor-3',
      vendorName: 'HomeEssentials',
      items: [
        {
          productId: 'prod-3',
          productName: 'Stainless Steel Water Bottle',
          quantity: 1,
          price: 1299,
          subtotal: 1299,
        },
      ],
      totalAmount: 1299,
      status: 'packed',
      shippingAddress: {
        fullName: 'John Doe',
        phone: '9876543210',
        addressLine1: '123 Main St',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        country: 'India',
        isDefault: true,
      },
      paymentMethod: 'wallet',
      paymentStatus: 'paid',
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'ORD-004',
      customerId: 'cust-1',
      customerName: 'John Doe',
      vendorId: 'vendor-4',
      vendorName: 'SportGear',
      items: [
        {
          productId: 'prod-4',
          productName: 'Running Shoes Sports Model',
          quantity: 1,
          price: 3499,
          subtotal: 3499,
        },
      ],
      totalAmount: 3499,
      status: 'pending',
      shippingAddress: {
        fullName: 'John Doe',
        phone: '9876543210',
        addressLine1: '123 Main St',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        country: 'India',
        isDefault: true,
      },
      paymentMethod: 'credit_card',
      paymentStatus: 'paid',
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'ORD-005',
      customerId: 'cust-1',
      customerName: 'John Doe',
      vendorId: 'vendor-5',
      vendorName: 'NaturesBrew',
      items: [
        {
          productId: 'prod-6',
          productName: 'Organic Tea Gift Set',
          quantity: 1,
          price: 899,
          subtotal: 899,
        },
      ],
      totalAmount: 899,
      status: 'cancelled',
      shippingAddress: {
        fullName: 'John Doe',
        phone: '9876543210',
        addressLine1: '123 Main St',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        country: 'India',
        isDefault: true,
      },
      paymentMethod: 'cod',
      paymentStatus: 'pending',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      notes: 'Out of stock',
    },
  ]

  // Filter orders based on selected status
  let filteredOrders = allOrders
  if (selectedStatus === 'active') {
    filteredOrders = allOrders.filter(
      (o) => o.status !== 'delivered' && o.status !== 'cancelled'
    )
  } else if (selectedStatus === 'delivered') {
    filteredOrders = allOrders.filter((o) => o.status === 'delivered')
  } else if (selectedStatus === 'cancelled') {
    filteredOrders = allOrders.filter((o) => o.status === 'cancelled')
  }

  const stats = [
    { label: 'Total Orders', value: allOrders.length, icon: '📦' },
    { label: 'Active Orders', value: allOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length, icon: '⏳' },
    { label: 'Delivered', value: allOrders.filter(o => o.status === 'delivered').length, icon: '✓' },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Orders</h1>
          <p className="text-muted-foreground">Track and manage your purchases</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-card border border-border rounded-lg p-4">
              <div className="text-2xl mb-2">{stat.icon}</div>
              <p className="text-muted-foreground text-sm">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border overflow-x-auto">
          {[
            { value: 'all' as const, label: 'All Orders' },
            { value: 'active' as const, label: 'Active' },
            { value: 'delivered' as const, label: 'Delivered' },
            { value: 'cancelled' as const, label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSelectedStatus(tab.value)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                selectedStatus === tab.value
                  ? 'text-primary border-primary'
                  : 'text-muted-foreground border-transparent hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders Grid */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-lg">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No orders found</h3>
            <p className="text-muted-foreground mb-6">Start shopping to place your first order</p>
            <a
              href="/products"
              className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
            >
              Browse Products
            </a>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
