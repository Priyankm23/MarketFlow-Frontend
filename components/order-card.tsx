'use client'

import React from 'react'
import Link from 'next/link'
import { Order, OrderStatus } from '@/lib/types'
import { Package, Clock, MapPin, ChevronRight } from 'lucide-react'

interface OrderCardProps {
  order: Order
  onTrack?: (orderId: string) => void
}

export function OrderCard({ order, onTrack }: OrderCardProps) {
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'delivered':
        return 'badge-success'
      case 'shipped':
      case 'in-transit':
        return 'badge-info'
      case 'packed':
      case 'confirmed':
        return 'badge-warning'
      case 'cancelled':
        return 'badge-error'
      case 'pending':
        return 'badge-warning'
      default:
        return 'badge-warning'
    }
  }

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'delivered':
        return '✓'
      case 'in-transit':
        return '→'
      case 'packed':
        return '📦'
      case 'cancelled':
        return '✗'
      default:
        return '⏳'
    }
  }

  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')

  return (
    <Link href={`/order/${order.id}`}>
      <div className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow duration-300 cursor-pointer group">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-xs text-muted-foreground">Order ID</p>
            <p className="font-mono font-semibold text-sm">{order.id}</p>
          </div>
          <span className={`${getStatusColor(order.status)}`}>
            {getStatusIcon(order.status)} {statusLabel}
          </span>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Package className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
            <span className="text-muted-foreground">•</span>
            <span className="font-medium">₹{order.totalAmount}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground truncate">{order.shippingAddress.city}</span>
          </div>
        </div>

        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(order.createdAt).toLocaleDateString()}
          </div>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  )
}
