"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import {
  fetchVendorProfile,
  isVendorApproved,
  normalizeVendorStatus,
} from "@/lib/vendor-profile";
import { authFetch } from "@/lib/auth-fetch";
import { VendorProfileData } from "@/lib/types";
import {
  ArrowLeft,
  BarChart2,
  Boxes,
  CalendarClock,
  CircleCheck,
  ClipboardList,
  LayoutDashboard,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Menu,
  Phone,
  Package,
  Settings,
  ShoppingBag,
  Truck,
  User,
  Wallet,
  X,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/config";

const ORDERS_API_BASE_URL = API_BASE_URL;

type VendorOrderItem = {
  id?: string;
  quantity?: number;
  price?: number;
  product?: {
    name?: string;
    price?: number;
    stock?: number;
    imageUrl?: string;
  };
};

type VendorOrderEvent = {
  id?: string;
  status?: string;
  note?: string;
  createdAt?: string;
};

type VendorOrder = {
  id: string;
  deliveryPartnerId?: string;
  totalAmount?: number;
  status?: string;
  createdAt?: string;
  shippingFullName?: string;
  shippingEmail?: string;
  shippingPhoneNumber?: string;
  shippingAddressLine1?: string;
  shippingAddressLine2?: string | null;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  user?: {
    name?: string;
    email?: string;
    phone?: string | number | null;
  };
  items?: VendorOrderItem[];
  events?: VendorOrderEvent[];
};

type VendorOrderResponse = {
  status?: string;
  message?: string;
  data?: VendorOrder;
};

type VendorOrdersResponse = {
  status?: string;
  message?: string;
  data?: VendorOrder[];
};

type DeliveryAssignmentResponse = {
  success?: boolean;
  message?: string;
  partnerId?: string;
  pickupEtaMinutes?: number;
  stage?: string;
};

const formatDate = (value?: string) => {
  if (!value) return "-";
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return "-";
  return parsedDate.toLocaleString();
};

const getOrderStatusTone = (status?: string) => {
  const normalized = (status || "PENDING").toUpperCase();

  if (normalized.includes("DELIVERED") || normalized.includes("PAID")) {
    return "bg-emerald-100 text-emerald-700";
  }

  if (normalized.includes("CANCEL")) {
    return "bg-red-100 text-red-700";
  }

  if (normalized.includes("PENDING") || normalized.includes("PROCESS")) {
    return "bg-indigo-100 text-indigo-700";
  }

  return "bg-secondary text-foreground";
};

const getStockState = (availableStock: number | null, orderedQty: number) => {
  if (availableStock === null) {
    return {
      label: "Stock Unknown",
      className: "bg-secondary text-foreground",
    };
  }

  if (availableStock <= 0) {
    return {
      label: "Out of Stock",
      className: "bg-red-100 text-red-700",
    };
  }

  if (availableStock < orderedQty) {
    return {
      label: "Low for This Order",
      className: "bg-indigo-100 text-indigo-700",
    };
  }

  if (availableStock <= 5) {
    return {
      label: "Low Stock",
      className: "bg-indigo-100 text-indigo-700",
    };
  }

  return {
    label: "In Stock",
    className: "bg-emerald-100 text-emerald-700",
  };
};

const formatCurrency = (value?: number) => {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
};

export default function VendorOrderDetailsPage() {
  const user = useAuthStore((state) => state.user);
  const params = useParams<{ id: string }>();
  const orderId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<VendorProfileData | null>(null);
  const [order, setOrder] = useState<VendorOrder | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isPacking, setIsPacking] = useState(false);
  const [packMessage, setPackMessage] = useState("");
  const [packStatus, setPackStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const [isMarkingReady, setIsMarkingReady] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [actionStatus, setActionStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [assignmentTriggered, setAssignmentTriggered] = useState(false);
  const [deliveryAgent, setDeliveryAgent] = useState<any>(null);

  const approved = useMemo(
    () => isVendorApproved(profile?.status),
    [profile?.status],
  );

  const status = useMemo(
    () => normalizeVendorStatus(profile?.status),
    [profile?.status],
  );

  const normalizedStatus = (order?.status || "").toUpperCase();

  useEffect(() => {
    let active = true;

    const fetchAgentProfile = async () => {
      // Look for the partner using the ID if it's available and status is ready
      if (!order?.deliveryPartnerId && normalizedStatus !== "READY_FOR_PICKUP")
        return;

      const partnerId = order?.deliveryPartnerId || "";
      if (!partnerId && !order) return;

      try {
        // Trying possible endpoints since the backend profile route is generic ("/profile")
        let res = await authFetch(
          `${API_BASE_URL}/delivery/profile?userId=${partnerId}`,
        );
        if (!res.ok && partnerId) {
          res = await authFetch(
            `${API_BASE_URL}/delivery/profile/${partnerId}`,
          );
        }
        if (!res.ok) {
          res = await authFetch(`${API_BASE_URL}/delivery/profile`);
        }

        if (res.ok) {
          const payload = await res.json();
          if (active) {
            setDeliveryAgent(payload.data || payload);
          }
        }
      } catch (e) {
        console.error("Failed to fetch delivery partner profile", e);
      }
    };

    if (normalizedStatus === "READY_FOR_PICKUP") {
      void fetchAgentProfile();
    }

    return () => {
      active = false;
    };
  }, [order?.deliveryPartnerId, normalizedStatus]);

  useEffect(() => {
    let active = true;

    const loadOrder = async () => {
      if (!orderId) {
        if (active) {
          setError("Missing order id.");
          setLoading(false);
        }
        return;
      }

      if (!user) {
        if (active) {
          setError("Please sign in to access vendor orders.");
          setLoading(false);
        }
        return;
      }

      if (user.role?.toUpperCase() !== "VENDOR") {
        if (active) {
          setError("Only users with vendor role can access this page.");
          setLoading(false);
        }
        return;
      }

      try {
        const vendorProfile = await fetchVendorProfile();
        if (!active) return;

        setProfile(vendorProfile);

        if (!isVendorApproved(vendorProfile?.status)) {
          setLoading(false);
          return;
        }

        const singleOrderEndpoints = [
          `${ORDERS_API_BASE_URL}/orders/vendor-orders/${orderId}`,
          `${ORDERS_API_BASE_URL}/vendor-orders/${orderId}`,
          `${API_BASE_URL}/orders/vendor-orders/${orderId}`,
        ];

        let foundOrder: VendorOrder | null = null;

        for (const endpoint of singleOrderEndpoints) {
          const response = await authFetch(endpoint, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) continue;

          const payload: VendorOrderResponse = await response
            .json()
            .catch(() => ({}));

          if (payload?.data?.id) {
            foundOrder = payload.data;
            break;
          }
        }

        if (!foundOrder) {
          const fallbackListEndpoints = [
            `${ORDERS_API_BASE_URL}/orders/vendor-orders`,
            `${ORDERS_API_BASE_URL}/vendor-orders`,
            `${API_BASE_URL}/orders/vendor-orders`,
          ];

          for (const endpoint of fallbackListEndpoints) {
            const response = await authFetch(endpoint, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            });

            if (!response.ok) continue;

            const payload: VendorOrdersResponse = await response
              .json()
              .catch(() => ({}));

            const candidate = (payload?.data || []).find(
              (item) => item.id === orderId,
            );

            if (candidate) {
              foundOrder = candidate;
              break;
            }
          }
        }

        if (!active) return;

        if (!foundOrder) {
          setError("Order not found.");
          setLoading(false);
          return;
        }

        setOrder(foundOrder);
        setLoading(false);
      } catch (err: unknown) {
        if (!active) return;

        const message =
          err instanceof Error ? err.message : "Failed to load order details.";
        setError(message);
        setLoading(false);
      }
    };

    void loadOrder();

    return () => {
      active = false;
    };
  }, [orderId, user]);

  useEffect(() => {
    if (
      !orderId ||
      !user ||
      user.role?.toUpperCase() !== "VENDOR" ||
      !approved
    ) {
      return;
    }

    let active = true;

    const refreshOrder = async () => {
      const singleOrderEndpoints = [
        `${ORDERS_API_BASE_URL}/orders/vendor-orders/${orderId}`,
        `${ORDERS_API_BASE_URL}/vendor-orders/${orderId}`,
        `${API_BASE_URL}/orders/vendor-orders/${orderId}`,
      ];

      let foundOrder: VendorOrder | null = null;

      for (const endpoint of singleOrderEndpoints) {
        const response = await authFetch(endpoint, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) continue;

        const payload: VendorOrderResponse = await response
          .json()
          .catch(() => ({}));

        if (payload?.data?.id) {
          foundOrder = payload.data;
          break;
        }
      }

      if (!active || !foundOrder) return;
      setOrder(foundOrder);
    };

    const timer = window.setInterval(() => {
      void refreshOrder();
    }, 15000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [orderId, user, approved]);

  const navItems = [
    { href: "/vendor/dashboard", label: "Dashboard", icon: LayoutDashboard },
    {
      href: "/vendor/products",
      label: "Products",
      icon: Package,
      disabled: !approved,
    },
    {
      href: "/vendor/orders",
      label: "Orders",
      icon: ShoppingBag,
      active: true,
      disabled: !approved,
    },
    {
      href: "/vendor/analytics",
      label: "Analytics",
      icon: BarChart2,
      disabled: !approved,
    },
    { href: "/vendor/profile", label: "Profile", icon: User },
    {
      href: "/vendor/settings",
      label: "Settings",
      icon: Settings,
      disabled: !approved,
    },
  ];

  const isCancelled =
    normalizedStatus === "CANCELLED" || normalizedStatus === "CANCELED";

  const orderItems = order?.items || [];
  const totalUnitsToPrepare = orderItems.reduce(
    (acc, item) => acc + Math.max(1, Number(item.quantity || 1)),
    0,
  );

  const deliveryLikeStatuses = [
    "OUT_FOR_DELIVERY",
    "IN_TRANSIT",
    "SHIPPED",
    "DELIVERED",
  ];

  const isPackedOrBeyond = ["PACKED", ...deliveryLikeStatuses].includes(
    normalizedStatus,
  );

  const canPackOrder =
    !!order && approved && !isCancelled && normalizedStatus === "CONFIRMED";

  const canMarkReady =
    !!order &&
    !isCancelled &&
    normalizedStatus === "PACKED" &&
    !assignmentTriggered &&
    approved;

  const latestOrderEvent = useMemo(() => {
    const events = order?.events || [];
    if (events.length === 0) return null;

    return [...events].sort((a, b) => {
      const at = new Date(a.createdAt || 0).getTime();
      const bt = new Date(b.createdAt || 0).getTime();
      return bt - at;
    })[0];
  }, [order?.events]);

  const latestDeliveryUpdate = useMemo(() => {
    const note = latestOrderEvent?.note?.trim();
    const statusValue = (latestOrderEvent?.status || "").toUpperCase();
    const isDeliveryState = [
      "PACKED",
      "ASSIGNED",
      "PICKED_UP",
      "IN_TRANSIT",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
    ].includes(statusValue);

    if (!isDeliveryState) return "";

    if (note) return note;
    return `Latest delivery status: ${statusValue.replaceAll("_", " ")}.`;
  }, [latestOrderEvent]);

  const markOrderPacked = async () => {
    if (!order || !canPackOrder || isPacking) return;

    setIsPacking(true);
    setPackMessage("");
    setPackStatus("idle");

    try {
      const response = await authFetch(
        `${ORDERS_API_BASE_URL}/orders/${order.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "PACKED",
            note: "Packed by vendor",
          }),
        },
      );

      const payload: VendorOrderResponse = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        setPackStatus("error");
        setPackMessage(
          payload.message || "Unable to pack this order right now.",
        );
        return;
      }

      setOrder((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: payload?.data?.status || "PACKED",
          events: [
            {
              id: `packed-${Date.now()}`,
              status: "PACKED",
              note: "Packed by vendor",
              createdAt: new Date().toISOString(),
            },
            ...(prev.events || []),
          ],
        };
      });

      setPackStatus("success");
      setPackMessage(
        payload.message || "Order packed. Dispatch can be triggered now.",
      );
    } catch {
      setPackStatus("error");
      setPackMessage("Unable to pack this order right now.");
    } finally {
      setIsPacking(false);
    }
  };

  const markReadyToDeliver = async () => {
    if (!order || !canMarkReady || isMarkingReady) return;

    setIsMarkingReady(true);
    setActionMessage("");
    setActionStatus("idle");

    const assignmentEndpoint = `${ORDERS_API_BASE_URL}/delivery/orders/${order.id}/assign`;

    try {
      const response = await authFetch(assignmentEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const payload: DeliveryAssignmentResponse = await response
        .json()
        .catch(() => ({}));

      if (!response.ok || payload?.success === false) {
        setActionStatus("error");
        setActionMessage(
          payload.message ||
            "Could not assign a delivery partner right now. Please try again.",
        );
        return;
      }

      setAssignmentTriggered(true);

      const extras: string[] = [];
      if (payload.stage) {
        extras.push(`Stage: ${payload.stage.replaceAll("_", " ")}`);
      }
      if (typeof payload.pickupEtaMinutes === "number") {
        extras.push(`Pickup ETA: ${payload.pickupEtaMinutes} min`);
      }

      const composedMessage =
        (payload.message || "Delivery assignment triggered successfully.") +
        (extras.length > 0 ? ` (${extras.join(" | ")})` : "");

      setActionStatus("success");
      setActionMessage(composedMessage);
    } catch {
      setActionStatus("error");
      setActionMessage(
        "Could not assign a delivery partner right now. Please try again.",
      );
    } finally {
      setIsMarkingReady(false);
    }
  };

  return (
    <div
      className="flex min-h-screen font-body [&_h1]:font-body [&_h2]:font-body [&_h3]:font-body [&_h4]:font-body"
      style={{
        backgroundColor: "var(--bg-base)",
        fontFamily: "var(--font-dm-sans)",
      }}
    >
      {isMobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          className="fixed inset-0 z-40 bg-black/35 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[250px] sm:w-[260px] flex flex-col transform transition-transform duration-300 ease-out ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
        style={{
          borderRight: "1px solid var(--border-default)",
          backgroundColor: "var(--bg-surface)",
        }}
      >
        <div className="p-4 sm:p-6 flex items-center justify-between">
          <Link href="/" className="block">
            <h2
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "22px",
                color: "var(--brand-primary)",
                letterSpacing: "0.03em",
                fontWeight: "normal",
              }}
            >
              MarketFlow
            </h2>
            <p
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                marginTop: "2px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Vendor Hub
            </p>
          </Link>

          <button
            type="button"
            aria-label="Close sidebar"
            className="md:hidden h-8 w-8 rounded-md flex items-center justify-center"
            style={{ color: "var(--text-secondary)" }}
            onClick={() => setIsMobileSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.active;
            return (
              <Link
                key={item.label}
                href={item.disabled ? "#" : item.href}
                onClick={(e) => {
                  if (item.disabled) {
                    e.preventDefault();
                    return;
                  }
                  setIsMobileSidebarOpen(false);
                }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive ? "" : "hover:bg-[var(--bg-sunken)]"
                }`}
                style={{
                  backgroundColor: isActive
                    ? "var(--brand-primary)"
                    : "transparent",
                  color: isActive
                    ? "var(--text-inverse)"
                    : "var(--text-secondary)",
                  opacity: item.disabled ? 0.5 : 1,
                  pointerEvents: item.disabled ? "none" : "auto",
                  fontWeight: isActive ? 500 : 400,
                }}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div
          className="p-4 mt-auto"
          style={{ borderTop: "1px solid var(--border-default)" }}
        >
          <div className="flex items-center gap-3 px-3 py-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: "var(--bg-sunken)",
                color: "var(--text-secondary)",
              }}
            >
              <User size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-medium truncate"
                style={{ color: "var(--text-primary)" }}
              >
                {user?.name || "Vendor"}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 ml-0 md:ml-[260px] flex flex-col min-h-screen">
        <header
          className="h-16 md:h-[72px] px-4 sm:px-6 md:px-8 flex items-center justify-between sticky top-0 z-30"
          style={{
            backgroundColor: "var(--bg-base)",
            borderBottom: "1px solid var(--border-default)",
          }}
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open sidebar"
              className="md:hidden h-9 w-9 rounded-md flex items-center justify-center"
              style={{
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
              }}
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <Menu size={18} />
            </button>

            <div className="flex flex-col gap-0.5">
              <h1
                className="text-2xl sm:text-3xl font-normal"
                style={{
                  letterSpacing: "0.04em",
                  color: "var(--text-primary)",
                }}
              >
                Order Workbench
              </h1>
              <p
                className="hidden sm:block text-xs font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                Structured order insights for operations and dispatch.
              </p>
            </div>
          </div>

          <Link
            href="/vendor/orders"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </Link>
        </header>

        <div className="p-4 sm:p-6 md:p-8 max-w-7xl w-full space-y-6">
          {loading && (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3 text-primary" />
              <p className="text-sm text-muted-foreground">
                Loading order details...
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="bg-card border border-rose-200 rounded-xl p-6 text-sm text-rose-700">
              {error}
            </div>
          )}

          {!loading && !error && profile && !approved && (
            <div className="bg-card border border-indigo-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 mt-0.5 text-indigo-700" />
                <div>
                  <h2 className="text-lg font-semibold text-indigo-700">
                    Order details are locked until approval
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Current status: {status}. Once approved, you can manage
                    delivery actions.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && approved && order && (
            <div className="space-y-6">
              <section
                className="rounded-2xl border p-5 sm:p-6"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(79,70,229,0.08) 0%, rgba(255,255,255,0.95) 60%)",
                  borderColor: "var(--border-default)",
                }}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Order Workbench
                    </p>
                    <p className="font-mono text-sm sm:text-base text-foreground break-all">
                      {order.id}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getOrderStatusTone(order.status)}`}
                  >
                    {(order.status || "PENDING").replaceAll("_", " ")}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-border bg-background px-3 py-3">
                    <p className="text-xs text-muted-foreground">Created At</p>
                    <p className="text-sm font-semibold text-foreground mt-1">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-background px-3 py-3">
                    <p className="text-xs text-muted-foreground">
                      Order Status
                    </p>
                    <p className="text-sm font-semibold text-foreground mt-1">
                      {(order.status || "PENDING").replaceAll("_", " ")}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-background px-3 py-3">
                    <p className="text-xs text-muted-foreground">Line Items</p>
                    <p className="text-sm font-semibold text-foreground mt-1">
                      {orderItems.length}
                    </p>
                  </div>
                </div>
              </section>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
                <div className="xl:col-span-2 space-y-6">
                  <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-border bg-card p-5">
                      <h2 className="text-lg font-semibold text-foreground">
                        Customer
                      </h2>
                      <div className="mt-4 space-y-3 text-sm">
                        <div className="flex items-start gap-2 rounded-lg border border-border bg-secondary/30 px-3 py-2.5">
                          <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Name
                            </p>
                            <p className="font-semibold text-foreground mt-0.5">
                              {order.user?.name || "Unknown"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 rounded-lg border border-border bg-secondary/30 px-3 py-2.5">
                          <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Email
                            </p>
                            <p className="font-semibold text-foreground mt-0.5 break-all">
                              {order.user?.email || "-"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 rounded-lg border border-border bg-secondary/30 px-3 py-2.5">
                          <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Phone
                            </p>
                            <p className="font-semibold text-foreground mt-0.5">
                              {order.user?.phone
                                ? String(order.user.phone)
                                : "-"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-5">
                      <h2 className="text-lg font-semibold text-foreground">
                        Shipping Destination
                      </h2>
                      <div className="mt-4 space-y-3 text-sm">
                        <div className="flex items-start gap-2 rounded-lg border border-border bg-secondary/30 px-3 py-2.5">
                          <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Recipient
                            </p>
                            <p className="font-semibold text-foreground mt-0.5">
                              {order.shippingFullName || "-"}
                            </p>
                          </div>
                        </div>
                        <div className="rounded-lg border border-border bg-secondary/30 px-3 py-2.5">
                          <p className="text-xs text-muted-foreground">
                            Contact
                          </p>
                          <p className="font-semibold text-foreground mt-0.5 break-all">
                            {order.shippingEmail || "-"}
                          </p>
                          <p className="font-semibold text-foreground mt-0.5">
                            {order.shippingPhoneNumber || "-"}
                          </p>
                        </div>
                        <div className="flex items-start gap-2 rounded-lg border border-border bg-secondary/30 px-3 py-2.5">
                          <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Address
                            </p>
                            <p className="font-semibold text-foreground mt-0.5">
                              {order.shippingAddressLine1 || "-"}
                              {order.shippingAddressLine2
                                ? `, ${order.shippingAddressLine2}`
                                : ""}
                            </p>
                            <p className="font-semibold text-foreground mt-0.5">
                              {order.shippingCity || "-"},{" "}
                              {order.shippingState || "-"}{" "}
                              {order.shippingPostalCode || "-"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-lg font-semibold text-foreground">
                        Product Preparation Sheet
                      </h2>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 text-indigo-700 px-3 py-1 text-xs font-semibold">
                        <ClipboardList className="h-3.5 w-3.5" />
                        Packing View
                      </span>
                    </div>

                    <div className="mt-4 space-y-3">
                      {orderItems.map((item, idx) => {
                        const orderedQty = Math.max(
                          1,
                          Number(item.quantity || 1),
                        );
                        const availableStock =
                          typeof item.product?.stock === "number"
                            ? item.product.stock
                            : null;
                        const stockState = getStockState(
                          availableStock,
                          orderedQty,
                        );

                        return (
                          <article
                            key={item.id || `${order.id}-${idx}`}
                            className="rounded-xl border border-border bg-background px-4 py-4"
                          >
                            <div className="flex flex-col sm:flex-row gap-4">
                              <div className="h-20 w-20 rounded-lg overflow-hidden bg-secondary shrink-0">
                                {item.product?.imageUrl ? (
                                  <img
                                    src={item.product.imageUrl}
                                    alt={item.product?.name || "Product"}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
                                    No Image
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p className="font-semibold text-foreground truncate">
                                    {item.product?.name || "Product"}
                                  </p>
                                  <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${stockState.className}`}
                                  >
                                    {stockState.label}
                                  </span>
                                </div>

                                <div className="mt-3 grid grid-cols-2 md:grid-cols-2 gap-2 text-xs">
                                  <div className="rounded-lg border border-border bg-card px-2.5 py-2">
                                    <p className="text-muted-foreground">
                                      Ordered Qty
                                    </p>
                                    <p className="font-semibold text-foreground mt-0.5">
                                      {orderedQty}
                                    </p>
                                  </div>
                                  <div className="rounded-lg border border-border bg-card px-2.5 py-2">
                                    <p className="text-muted-foreground">
                                      Available
                                    </p>
                                    <p className="font-semibold text-foreground mt-0.5">
                                      {availableStock === null
                                        ? "-"
                                        : availableStock}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>

                  <section className="rounded-xl border border-border bg-card p-5">
                    <h2 className="text-lg font-semibold text-foreground">
                      Order Events Timeline
                    </h2>
                    <div className="mt-4 space-y-3">
                      {(order.events || []).length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No events available.
                        </p>
                      ) : (
                        (order.events || []).map((event, idx) => (
                          <div
                            key={event.id || `${order.id}-event-${idx}`}
                            className="rounded-lg border border-border bg-secondary/20 px-3 py-3"
                          >
                            <p className="text-sm font-semibold text-foreground">
                              {(
                                event.status ||
                                order.status ||
                                "PENDING"
                              ).replaceAll("_", " ")}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {event.note || "No event note"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(event.createdAt)}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </section>
                </div>

                <aside className="xl:sticky xl:top-24 space-y-4">
                  {normalizedStatus === "READY_FOR_PICKUP" ? (
                    <section className="rounded-xl border border-indigo-200 bg-indigo-50 p-5">
                      <h3 className="text-base font-semibold text-indigo-900">
                        Delivery Agent Details
                      </h3>
                      {deliveryAgent && deliveryAgent.user ? (
                        <div className="mt-4 space-y-3 text-sm">
                          <div className="rounded-lg border border-indigo-100 bg-white/60 px-3 py-2.5">
                            <p className="text-xs text-indigo-700/70">
                              Agent Name
                            </p>
                            <p className="font-semibold text-indigo-900 mt-0.5">
                              {deliveryAgent.user.name || "Unknown"}
                            </p>
                          </div>
                          <div className="rounded-lg border border-indigo-100 bg-white/60 px-3 py-2.5">
                            <p className="text-xs text-indigo-700/70">
                              Contact
                            </p>
                            <p className="font-semibold text-indigo-900 mt-0.5">
                              {deliveryAgent.user.phone || "-"}
                            </p>
                            <p className="font-semibold text-indigo-900 mt-0.5 break-all">
                              {deliveryAgent.user.email || "-"}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 text-sm text-indigo-700">
                          Fetching agent details...
                        </div>
                      )}
                    </section>
                  ) : !isPackedOrBeyond ? (
                    <section className="rounded-xl border border-border bg-card p-5">
                      <h3 className="text-base font-semibold text-foreground">
                        Packing Control
                      </h3>
                      <p className="mt-3 text-sm text-muted-foreground">
                        Pack this order first. Dispatch becomes available only
                        after packing is confirmed.
                      </p>

                      <div className="mt-4 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
                        Current fulfillment state:{" "}
                        {(order.status || "PENDING").replaceAll("_", " ")}.
                      </div>

                      {latestDeliveryUpdate ? (
                        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                          {latestDeliveryUpdate}
                        </div>
                      ) : null}

                      <button
                        type="button"
                        className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={markOrderPacked}
                        disabled={!canPackOrder || isPacking}
                      >
                        <Package className="h-4 w-4" />
                        {isPacking ? "Packing..." : "Pack"}
                      </button>

                      {packMessage ? (
                        <p
                          className={`mt-2 text-xs ${packStatus === "error" ? "text-red-700" : "text-emerald-700"}`}
                        >
                          {packMessage}
                        </p>
                      ) : null}
                    </section>
                  ) : (
                    <section className="rounded-xl border border-border bg-card p-5">
                      <h3 className="text-base font-semibold text-foreground">
                        Dispatch Readiness
                      </h3>
                      <div className="mt-4 space-y-2.5 text-sm">
                        <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/20 px-3 py-2">
                          <span className="inline-flex items-center gap-2 text-muted-foreground">
                            <Boxes className="h-4 w-4" />
                            Total Units
                          </span>
                          <span className="font-semibold text-foreground">
                            {totalUnitsToPrepare}
                          </span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/20 px-3 py-2">
                          <span className="inline-flex items-center gap-2 text-muted-foreground">
                            <CalendarClock className="h-4 w-4" />
                            Created On
                          </span>
                          <span className="font-semibold text-foreground text-xs">
                            {formatDate(order.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/20 px-3 py-2">
                          <span className="inline-flex items-center gap-2 text-muted-foreground">
                            <Wallet className="h-4 w-4" />
                            Order Amount
                          </span>
                          <span className="font-semibold text-foreground">
                            {formatCurrency(order.totalAmount)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
                        Current fulfillment state:{" "}
                        {(order.status || "PENDING").replaceAll("_", " ")}.
                      </div>

                      {latestDeliveryUpdate ? (
                        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                          {latestDeliveryUpdate}
                        </div>
                      ) : null}

                      <button
                        type="button"
                        className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={markReadyToDeliver}
                        disabled={!canMarkReady || isMarkingReady}
                      >
                        <Truck className="h-4 w-4" />
                        {isMarkingReady
                          ? "Assigning Partner..."
                          : "Ready to Deliver"}
                      </button>

                      {actionMessage ? (
                        <p
                          className={`mt-2 text-xs ${actionStatus === "error" ? "text-red-700" : "text-emerald-700"}`}
                        >
                          {actionMessage}
                        </p>
                      ) : null}
                    </section>
                  )}

                  <section className="rounded-xl border border-border bg-card p-5">
                    <h3 className="text-base font-semibold text-foreground">
                      Fulfillment Snapshot
                    </h3>
                    <div className="mt-4 space-y-2 text-sm">
                      <p className="flex items-start gap-2 text-foreground">
                        <CircleCheck className="h-4 w-4 mt-0.5 text-emerald-600" />
                        Recipient: {order.shippingFullName || "-"}
                      </p>
                      <p className="flex items-start gap-2 text-foreground break-all">
                        <Mail className="h-4 w-4 mt-0.5 text-indigo-700" />
                        {order.shippingEmail || "-"}
                      </p>
                      <p className="flex items-start gap-2 text-foreground">
                        <Phone className="h-4 w-4 mt-0.5 text-indigo-700" />
                        {order.shippingPhoneNumber || "-"}
                      </p>
                    </div>
                  </section>

                  {isCancelled && (
                    <section className="rounded-xl border border-red-200 bg-red-50 p-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                        Cancelled Verdict
                      </p>
                      <p className="text-sm font-semibold text-red-700 mt-1">
                        Order Cancelled
                      </p>
                      <p className="text-sm text-red-700/90 mt-1">
                        Reason:{" "}
                        {order.events?.[0]?.note?.trim() ||
                          "Order was cancelled by the system or customer."}
                      </p>
                    </section>
                  )}
                </aside>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
