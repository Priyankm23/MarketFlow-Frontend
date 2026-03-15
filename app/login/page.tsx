"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { fetchVendorProfile } from "@/lib/vendor-profile";

type UserRole = "customer" | "vendor" | "delivery" | "admin";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>("customer");
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
        const accessToken = localStorage.getItem("accessToken");
        const vendorProfile = await fetchVendorProfile(accessToken).catch(
          () => null,
        );
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
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-lg p-8 shadow-sm animate-fade-in">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-primary-foreground text-xl font-bold">
                M
              </div>
            </div>
            <h1 className="text-2xl font-bold">Welcome to MarketFlow</h1>
            <p className="text-muted-foreground text-sm mt-2">
              Sign in to your account
            </p>
          </div>

          {/* Role Selection */}
          <div className="mb-6 p-4 bg-secondary rounded-lg">
            <p className="text-sm font-medium mb-3">Login as:</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  value: "customer" as UserRole,
                  label: "Customer",
                  icon: "🛍️",
                },
                { value: "vendor" as UserRole, label: "Vendor", icon: "🏪" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setRole(option.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    role === option.value
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-card border border-border hover:bg-secondary"
                  }`}
                >
                  <span className="mr-2">{option.icon}</span>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Remember & Forgot */}
            <div className="flex justify-between items-center text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded" />
                <span>Remember me</span>
              </label>
              <Link href="#" className="text-primary hover:underline">
                Forgot password?
              </Link>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Demo Credentials Info */}
          <div className="mt-6 p-4 bg-accent/10 rounded-lg text-sm">
            <p className="font-medium text-foreground mb-2">
              Demo Credentials:
            </p>
            <p className="text-muted-foreground">Email: demo@example.com</p>
            <p className="text-muted-foreground">Password: demo123</p>
          </div>

          {/* Sign Up Link */}
          <div className="mt-6 text-center text-sm">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="text-primary hover:underline font-medium"
            >
              Create one now
            </Link>
          </div>

          {/* Additional Links */}
          <div className="mt-6 pt-6 border-t border-border space-y-2 text-center text-sm">
            <p className="text-muted-foreground">New to MarketFlow?</p>
            <Link
              href="/vendor/apply"
              className="block text-primary hover:underline font-medium"
            >
              Become a Vendor
            </Link>
            <Link
              href="/delivery/apply"
              className="block text-primary hover:underline font-medium"
            >
              Join as Delivery Partner
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
