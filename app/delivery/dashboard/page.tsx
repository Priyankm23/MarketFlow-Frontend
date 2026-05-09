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
  orderId?: string;
  order_id?: string;
  status?: string;
  totalAmount?: number | string;
  createdAt?: string;
  shippingFullName?: string;
  shippingEmail?: string;
  shippingPhoneNumber?: string;
  shippingAddressLine1?: string;
  shippingAddressLine2?: string | null;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  shippingLat?: number;
  shippingLng?: number;
  vendor?: {
    id?: string;
    businessName?: string;
    addressLine1?: string;
    addressLine2?: string | null;
    city?: string;
    state?: string;
    pincode?: string;
    lat?: number;
    lng?: number;
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
  pickupCoords: [number, number];
  dropCoords: [number, number];
};

type DashboardData = {
  earnings: {
    today: number;
    dailyTarget: number;
    weekToDate: number;
    growthPercentage: number;
  };
  performance: {
    ordersCompletedToday: number;
    averageRating: number;
    activeStreakDays: number;
  };
};

// --- HELPERS ---

const statusTone: Record<DeliveryTask["status"], string> = {
  assigned: "bg-orange-50 text-orange-700 border border-orange-100",
  picked_up: "bg-blue-50 text-blue-700 border border-blue-100",
  in_transit: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  packed: "bg-orange-50 text-orange-700 border border-orange-100",
  delivered: "bg-emerald-50 text-emerald-700 border border-emerald-100",
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
  if (normalized === "READY_FOR_PICKUP") return "picked_up";
  if (normalized === "PACKED") return "packed";
  return "assigned";
};

// --- SUB-COMPONENTS ---

function MapPreview({ 
  className, 
  pickup, 
  drop,
  pickupName,
  dropName
}: { 
  className?: string; 
  pickup: [number, number]; 
  drop: [number, number];
  pickupName: string;
  dropName: string;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const openGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${pickup[0]},${pickup[1]}&destination=${drop[0]},${drop[1]}&travelmode=driving`;
    window.open(url, '_blank');
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const loadLeaflet = () => {
      if ((window as any).L) {
        setMapLoaded(true);
        return;
      }

      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);

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

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      touchZoom: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false
    }).setView(pickup, 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

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

    L.marker(pickup, { icon: pickupIcon }).addTo(map);
    L.marker(drop, { icon: dropIcon }).addTo(map);

    const routePoints = [pickup, drop];
    const polyline = L.polyline(routePoints, {
      color: "#ea580c",
      weight: 4,
      dashArray: "8, 12",
      lineCap: "round",
      opacity: 0.6,
    }).addTo(map);

    map.fitBounds(polyline.getBounds(), { padding: [40, 40] });

    return () => {
      map.remove();
    };
  }, [mapLoaded, pickup, drop]);

  return (
    <div 
      onClick={openGoogleMaps}
      className={`relative bg-slate-100 rounded-3xl overflow-hidden border border-border group cursor-pointer active:scale-[0.99] transition-transform ${className}`}
    >
      <div ref={mapRef} className="w-full h-full z-0 grayscale-[0.5] contrast-[1.1]" />
      
      <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors pointer-events-none" />

      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        {!mapLoaded && (
          <div className="flex flex-col items-center gap-2 text-slate-400">
             <Loader2 size={24} className="animate-spin" />
             <p className="text-[10px] font-bold uppercase tracking-widest">Generating Preview</p>
          </div>
        )}
      </div>

      <div className="absolute top-4 left-4 z-10">
        <div className="bg-white/95 backdrop-blur-md shadow-xl rounded-2xl px-4 py-2 flex items-center gap-2 border border-white">
          <Navigation size={16} className="text-orange-600" />
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-800">
            Tap to Open Google Maps
          </span>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-10">
        <div className="bg-orange-600 text-white rounded-2xl px-5 py-2.5 shadow-xl text-[10px] font-black flex items-center gap-2 animate-bounce">
          <Route size={16} /> START NAVIGATION
        </div>
      </div>
    </div>
  );
}

export default function DeliveryDashboardPage() {
  const [assignedTasks, setAssignedTasks] = useState<DeliveryTask[]>([]);
  const [currentDeliveries, setCurrentDeliveries] = useState<DeliveryTask[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
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
  const [pickedUpById, setPickedUpById] = useState<Record<string, boolean>>({});
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});
  const [showOtpField, setShowOtpField] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const raw = window.localStorage.getItem("delivery_picked_up_orders");
    if (raw) setPickedUpById(JSON.parse(raw));
  }, []);

  const handleOtpVerification = async (taskId: string, orderId: string) => {
    const enteredOtp = (otpInputs[taskId] || "").trim();
    if (!enteredOtp) return;

    try {
      const response = await authFetch(`${DELIVERY_API_BASE_URL}/orders/${orderId}/pickup-otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: enteredOtp }),
        credentials: "include"
      });

      const payload = await response.json().catch(() => ({}));

      if (response.ok && payload.success) {
        const nextPickedUp = { ...pickedUpById, [taskId]: true };
        setPickedUpById(nextPickedUp);
        window.localStorage.setItem("delivery_picked_up_orders", JSON.stringify(nextPickedUp));
        setTaskMessageById(p => ({ ...p, [taskId]: { kind: "success", text: "Handover verified! You can now deliver the package." } }));
      } else {
        setTaskMessageById(p => ({ ...p, [taskId]: { kind: "error", text: payload.message || "Invalid OTP. Please check with the vendor." } }));
      }
    } catch (err) {
      setTaskMessageById(p => ({ ...p, [taskId]: { kind: "error", text: "Verification failed. Please try again." } }));
    }
  };

  const loadData = async () => {
    try {
      // Parallel fetch for assigned, current and dashboard stats
      const [assignedRes, currentRes, statsRes] = await Promise.all([
        authFetch(`${DELIVERY_API_BASE_URL}/tasks/assigned`, { credentials: "include" }),
        authFetch(`${DELIVERY_API_BASE_URL}/current`, { credentials: "include" }),
        authFetch(`${DELIVERY_API_BASE_URL}/dashboard`, { credentials: "include" })
      ]);

      // Handle stats response
      if (statsRes.ok) {
        const statsPayload = await statsRes.json();
        if (statsPayload?.success) {
          setDashboardData(statsPayload.data);
        }
      }

      // Handle assigned tasks
      if (assignedRes.ok) {
        const payload: AssignedTasksResponse = await assignedRes.json().catch(() => ({}));
        const apiTasks = Array.isArray(payload?.data) ? payload.data : [];
        setAssignedTasks(apiTasks.map((t, idx) => mapApiToDeliveryTask(t, idx)));
      }

      // Handle current deliveries
      if (currentRes.ok) {
        const payload: AssignedTasksResponse = await currentRes.json().catch(() => ({}));
        const apiTasks = Array.isArray(payload?.data) ? payload.data : [];
        setCurrentDeliveries(apiTasks.map((t, idx) => mapApiToDeliveryTask(t, idx)));
      }

      if (!assignedRes.ok && assignedRes.status === 404) {
        setProfileMissing(true);
        setError("Delivery profile not found.");
      }

      setLoading(false);
    } catch {
      setError("Unable to load data.");
      setLoading(false);
    }
  };

  const mapApiToDeliveryTask = (task: ApiAssignedTask, index: number): DeliveryTask => {
    const pickupAddress = toOneLineAddress([
      task.vendor?.addressLine1, task.vendor?.addressLine2, task.vendor?.city, task.vendor?.state, task.vendor?.pincode,
    ]);
    const deliveryAddress = toOneLineAddress([
      task.shippingAddressLine1, task.shippingAddressLine2, task.shippingCity, task.shippingState, task.shippingPostalCode,
    ]);
    const itemCount = (task.items || []).reduce((sum, item) => sum + Math.max(1, Number(item.quantity || 1)), 0);
    
    // Try to find a real order ID in the response, otherwise fallback to task ID
    const actualOrderId = task.orderId || task.order_id || task.id;

    return {
      id: task.id, 
      orderId: actualOrderId, 
      vendorName: task.vendor?.businessName || "Vendor", 
      pickupAddress, 
      deliveryAddress, 
      customerName: task.shippingFullName || task.user?.name || "Customer", 
      customerPhone: task.shippingPhoneNumber || (task.user?.phone ? String(task.user.phone) : "-"), 
      status: mapTaskStatus(task.status), 
      amount: Number(task.totalAmount || 0), 
      distanceKm: 1.5 + index * 0.9, 
      createdAt: task.createdAt, 
      itemCount, 
      pickupCoords: [task.vendor?.lat || 21.1702, task.vendor?.lng || 72.8311], 
      dropCoords: [task.shippingLat || 21.1602, task.shippingLng || 72.8211]
    };
  };

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    const raw = window.localStorage.getItem("delivery_eta_tracking");
    if (!raw) return;
    const parsed = JSON.parse(raw);
    const acceptedIds = Object.keys(parsed);
    if (acceptedIds.length > 0) setAcceptedTaskIds(acceptedIds);
  }, []);

  useEffect(() => {
    if (acceptedTaskIds.length === 0) return;
    const tick = () => {
      const raw = window.localStorage.getItem("delivery_eta_tracking");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const now = Date.now();
      const next: Record<string, number> = {};
      for (const taskId of acceptedTaskIds) {
        const data = parsed[taskId];
        if (!data) continue;
        next[taskId] = Math.max(0, data.acceptedAt + data.etaMinutes * 60 * 1000 - now);
      }
      setCountdownById(next);
    };
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [acceptedTaskIds]);

  const handleAssignmentResponse = async (task: DeliveryTask, accept: boolean) => {
    if (respondingTaskId) return;
    setRespondingTaskId(task.id);
    try {
      const response = await authFetch(`${DELIVERY_API_BASE_URL}/orders/${task.orderId}/respond`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: task.orderId, accept }), credentials: "include"
      });
      const payload: AssignmentRespondResponse = await response.json().catch(() => ({}));
      if (!response.ok || payload?.success === false) {
        setTaskMessageById(p => ({ ...p, [task.id]: { kind: "error", text: payload?.message || "Response failed." } }));
        return;
      }
      if (accept) {
        const eta = payload.pickupEtaMinutes || 20;
        const current = JSON.parse(window.localStorage.getItem("delivery_eta_tracking") || "{}");
        current[task.id] = { acceptedAt: Date.now(), etaMinutes: eta };
        window.localStorage.setItem("delivery_eta_tracking", JSON.stringify(current));
        setAcceptedTaskIds(p => Array.from(new Set([...p, task.id])));
        
        // Move from assigned to current locally for instant feedback
        setAssignedTasks(p => p.filter(item => item.id !== task.id));
        setCurrentDeliveries(p => [{ ...task, status: payload.stage === "LAST_MILE" ? "in_transit" : "picked_up" }, ...p]);
        
        // Refresh data to ensure all partner links are established
        void loadData();
      } else {
        setAssignedTasks(p => p.filter(item => item.id !== task.id));
      }
    } finally { setRespondingTaskId(null); }
  };

  const markDeliveryCompleted = async (task: DeliveryTask) => {
    if (completingTaskId) return;
    setCompletingTaskId(task.id);
    try {
      const response = await authFetch(`${DELIVERY_API_BASE_URL}/orders/${task.orderId}/complete`, {
        method: "POST", credentials: "include"
      });
      if (response.ok) {
        setCurrentDeliveries(p => p.filter(item => item.id !== task.id));
        setAcceptedTaskIds(p => p.filter(id => id !== task.id));
        const current = JSON.parse(window.localStorage.getItem("delivery_eta_tracking") || "{}");
        delete current[task.id];
        window.localStorage.setItem("delivery_eta_tracking", JSON.stringify(current));
        
        const nextPickedUp = { ...pickedUpById };
        delete nextPickedUp[task.id];
        setPickedUpById(nextPickedUp);
        window.localStorage.setItem("delivery_picked_up_orders", JSON.stringify(nextPickedUp));
      }
    } finally { setCompletingTaskId(null); }
  };

  const formatCountdown = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  };

  const activeTask = currentDeliveries[0] || assignedTasks[0];
  const isJustAssigned = !currentDeliveries.find(t => t.id === activeTask?.id);

  return (
    <div className="min-h-screen bg-slate-50 font-body pb-24 md:pb-8" style={{ fontFamily: "var(--font-dm-sans)" }}>
      <DeliveryHeader title="Active Workspace" subtitle="Deliveries & performance tracking." />

      <div className="mx-auto max-w-2xl px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* COMPACT LIGHT-THEMED SUMMARY CARD */}
        <section className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-xl shadow-slate-200 border border-slate-100 text-slate-900 relative overflow-hidden group">
          {/* Light architectural orange corner */}
          <div className="absolute right-0 top-0 w-32 h-32 bg-orange-50 rounded-bl-[6rem] z-0 border-l border-b border-orange-100/50" />
          
          <div className="absolute right-6 top-6 z-20">
             <div className="h-10 w-10 rounded-xl bg-orange-100/50 flex items-center justify-center">
                <Zap size={20} className="text-orange-600 fill-orange-600/10" />
             </div>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-orange-600/60">Live Performance</p>
            </div>
            
            <div className="flex items-center gap-6">
               <div className="flex items-baseline gap-2">
                 <span className="text-6xl sm:text-7xl font-black tracking-tighter text-slate-950">
                   ₹{dashboardData?.earnings.today ?? 0}
                 </span>
                 <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Earned</p>
               </div>

               <div className="h-10 w-px bg-slate-100" />

               <div className="flex items-baseline gap-2">
                 <span className="text-6xl sm:text-7xl font-black tracking-tighter text-orange-600">
                   {dashboardData?.performance.ordersCompletedToday ?? 0}
                 </span>
                 <div className="flex flex-col -space-y-0.5">
                    <p className="text-xs font-black uppercase tracking-tight text-slate-900">Orders</p>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Done</p>
                 </div>
               </div>
            </div>

            <div className="mt-8 flex items-center gap-4">
               <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between px-1">
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Daily Target</p>
                     <p className="text-[10px] font-black text-orange-600">
                        {dashboardData ? Math.round((dashboardData.earnings.today / (dashboardData.earnings.dailyTarget || 1)) * 100) : 0}%
                     </p>
                  </div>
                  <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                     <div 
                        className="h-full bg-orange-500 transition-all duration-1000" 
                        style={{ width: `${dashboardData ? Math.min(100, (dashboardData.earnings.today / (dashboardData.earnings.dailyTarget || 1)) * 100) : 0}%` }}
                     />
                  </div>
               </div>
               <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                  <TrendingUp size={12} className="text-emerald-600" />
                  <span className="text-[9px] font-black text-emerald-700">+{dashboardData?.earnings.growthPercentage ?? 0}%</span>
               </div>
            </div>
          </div>
        </section>

        {/* LOADING & ERROR STATES */}
        {loading && (
          <div className="flex flex-col items-center py-10 text-slate-400">
            <Loader2 className="animate-spin mb-3 text-orange-600" size={28} />
            <p className="text-[10px] font-bold uppercase tracking-widest">Scanning Assignments...</p>
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 flex items-start gap-3 sm:gap-4 text-rose-700 shadow-sm mx-1">
            <div className="bg-rose-100 p-2 rounded-xl shrink-0">
              <AlertCircle size={18} className="sm:scale-110" />
            </div>
            <div className="text-sm">
              <p className="font-black text-sm sm:text-base">Network Alert</p>
              <p className="mt-0.5 sm:mt-1 opacity-80 font-medium text-[11px] sm:text-sm">{error}</p>
              {profileMissing && (
                 <Link href="/delivery/tasks" className="mt-3 sm:mt-4 inline-flex items-center gap-2 rounded-xl bg-orange-600 px-3 sm:px-4 py-2 sm:py-2.5 text-[10px] sm:text-xs font-bold text-white hover:bg-orange-700 transition-colors shadow-lg shadow-orange-200">
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
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                {isJustAssigned ? "Assigned Task" : "Current Delivery"}
              </h2>
              <div className="flex items-center gap-1.5 bg-emerald-50 px-2 sm:px-3 py-1 rounded-full border border-emerald-100 shadow-sm">
                <div className="h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] sm:text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                  {isJustAssigned ? "Awaiting Decision" : "Live Link"}
                </span>
              </div>
            </div>

            <MapPreview 
              className="h-64 sm:h-80 shadow-2xl shadow-slate-200 ring-2 sm:ring-4 ring-white" 
              pickup={activeTask.pickupCoords}
              drop={activeTask.dropCoords}
              pickupName={activeTask.vendorName}
              dropName={activeTask.customerName}
            />

            <div className="bg-white rounded-3xl sm:rounded-[2.5rem] border border-border shadow-xl overflow-hidden group mx-0.5">
              <div className="p-5 sm:p-8">
                <div className="flex items-start justify-between mb-6 sm:mb-8">
                  <div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                       <ShoppingBag size={12} className="text-orange-600 sm:scale-110" />
                       <p className="text-[9px] sm:text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.15em] sm:tracking-[0.2em]">Package ID</p>
                    </div>
                    <p className="text-base sm:text-lg font-black text-slate-950 mt-0.5 tracking-tight">#{activeTask.orderId.slice(-8).toUpperCase()}</p>
                  </div>
                  <div className={`px-3 sm:px-5 py-1 sm:py-2 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest shadow-sm ${statusTone[activeTask.status]}`}>
                    {statusLabel[activeTask.status]}
                  </div>
                </div>

                <div className="space-y-6 sm:space-y-8">
                  {/* TIMELINE STYLE ADDRESSES */}
                  <div className="relative pl-8 sm:pl-10 space-y-8 sm:space-y-10">
                    <div className="absolute left-3 sm:left-4 top-3 bottom-3 w-px border-l-2 border-dashed border-slate-100" />
                    
                    <div className="relative">
                      <div className="absolute -left-8 sm:-left-10 top-0.5 w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 z-10 shadow-sm">
                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-orange-600 shadow-[0_0_8px_rgba(234,88,12,0.5)]" />
                      </div>
                      <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] sm:tracking-[0.2em]">Store Pickup</p>
                      <p className="text-sm sm:text-base font-black text-slate-900 mt-0.5">{activeTask.vendorName}</p>
                      <p className="text-[11px] sm:text-xs text-slate-500 mt-1.5 leading-relaxed bg-slate-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 font-medium">{activeTask.pickupAddress}</p>
                    </div>

                    <div className="relative">
                      <div className="absolute -left-8 sm:-left-10 top-0.5 w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 z-10 shadow-sm">
                        <MapPin size={12} className="fill-rose-600 text-white stroke-[3] sm:scale-125" />
                      </div>
                      <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] sm:tracking-[0.2em]">Customer Drop</p>
                      <p className="text-sm sm:text-base font-black text-slate-900 mt-0.5">{activeTask.customerName}</p>
                      <p className="text-[11px] sm:text-xs text-slate-500 mt-1.5 leading-relaxed bg-slate-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 font-medium">{activeTask.deliveryAddress}</p>
                      
                      {!isJustAssigned && (
                        <div className="mt-4 sm:mt-6 flex items-center gap-3">
                          <button className="flex-1 flex items-center justify-center gap-2 sm:gap-3 bg-slate-950 text-white px-4 sm:px-5 py-3 sm:py-4 rounded-xl sm:rounded-[1.5rem] text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95">
                            <Phone size={14} className="fill-white sm:scale-110" /> Call Customer
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50/30 px-5 sm:px-8 py-5 sm:py-7 flex flex-col sm:flex-row gap-5 sm:items-center justify-between border-t border-orange-100/50">
                <div className="flex items-center gap-6 sm:gap-8 justify-between sm:justify-start">
                  <div className="flex items-center gap-6 sm:gap-8">
                    <div>
                      <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Payload</p>
                      <p className="text-xs sm:text-sm font-black text-slate-800 tracking-tight">{activeTask.itemCount} Units</p>
                    </div>
                    <div className="w-px h-8 sm:h-10 bg-orange-200/50" />
                    <div>
                      <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Earning</p>
                      <p className="text-xs sm:text-sm font-black text-orange-600 tracking-tight">₹{activeTask.amount}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-3 w-full sm:w-auto">
                  {isJustAssigned ? (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleAssignmentResponse(activeTask, false)}
                        disabled={!!respondingTaskId}
                        className="flex-1 sm:flex-none bg-white border border-rose-200 text-rose-600 px-4 sm:px-6 py-3.5 sm:py-4 rounded-xl sm:rounded-[1.75rem] text-[11px] sm:text-sm font-black uppercase tracking-widest hover:bg-rose-50 transition-all active:scale-95 disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button 
                        onClick={() => handleAssignmentResponse(activeTask, true)}
                        disabled={!!respondingTaskId}
                        className="flex-2 sm:flex-none bg-orange-600 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-[1.75rem] text-[11px] sm:text-sm font-black uppercase tracking-widest shadow-xl shadow-orange-200 hover:bg-orange-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {respondingTaskId ? <Loader2 size={16} className="animate-spin" /> : "Accept"}
                      </button>
                    </div>
                  ) : !pickedUpById[activeTask.id] ? (
                    <div className="space-y-3 w-full">
                      {!showOtpField[activeTask.id] ? (
                        <button 
                          onClick={() => setShowOtpField(p => ({ ...p, [activeTask.id]: true }))}
                          className="w-full bg-orange-600 text-white px-6 py-3.5 sm:py-4 rounded-xl sm:rounded-[1.75rem] text-[11px] sm:text-sm font-black uppercase tracking-widest shadow-xl shadow-orange-200 hover:bg-orange-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                          Confirm Acceptance <ChevronRight size={16} />
                        </button>
                      ) : (
                        <div className="flex flex-col gap-2.5 animate-in fade-in slide-in-from-top-2">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Handover OTP</p>
                          <div className="flex gap-2">
                            <input 
                              type="text"
                              maxLength={4}
                              placeholder="0 0 0 0"
                              inputMode="numeric"
                              value={otpInputs[activeTask.id] || ""}
                              onChange={(e) => setOtpInputs(p => ({ ...p, [activeTask.id]: e.target.value.replace(/\D/g, "") }))}
                              className="flex-1 bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-center text-lg font-black tracking-[0.3em] focus:border-orange-500 outline-none transition-all"
                            />
                            <button 
                              onClick={() => handleOtpVerification(activeTask.id, activeTask.orderId)}
                              className="bg-slate-950 text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95"
                            >
                              Verify
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button 
                      onClick={() => markDeliveryCompleted(activeTask)}
                      disabled={!!completingTaskId}
                      className="w-full sm:w-auto bg-emerald-600 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-[1.75rem] text-[11px] sm:text-sm font-black uppercase tracking-widest shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {completingTaskId ? <Loader2 size={16} className="animate-spin" /> : <>Delivered <CheckCircle2 size={16} /></>}
                    </button>
                  )}
                </div>
              </div>

              {acceptedTaskIds.includes(activeTask.id) && !pickedUpById[activeTask.id] && (
                <div className="px-5 sm:px-8 py-4 sm:py-5 bg-orange-600 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Clock3 size={16} className="animate-pulse sm:scale-110" />
                    <span className="text-[9px] sm:text-xs font-black uppercase tracking-[0.1em] sm:tracking-[0.2em]">Est. Time Arrival</span>
                  </div>
                  <span className="text-xl sm:text-2xl font-mono font-black tracking-tighter">
                    {formatCountdown(countdownById[activeTask.id] || 0)}
                  </span>
                </div>
              )}
            </div>

            {taskMessageById[activeTask.id] && (
              <div className={`p-4 sm:p-5 rounded-2xl sm:rounded-[1.5rem] text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-center border-2 animate-in fade-in zoom-in ${
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
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Assignment Queue</h2>
            <span className="bg-slate-200 text-slate-600 px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
              {assignedTasks.filter(t => t.id !== activeTask?.id).length} Orders
            </span>
          </div>
          {assignedTasks.filter(t => t.id !== activeTask?.id).length === 0 && (
            <div className="bg-white rounded-3xl sm:rounded-[2.5rem] p-10 sm:p-12 text-center border border-dashed border-slate-200 shadow-sm mx-0.5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-2xl sm:rounded-[2rem] flex items-center justify-center mx-auto mb-4 sm:mb-6 border border-slate-100 shadow-inner">
                <CheckCircle2 size={32} className="text-slate-200 sm:scale-125" />
              </div>
              <p className="text-sm sm:text-base font-black text-slate-900">Queue is Clear</p>
              <p className="text-[10px] sm:text-xs text-slate-400 mt-1.5 sm:mt-2 max-w-[200px] sm:max-w-[220px] mx-auto font-medium leading-relaxed italic text-center">New orders will appear here automatically.</p>
            </div>
          )}
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            {assignedTasks.filter(t => t.id !== activeTask?.id).map(task => (
              <div key={task.id} className="bg-white rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 border border-border shadow-sm flex flex-col gap-3 sm:gap-4 hover:shadow-md transition-all border-l-4 border-l-orange-500 mx-0.5">
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-[1.25rem] bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                    <ShoppingBag size={24} className="sm:scale-125" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs sm:text-sm font-black text-slate-950 truncate tracking-tight">{task.vendorName}</p>
                      <p className="text-[10px] sm:text-xs font-black text-orange-600 tracking-tighter bg-orange-50 px-2 py-0.5 rounded-lg">₹{task.amount}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <MapPin size={10} className="sm:scale-110" />
                      <p className="text-[9px] sm:text-[11px] font-bold truncate uppercase tracking-tight">{task.deliveryAddress}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <button 
                    onClick={() => handleAssignmentResponse(task, false)}
                    disabled={!!respondingTaskId}
                    className="flex-1 bg-white border border-rose-200 text-rose-600 px-3 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 transition-all active:scale-95 disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button 
                    onClick={() => handleAssignmentResponse(task, true)}
                    disabled={!!respondingTaskId}
                    className="flex-1 bg-orange-600 text-white px-3 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-100 hover:bg-orange-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {respondingTaskId === task.id ? <Loader2 size={12} className="animate-spin" /> : "Accept"}
                  </button>
                </div>

                {taskMessageById[task.id] && (
                  <div className={`p-2.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-center border ${
                    taskMessageById[task.id].kind === "error" ? "bg-rose-50 border-rose-100 text-rose-700" : "bg-emerald-50 border-emerald-100 text-emerald-700"
                  }`}>
                    {taskMessageById[task.id].text}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* PERFORMANCE TIPS */}
        {!loading && (
          <section className="bg-orange-600 rounded-[1.75rem] sm:rounded-[2.5rem] p-6 sm:p-8 text-white shadow-xl shadow-orange-100 relative overflow-hidden mx-0.5">
             <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full blur-2xl" />
             <div className="relative z-10 flex items-start gap-4 sm:gap-5">
                <div className="bg-white/20 p-2 sm:p-3 rounded-xl sm:rounded-2xl"><Target size={20} className="text-white sm:scale-125" /></div>
                <div>
                   <p className="text-[9px] sm:text-xs font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-orange-200 mb-0.5 sm:mb-1">Partner Mastery</p>
                   <p className="text-xs sm:text-sm font-bold leading-relaxed">Completing more orders today will unlock premium "Fast-Track" status for tomorrow.</p>
                </div>
             </div>
          </section>
        )}
      </div>

    </div>
  );
}
