"use client";

import React, { useEffect, useState, useCallback } from "react";
import { API_BASE_URL } from "@/lib/config";
import { Server, RefreshCw, CheckCircle2, AlertCircle, Clock } from "lucide-react";

type SyncStatus = "syncing" | "synced" | "offline";

interface BackendStatusBadgeProps {
  variant?: "pill" | "banner" | "compact";
  className?: string;
}

export function BackendStatusBadge({
  variant = "pill",
  className = "",
}: BackendStatusBadgeProps) {
  const [status, setStatus] = useState<SyncStatus>("syncing");
  const [latency, setLatency] = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const checkStatus = useCallback(async () => {
    setIsRefreshing(true);
    const startTime = performance.now();

    try {
      // Try /health endpoint first, fallback to base URL
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      let response: Response;
      try {
        response = await fetch(`${API_BASE_URL}/health`, {
          method: "GET",
          signal: controller.signal,
          cache: "no-store",
        });
      } catch {
        // Fallback to API_BASE_URL if /health route doesn't exist
        const fallbackController = new AbortController();
        const fallbackTimeout = setTimeout(() => fallbackController.abort(), 12000);
        response = await fetch(API_BASE_URL, {
          method: "GET",
          signal: fallbackController.signal,
          cache: "no-store",
        });
        clearTimeout(fallbackTimeout);
      }

      clearTimeout(timeoutId);
      const endTime = performance.now();
      const pingMs = Math.round(endTime - startTime);

      if (response.ok || response.status < 500) {
        setStatus("synced");
        setLatency(pingMs);
      } else {
        setStatus("offline");
        setLatency(null);
      }
    } catch {
      setStatus("offline");
      setLatency(null);
    } finally {
      setLastChecked(new Date());
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
    // Re-check backend status every 30 seconds
    const interval = setInterval(() => {
      checkStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, [checkStatus]);

  if (variant === "compact") {
    return (
      <div className={`relative inline-flex items-center ${className}`}>
        <button
          onClick={() => setShowDetails((prev) => !prev)}
          className="group flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 shadow-sm backdrop-blur-md transition-all duration-200"
          title="Click to view Render backend connectivity"
        >
          <span className="relative flex h-2 w-2">
            {status === "synced" && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            {status === "syncing" && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                status === "synced"
                  ? "bg-emerald-500"
                  : status === "syncing"
                  ? "bg-amber-500"
                  : "bg-red-500"
              }`}
            />
          </span>

          <span className="font-mono text-[11px] tracking-tight">
            {status === "synced" && (
              <span className="text-emerald-400 font-semibold">Backend Synced</span>
            )}
            {status === "syncing" && (
              <span className="text-amber-300">Waking Backend...</span>
            )}
            {status === "offline" && (
              <span className="text-red-400 font-semibold">Backend Offline</span>
            )}
          </span>

          {latency !== null && status === "synced" && (
            <span className="text-[10px] text-zinc-400 font-mono">
              ({latency}ms)
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        className={`flex items-center justify-between gap-3 px-3 py-1.5 rounded-full border text-xs font-medium backdrop-blur-md shadow-sm transition-all duration-300 cursor-pointer ${
          status === "synced"
            ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300 hover:border-emerald-500/50"
            : status === "syncing"
            ? "bg-amber-950/40 border-amber-500/30 text-amber-300 hover:border-amber-500/50"
            : "bg-red-950/40 border-red-500/30 text-red-300 hover:border-red-500/50"
        }`}
        onClick={() => setShowDetails((prev) => !prev)}
      >
        <div className="flex items-center gap-2">
          {/* Status Dot with Ripple Effect */}
          <span className="relative flex h-2.5 w-2.5 items-center justify-center">
            {status === "synced" && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            {status === "syncing" && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                status === "synced"
                  ? "bg-emerald-500"
                  : status === "syncing"
                  ? "bg-amber-400"
                  : "bg-red-500"
              }`}
            />
          </span>

          {/* Status Text */}
          <div className="flex items-center gap-1.5 font-medium tracking-tight text-[11px] sm:text-xs">
            <Server className="w-3.5 h-3.5 opacity-80" />
            <span>
              {status === "synced" && "Backend Synced (Render)"}
              {status === "syncing" && "Connecting to Render..."}
              {status === "offline" && "Backend Offline"}
            </span>
          </div>

          {/* Latency badge */}
          {status === "synced" && latency !== null && (
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">
              {latency}ms
            </span>
          )}
        </div>

        {/* Refresh Icon */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            checkStatus();
          }}
          className="p-0.5 hover:bg-white/10 rounded-full transition-colors text-zinc-300 hover:text-white"
          title="Re-check connection"
        >
          <RefreshCw
            className={`w-3 h-3 ${isRefreshing ? "animate-spin text-emerald-400" : ""}`}
          />
        </button>
      </div>

      {/* Popover Details on click */}
      {showDetails && (
        <div className="absolute right-0 top-full mt-2 w-72 p-3.5 rounded-xl bg-zinc-900/95 border border-zinc-800 text-zinc-200 shadow-2xl z-50 text-xs backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800">
            <div className="flex items-center gap-1.5 font-semibold text-zinc-100">
              <Server className="w-4 h-4 text-red-500" />
              <span>Backend Connection Status</span>
            </div>
            <button
              onClick={() => setShowDetails(false)}
              className="text-zinc-400 hover:text-white text-xs font-bold px-1"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2 font-sans">
            <div className="flex justify-between items-center text-zinc-300">
              <span className="text-zinc-400">Status:</span>
              <span className="font-semibold capitalize flex items-center gap-1">
                {status === "synced" && (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">In Sync (Live)</span>
                  </>
                )}
                {status === "syncing" && (
                  <>
                    <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                    <span className="text-amber-400">Waking Up...</span>
                  </>
                )}
                {status === "offline" && (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-red-400">Unreachable</span>
                  </>
                )}
              </span>
            </div>

            <div className="flex justify-between items-center text-zinc-300">
              <span className="text-zinc-400">Server Host:</span>
              <span className="font-mono text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300 truncate max-w-[140px]" title={API_BASE_URL}>
                Render (production)
              </span>
            </div>

            {latency !== null && (
              <div className="flex justify-between items-center text-zinc-300">
                <span className="text-zinc-400">Latency:</span>
                <span className="font-mono text-emerald-400">{latency} ms</span>
              </div>
            )}

            {lastChecked && (
              <div className="flex justify-between items-center text-zinc-400 text-[10px] pt-1 border-t border-zinc-800/80">
                <span>Last sync check:</span>
                <span>{lastChecked.toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
