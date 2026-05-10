"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
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
  Bike,
  CalendarClock,
  CheckCircle2,
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
  ShieldCheck,
  ShoppingBag,
  Truck,
  User,
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
  deliveryPartner?: {
    id?: string;
    user?: { id?: string; name?: string; email?: string; phone?: string };
    activeDeliveries?: number;
    dailyCapacity?: number;
  } | null;
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

const formatMoney = (value?: number) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

function StatusBadge({ status }: { status: string }) {
  const normalized = (status || "PENDING").toUpperCase();
  const config: Record<
    string,
    { label: string; bg: string; color: string; dot: boolean }
  > = {
    APPROVED: {
      label: "Approved",
      bg: "bg-emerald-50",
      color: "text-emerald-700",
      dot: true,
    },
    PENDING: {
      label: "Pending",
      bg: "bg-amber-50",
      color: "text-amber-700",
      dot: true,
    },
    REJECTED: {
      label: "Rejected",
      bg: "bg-rose-50",
      color: "text-rose-700",
      dot: false,
    },
    CONFIRMED: {
      label: "Confirmed",
      bg: "bg-indigo-50",
      color: "text-indigo-700",
      dot: true,
    },
    DELIVERED: {
      label: "Delivered",
      bg: "bg-emerald-100",
      color: "text-emerald-800",
      dot: false,
    },
    CANCELLED: {
      label: "Cancelled",
      bg: "bg-rose-100",
      color: "text-rose-800",
      dot: false,
    },
  };

  const c = config[normalized] || {
    label: normalized.replaceAll("_", " "),
    bg: "bg-slate-100",
    color: "text-slate-700",
    dot: false,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm border border-black/5 ${c.bg} ${c.color}`}
    >
      {c.dot && (
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ backgroundColor: "currentColor" }}
        />
      )}
      {c.label}
    </span>
  );
}

function MetricTile({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-base font-semibold text-foreground break-words">
            {value}
          </p>
          {hint ? (
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-sunken)] text-[var(--text-secondary)]">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function DetailField({
  icon: Icon,
  label,
  lines,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  lines: string[];
}) {
  return (
    <div className="rounded-xl border border-border bg-secondary/20 px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-muted-foreground shadow-sm">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {label}
          </p>
          {lines.map((line, index) => (
            <p
              key={`${label}-${index}`}
              className={`break-words text-sm ${index === 0 ? "mt-1.5 font-semibold text-foreground" : "mt-1 text-muted-foreground"}`}
            >
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

const normalizeComparable = (value?: string | number | null) =>
  String(value ?? "")
    .trim()
    .replace(/\s+/g, "")
    .toLowerCase();

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
  const [backendOtp, setBackendOtp] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<"PENDING" | "ACCEPTED" | "REJECTED" | "UNKNOWN">("UNKNOWN");
  const [deliveryStage, setDeliveryStage] = useState<string | null>(null);
  const [pickupEta, setPickupEta] = useState<number | null>(null);

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
    // Prefer using the delivery partner data included in the order payload.
    // If the backend returned `order.deliveryPartner`, use that directly.
    if (!order) return;

    if (order.deliveryPartner) {
      setDeliveryAgent(order.deliveryPartner);
      return;
    }

    // If the order has no embedded deliveryPartner and status is READY_FOR_PICKUP,
    // leave `deliveryAgent` null so the UI shows the "Fetching agent details..." text.
    // We intentionally avoid calling the `/delivery/profile` API here because
    // the vendor order response already contains the needed partner info when available.
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

        const endpoints = [
          `${ORDERS_API_BASE_URL}/orders/vendor-orders`,
          `${ORDERS_API_BASE_URL}/vendor-orders`,
          `${API_BASE_URL}/orders/vendor-orders`,
        ];

        let foundOrder: VendorOrder | null = null;

        for (const endpoint of endpoints) {
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
      // 1. Refresh General Order Data
      const endpoints = [
        `${ORDERS_API_BASE_URL}/orders/vendor-orders`,
        `${ORDERS_API_BASE_URL}/vendor-orders`,
        `${API_BASE_URL}/orders/vendor-orders`,
      ];

      let foundOrder: VendorOrder | null = null;

      for (const endpoint of endpoints) {
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

      if (!active || !foundOrder) return;
      setOrder(foundOrder);

      // 2. Refresh Real-time Delivery Status (Verdict, Partner Details, ETA)
      try {
        const statusRes = await authFetch(
          `${API_BASE_URL}/orders/vendor-orders/${orderId}/delivery-status`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          },
        );

        if (statusRes.ok) {
          const statusPayload = await statusRes.json();
          if (statusPayload.data) {
            const d = statusPayload.data;
            setVerdict(d.verdict || "UNKNOWN");
            setDeliveryStage(d.deliveryStage);
            setPickupEta(d.pickupEtaMinutes);
            if (d.deliveryPartner) {
              setDeliveryAgent(d.deliveryPartner);
            }

            // 3. Auto-fetch Handover OTP if Verdict is ACCEPTED
            if (d.verdict === "ACCEPTED" && !backendOtp) {
              try {
                const otpRes = await authFetch(
                  `${API_BASE_URL}/delivery/orders/${orderId}/pickup-otp`,
                  {
                    method: "POST",
                    credentials: "include",
                  },
                );
                if (otpRes.ok) {
                  const otpPayload = await otpRes.json();
                  if (otpPayload.success && otpPayload.data?.otp) {
                    setBackendOtp(String(otpPayload.data.otp));
                  }
                }
              } catch (otpErr) {
                console.error("Auto-fetching OTP failed:", otpErr);
              }
            }
          }
        }
      } catch (err) {
        console.error("Polling delivery status failed:", err);
      }
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
  const orderStatusLabel = (order?.status || "PENDING").replace(/_/g, " ");
  const customerName = order?.user?.name?.trim() || "";
  const customerEmail = order?.user?.email?.trim() || "";
  const customerPhone = order?.user?.phone ? String(order.user.phone).trim() : "";
  const shippingRecipient = order?.shippingFullName?.trim() || "";
  const shippingEmail = order?.shippingEmail?.trim() || "";
  const shippingPhone = order?.shippingPhoneNumber?.trim() || "";
  const showShippingRecipient =
    !!shippingRecipient &&
    normalizeComparable(shippingRecipient) !==
      normalizeComparable(customerName);
  const shippingContactLines = [shippingEmail, shippingPhone].filter(
    (line) =>
      !!line &&
      normalizeComparable(line) !== normalizeComparable(customerEmail) &&
      normalizeComparable(line) !== normalizeComparable(customerPhone),
  );
  const totalUnitsToPrepare = orderItems.reduce(
    (acc, item) => acc + Math.max(1, Number(item.quantity || 1)),
    0,
  );

  const deliveryLikeStatuses = [
    "ASSIGNED",
    "READY_FOR_PICKUP",
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

  const canHandToPartner = 
    !!order &&
    !isCancelled &&
    normalizedStatus === "READY_FOR_PICKUP" &&
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

  const timelineEvents = useMemo(() => {
    const events = order?.events || [];
    return [...events].sort((a, b) => {
      const at = new Date(a.createdAt || 0).getTime();
      const bt = new Date(b.createdAt || 0).getTime();
      return bt - at;
    });
  }, [order?.events]);

  const latestDeliveryUpdate = useMemo(() => {
    const note = latestOrderEvent?.note?.trim();
    const statusValue = (latestOrderEvent?.status || "").toUpperCase();
    const isDeliveryState = [
      "PACKED",
      "ASSIGNED",
      "READY_FOR_PICKUP",
      "PICKED_UP",
      "IN_TRANSIT",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
    ].includes(statusValue);

    if (!isDeliveryState) return "";

    if (note) return note;
    return `Latest delivery status: ${statusValue.replace(/_/g, " ")}.`;
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
        extras.push(`Stage: ${payload.stage.replace(/_/g, " ")}`);
      }
      if (typeof payload.pickupEtaMinutes === "number") {
        extras.push(`Pickup ETA: ${payload.pickupEtaMinutes} min`);
      }

      const composedMessage =
        (payload.message || "Delivery assignment triggered successfully.") +
        (extras.length > 0 ? ` (${extras.join(" | ")})` : "");

      setActionStatus("success");
      setActionMessage(composedMessage);
      
      // Initial fetch to get the PENDING verdict and partner name
      setTimeout(() => {
        // Trigger a refresh after a short delay to see the "Partner Found" state
        // This is handled by the interval, but doing it once here helps the UX
      }, 1000);
    } catch {
      setActionStatus("error");
      setActionMessage(
        "Could not assign a delivery partner right now. Please try again.",
      );
    } finally {
      setIsMarkingReady(false);
    }
  };

  const currentHandoverOtp = useMemo(() => {
    return backendOtp;
  }, [backendOtp]);

  const isPickedUp = useMemo(() => {
    if (typeof window === "undefined" || !order) return false;
    const pickedUpOrders = JSON.parse(window.localStorage.getItem("delivery_picked_up_orders") || "{}");
    // The keys in delivery_picked_up_orders are taskIds, which we've mapped to orderIds in this implementation
    return !!pickedUpOrders[order.id];
  }, [order?.id]);

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
          <Link href="/vendor/dashboard" className="block">
            <Image
              src="/logo/logo.png"
              alt="Markivo"
              width={172}
              height={46}
              className="h-9 sm:h-10 w-auto"
              priority
            />
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

        <div className="px-5 mb-6">
          <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
            <h3 className="font-bold text-foreground text-sm truncate">
              {profile?.businessName || "My Store"}
            </h3>
            <div className="mt-2">
              <StatusBadge status={status || "PENDING"} />
            </div>
          </div>
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
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </Link>
        </header>

        <div className="p-4 sm:p-5 md:p-6 max-w-7xl w-full space-y-5 text-[15px] sm:text-base">
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
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">
              <div className="xl:col-span-2 space-y-5">
                {/* 1. Order Items first as requested */}
                <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-3 border-b border-border pb-5 mb-5">
                    <h2 className="text-xl font-bold text-foreground">
                      Order Items
                    </h2>
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-bold">
                      <ClipboardList className="h-3.5 w-3.5" />
                      Manifest
                    </span>
                  </div>

                  <div className="space-y-3">
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
                          className="rounded-xl border border-border bg-background p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex flex-col gap-5 sm:flex-row">
                            <div className="h-32 w-32 sm:h-36 sm:w-36 rounded-xl overflow-hidden border border-border bg-secondary shrink-0 shadow-sm">
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

                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                              <div>
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="text-lg font-bold text-foreground truncate">
                                      {item.product?.name || "Product"}
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                      Unit Price:{" "}
                                      <span className="font-bold text-foreground">
                                        {formatMoney(
                                          item.product?.price ?? item.price ?? 0,
                                        )}
                                      </span>
                                    </p>
                                  </div>
                                  <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${stockState.className}`}
                                  >
                                    {stockState.label}
                                  </span>
                                </div>
                              </div>

                              <div className="mt-5 grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
                                <div className="rounded-xl border border-border bg-secondary/10 px-3 py-2.5">
                                  <p className="text-muted-foreground font-medium">
                                    Quantity
                                  </p>
                                  <p className="text-base font-bold text-foreground mt-0.5">
                                    {orderedQty}
                                  </p>
                                </div>
                                <div className="rounded-xl border border-border bg-secondary/10 px-3 py-2.5">
                                  <p className="text-muted-foreground font-medium">
                                    In Stock
                                  </p>
                                  <p className="text-base font-bold text-foreground mt-0.5">
                                    {availableStock === null
                                      ? "-"
                                      : availableStock}
                                  </p>
                                </div>
                                <div className="rounded-xl border border-border bg-primary/5 px-3 py-2.5 border-primary/10">
                                  <p className="text-primary font-medium">
                                    Line Total
                                  </p>
                                  <p className="text-base font-bold text-primary mt-0.5">
                                    {formatMoney(
                                      (item.product?.price ?? item.price ?? 0) *
                                        orderedQty,
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  <div className="mt-6 border-t border-border pt-5 flex justify-end">
                    <div className="w-full sm:w-64 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-bold">
                          {formatMoney(
                            orderItems.reduce(
                              (acc, item) =>
                                acc +
                                (item.product?.price ?? item.price ?? 0) *
                                  Math.max(1, Number(item.quantity || 1)),
                              0,
                            ),
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Platform Fee</span>
                        <span className="font-bold text-primary">₹29</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Delivery Fee</span>
                        <span className="font-bold text-primary">₹40</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t border-border pt-2 mt-2">
                        <span>Total</span>
                        <span className="text-primary">{formatMoney(order.totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 2. Order Invoice (Overview + Addresses) second */}
                <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-5 border-b border-border pb-6">
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                        Order Invoice
                      </p>
                      <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                        #{order.id.slice(-12).toUpperCase()}
                      </h2>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <CalendarClock className="h-3.5 w-3.5" />
                          {formatDate(order.createdAt)}
                        </div>
                        <span className="h-3.5 w-px bg-border hidden sm:block" />
                        <div className="flex items-center gap-1.5">
                          <Package className="h-3.5 w-3.5" />
                          {orderItems.length} item{orderItems.length === 1 ? "" : "s"}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-start sm:items-end gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold shadow-sm ${getOrderStatusTone(order.status)}`}
                      >
                        {orderStatusLabel}
                      </span>
                      <p className="text-2xl font-bold text-foreground">
                        {formatMoney(order.totalAmount)}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-medium">
                        Inc. ₹29 Platform & ₹40 Delivery Fees
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div className="space-y-3">
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-1.5">
                        Bill To
                      </h3>
                      <div className="space-y-2">
                        <DetailField
                          icon={User}
                          label="Customer Name"
                          lines={[customerName || "Unknown customer"]}
                        />
                        <DetailField
                          icon={Mail}
                          label="Email Address"
                          lines={[customerEmail || "-"]}
                        />
                        <DetailField
                          icon={Phone}
                          label="Phone Number"
                          lines={[customerPhone || "-"]}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-1.5">
                        Ship To
                      </h3>
                      <div className="space-y-2">
                        {showShippingRecipient ? (
                          <DetailField
                            icon={User}
                            label="Recipient"
                            lines={[shippingRecipient]}
                          />
                        ) : null}
                        <DetailField
                          icon={MapPin}
                          label="Shipping Address"
                          lines={[
                            `${order.shippingAddressLine1 || "-"}${
                              order.shippingAddressLine2
                                ? `, ${order.shippingAddressLine2}`
                                : ""
                            }`,
                            `${order.shippingCity || "-"}, ${order.shippingState || "-"} ${order.shippingPostalCode || "-"}`,
                          ]}
                        />
                        {shippingContactLines.length > 0 ? (
                          <DetailField
                            icon={Phone}
                            label="Shipping Contact"
                            lines={shippingContactLines}
                          />
                        ) : null}
                      </div>
                    </div>
                  </div>
                </section>

                {/* 3. Order Timeline third */}
                <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-foreground border-b border-border pb-3 mb-5">
                    Order Timeline
                  </h2>
                  <div className="space-y-3">
                    {timelineEvents.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No events available.
                      </p>
                    ) : (
                      timelineEvents.map((event, idx) => (
                        <div
                          key={event.id || `${order.id}-event-${idx}`}
                          className="relative rounded-xl border border-border bg-secondary/5 p-4 pl-12 shadow-sm"
                        >
                          {idx !== timelineEvents.length - 1 ? (
                            <div className="absolute bottom-0 left-5 top-8 w-px bg-border" />
                          ) : null}
                          <div className="absolute left-3.5 top-5 h-3 w-3 rounded-full bg-primary ring-6 ring-primary/10 shadow-sm" />
                          <p className="text-base font-bold text-foreground">
                            {(
                              event.status ||
                              order.status ||
                              "PENDING"
                            ).replace(/_/g, " ")}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1.5">
                            {event.note || "No event note"}
                          </p>
                          <div className="flex items-center gap-1.5 mt-2.5 text-xs text-muted-foreground">
                            <CalendarClock className="h-3.5 w-3.5" />
                            {formatDate(event.createdAt)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>

              {/* Action Panel alongside items on PC */}
              <aside className="xl:sticky xl:top-24 space-y-5">
                {normalizedStatus === "DELIVERED" && (
                  <section className="rounded-3xl border border-emerald-100 bg-emerald-50/50 p-8 shadow-xl shadow-emerald-100/30 border-t-8 border-t-emerald-500 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-4 ring-white">
                        <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                      </div>
                      <h2 className="text-2xl font-black text-emerald-900 uppercase tracking-tight mb-2">Order Delivered</h2>
                      <p className="text-sm text-emerald-700 font-bold leading-relaxed px-4">
                        This order has been successfully completed and received by the customer.
                      </p>
                      
                      <div className="mt-8 pt-8 border-t border-emerald-100 flex flex-col gap-3">
                         <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-emerald-600/60 px-2">
                            <span>Service Link</span>
                            <span>Secure</span>
                         </div>
                         <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                               <ShieldCheck size={18} />
                            </div>
                            <p className="text-xs font-black text-slate-900 text-left">Verified via Secure OTP Handover</p>
                         </div>
                      </div>
                    </div>
                  </section>
                )}

                {currentHandoverOtp && !isPickedUp && normalizedStatus !== "DELIVERED" && (
                  <section className="rounded-2xl border border-blue-100 bg-blue-50/50 p-6 shadow-xl shadow-blue-100/30 border-t-4 border-t-blue-600 animate-in fade-in zoom-in duration-500">
                    <div className="text-center">
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-4">Handover Security OTP</p>
                      <div className="flex justify-center gap-3 mb-4">
                        {currentHandoverOtp.split("").map((digit: string, idx: number) => (
                          <div key={idx} className="w-12 h-14 bg-white border-2 border-blue-200 rounded-xl flex items-center justify-center text-2xl font-black text-blue-700 shadow-sm">
                            {digit}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-blue-700 font-bold leading-relaxed px-4">Share this code with the partner to verify handover.</p>
                    </div>
                  </section>
                )}

                {(deliveryAgent || normalizedStatus === "READY_FOR_PICKUP" || normalizedStatus === "DELIVERED") && (
                  <section className="rounded-2xl border border-orange-100 bg-white p-5 shadow-xl shadow-orange-100/50 border-t-4 border-t-orange-600">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                        <Bike className="h-5 w-5 text-orange-600" />
                        Delivery Partner
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${isPickedUp || normalizedStatus === "DELIVERED" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : verdict === "ACCEPTED" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-orange-50 text-orange-600 border-orange-100"}`}>
                        {normalizedStatus === "DELIVERED" ? "Completed" : isPickedUp ? "Verified" : verdict === "ACCEPTED" ? "Assigned" : verdict === "PENDING" ? "Partner Found" : "Pending"}
                      </span>
                    </div>

                    {deliveryAgent && deliveryAgent.user ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-orange-50/50 rounded-2xl border border-orange-100/50">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg ${isPickedUp || normalizedStatus === "DELIVERED" || verdict === "ACCEPTED" ? "bg-emerald-600 shadow-emerald-200" : "bg-orange-600 shadow-orange-200"}`}>
                            {isPickedUp || normalizedStatus === "DELIVERED" || verdict === "ACCEPTED" ? <CheckCircle2 size={24} /> : <User size={24} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[10px] font-black uppercase tracking-widest ${isPickedUp || normalizedStatus === "DELIVERED" || verdict === "ACCEPTED" ? "text-emerald-600/70" : "text-orange-600/70"}`}>
                              {verdict === "ACCEPTED" ? "Partner Name" : "Status: Waiting for Acceptance"}
                            </p>
                            <p className="text-base font-black text-slate-900 truncate">
                              {deliveryAgent.user.name || "Unknown"}
                            </p>
                          </div>
                        </div>

                        {pickupEta && verdict === "ACCEPTED" && (
                          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                               <CalendarClock size={18} />
                            </div>
                            <p className="text-xs font-black text-indigo-700 uppercase tracking-tight">Pickup ETA: {pickupEta} Minutes</p>
                          </div>
                        )}

                        {(isPickedUp || normalizedStatus === "DELIVERED") && (
                          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                               <ShieldCheck size={18} />
                            </div>
                            <p className="text-xs font-black text-emerald-700 uppercase tracking-tight">Partner Verified with OTP</p>
                          </div>
                        )}

                        <div className="grid grid-cols-1 gap-3">
                          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 border border-slate-100 shrink-0 shadow-sm">
                              <Phone size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Direct Contact
                              </p>
                              <p className="text-sm font-black text-slate-900">
                                {deliveryAgent.user.phone || "-"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {normalizedStatus !== "DELIVERED" && !isPickedUp && deliveryAgent.user.phone && (
                          <button
                            type="button"
                            onClick={() =>
                              window.open(`tel:${deliveryAgent.user.phone}`)
                            }
                            className="w-full flex items-center justify-center gap-2 bg-slate-950 text-white px-5 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95"
                          >
                            <Phone size={16} className="fill-white" /> Call
                            Partner
                          </button>
                        )}
                      </div>
                    ) : normalizedStatus !== "DELIVERED" ? (
                      <div className="mt-5 flex flex-col items-center justify-center py-6 text-center text-muted-foreground bg-secondary/10 rounded-xl border border-dashed border-border">
                        <Loader2 className="h-5 w-5 animate-spin mb-2.5 text-primary" />
                        <p className="text-xs font-medium">
                          Fetching agent details...
                        </p>
                      </div>
                    ) : null}
                  </section>
                )}

                {normalizedStatus !== "DELIVERED" && !isPackedOrBeyond && (
                  <section className="rounded-2xl border border-border bg-card p-5 shadow-md border-t-4 border-t-primary">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-bold text-foreground">
                          Packing Control
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Confirm packing before dispatch.
                        </p>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
                        <Package className="h-5 w-5" />
                      </div>
                    </div>
                    <p className="mt-3.5 text-sm text-muted-foreground leading-relaxed">
                      Pack this order first. Dispatch becomes available only
                      after packing is confirmed.
                    </p>

                    {latestDeliveryUpdate ? (
                      <div className="mt-3.5 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5 text-xs text-primary font-medium">
                        <div className="flex items-center gap-1.5">
                          <BarChart2 className="h-3.5 w-3.5" />
                          {latestDeliveryUpdate}
                        </div>
                      </div>
                    ) : null}

                    <button
                      type="button"
                      className="mt-5 w-full inline-flex items-center justify-center gap-2.5 rounded-xl bg-primary px-5 py-3 text-base font-bold text-white hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={markOrderPacked}
                      disabled={!canPackOrder || isPacking}
                    >
                      {isPacking ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Packing...
                        </>
                      ) : (
                        <>
                          <Package className="h-4 w-4" />
                          Pack Order
                        </>
                      )}
                    </button>

                    {packMessage ? (
                      <div
                        className={`mt-3.5 rounded-lg px-3 py-2 text-xs font-medium ${
                          packStatus === "error"
                            ? "bg-red-50 text-red-700 border border-red-100"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        }`}
                      >
                        {packMessage}
                      </div>
                    ) : null}
                  </section>
                )}
                
                {normalizedStatus !== "DELIVERED" && isPackedOrBeyond && !isPickedUp && (
                  <section className="rounded-2xl border border-border bg-card p-5 shadow-md border-t-4 border-t-emerald-500">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-bold text-foreground">
                          Dispatch Readiness
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Packaging complete. Trigger delivery.
                        </p>
                      </div>
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-sm bg-emerald-100 text-emerald-600`}>
                        <Truck className="h-5 w-5" />
                      </div>
                    </div>

                    {latestDeliveryUpdate ? (
                      <div className="mt-3.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-700 font-medium">
                        <div className="flex items-center gap-1.5">
                          <BarChart2 className="h-3.5 w-3.5" />
                          {latestDeliveryUpdate}
                        </div>
                      </div>
                    ) : null}

                    <button
                      type="button"
                      className="mt-5 w-full inline-flex items-center justify-center gap-2.5 rounded-xl bg-emerald-600 px-5 py-3 text-base font-bold text-white hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={markReadyToDeliver}
                      disabled={!canMarkReady || isMarkingReady}
                    >
                      {isMarkingReady ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Assigning...
                        </>
                      ) : (
                        <>
                          <Truck className="h-4 w-4" />
                          Ready to Deliver
                        </>
                      )}
                    </button>

                    {actionMessage ? (
                      <div
                        className={`mt-3.5 rounded-lg px-3 py-2 text-xs font-medium ${
                          actionStatus === "error"
                            ? "bg-red-50 text-red-700 border border-red-100"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        }`}
                      >
                        {actionMessage}
                      </div>
                    ) : null}
                  </section>
                )}

                {isCancelled && (
                  <section className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-md border-t-4 border-t-red-500">
                    <div className="flex items-center gap-2 text-red-700 font-bold mb-2.5">
                      <X className="h-4 w-4" />
                      <span className="uppercase tracking-wider text-[10px]">Cancelled Verdict</span>
                    </div>
                    <p className="text-lg font-bold text-red-700">
                      Order Cancelled
                    </p>
                    <p className="text-sm text-red-700/90 mt-2.5 leading-relaxed">
                      Reason:{" "}
                      <span className="font-medium">
                        {order.events?.[0]?.note?.trim() ||
                          "Order was cancelled by the system or customer."}
                      </span>
                    </p>
                  </section>
                )}
              </aside>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
