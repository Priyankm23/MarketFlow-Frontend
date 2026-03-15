'use client'

import React, { useState } from 'react'
import { Sidebar } from '@/components/sidebar'
import { VendorApplication } from '@/lib/types'
import { Check, X, Eye, Loader } from 'lucide-react'

export default function AdminDashboard() {
  const [vendorApps, setVendorApps] = useState<VendorApplication[]>([
    {
      id: 'APP-001',
      businessName: 'TechHub Electronics',
      ownerName: 'Rajesh Kumar',
      email: 'rajesh@techhub.com',
      phone: '9876543210',
      address: '123 Tech Street, Bangalore',
      businessType: 'Electronics',
      documents: {
        gstCertificate: 'doc-gst-001.pdf',
        businessRegistration: 'doc-reg-001.pdf',
        bankDetails: 'doc-bank-001.pdf',
        ownerID: 'doc-id-001.pdf',
      },
      status: 'pending',
      appliedAt: new Date().toISOString(),
    },
    {
      id: 'APP-002',
      businessName: 'Fashion Forward',
      ownerName: 'Priya Sharma',
      email: 'priya@fashionforward.com',
      phone: '9876543211',
      address: '456 Fashion Ave, Mumbai',
      businessType: 'Fashion',
      documents: {
        gstCertificate: 'doc-gst-002.pdf',
        businessRegistration: 'doc-reg-002.pdf',
        bankDetails: 'doc-bank-002.pdf',
        ownerID: 'doc-id-002.pdf',
      },
      status: 'pending',
      appliedAt: new Date().toISOString(),
    },
  ])

  const [selectedApp, setSelectedApp] = useState<VendorApplication | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectionForm, setShowRejectionForm] = useState<string | null>(null)

  const handleApprove = async (appId: string) => {
    setProcessingId(appId)
    await new Promise(resolve => setTimeout(resolve, 1500))

    setVendorApps(vendorApps.map(app =>
      app.id === appId
        ? {
          ...app,
          status: 'approved' as const,
          reviewedAt: new Date().toISOString(),
          reviewedBy: 'admin-001',
        }
        : app
    ))
    setProcessingId(null)
    setSelectedApp(null)
  }

  const handleReject = async (appId: string) => {
    if (!rejectionReason.trim()) return

    setProcessingId(appId)
    await new Promise(resolve => setTimeout(resolve, 1500))

    setVendorApps(vendorApps.map(app =>
      app.id === appId
        ? {
          ...app,
          status: 'rejected' as const,
          rejectionReason,
          reviewedAt: new Date().toISOString(),
          reviewedBy: 'admin-001',
        }
        : app
    ))
    setProcessingId(null)
    setSelectedApp(null)
    setShowRejectionForm(null)
    setRejectionReason('')
  }

  const stats = [
    { label: 'Total Vendors', value: '342', icon: '🏪' },
    { label: 'Pending Approvals', value: vendorApps.filter(a => a.status === 'pending').length.toString(), icon: '⏳' },
    { label: 'Revenue', value: '₹45,23,000', icon: '💰' },
    { label: 'Active Orders', value: '1,234', icon: '📦' },
  ]

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/admin/vendors', label: 'Vendor Approvals', icon: '✓', badge: vendorApps.filter(a => a.status === 'pending').length },
    { href: '/admin/orders', label: 'Orders', icon: '📦' },
    { href: '/admin/disputes', label: 'Disputes', icon: '⚠️' },
    { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
  ]

  const navItems2 = navItems

  return (
    <div className="flex bg-background min-h-screen">
      <Sidebar items={navItems2} title="Admin Panel" userRole="admin" />

      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-card border-b border-border p-6 sticky top-0 z-40">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage platform, vendors, and orders</p>
        </div>

        <div className="p-6 space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, idx) => (
              <div key={idx} className="bg-card border border-border rounded-lg p-6">
                <p className="text-3xl mb-2">{stat.icon}</p>
                <p className="text-muted-foreground text-sm">{stat.label}</p>
                <p className="text-2xl font-bold mt-2">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Vendor Approvals Section */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Pending Vendor Approvals</h2>

            <div className="space-y-4">
              {vendorApps.filter(a => a.status === 'pending').length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No pending approvals</p>
                </div>
              ) : (
                vendorApps.filter(a => a.status === 'pending').map((app) => (
                  <div
                    key={app.id}
                    className="p-4 border border-border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedApp(selectedApp?.id === app.id ? null : app)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg">{app.businessName}</h3>
                        <p className="text-sm text-muted-foreground">{app.ownerName} • {app.businessType}</p>
                        <p className="text-xs text-muted-foreground mt-1">{app.email} • {app.phone}</p>
                      </div>
                      <div className="text-right">
                        <span className="badge-warning">Pending Review</span>
                        <p className="text-xs text-muted-foreground mt-2">Applied: {new Date(app.appliedAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {selectedApp?.id === app.id && (
                      <div className="mt-4 pt-4 border-t border-border space-y-4 animate-slide-up">
                        {/* Business Details */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground font-medium mb-1">OWNER NAME</p>
                            <p className="font-medium">{app.ownerName}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground font-medium mb-1">BUSINESS TYPE</p>
                            <p className="font-medium">{app.businessType}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground font-medium mb-1">EMAIL</p>
                            <p className="font-medium text-sm">{app.email}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground font-medium mb-1">PHONE</p>
                            <p className="font-medium">{app.phone}</p>
                          </div>
                        </div>

                        {/* Address */}
                        <div>
                          <p className="text-xs text-muted-foreground font-medium mb-1">ADDRESS</p>
                          <p className="text-sm">{app.address}</p>
                        </div>

                        {/* Documents */}
                        <div>
                          <p className="text-xs text-muted-foreground font-medium mb-2">SUBMITTED DOCUMENTS</p>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(app.documents).map(([key, value]) => (
                              <button
                                key={key}
                                className="p-2 bg-secondary hover:bg-secondary/80 rounded-lg flex items-center justify-between text-sm transition-colors"
                              >
                                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                <Eye className="w-4 h-4" />
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Rejection Form */}
                        {showRejectionForm === app.id && (
                          <div className="p-4 bg-destructive/10 rounded-lg space-y-3">
                            <p className="text-sm font-medium">Rejection Reason</p>
                            <textarea
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              placeholder="Provide a reason for rejection..."
                              className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-destructive"
                              rows={3}
                            />
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-2">
                          {!showRejectionForm || showRejectionForm !== app.id ? (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleApprove(app.id)
                                }}
                                disabled={processingId === app.id}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-success text-white rounded-lg hover:opacity-90 disabled:opacity-50 font-medium transition-all"
                              >
                                {processingId === app.id ? (
                                  <Loader className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Check className="w-4 h-4" />
                                )}
                                Approve
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setShowRejectionForm(app.id)
                                }}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-destructive text-white rounded-lg hover:opacity-90 font-medium transition-all"
                              >
                                <X className="w-4 h-4" />
                                Reject
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleReject(app.id)
                                }}
                                disabled={processingId === app.id || !rejectionReason.trim()}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-destructive text-white rounded-lg hover:opacity-90 disabled:opacity-50 font-medium transition-all"
                              >
                                {processingId === app.id ? (
                                  <Loader className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Check className="w-4 h-4" />
                                )}
                                Confirm Rejection
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setShowRejectionForm(null)
                                  setRejectionReason('')
                                }}
                                className="flex-1 px-4 py-2.5 border border-border rounded-lg hover:bg-secondary font-medium transition-colors"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Approved & Rejected */}
          {vendorApps.filter(a => a.status !== 'pending').length > 0 && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Reviewed Applications</h2>
              <div className="space-y-2">
                {vendorApps.filter(a => a.status !== 'pending').map((app) => (
                  <div key={app.id} className="p-3 bg-secondary rounded-lg flex justify-between items-center">
                    <p className="font-medium">{app.businessName}</p>
                    <span className={app.status === 'approved' ? 'badge-success' : 'badge-error'}>
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </span>
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
