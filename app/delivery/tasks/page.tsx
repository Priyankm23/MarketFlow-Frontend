'use client'

import React, { useState } from 'react'
import { Sidebar } from '@/components/sidebar'
import { MapPin, Package, Phone, CheckCircle, Loader, Navigation } from 'lucide-react'

interface Task {
  id: string
  orderId: string
  customerId: string
  vendorName: string
  pickupAddress: string
  deliveryAddress: string
  customerPhone: string
  status: 'pending' | 'accepted' | 'picked_up' | 'in_transit' | 'delivered'
  items: number
  totalAmount: number
  distance: string
}

export default function DeliveryTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 'TASK-001',
      orderId: 'ORD-001',
      customerId: 'cust-1',
      vendorName: 'TechHub',
      pickupAddress: '123 Vendor Street, Bangalore',
      deliveryAddress: '456 Customer Lane, Bangalore',
      customerPhone: '9876543210',
      status: 'pending',
      items: 1,
      totalAmount: 4999,
      distance: '2.3 km',
    },
    {
      id: 'TASK-002',
      orderId: 'ORD-002',
      customerId: 'cust-2',
      vendorName: 'StyleWear',
      pickupAddress: '789 Fashion Ave, Bangalore',
      deliveryAddress: '321 Home Street, Bangalore',
      customerPhone: '9876543211',
      status: 'accepted',
      items: 2,
      totalAmount: 1198,
      distance: '4.5 km',
    },
    {
      id: 'TASK-003',
      orderId: 'ORD-003',
      customerId: 'cust-3',
      vendorName: 'HomeEssentials',
      pickupAddress: '555 Home Square, Bangalore',
      deliveryAddress: '789 Delivery Road, Bangalore',
      customerPhone: '9876543212',
      status: 'picked_up',
      items: 3,
      totalAmount: 2599,
      distance: '3.1 km',
    },
    {
      id: 'TASK-004',
      orderId: 'ORD-004',
      customerId: 'cust-4',
      vendorName: 'SportGear',
      pickupAddress: '222 Sports Lane, Bangalore',
      deliveryAddress: '444 Athletic Way, Bangalore',
      customerPhone: '9876543213',
      status: 'in_transit',
      items: 1,
      totalAmount: 3499,
      distance: '5.8 km',
    },
  ])

  const [expandedTask, setExpandedTask] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'badge-success'
      case 'in_transit':
        return 'badge-info'
      case 'accepted':
      case 'picked_up':
        return 'badge-warning'
      case 'pending':
        return 'badge-warning'
      default:
        return 'badge-warning'
    }
  }

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')
  }

  const handleAcceptTask = async (taskId: string) => {
    setProcessingId(taskId)
    await new Promise(resolve => setTimeout(resolve, 800))
    setTasks(tasks.map(t =>
      t.id === taskId ? { ...t, status: 'accepted' as const } : t
    ))
    setProcessingId(null)
  }

  const handlePickup = async (taskId: string) => {
    setProcessingId(taskId)
    await new Promise(resolve => setTimeout(resolve, 800))
    setTasks(tasks.map(t =>
      t.id === taskId ? { ...t, status: 'picked_up' as const } : t
    ))
    setProcessingId(null)
  }

  const handleStartDelivery = async (taskId: string) => {
    setProcessingId(taskId)
    await new Promise(resolve => setTimeout(resolve, 800))
    setTasks(tasks.map(t =>
      t.id === taskId ? { ...t, status: 'in_transit' as const } : t
    ))
    setProcessingId(null)
  }

  const handleDeliver = async (taskId: string) => {
    setProcessingId(taskId)
    await new Promise(resolve => setTimeout(resolve, 800))
    setTasks(tasks.map(t =>
      t.id === taskId ? { ...t, status: 'delivered' as const } : t
    ))
    setProcessingId(null)
  }

  const navItems = [
    { href: '/delivery/tasks', label: 'Active Tasks', icon: '📦', badge: tasks.filter(t => t.status !== 'delivered').length },
    { href: '/delivery/history', label: 'Completed', icon: '✓' },
    { href: '/delivery/earnings', label: 'Earnings', icon: '💰' },
    { href: '/delivery/profile', label: 'Profile', icon: '👤' },
  ]

  const activeTasks = tasks.filter(t => t.status !== 'delivered')
  const completedTasks = tasks.filter(t => t.status === 'delivered')

  return (
    <div className="flex bg-background min-h-screen">
      <Sidebar items={navItems} title="Delivery Partner" userRole="delivery" />

      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-card border-b border-border p-6 sticky top-0 z-40">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">Active Deliveries</h1>
              <p className="text-muted-foreground mt-1">{activeTasks.length} task{activeTasks.length !== 1 ? 's' : ''} available</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Today's Earnings</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">₹{activeTasks.reduce((sum, t) => sum + Math.floor(t.totalAmount * 0.05), 0)}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Task Cards - Mobile First */}
          <div className="space-y-4">
            {activeTasks.length === 0 ? (
              <div className="text-center py-16 bg-card border border-border rounded-lg">
                <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No active deliveries</h3>
                <p className="text-muted-foreground">Check back soon for new tasks!</p>
              </div>
            ) : (
              activeTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                >
                  {/* Card Header - Always Visible */}
                  <div className="p-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-lg">{task.id}</h3>
                        <p className="text-sm text-muted-foreground">{task.vendorName} → Delivery</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">₹{task.totalAmount}</p>
                        <span className={getStatusColor(task.status)}>
                          {getStatusLabel(task.status)}
                        </span>
                      </div>
                    </div>

                    {/* Quick Info */}
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {task.distance}
                      </div>
                      <div className="flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        {task.items} item{task.items !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedTask === task.id && (
                    <div className="p-4 border-t border-border space-y-4 bg-secondary/30 animate-slide-up">
                      {/* Pickup & Delivery Addresses */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground font-medium mb-2">PICKUP FROM</p>
                          <div className="flex gap-2">
                            <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                            <p className="text-sm">{task.pickupAddress}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground font-medium mb-2">DELIVER TO</p>
                          <div className="flex gap-2">
                            <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                            <p className="text-sm">{task.deliveryAddress}</p>
                          </div>
                        </div>
                      </div>

                      {/* Customer Contact */}
                      <div className="p-3 bg-card border border-border rounded-lg flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Customer Contact</p>
                          <p className="font-medium">{task.customerPhone}</p>
                        </div>
                        <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                          <Phone className="w-5 h-5 text-primary" />
                        </button>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-4 border-t border-border">
                        {task.status === 'pending' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAcceptTask(task.id)
                            }}
                            disabled={processingId === task.id}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 font-medium transition-all"
                          >
                            {processingId === task.id ? (
                              <Loader className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                            Accept Task
                          </button>
                        )}

                        {task.status === 'accepted' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handlePickup(task.id)
                            }}
                            disabled={processingId === task.id}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 font-medium transition-all"
                          >
                            {processingId === task.id ? (
                              <Loader className="w-4 h-4 animate-spin" />
                            ) : (
                              <Package className="w-4 h-4" />
                            )}
                            Confirm Pickup
                          </button>
                        )}

                        {task.status === 'picked_up' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStartDelivery(task.id)
                            }}
                            disabled={processingId === task.id}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 font-medium transition-all"
                          >
                            {processingId === task.id ? (
                              <Loader className="w-4 h-4 animate-spin" />
                            ) : (
                              <Navigation className="w-4 h-4" />
                            )}
                            Start Delivery
                          </button>
                        )}

                        {task.status === 'in_transit' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeliver(task.id)
                            }}
                            disabled={processingId === task.id}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50 font-medium transition-all"
                          >
                            {processingId === task.id ? (
                              <Loader className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                            Mark Delivered
                          </button>
                        )}

                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 px-4 py-2.5 border border-border rounded-lg hover:bg-secondary font-medium transition-colors"
                        >
                          View Map
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4">Completed Today</h2>
              <div className="space-y-2">
                {completedTasks.map((task) => (
                  <div key={task.id} className="p-3 bg-green-100 dark:bg-green-950/30 border border-green-300 dark:border-green-700 rounded-lg flex justify-between items-center">
                    <p className="font-medium">{task.id}</p>
                    <p className="text-sm text-green-700 dark:text-green-400 font-medium">Delivered ✓</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
