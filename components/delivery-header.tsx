"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Bike, FileText, MapPin, Bell } from "lucide-react";

type DeliveryHeaderProps = {
  title: string;
  subtitle: string;
};

const navItems = [
  {
    href: "/delivery/dashboard",
    label: "Dashboard",
    icon: Bike,
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

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-white/90 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 md:px-8">
        <div className="flex items-center justify-between mb-4">
          <Link href="/delivery/dashboard" className="flex items-center gap-2">
            <Image
              src="/logo/logo.png"
              alt="Markivo"
              width={120}
              height={32}
              className="h-7 w-auto"
              priority
            />
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-orange-100 text-[10px] font-bold text-orange-600 uppercase tracking-widest">
              Partner Hub
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <button className="h-9 w-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-orange-50 hover:text-orange-600 transition-colors border border-slate-100 shadow-sm">
              <Bell size={18} />
            </button>
            <div className="h-9 w-9 rounded-full bg-orange-600 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-orange-200 ring-2 ring-white">
              JD
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-body text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {title}
            </h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">{subtitle}</p>
          </div>

          <nav className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href || pathname?.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-extrabold whitespace-nowrap transition-all active:scale-95 ${
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
