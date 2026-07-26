"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  Bike,
  FileText,
  MapPin,
  Bell,
  User,
  Loader2,
  Mail,
  Phone,
  Shield,
  LogOut,
  CheckCircle2,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { authFetch } from "@/lib/auth-fetch";
import { API_BASE_URL } from "@/lib/config";
import { useAuthStore } from "@/lib/store";

type DeliveryHeaderProps = {
  title: string;
  subtitle: string;
};

type PartnerProfile = {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: string;
  };
};

const navItems = [
  {
    href: "/delivery/dashboard",
    label: "Dashboard",
    icon: Bike,
  },
  {
    href: "/delivery/completed",
    label: "Deliveries Done",
    icon: CheckCircle2,
  },
  {
    href: "/delivery/tasks",
    label: "Coverage",
    icon: MapPin,
  },
  {
    href: "/delivery/terms",
    label: "Terms & Agreement",
    icon: FileText,
  },
];

export function DeliveryHeader({ title, subtitle }: DeliveryHeaderProps) {
  const pathname = usePathname();
  const [profile, setProfile] = useState<PartnerProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const logout = useAuthStore((state) => state.logout);

  const fetchProfile = async () => {
    if (profile) return;
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/delivery/profile`, {
        credentials: "include",
      });
      if (res.ok) {
        const payload = await res.json();
        if (payload.success) {
          setProfile(payload.data);
        }
      }
    } catch (err) {
      console.error("Failed to fetch partner profile", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border-default)] bg-white/95 backdrop-blur-md antialiased">
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 md:px-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <button
                  onClick={fetchProfile}
                  className="h-9 w-9 rounded-md bg-black flex items-center justify-center text-white shadow-sm hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <User size={18} />
                </button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[320px] sm:w-[400px] p-0 border-r border-[var(--border-default)]"
              >
                <SheetHeader className="p-6 bg-black text-white relative overflow-hidden">
                  <div className="relative z-10 text-left">
                    <SheetTitle className="text-white font-bold text-xl tracking-tight text-left">
                      Partner Profile
                    </SheetTitle>
                    <p className="text-zinc-400 text-xs font-medium mt-1">
                      Verified Delivery Network
                    </p>
                  </div>
                </SheetHeader>

                <div className="p-6">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-zinc-400">
                      <Loader2 className="animate-spin text-black" size={28} />
                      <p className="text-xs font-medium">Fetching profile...</p>
                    </div>
                  ) : profile ? (
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-md bg-black flex items-center justify-center text-white shadow-sm shrink-0">
                          <User size={28} />
                        </div>
                        <div>
                          <h2 className="text-base font-bold text-black tracking-tight">
                            {profile.user.name}
                          </h2>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span className="text-xs font-semibold text-emerald-600">
                              Active Partner
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="bg-zinc-50 rounded-md p-4 border border-zinc-200 flex items-center gap-3.5">
                          <div className="h-9 w-9 rounded-md bg-white border border-zinc-200 flex items-center justify-center text-black shrink-0">
                            <Mail size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-medium text-zinc-500">
                              Email Address
                            </p>
                            <p className="text-xs font-bold text-black truncate max-w-[180px]">
                              {profile.user.email}
                            </p>
                          </div>
                        </div>

                        <div className="bg-zinc-50 rounded-md p-4 border border-zinc-200 flex items-center gap-3.5">
                          <div className="h-9 w-9 rounded-md bg-white border border-zinc-200 flex items-center justify-center text-black shrink-0">
                            <Phone size={16} />
                          </div>
                          <div>
                            <p className="text-[11px] font-medium text-zinc-500">
                              Phone Number
                            </p>
                            <p className="text-xs font-bold text-black">
                              {profile.user.phone || "Not provided"}
                            </p>
                          </div>
                        </div>

                        <div className="bg-zinc-50 rounded-md p-4 border border-zinc-200 flex items-center gap-3.5">
                          <div className="h-9 w-9 rounded-md bg-white border border-zinc-200 flex items-center justify-center text-black shrink-0">
                            <Shield size={16} />
                          </div>
                          <div>
                            <p className="text-[11px] font-medium text-zinc-500">
                              Access Role
                            </p>
                            <p className="text-xs font-bold text-black capitalize">
                              {profile.user.role.replaceAll("_", " ")}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-[var(--border-default)]">
                        <button
                          onClick={() => {
                            logout();
                            window.location.href = "/login";
                          }}
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-md bg-white border border-[var(--border-default)] text-red-600 font-bold text-xs hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer"
                        >
                          <LogOut size={15} /> Secure Sign Out
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-16 text-center text-zinc-400">
                      <p className="text-xs font-medium">
                        Failed to load partner profile
                      </p>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-md bg-zinc-100 text-[10px] sm:text-xs font-bold text-zinc-800 border border-zinc-200">
              Partner Hub
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button className="h-9 w-9 rounded-md bg-white flex items-center justify-center text-black hover:bg-zinc-100 transition-colors border border-[var(--border-default)] shadow-sm cursor-pointer">
              <Bell size={17} />
            </button>
            <Link href="/delivery/dashboard" className="flex items-center gap-2">
              <Image
                src="/logo/logo.png"
                alt="Markivo"
                width={100}
                height={28}
                className="h-6 w-auto"
                priority
              />
            </Link>
          </div>
        </div>

        {/* Header Title & Navigation Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-black">
              {title}
            </h1>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">
              {subtitle}
            </p>
          </div>

          <nav className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                    active
                      ? "bg-black text-white shadow-sm"
                      : "bg-white border border-[var(--border-default)] text-zinc-600 hover:text-black hover:bg-zinc-50"
                  }`}
                >
                  <Icon size={14} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
