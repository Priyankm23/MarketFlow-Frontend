"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/store";

const protectedPrefixes: string[] = [
  "/customer",
  "/vendor",
  "/delivery",
  "/admin",
  "/products",
];

// Paths that might start with protected prefix but should remain public
const publicExclusions = [
  "/vendor/apply",
  "/vendor/learn-more",
  "/delivery/apply",
];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const refreshSession = useAuthStore((state) => state.refreshSession);
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    setMounted(true);
    
    const initAuth = async () => {
      const token = localStorage.getItem("accessToken");
      if (!user && !token) {
        // Try to restore session from cookies
        await refreshSession();
      }
      setCheckingAuth(false);
    };

    initAuth();
  }, [user, refreshSession]);

  useEffect(() => {
    if (!mounted || checkingAuth) return;

    const requiresAuth = protectedPrefixes.some((prefix) =>
      pathname?.startsWith(prefix),
    );
    const isExcluded = publicExclusions.includes(pathname || "");

    if (requiresAuth && !isExcluded) {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("accessToken")
          : null;

      if (!user && !token) {
        router.push("/login");
        return;
      }

      // Role-based protection
      if (user) {
        const normalizedRole = user.role?.toUpperCase() || "";

        if (pathname?.startsWith("/admin") && normalizedRole !== "ADMIN") {
          router.push("/login"); // Or a forbidden page
        } else if (
          pathname?.startsWith("/vendor") &&
          normalizedRole !== "VENDOR" &&
          !isExcluded
        ) {
          router.push("/login");
        } else if (
          pathname?.startsWith("/delivery") &&
          !["DELIVERY", "DELIVERY_PARTNER"].includes(normalizedRole) &&
          !isExcluded
        ) {
          router.push("/login");
        }
      }
    }
  }, [mounted, user, pathname, router]);

  // Prevent UI flash on client-side before mount
  if (!mounted || checkingAuth) {
    return <div className="min-h-screen bg-background" />;
  }

  return <>{children}</>;
}
