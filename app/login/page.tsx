"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { fetchVendorProfile } from "@/lib/vendor-profile";

// No client-side role selection required; server determines user role

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await login(email, password);

      // Override or fallback role
      const actualRole = user.role.toLowerCase();

      // Redirect based on actual role
      const dashboardMap: Record<string, string> = {
        customer: "/products",
        vendor: "/vendor/dashboard",
        delivery_partner: "/delivery/tasks",
        delivery: "/delivery/tasks",
        admin: "/admin/dashboard",
      };

      if (actualRole === "vendor") {
        const vendorProfile = await fetchVendorProfile().catch(() => null);
        const hasVendorProfile = Boolean(vendorProfile);
        router.push(hasVendorProfile ? "/vendor/dashboard" : "/vendor/apply");
        return;
      }

      router.push(dashboardMap[actualRole] || "/products");
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[var(--bg-base)] flex flex-col items-center justify-center px-4"
      style={{ fontFamily: "var(--font-dm-sans)" }}
    >
      <div className="mb-8 text-center">
        <Link href="/">
          <h2
            style={{
              fontFamily: "var(--font-instrument-serif)",
              fontSize: "32px",
              color: "var(--brand-primary)",
              letterSpacing: "0.02em",
              fontWeight: "normal",
            }}
          >
            MarketFlow
          </h2>
        </Link>
      </div>

      <div className="w-full max-w-[420px]">
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-8 shadow-sm">
          {/* Header */}
          <div className="mb-8">
            <h1
              style={{
                fontFamily: "var(--font-instrument-serif)",
                fontSize: "2rem",
                color: "var(--text-primary)",
              }}
            >
              Welcome back
            </h1>
            <p className="text-[var(--text-secondary)] text-sm mt-1">
              Enter your credentials to access your account
            </p>
          </div>

          {/* Role selection removed: login does not require selecting a role */}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-sunken)] border border-[var(--border-default)] rounded-xl focus:outline-none focus:border-[var(--brand-primary)] text-sm transition-colors"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                  Password
                </label>
                <Link
                  href="#"
                  className="text-[11px] font-bold uppercase tracking-widest text-[var(--brand-primary)] hover:underline"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-[var(--bg-sunken)] border border-[var(--border-default)] rounded-xl focus:outline-none focus:border-[var(--brand-primary)] text-sm transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-[var(--status-error-bg)] text-[var(--status-error)] rounded-xl text-xs font-medium border border-[var(--status-error)]/10">
                {error}
              </div>
            )}

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[var(--brand-primary)] text-[var(--text-inverse)] rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-8 text-center text-sm text-[var(--text-secondary)]">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="text-[var(--brand-primary)] hover:underline font-bold"
            >
              Sign up
            </Link>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2">
          <Link
            href="/vendor/apply"
            className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--brand-primary)] transition-colors"
          >
            Become a Vendor
          </Link>
          <Link
            href="/delivery/apply"
            className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--brand-primary)] transition-colors"
          >
            Delivery Partner
          </Link>
        </div>
      </div>
    </div>
  );
}
