"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuthStore } from "@/lib/store";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  badge?: number;
  disabled?: boolean;
}

interface SidebarProps {
  items: NavItem[];
  title: string;
  userRole: string;
}

export function Sidebar({ items, title, userRole }: SidebarProps) {
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="text-xs text-muted-foreground mt-1 capitalize">
          {userRole} Portal
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {items.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const baseClass = `flex items-center justify-between px-4 py-2.5 rounded-lg transition-colors ${
            isActive
              ? "bg-primary text-primary-foreground"
              : "hover:bg-secondary text-foreground"
          }`;

          if (item.disabled) {
            return (
              <button
                key={item.href}
                type="button"
                disabled
                className={`${baseClass} w-full cursor-not-allowed opacity-45`}
                title="Available after profile approval"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="flex items-center justify-center w-5 h-5 text-xs font-bold bg-destructive text-destructive-foreground rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          }

          return (
            <Link key={item.href} href={item.href} className={baseClass}>
              <div className="flex items-center gap-3">
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              {item.badge && (
                <span className="flex items-center justify-center w-5 h-5 text-xs font-bold bg-destructive text-destructive-foreground rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-3">
        <div className="p-3 bg-secondary rounded-lg">
          <p className="text-xs text-muted-foreground">Signed in as</p>
          <p className="text-sm font-medium truncate">{user?.email}</p>
        </div>
        <button
          onClick={async () => {
            await logout();
            window.location.href = "/login";
          }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium border border-border rounded-lg hover:bg-secondary transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );
}
