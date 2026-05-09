"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { authFetch } from "@/lib/auth-fetch";
import { DeliveryHeader } from "@/components/delivery-header";
import { 
  Bike, 
  Clock3, 
  Loader2, 
  MapPin, 
  Phone, 
  Route, 
  TrendingUp, 
  Wallet, 
  Star, 
  Navigation,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
  ShoppingBag,
  User,
  MoreVertical,
  X,
  Target,
  Zap
} from "lucide-react";
import { API_BASE_URL } from "@/lib/config";

const DELIVERY_API_BASE_URL = `${API_BASE_URL}/delivery`;

// --- TYPES ---

type ApiAssignedTask = {
  id: string;
  status?: string;
  totalAmount?: number;
  createdAt?: string;
  shippingAddressLine1?: string;
  shippingAddressLine2?: string | null;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  vendor?: {
    id?: string;
    businessName?: string;
    addressLine1?: string;
    addressLine2?: string | null;
    city?: string;
    state?: string;
    pincode?: string;
  };
  user?: {
    id?: string;
    name?: string;
    phone?: string | number | null;
  };
  items?: Array<{
    id?: string;
    quantity?: number;
    product?: {
      name?: string;
      imageUrl?: string | null;
    };
  }>;
};

type AssignedTasksResponse = {
  success?: boolean;
  message?: string;
  data?: ApiAssignedTask[];
};

type AssignmentRespondResponse = {
  success?: boolean;
  message?: string;
  pickupEtaMinutes?: number;
  stage?: string;
  reassigned?: unknown;
};

type DeliveryTask = {
  id: string;
  orderId: string;
  vendorName: string;
  pickupAddress: string;
  deliveryAddress: string;
  customerName: string;
  customerPhone: string;
  status: "assigned" | "picked_up" | "in_transit" | "packed" | "delivered";
  amount: number;
  distanceKm: number;
  createdAt?: string;
  itemCount: number;
};

// --- MOCK DATA ---
const MOCK_EARNINGS = {
  today: 840,
  target: 1200,
  week: 5200,
  ordersCompleted: 12,
  rating: 4.8
};

// --- HELPERS ---

const statusTone: Record<DeliveryTask["status"], string> = {
  assigned: "bg-orange-100 text-orange-700",
  picked_up: "bg-blue-100 text-blue-700",
  in_transit: "bg-emerald-100 text-emerald-700",
  packed: "bg-orange-100 text-orange-700",
  delivered: "bg-emerald-100 text-emerald-700",
};

const statusLabel: Record<DeliveryTask["status"], string> = {
  assigned: "Assigned",
  picked_up: "Picked Up",
  in_transit: "In Transit",
  packed: "Packed",
  delivered: "Delivered",
};

const toOneLineAddress = (parts: Array<string | null | undefined>) => {
  return parts
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(", ");
};

const mapTaskStatus = (status?: string): DeliveryTask["status"] => {
  const normalized = (status || "").toUpperCase();
  if (normalized === "DELIVERED") return "delivered";
  if (normalized === "IN_TRANSIT") return "in_transit";
  if (normalized === "PICKED_UP") return "picked_up";
  if (normalized === "PACKED") return "packed";
  return "assigned";
};

// --- SUB-COMPONENTS ---

/**
 * LEAFLET MAP COMPONENT
 * Dynamically loads Leaflet from CDN to show a real map.
 */
function LeafletMap({ className }: { className?: string }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    // Only load if not already present
    if (typeof window === "undefined") return;
    
    const loadLeaflet = () => {
      if ((window as any).L) {
        setMapLoaded(true);
        return;
      }

      // Add CSS
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);

      // Add JS
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
    };

    loadLeaflet();
  }, []);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    // Initialize map
    // Using a default coordinate (Surat, Gujarat center for context)
    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([21.1702, 72.8311], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

    // Mock markers
    const pickupIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: #ea580c; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(234,88,12,0.5)"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    });

    const dropIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: #ef4444; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(239,68,68,0.5)"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    });

    L.marker([21.175, 72.835], { icon: pickupIcon }).addTo(map);
    L.marker([21.165, 72.825], { icon: dropIcon }).addTo(map);

    // DRAW PATH
    const routePoints = [
      [21.175, 72.835], // Pickup
      [21.172, 72.830], // Mid-point
      [21.168, 72.828], // Mid-point
      [21.165, 72.825], // Drop-off
    ];

    const polyline = L.polyline(routePoints, {
      color: "#ea580c",
      weight: 4,
      dashArray: "8, 12",
      lineCap: "round",
      opacity: 0.8,
    }).addTo(map);

    // Optional: Zoom to fit both markers
    map.fitBounds(polyline.getBounds(), { padding: [50, 50] });

    return () => {
      map.remove();
    };
  }, [mapLoaded]);

  return (
    <div className={`relative bg-slate-100 rounded-3xl overflow-hidden border border-border group ${className}`}>
      <div ref={mapRef} className="w-full h-full z-0" />
      
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        {!mapLoaded && (
          <div className="flex flex-col items-center gap-2 text-slate-400">
             <Loader2 size={24} className="animate-spin" />
             <p className="text-[10px] font-bold uppercase tracking-widest">Loading Live Map</p>
          </div>
        )}
      </div>

      {/* OVERLAYS */}
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-white/95 backdrop-blur-md shadow-xl rounded-2xl px-4 py-2 flex items-center gap-2 border border-white">
          <Navigation size={16} className="text-orange-600 animate-pulse" />
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-800">
            Real-time Navigation
          </span>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-10">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl px-4 py-2 shadow-lg border border-white text-[10px] font-black text-orange-700 flex items-center gap-2">
          <Route size={14} /> 2.4 KM LEFT
        </div>
        <div className="bg-orange-600 text-white rounded-2xl px-4 py-2 shadow-xl text-[10px] font-black flex items-center gap-2">
          <Clock3 size={14} /> 8 MINS
        </div>
      </div>
    </div>
  );
}

export default function DeliveryDashboardPage() {
  const [tasks, setTasks] = useState<DeliveryTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profileMissing, setProfileMissing] = useState(false);
  const [taskMessageById, setTaskMessageById] = useState<
    Record<string, { kind: "success" | "error"; text: string }>
  >({});
  const [respondingTaskId, setRespondingTaskId] = useState<string | null>(null);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [acceptedTaskIds, setAcceptedTaskIds] = useState<string[]>([]);
  const [countdownById, setCountdownById] = useState<Record<string, number>>(
    {},
  );

  useEffect(() => {
    let active = true;

    const loadTasks = async () => {
      try {
        const response = await authFetch(
          `${DELIVERY_API_BASE_URL}/tasks/assigned`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        if (!active) return;

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          const message = payload?.message || "Unable to load assigned tasks.";

          if (response.status === 404) {
            setProfileMissing(true);
            setError(
              "Delivery profile not found. Please complete coverage setup.",
            );
            setLoading(false);
            return;
          }

          setError(message);
          setLoading(false);
          return;
        }

        const payload: AssignedTasksResponse = await response
          .json()
          .catch(() => ({}));

        const apiTasks = Array.isArray(payload?.data) ? payload.data : [];

        const mappedTasks: DeliveryTask[] = apiTasks.map((task, index) => {
          const pickupAddress = toOneLineAddress([
            task.vendor?.addressLine1,
            task.vendor?.addressLine2,
            task.vendor?.city,
            task.vendor?.state,
            task.vendor?.pincode,
          ]);

          const deliveryAddress = toOneLineAddress([
            task.shippingAddressLine1,
            task.shippingAddressLine2,
            task.shippingCity,
            task.shippingState,
            task.shippingPostalCode,
          ]);

          const itemCount = (task.items || []).reduce(
            (sum, item) => sum + Math.max(1, Number(item.quantity || 1)),
            0,
          );

          return {
            id: task.id,
            orderId: task.id,
            vendorName: task.vendor?.businessName || "Vendor",
            pickupAddress: pickupAddress || "Pickup address not available",
            deliveryAddress:
              deliveryAddress || "Delivery address not available",
            customerName: task.user?.name || "Customer",
            customerPhone: task.user?.phone ? String(task.user.phone) : "-",
            status: mapTaskStatus(task.status),
            amount: Number(task.totalAmount || 0),
            distanceKm: 1.5 + index * 0.9,
            createdAt: task.createdAt,
            itemCount,
          };
        });

        setTasks(mappedTasks);
        setLoading(false);
      } catch {
        if (!active) return;
        setError("Unable to load assigned tasks.");
        setLoading(false);
      }
    };

    void loadTasks();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const raw = window.localStorage.getItem("delivery_eta_tracking");
    if (!raw) return;

    const parsed = JSON.parse(raw) as Record<
      string,
      { acceptedAt: number; etaMinutes: number }
    >;
    const acceptedIds = Object.keys(parsed);
    if (acceptedIds.length === 0) return;

    setAcceptedTaskIds((prev) =>
      Array.from(new Set([...prev, ...acceptedIds])),
    );
  }, []);

  useEffect(() => {
    if (acceptedTaskIds.length === 0) return;

    const tick = () => {
      const raw = window.localStorage.getItem("delivery_eta_tracking");
      if (!raw) return;

      const parsed = JSON.parse(raw) as Record<
        string,
        { acceptedAt: number; etaMinutes: number }
      >;

      const now = Date.now();
      const next: Record<string, number> = {};

      for (const taskId of acceptedTaskIds) {
        const data = parsed[taskId];
        if (!data) continue;
        const etaMs = data.etaMinutes * 60 * 1000;
        next[taskId] = Math.max(0, data.acceptedAt + etaMs - now);
      }

      setCountdownById(next);
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [acceptedTaskIds]);

  const setTaskMessage = (
    taskId: string,
    kind: "success" | "error",
    text: string,
  ) => {
    setTaskMessageById((prev) => ({ ...prev, [taskId]: { kind, text } }));
  };

  const persistEta = (taskId: string, etaMinutes: number) => {
    const raw = window.localStorage.getItem("delivery_eta_tracking");
    const current = raw
      ? (JSON.parse(raw) as Record<
          string,
          { acceptedAt: number; etaMinutes: number }
        >)
      : {};

    current[taskId] = {
      acceptedAt: Date.now(),
      etaMinutes,
    };

    window.localStorage.setItem(
      "delivery_eta_tracking",
      JSON.stringify(current),
    );
  };

  const handleAssignmentResponse = async (
    task: DeliveryTask,
    accept: boolean,
  ) => {
    if (respondingTaskId) return;

    setRespondingTaskId(task.id);

    try {
      const response = await authFetch(
        `${DELIVERY_API_BASE_URL}/orders/${task.orderId}/respond`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId: task.orderId,
            accept,
          }),
        },
      );

      const payload: AssignmentRespondResponse = await response
        .json()
        .catch(() => ({}));

      if (!response.ok || payload?.success === false) {
        setTaskMessage(
          task.id,
          "error",
          payload?.message || "Unable to submit response.",
        );
        return;
      }

      setTaskMessage(
        task.id,
        "success",
        payload?.message || "Response recorded.",
      );

      if (accept) {
        const eta =
          typeof payload.pickupEtaMinutes === "number" &&
          payload.pickupEtaMinutes > 0
            ? payload.pickupEtaMinutes
            : 20;

        persistEta(task.id, eta);
        setAcceptedTaskIds((prev) => Array.from(new Set([...prev, task.id])));

        setTasks((prev) =>
          prev.map((item) =>
            item.id === task.id
              ? {
                  ...item,
                  status:
                    payload.stage === "LAST_MILE" ? "in_transit" : "picked_up",
                }
              : item,
          ),
        );
      } else {
        setTasks((prev) => prev.filter((item) => item.id !== task.id));
      }
    } catch {
      setTaskMessage(task.id, "error", "Unable to submit response.");
    } finally {
      setRespondingTaskId(null);
    }
  };

  const markDeliveryCompleted = async (task: DeliveryTask) => {
    if (completingTaskId) return;

    setCompletingTaskId(task.id);

    try {
      const response = await authFetch(
        `${API_BASE_URL}/orders/${task.orderId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "DELIVERED",
            note: "Delivered by delivery partner",
          }),
        },
      );

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setTaskMessage(
          task.id,
          "error",
          payload?.message || "Unable to complete delivery.",
        );
        return;
      }

      setTasks((prev) =>
        prev.map((item) =>
          item.id === task.id ? { ...item, status: "delivered" } : item,
        ),
      );
      setAcceptedTaskIds((prev) => prev.filter((taskId) => taskId !== task.id));

      const raw = window.localStorage.getItem("delivery_eta_tracking");
      if (raw) {
        const parsed = JSON.parse(raw) as Record<
          string,
          { acceptedAt: number; etaMinutes: number }
        >;
        delete parsed[task.id];
        window.localStorage.setItem(
          "delivery_eta_tracking",
          JSON.stringify(parsed),
        );
      }

      setTaskMessage(task.id, "success", "Delivery marked complete.");
    } catch {
      setTaskMessage(task.id, "error", "Unable to complete delivery.");
    } finally {
      setCompletingTaskId(null);
    }
  };

  const formatCountdown = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const activeTask = tasks.find(t => t.status !== 'delivered');

  return (
    <div className="min-h-screen bg-slate-50 font-body pb-24" style={{ fontFamily: "var(--font-dm-sans)" }}>
      <DeliveryHeader
        title="Active Workspace"
        subtitle="Live deliveries and daily performance."
      />

      <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        {/* PREMIUM EARNINGS CARD */}
        <section className="bg-slate-950 rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200 text-white relative overflow-hidden group">
          {/* Animated Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 to-transparent opacity-50" />
          <div className="absolute top-0 right-0 p-8">
             <div className="h-16 w-16 rounded-full bg-orange-600/10 border border-orange-500/20 flex items-center justify-center animate-pulse">
                <Zap size={32} className="text-orange-500 fill-orange-500/20" />
             </div>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-8">
              <span className="h-2 w-2 rounded-full bg-orange-500 animate-ping" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">Live Earnings Today</p>
            </div>
            
            <div className="flex items-end gap-3 mb-8">
              <span className="text-6xl font-black tracking-tighter">₹{MOCK_EARNINGS.today}</span>
              <div className="mb-2">
                 <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                    <TrendingUp size={14} /> +12%
                 </div>
              </div>
            </div>

            <div className="space-y-4">
               <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1 px-1">
                  <span>Daily Progress</span>
                  <span>{Math.round((MOCK_EARNINGS.today / MOCK_EARNINGS.target) * 100)}%</span>
               </div>
               <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800 shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-600 to-orange-400 transition-all duration-1000 rounded-full shadow-[0_0_15px_rgba(234,88,12,0.3)]" 
                    style={{ width: `${(MOCK_EARNINGS.today / MOCK_EARNINGS.target) * 100}%` }}
                  />
               </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-800 hover:border-orange-500/30 transition-all group/stat">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 group-hover/stat:text-orange-500 transition-colors">Orders</p>
                <p className="text-2xl font-black">{MOCK_EARNINGS.ordersCompleted}</p>
              </div>
              <div className="bg-slate-900/50 rounded-2xl p-4 border border-slate-800 hover:border-orange-500/30 transition-all group/stat">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 group-hover/stat:text-orange-500 transition-colors">Rating</p>
                <div className="flex items-center gap-2">
                   <p className="text-2xl font-black">{MOCK_EARNINGS.rating}</p>
                   <Star size={18} className="fill-orange-500 text-orange-500" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* LOADING & ERROR STATES */}
        {loading && (
          <div className="flex flex-col items-center py-12 text-slate-400">
            <Loader2 className="animate-spin mb-3 text-orange-600" size={32} />
            <p className="text-xs font-bold uppercase tracking-widest">Scanning for Assignments...</p>
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border border-rose-100 rounded-[2rem] p-6 flex items-start gap-4 text-rose-700 shadow-sm">
            <div className="bg-rose-100 p-2 rounded-xl">
              <AlertCircle size={20} className="shrink-0" />
            </div>
            <div className="text-sm">
              <p className="font-bold text-base">Network Alert</p>
              <p className="mt-1 opacity-80 font-medium">{error}</p>
              {profileMissing && (
                 <Link
                 href="/delivery/tasks"
                 className="mt-4 inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-orange-700 transition-colors shadow-lg shadow-orange-200"
               >
                 Set Coverage <ChevronRight size={14} />
               </Link>
              )}
            </div>
          </div>
        )}

        {/* LIVE TASK FOCUS */}
        {activeTask && (
          <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Active Delivery</h2>
              <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 shadow-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Connected</span>
              </div>
            </div>

            <LeafletMap className="h-80 shadow-2xl shadow-slate-200 ring-4 ring-white" />

            <div className="bg-white rounded-[2.5rem] border border-border shadow-xl overflow-hidden group">
              <div className="p-8">
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <div className="flex items-center gap-2">
                       <ShoppingBag size={14} className="text-orange-600" />
                       <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.2em]">Package ID</p>
                    </div>
                    <p className="text-lg font-black text-slate-950 mt-1 tracking-tight">#{activeTask.orderId.slice(-8).toUpperCase()}</p>
                  </div>
                  <div className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm ${statusTone[activeTask.status]}`}>
                    {statusLabel[activeTask.status]}
                  </div>
                </div>

                <div className="space-y-8">
                  {/* TIMELINE STYLE ADDRESSES */}
                  <div className="relative pl-10 space-y-10">
                    <div className="absolute left-4 top-3 bottom-3 w-px border-l-2 border-dashed border-slate-100" />
                    
                    <div className="relative">
                      <div className="absolute -left-10 top-0.5 w-8 h-8 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 z-10 shadow-sm">
                        <div className="w-2.5 h-2.5 rounded-full bg-orange-600 shadow-[0_0_8px_rgba(234,88,12,0.5)]" />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Store Pickup</p>
                      <p className="text-base font-black text-slate-900 mt-1">{activeTask.vendorName}</p>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 font-medium">{activeTask.pickupAddress}</p>
                    </div>

                    <div className="relative">
                      <div className="absolute -left-10 top-0.5 w-8 h-8 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 z-10 shadow-sm">
                        <MapPin size={16} className="fill-rose-600 text-white stroke-[3]" />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Customer Drop</p>
                      <p className="text-base font-black text-slate-900 mt-1">{activeTask.customerName}</p>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 font-medium">{activeTask.deliveryAddress}</p>
                      
                      <div className="mt-6 flex items-center gap-3">
                        <button className="flex-1 flex items-center justify-center gap-3 bg-slate-950 text-white px-5 py-4 rounded-[1.5rem] text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95">
                          <Phone size={16} className="fill-white" /> Call Customer
                        </button>
                        <button className="h-14 w-14 flex items-center justify-center bg-white border border-slate-200 rounded-[1.5rem] text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm">
                          <MoreVertical size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50/30 px-8 py-7 flex items-center justify-between border-t border-orange-100/50">
                <div className="flex items-center gap-8">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Payload</p>
                    <p className="text-sm font-black text-slate-800 tracking-tight">{activeTask.itemCount} Units</p>
                  </div>
                  <div className="w-px h-10 bg-orange-200/50" />
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Earning</p>
                    <p className="text-sm font-black text-orange-600 tracking-tight">₹{activeTask.amount}</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => {
                    if (activeTask.status === 'assigned') void handleAssignmentResponse(activeTask, true);
                    else void markDeliveryCompleted(activeTask);
                  }}
                  disabled={respondingTaskId === activeTask.id || completingTaskId === activeTask.id}
                  className="bg-orange-600 text-white px-8 py-4 rounded-[1.75rem] text-sm font-black uppercase tracking-widest shadow-xl shadow-orange-200 hover:bg-orange-700 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  {respondingTaskId === activeTask.id || completingTaskId === activeTask.id ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : activeTask.status === 'assigned' ? (
                    <>Accept <ChevronRight size={18} /></>
                  ) : (
                    <>Delivered <CheckCircle2 size={18} /></>
                  )}
                </button>
              </div>

              {acceptedTaskIds.includes(activeTask.id) && (
                <div className="px-8 py-5 bg-orange-600 text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock3 size={18} className="animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-[0.2em]">Est. Time Arrival</span>
                  </div>
                  <span className="text-2xl font-mono font-black tracking-tighter">
                    {formatCountdown(countdownById[activeTask.id] || 0)}
                  </span>
                </div>
              )}
            </div>

            {taskMessageById[activeTask.id] && (
              <div className={`p-5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest text-center border-2 animate-in fade-in zoom-in ${
                taskMessageById[activeTask.id].kind === "error" ? "bg-rose-50 border-rose-100 text-rose-700" : "bg-emerald-50 border-emerald-100 text-emerald-700"
              }`}>
                {taskMessageById[activeTask.id].text}
              </div>
            )}
          </section>
        )}

        {/* UPCOMING QUEUE */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Assignment Queue</h2>
            <span className="bg-slate-200 text-slate-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
              {tasks.filter(t => t.status === 'assigned' && t.id !== activeTask?.id).length} Orders
            </span>
          </div>

          {tasks.filter(t => t.status === 'assigned' && t.id !== activeTask?.id).length === 0 && (
            <div className="bg-white rounded-[2.5rem] p-12 text-center border border-dashed border-slate-200 shadow-sm">
              <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-slate-100 shadow-inner">
                <CheckCircle2 size={40} className="text-slate-200" />
              </div>
              <p className="text-base font-black text-slate-900">Queue is Clear</p>
              <p className="text-xs text-slate-400 mt-2 max-w-[220px] mx-auto font-medium leading-relaxed">System will notify you once a new order is matched with your location.</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {tasks.filter(t => t.status === 'assigned' && t.id !== activeTask?.id).map(task => (
              <div key={task.id} className="bg-white rounded-[2rem] p-6 border border-border shadow-sm flex items-center gap-6 hover:shadow-md transition-all group active:scale-[0.98] border-l-4 border-l-orange-500">
                <div className="w-16 h-16 rounded-[1.25rem] bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shrink-0 group-hover:bg-orange-100 transition-colors">
                  <ShoppingBag size={28} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-black text-slate-950 truncate tracking-tight">{task.vendorName}</p>
                    <p className="text-xs font-black text-orange-600 tracking-tighter bg-orange-50 px-2 py-0.5 rounded-lg">₹{task.amount}</p>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <MapPin size={12} className="text-slate-300" />
                    <p className="text-[11px] font-bold truncate uppercase tracking-tight">{task.deliveryAddress}</p>
                  </div>
                </div>
                <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-orange-600 group-hover:bg-orange-50 transition-all">
                   <ChevronRight size={20} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* PERFORMANCE TIPS */}
        {!loading && (
          <section className="bg-orange-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-orange-100 relative overflow-hidden">
             <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
             <div className="relative z-10 flex items-start gap-5">
                <div className="bg-white/20 p-3 rounded-2xl">
                   <Target size={24} className="text-white" />
                </div>
                <div>
                   <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-200 mb-1">Partner Mastery</p>
                   <p className="text-sm font-bold leading-relaxed">
                     Completing {Math.max(0, MOCK_EARNINGS.ordersCompleted - 8)} more orders before 9 PM will unlock the "Prime Partner" bonus for tomorrow.
                   </p>
                </div>
             </div>
          </section>
        )}
      </div>

      {/* STICKY BOTTOM NAV (MOBILE) */}
      <nav className="fixed bottom-0 inset-x-0 h-20 bg-white/90 backdrop-blur-2xl border-t border-slate-100 px-10 flex items-center justify-around z-50 md:hidden shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <button className="flex flex-col items-center gap-1.5 text-orange-600 relative group">
          <div className="absolute -top-1 w-1 h-1 rounded-full bg-orange-600" />
          <Bike size={24} className="stroke-[2.5]" />
          <span className="text-[10px] font-black uppercase tracking-tighter">Live</span>
        </button>
        <button className="flex flex-col items-center gap-1.5 text-slate-300 hover:text-orange-400 transition-all active:scale-90">
          <TrendingUp size={24} />
          <span className="text-[10px] font-black uppercase tracking-tighter">Earnings</span>
        </button>
        <button className="flex flex-col items-center gap-1.5 text-slate-300 hover:text-orange-400 transition-all active:scale-90">
          <User size={24} />
          <span className="text-[10px] font-black uppercase tracking-tighter">Profile</span>
        </button>
      </nav>
    </div>
  );
}
