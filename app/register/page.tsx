"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { useAuthStore } from "@/lib/store";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "CUSTOMER",
    agreeToTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const register = useAuthStore((state) => state.register);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.fullName || !formData.email || !formData.password) {
      setError("Please fill in all required fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (!formData.agreeToTerms) {
      setError("Please agree to the terms and conditions");
      return;
    }

    setLoading(true);
    try {
      await register(
        formData.fullName,
        formData.email,
        formData.password,
        formData.role as any,
      );

      // Redirect based on role
      switch (formData.role) {
        case "VENDOR":
          router.push("/vendor/apply");
          break;
        case "ADMIN":
          router.push("/admin/dashboard");
          break;
        case "DELIVERY_PARTNER":
          router.push("/delivery/tasks");
          break;
        default:
          router.push("/products");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col items-center justify-center px-4 py-12" style={{ fontFamily: "var(--font-dm-sans)" }}>
      <div className="mb-8 text-center">
        <Link href="/">
          <h2 style={{ fontFamily: "var(--font-instrument-serif)", fontSize: "32px", color: "var(--brand-primary)", letterSpacing: "0.02em", fontWeight: "normal" }}>
            MarketFlow
          </h2>
        </Link>
      </div>

      <div className="w-full max-w-[460px]">
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-8 shadow-sm">
          {/* Header */}
          <div className="mb-8">
            <h1 style={{ fontFamily: "var(--font-instrument-serif)", fontSize: "2rem", color: "var(--text-primary)" }}>
              Create an account
            </h1>
            <p className="text-[var(--text-secondary)] text-sm mt-1">
              Join our community of vendors and shoppers
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-sunken)] border border-[var(--border-default)] rounded-xl focus:outline-none focus:border-[var(--brand-primary)] text-sm transition-colors"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-sunken)] border border-[var(--border-default)] rounded-xl focus:outline-none focus:border-[var(--brand-primary)] text-sm transition-colors"
                  required
                />
              </div>
            </div>

            {/* Passwords Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Password */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-[var(--bg-sunken)] border border-[var(--border-default)] rounded-xl focus:outline-none focus:border-[var(--brand-primary)] text-sm transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                  Confirm
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-[var(--bg-sunken)] border border-[var(--border-default)] rounded-xl focus:outline-none focus:border-[var(--brand-primary)] text-sm transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                Account Type
              </label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-[var(--bg-sunken)] border border-[var(--border-default)] rounded-xl focus:outline-none focus:border-[var(--brand-primary)] text-sm appearance-none cursor-pointer"
                required
              >
                <option value="CUSTOMER">Customer (Shopping)</option>
                <option value="VENDOR">Vendor (Selling)</option>
                <option value="DELIVERY_PARTNER">Delivery Partner</option>
              </select>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-[var(--status-error-bg)] text-[var(--status-error)] rounded-xl text-xs font-medium border border-[var(--status-error)]/10">
                {error}
              </div>
            )}

            {/* Terms & Conditions */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={formData.agreeToTerms}
                onChange={(e) =>
                  setFormData({ ...formData, agreeToTerms: e.target.checked })
                }
                className="mt-1 rounded border-[var(--border-default)] text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
              />
              <span className="text-xs text-[var(--text-secondary)] leading-normal">
                I agree to the <Link href="#" className="text-[var(--brand-primary)] font-bold hover:underline">Terms of Service</Link> and <Link href="#" className="text-[var(--brand-primary)] font-bold hover:underline">Privacy Policy</Link>
              </span>
            </label>

            {/* Sign Up Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[var(--brand-primary)] text-[var(--text-inverse)] rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-8 text-center text-sm text-[var(--text-secondary)]">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-[var(--brand-primary)] hover:underline font-bold"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
