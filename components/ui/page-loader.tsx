"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { Navbar } from "@/components/navbar";

type PageLoaderProps = {
  message?: string;
  subtext?: string;
  showNavbar?: boolean;
};

export function PageLoader({
  message = "Loading...",
  subtext = "Please wait a moment while we fetch your information.",
  showNavbar = true,
}: PageLoaderProps) {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col antialiased">
      {showNavbar && <Navbar />}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center -mt-10">
        <div className="relative flex items-center justify-center mb-5">
          {/* Pulsing Outer Ring */}
          <div className="absolute w-16 h-16 rounded-full bg-zinc-200/50 animate-ping opacity-60" />
          
          {/* Main Glass Icon Container */}
          <div className="relative w-12 h-12 rounded-md bg-white border border-[var(--border-default)] shadow-sm flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-black animate-spin" />
          </div>
        </div>

        <h2 className="text-base font-bold text-black tracking-tight mb-1">
          {message}
        </h2>
        <p className="text-xs font-medium text-zinc-500 max-w-xs leading-relaxed">
          {subtext}
        </p>

        {/* Micro Loader Shimmer */}
        <div className="w-32 h-1 bg-zinc-200 rounded-full mt-5 overflow-hidden">
          <div className="h-full bg-black rounded-full animate-pulse w-2/3" />
        </div>
      </div>
    </div>
  );
}
