"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { pingBackend } from "@/lib/ping-backend";

const protectedPrefixes: string[] = [
  "/customer",
  "/vendor",
  "/delivery",
  "/admin",
];

// Paths that might start with protected prefix but should remain public
const publicExclusions = [
  "/vendor/apply",
  "/vendor/learn-more",
  "/delivery/apply",
  "/customer/cart",
];

// Prevent multiple session restoration attempts during SPA navigation
let hasAttemptedRefreshGlobal = false;

function PremiumLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-base)] text-[var(--text-primary)] transition-colors duration-300">
      <div className="flex flex-col items-center gap-6 animate-pulse">
        {/* Animated Brand Logo Symbol */}
        <div className="relative flex items-center justify-center">
          {/* Outer circle with glow */}
          <div className="w-20 h-20 rounded-full border-2 border-red-600 dark:border-red-500 flex items-center justify-center shadow-lg shadow-red-600/20 bg-white dark:bg-zinc-900">
            <svg
              className="w-10 h-10 text-red-600 dark:text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          </div>
        </div>

        {/* Text Area */}
        <div className="text-center flex flex-col gap-2">
          <h1 className="text-3xl font-black tracking-tighter uppercase leading-none text-[var(--text-primary)]">
            Mark<span className="text-red-600">ivo</span>
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">
            Connecting you to global opportunities...
          </p>
        </div>

        {/* Progress line */}
        <div className="w-48 h-1 bg-[var(--border-default)] rounded-full overflow-hidden relative">
          <div className="absolute top-0 left-0 h-full bg-red-600 dark:bg-red-500 rounded-full w-1/3 animate-infinite-loading" />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes infinite-loading {
            0% { left: -33%; }
            100% { left: 100%; }
          }
          .animate-infinite-loading {
            animation: infinite-loading 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          }
        `
      }} />
    </div>
  );
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const refreshSession = useAuthStore((state) => state.refreshSession);
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Immediately ping backend server on Render to awaken cold start
  useEffect(() => {
    pingBackend();
  }, []);


  // Check if current page requires authentication
  const requiresAuth = protectedPrefixes.some((prefix) =>
    pathname?.startsWith(prefix)
  );
  const isExcluded = publicExclusions.includes(pathname || "");
  const isProtectedRoute = requiresAuth && !isExcluded;

  useEffect(() => {
    setMounted(true);

    const initAuth = async () => {
      const token = localStorage.getItem("accessToken");

      if (!isProtectedRoute) {
        // Public pages: immediately let the page render
        setCheckingAuth(false);

        // Fetch session status asynchronously in the background
        if (!user && !token && !hasAttemptedRefreshGlobal) {
          hasAttemptedRefreshGlobal = true;
          refreshSession();
        }
        return;
      }

      // Protected pages: block render until we confirm session status
      if (!user && !token) {
        if (!hasAttemptedRefreshGlobal) {
          hasAttemptedRefreshGlobal = true;
          await refreshSession();
        }
      }
      setCheckingAuth(false);
    };

    initAuth();
  }, [user, refreshSession, pathname, isProtectedRoute]);

  useEffect(() => {
    if (!mounted || checkingAuth) return;

    if (isProtectedRoute) {
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
          router.push("/login");
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
  }, [mounted, user, pathname, router, isProtectedRoute, checkingAuth, isExcluded]);

  // Show premium loader for protected pages before mounting or while checking auth
  if (isProtectedRoute && (!mounted || checkingAuth)) {
    return <PremiumLoader />;
  }

  return <>{children}</>;
}

