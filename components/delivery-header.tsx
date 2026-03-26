"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bike, FileText, MapPin } from "lucide-react";

type DeliveryHeaderProps = {
  title: string;
  subtitle: string;
};

const navItems = [
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
  {
    href: "/delivery/dashboard",
    label: "Dashboard",
    icon: Bike,
  },
];

export function DeliveryHeader({ title, subtitle }: DeliveryHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 md:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              MarketFlow Delivery Partner
            </p>
            <h1 className="font-body text-xl sm:text-2xl font-semibold text-foreground tracking-normal">
              {title}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          </div>

          <nav className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href || pathname?.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                    active
                      ? "bg-indigo-600 text-white"
                      : "bg-secondary text-foreground hover:bg-indigo-50 hover:text-indigo-700"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
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
