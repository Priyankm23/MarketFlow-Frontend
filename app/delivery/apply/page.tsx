"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { useAuthStore } from "@/lib/store";
import {
  Bike,
  ShieldCheck,
  Clock,
  Wallet,
  MapPin,
  ChevronRight,
  LogIn,
  UserPlus,
  ArrowRight,
} from "lucide-react";

export default function DeliveryApplyPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-black antialiased pb-20">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 lg:py-14">
        {/* Hero Section */}
        <div className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-100 border border-zinc-200 rounded-md text-xs font-semibold text-zinc-800 mb-4">
            <Bike size={15} className="text-black" />
            Markivo Logistics Network
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-black mb-2 sm:mb-3">
            Earn with Markivo Delivery
          </h1>
          <p className="text-sm sm:text-base font-medium text-zinc-500 max-w-2xl">
            Join thousands of delivery partners earning competitive payouts with flexible hours across local neighborhoods.
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
          <div className="p-6 bg-white border border-[var(--border-default)] rounded-md shadow-sm space-y-2.5">
            <div className="w-10 h-10 rounded-md bg-zinc-100 text-black flex items-center justify-center mb-3">
              <Clock size={20} />
            </div>
            <h3 className="text-sm font-bold text-black">Flexible Hours</h3>
            <p className="text-xs text-zinc-500 font-medium leading-relaxed">
              Choose when you work. Turn on your delivery status whenever you are ready to accept local tasks.
            </p>
          </div>

          <div className="p-6 bg-white border border-[var(--border-default)] rounded-md shadow-sm space-y-2.5">
            <div className="w-10 h-10 rounded-md bg-zinc-100 text-black flex items-center justify-center mb-3">
              <Wallet size={20} />
            </div>
            <h3 className="text-sm font-bold text-black">Transparent Payouts</h3>
            <p className="text-xs text-zinc-500 font-medium leading-relaxed">
              Track earnings per delivery in real time with guaranteed per-task base fees and milestone perks.
            </p>
          </div>

          <div className="p-6 bg-white border border-[var(--border-default)] rounded-md shadow-sm space-y-2.5">
            <div className="w-10 h-10 rounded-md bg-zinc-100 text-black flex items-center justify-center mb-3">
              <MapPin size={20} />
            </div>
            <h3 className="text-sm font-bold text-black">Optimized Routes</h3>
            <p className="text-xs text-zinc-500 font-medium leading-relaxed">
              Get matched with nearby vendor pickups and streamlined drop-off routes for fast turnarounds.
            </p>
          </div>
        </div>

        {/* Authentication Card */}
        <div className="p-6 sm:p-8 bg-white border border-[var(--border-default)] rounded-md shadow-sm space-y-6">
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={20} className="text-black" />
            <div>
              <h2 className="text-base font-bold text-black tracking-tight">
                Partner Portal Access
              </h2>
              <p className="text-xs text-zinc-500 font-medium">
                Log in or sign up to manage your delivery workspace and view active orders.
              </p>
            </div>
          </div>

          {user ? (
            <div className="p-5 bg-zinc-50 border border-zinc-200 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-black">
                  Signed in as {user.name || user.email}
                </p>
                <p className="text-xs text-zinc-500 font-medium mt-0.5">
                  Account Role: {user.role || "Partner"}
                </p>
              </div>
              <Link
                href="/delivery/terms"
                className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-md bg-black text-white text-xs font-bold hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer shrink-0"
              >
                Go to Partner Workspace <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 bg-zinc-50 border border-zinc-200 rounded-md space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-black">Registered Partner?</h3>
                  <p className="text-xs text-zinc-500 font-medium mt-0.5 leading-relaxed">
                    Sign in to view assigned tasks, active pickups, and delivery earnings.
                  </p>
                </div>
                <Link
                  href="/login"
                  className="w-full inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md bg-black text-white text-xs font-bold hover:bg-zinc-800 transition-colors shadow-sm"
                >
                  <LogIn size={14} />
                  Log In to Delivery Portal
                </Link>
              </div>

              <div className="p-5 bg-zinc-50 border border-zinc-200 rounded-md space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-black">Become a Partner</h3>
                  <p className="text-xs text-zinc-500 font-medium mt-0.5 leading-relaxed">
                    Create a new partner account to begin onboarding and route setup.
                  </p>
                </div>
                <Link
                  href="/register"
                  className="w-full inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md bg-white border border-[var(--border-default)] text-black text-xs font-bold hover:bg-zinc-100 transition-colors shadow-sm"
                >
                  <UserPlus size={14} />
                  Apply & Register
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
