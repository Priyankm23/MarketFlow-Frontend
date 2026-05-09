"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Bike, FileText, MapPin, Bell, User, Loader2, Mail, Phone, Shield, LogOut, CheckCircle2 } from "lucide-react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
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
    label: "Terms",
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
        credentials: "include"
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
    <header className="sticky top-0 z-30 border-b border-border bg-white/90 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 md:px-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <button 
                  onClick={fetchProfile}
                  className="h-9 w-9 rounded-full bg-slate-950 flex items-center justify-center text-white shadow-lg ring-2 ring-white active:scale-95 transition-transform"
                >
                  <User size={18} />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[320px] sm:w-[400px] p-0 border-r border-border">
                <SheetHeader className="p-6 bg-slate-950 text-white relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 to-transparent opacity-50" />
                  <div className="relative z-10 text-left">
                    <SheetTitle className="text-white font-black text-xl tracking-tight text-left">Partner Profile</SheetTitle>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Verified Delivery Network</p>
                  </div>
                </SheetHeader>

                <div className="p-6">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                      <Loader2 className="animate-spin" size={32} />
                      <p className="text-[10px] font-bold uppercase tracking-widest">Fetching Details...</p>
                    </div>
                  ) : profile ? (
                    <div className="space-y-8">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-[1.25rem] bg-orange-600 flex items-center justify-center text-white shadow-xl shadow-orange-200">
                          <User size={32} />
                        </div>
                        <div>
                          <h2 className="text-lg font-black text-slate-900 tracking-tight">{profile.user.name}</h2>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Active Partner</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-4 group transition-colors hover:bg-white hover:border-orange-100">
                          <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-orange-600 transition-colors">
                            <Mail size={18} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</p>
                            <p className="text-sm font-bold text-slate-900 truncate max-w-[180px]">{profile.user.email}</p>
                          </div>
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-4 group transition-colors hover:bg-white hover:border-orange-100">
                          <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-orange-600 transition-colors">
                            <Phone size={18} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</p>
                            <p className="text-sm font-bold text-slate-900">{profile.user.phone || "Not provided"}</p>
                          </div>
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-4 group transition-colors hover:bg-white hover:border-orange-100">
                          <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-orange-600 transition-colors">
                            <Shield size={18} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Access Role</p>
                            <p className="text-sm font-bold text-slate-900 capitalize">{profile.user.role.replaceAll("_", " ")}</p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-8 border-t border-slate-100">
                        <button 
                          onClick={() => {
                            logout();
                            window.location.href = "/login";
                          }}
                          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-slate-50 text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 border border-transparent transition-all active:scale-95"
                        >
                          <LogOut size={16} /> Secure Sign Out
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-20 text-center text-slate-400">
                      <p className="text-sm font-bold">Failed to load profile</p>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-orange-50 text-[10px] font-bold text-orange-600 uppercase tracking-widest border border-orange-100">
              Partner Hub
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button className="h-9 w-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-orange-50 hover:text-orange-600 transition-colors border border-slate-100 shadow-sm">
              <Bell size={18} />
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

        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="shrink-0">
            <h1 className="font-body text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {title}
            </h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">{subtitle}</p>
          </div>

          <nav className="flex items-center gap-2 overflow-x-auto pb-2 -mb-2 sm:pb-0 sm:mb-0 scrollbar-hide flex-nowrap snap-x snap-mandatory">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href || pathname?.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-extrabold whitespace-nowrap transition-all active:scale-95 snap-center ${
                    active
                      ? "bg-orange-600 text-white shadow-xl shadow-orange-200"
                      : "bg-white text-slate-500 border border-slate-200 hover:border-orange-200 hover:text-orange-600"
                  }`}
                >
                  <Icon className="h-4 w-4" />
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
