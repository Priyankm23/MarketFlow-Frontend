"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { useAuthStore } from "@/lib/store";
import {
  Package,
  ShieldCheck,
  MapPin,
  CreditCard,
  LogOut,
  User,
  Heart,
  Bell,
  ChevronRight,
  UserCircle,
  Clock,
  TicketPercent,
  ArrowRight,
  Mail,
} from "lucide-react";

type ProfileCardProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
  href?: string;
  isIncoming?: boolean;
};

function ProfileCard({ title, description, icon, href, isIncoming }: ProfileCardProps) {
  if (isIncoming) {
    return (
      <div className="flex items-start gap-4 p-5 bg-white border border-[var(--border-default)] rounded-md shadow-sm opacity-85 transition-all">
        <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-md bg-zinc-100 text-zinc-600 shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="text-sm font-bold text-black">{title}</h3>
            <span className="px-2 py-0.5 bg-zinc-100 border border-zinc-200 text-zinc-600 text-[10px] font-semibold rounded-md shrink-0">
              Feature Incoming
            </span>
          </div>
          <p className="text-xs text-zinc-500 font-medium leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={href || "#"}
      className="group flex items-start gap-4 p-5 bg-white border border-[var(--border-default)] rounded-md shadow-sm hover:border-black hover:shadow-md transition-all duration-200"
    >
      <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-md bg-black text-white shrink-0 shadow-sm">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-black mb-1">
          {title}
        </h3>
        <p className="text-xs text-zinc-500 font-medium leading-relaxed">
          {description}
        </p>
      </div>
      <ChevronRight
        size={16}
        className="text-zinc-400 group-hover:text-black group-hover:translate-x-0.5 transition-all self-center shrink-0"
      />
    </Link>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)]">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-24 text-center">
          <div className="w-16 h-16 bg-zinc-100 rounded-md flex items-center justify-center mx-auto mb-5">
            <User size={28} className="text-zinc-400" />
          </div>
          <h1 className="text-2xl font-bold text-black tracking-tight">Access Denied</h1>
          <p className="text-zinc-500 text-xs mt-2">Please login to view your account details.</p>
          <Link
            href="/login"
            className="mt-6 inline-block px-6 py-2.5 bg-black text-white rounded-md font-bold text-xs hover:bg-zinc-800 transition-colors shadow-sm"
          >
            Login Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] pb-20 antialiased">
      <Navbar />

      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 mb-8 text-xs text-zinc-500 font-medium">
          <Link href="/" className="hover:text-black transition-colors">Home</Link>
          <ChevronRight size={12} className="text-zinc-400" />
          <span className="text-black font-semibold">Your Account</span>
        </div>

        {/* User Info Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10 border-b border-[var(--border-default)] pb-8">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black flex items-center justify-center border-2 border-white shadow-sm">
                <UserCircle size={40} className="text-white opacity-90" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 bg-black rounded-full border-2 border-white flex items-center justify-center text-white shadow-sm">
                <ShieldCheck size={12} />
              </div>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-black tracking-tight mb-1">
                Hello, {user.name?.split(' ')[0] || 'Member'}
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs text-zinc-500 font-medium flex items-center gap-1.5">
                  <Mail size={13} className="text-zinc-400" />
                  {user.email}
                </span>
                {user.role && (
                  <span className="px-2 py-0.5 bg-zinc-100 border border-zinc-200 text-xs font-semibold text-zinc-800 rounded-md">
                    {user.role}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-[var(--border-default)] bg-white rounded-md text-xs font-bold text-black hover:bg-zinc-50 transition-all shadow-sm cursor-pointer"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <ProfileCard
            title="Your Orders"
            description="Track, return, or buy things again"
            icon={<Package size={20} />}
            href="/customer/orders"
            isIncoming={false}
          />
          <ProfileCard
            title="Login & Security"
            description="Edit login, name, and mobile number"
            icon={<ShieldCheck size={20} />}
            isIncoming={true}
          />
          <ProfileCard
            title="Your Addresses"
            description="Edit addresses for orders and gifts"
            icon={<MapPin size={20} />}
            isIncoming={true}
          />
          <ProfileCard
            title="Payment Methods"
            description="Edit or add payment methods"
            icon={<CreditCard size={20} />}
            isIncoming={true}
          />
          <ProfileCard
            title="Wishlist"
            description="View your saved items and boards"
            icon={<Heart size={20} />}
            isIncoming={true}
          />
          <ProfileCard
            title="Notifications"
            description="View account activity and reminders"
            icon={<Bell size={20} />}
            isIncoming={true}
          />
          <ProfileCard
            title="Account History"
            description="View recently viewed and saved items"
            icon={<Clock size={20} />}
            isIncoming={true}
          />
          <ProfileCard
            title="Coupons"
            description="View and manage your reward coupons"
            icon={<TicketPercent size={20} />}
            isIncoming={true}
          />
        </div>

        {/* Support Banner */}
        <div className="mt-12 p-6 sm:p-8 bg-zinc-900 rounded-md text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm border border-zinc-800">
          <div className="space-y-1.5 text-left max-w-xl">
            <h2 className="text-base font-bold text-white">Need help with your account?</h2>
            <p className="text-zinc-300 text-xs font-medium leading-relaxed">
              Our support team is available 24/7 to help you with any account or order related concerns.
            </p>
          </div>
          <Link
            href="/support"
            className="group flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-black rounded-md font-bold text-xs hover:bg-zinc-100 transition-all shadow-sm shrink-0"
          >
            Contact Support
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
