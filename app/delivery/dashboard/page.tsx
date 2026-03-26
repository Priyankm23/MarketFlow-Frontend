"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { authFetch } from "@/lib/auth-fetch";
import { DeliveryHeader } from "@/components/delivery-header";
import { Bike, Clock3, Loader2, MapPin, Phone, Route } from "lucide-react";
import { API_BASE_URL } from "@/lib/config";

const DELIVERY_API_BASE_URL = `${API_BASE_URL}/delivery`;

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
  customerPhone: string;
  status: "assigned" | "picked_up" | "in_transit" | "packed" | "delivered";
  amount: number;
  distanceKm: number;
  createdAt?: string;
  itemCount: number;
};

const statusTone: Record<DeliveryTask["status"], string> = {
  assigned: "bg-indigo-100 text-indigo-700",
  picked_up: "bg-blue-100 text-blue-700",
  in_transit: "bg-emerald-100 text-emerald-700",
  packed: "bg-indigo-100 text-indigo-700",
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
            customerPhone: task.user?.phone ? String(task.user.phone) : "-",
            status: mapTaskStatus(task.status),
            amount: Number(task.totalAmount || 0),
            // Placeholder distance until geo service is integrated.
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
          payload.message || "Unable to submit response.",
        );
        return;
      }

      setTaskMessage(
        task.id,
        "success",
        payload.message || "Response recorded.",
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
        `${toApiV1BaseUrl(API_BASE_URL)}/orders/${task.orderId}/status`,
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

  const stats = useMemo(() => {
    const active = tasks.length;
    const transit = tasks.filter((task) => task.status === "in_transit").length;
    const totalDistance = tasks.reduce((sum, task) => sum + task.distanceKm, 0);
    return {
      active,
      transit,
      totalDistance,
    };
  }, [tasks]);

  const etaAnalytics = useMemo(() => {
    const raw =
      typeof window !== "undefined"
        ? window.localStorage.getItem("delivery_eta_tracking")
        : null;

    const parsed = raw
      ? (JSON.parse(raw) as Record<
          string,
          { acceptedAt: number; etaMinutes: number }
        >)
      : {};

    const values = Object.values(parsed).map((item) => item.etaMinutes);
    const avgEta =
      values.length > 0
        ? values.reduce((sum, value) => sum + value, 0) / values.length
        : 0;

    return {
      tracked: values.length,
      averageEta: avgEta,
    };
  }, [acceptedTaskIds]);

  const formatCountdown = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6 md:px-8">
      <DeliveryHeader
        title="Delivery Dashboard"
        subtitle="Live assigned tasks based on your partner profile and coverage setup."
      />

      <div className="mx-auto max-w-6xl space-y-6">
        {loading ? (
          <section className="mt-6 rounded-2xl border border-border bg-card p-8 text-center">
            <Loader2 className="h-7 w-7 animate-spin mx-auto text-indigo-600" />
            <p className="mt-3 text-sm text-muted-foreground">
              Loading assigned tasks...
            </p>
          </section>
        ) : null}

        {!loading && error ? (
          <section className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="text-sm font-medium text-red-700">{error}</p>
            {profileMissing ? (
              <Link
                href="/delivery/tasks"
                className="mt-3 inline-flex rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                Complete Coverage Setup
              </Link>
            ) : null}
          </section>
        ) : null}

        {!loading && !error ? (
          <>
            <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="font-body text-2xl sm:text-3xl font-semibold text-foreground tracking-normal">
                    Delivery Dashboard
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Mock assigned delivery tasks for partner workflow.
                  </p>
                </div>
                <div className="rounded-xl bg-indigo-100 p-2.5 text-indigo-700">
                  <Bike className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-lg border border-border bg-secondary/20 px-3 py-2.5">
                  <p className="text-xs text-muted-foreground">Active Tasks</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    {stats.active}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/20 px-3 py-2.5">
                  <p className="text-xs text-muted-foreground">In Transit</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    {stats.transit}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/20 px-3 py-2.5 col-span-2 md:col-span-1">
                  <p className="text-xs text-muted-foreground">
                    Distance Today
                  </p>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    {stats.totalDistance.toFixed(1)} km
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/20 px-3 py-2.5 col-span-2 md:col-span-1">
                  <p className="text-xs text-muted-foreground">Avg ETA</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    {etaAnalytics.tracked > 0
                      ? `${etaAnalytics.averageEta.toFixed(0)} min`
                      : "-"}
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              {tasks.map((task) => {
                const isAccepted =
                  acceptedTaskIds.includes(task.id) ||
                  task.status === "picked_up" ||
                  task.status === "in_transit";
                const canRespond =
                  task.status === "assigned" || task.status === "packed";
                const canComplete = isAccepted && task.status !== "delivered";

                return (
                  <article
                    key={task.id}
                    className="rounded-xl border border-border bg-card p-4 sm:p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Task
                        </p>
                        <p className="font-semibold text-foreground mt-1">
                          {task.id}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Order {task.orderId}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone[task.status]}`}
                      >
                        {statusLabel[task.status]}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg border border-border bg-secondary/20 p-3">
                        <p className="text-xs text-muted-foreground">Pickup</p>
                        <p className="font-medium text-foreground mt-1">
                          {task.vendorName}
                        </p>
                        <p className="text-foreground mt-1 flex items-start gap-1.5">
                          <MapPin className="h-4 w-4 mt-0.5 text-indigo-700" />
                          {task.pickupAddress}
                        </p>
                      </div>

                      <div className="rounded-lg border border-border bg-secondary/20 p-3">
                        <p className="text-xs text-muted-foreground">
                          Drop Location
                        </p>
                        <p className="text-foreground mt-1 flex items-start gap-1.5">
                          <Route className="h-4 w-4 mt-0.5 text-indigo-700" />
                          {task.deliveryAddress}
                        </p>
                        <p className="text-foreground mt-2 flex items-center gap-1.5">
                          <Phone className="h-4 w-4 text-indigo-700" />
                          {task.customerPhone}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                      <div className="rounded-md border border-border bg-background p-2">
                        <p className="text-muted-foreground">Amount</p>
                        <p className="font-semibold text-foreground mt-0.5">
                          ₹{task.amount.toLocaleString("en-IN")}
                        </p>
                      </div>
                      <div className="rounded-md border border-border bg-background p-2">
                        <p className="text-muted-foreground">Distance</p>
                        <p className="font-semibold text-foreground mt-0.5">
                          {task.distanceKm.toFixed(1)} km
                        </p>
                      </div>
                      <div className="rounded-md border border-border bg-background p-2">
                        <p className="text-muted-foreground">Action</p>
                        <p className="font-semibold text-foreground mt-0.5">
                          {task.status === "assigned" ||
                          task.status === "packed"
                            ? "Pick Up"
                            : task.status === "picked_up"
                              ? "Start Route"
                              : "Deliver"}
                        </p>
                      </div>
                    </div>

                    {acceptedTaskIds.includes(task.id) ? (
                      <div className="mt-3 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
                        ETA Timer:{" "}
                        {formatCountdown(countdownById[task.id] || 0)}
                      </div>
                    ) : null}

                    <div className="mt-3 flex flex-wrap gap-2">
                      {canRespond && !isAccepted ? (
                        <>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
                            onClick={() =>
                              void handleAssignmentResponse(task, true)
                            }
                            disabled={respondingTaskId === task.id}
                          >
                            {respondingTaskId === task.id
                              ? "Submitting..."
                              : "Accept"}
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-md bg-white px-3 py-2 text-xs font-semibold text-red-700 border border-red-200 hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed"
                            onClick={() =>
                              void handleAssignmentResponse(task, false)
                            }
                            disabled={respondingTaskId === task.id}
                          >
                            {respondingTaskId === task.id
                              ? "Submitting..."
                              : "Reject"}
                          </button>
                        </>
                      ) : null}

                      {canComplete ? (
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
                          onClick={() => void markDeliveryCompleted(task)}
                          disabled={completingTaskId === task.id}
                        >
                          {completingTaskId === task.id
                            ? "Completing..."
                            : "Delivery Completed"}
                        </button>
                      ) : null}
                    </div>

                    {taskMessageById[task.id] ? (
                      <p
                        className={`mt-2 text-xs ${taskMessageById[task.id].kind === "error" ? "text-red-700" : "text-emerald-700"}`}
                      >
                        {taskMessageById[task.id].text}
                      </p>
                    ) : null}
                  </article>
                );
              })}
            </section>

            <section className="rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground flex items-center gap-2">
              <Clock3 className="h-4 w-4" />
              Task list is loaded from /delivery/tasks/assigned. Distance values
              are temporary until map distance service is integrated.
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}
