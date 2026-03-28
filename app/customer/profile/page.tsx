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
} from "lucide-react";

type ProfileCardProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
};

function ProfileCard({ title, description, icon, href }: ProfileCardProps) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-4 p-6 bg-white border border-[var(--border-default)] rounded-xl hover:border-[var(--brand-accent)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    >
      <div className="mt-1 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--bg-sunken)] group-hover:bg-[var(--brand-accent-soft)] transition-colors">
        <div className="text-black group-hover:text-[var(--brand-accent)] transition-colors">
          {icon}
        </div>
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-black text-black uppercase tracking-tight mb-1 group-hover:text-[var(--brand-accent)] transition-colors">
          {title}
        </h3>
        <p className="text-xs font-bold text-zinc-400 leading-relaxed uppercase tracking-tighter">
          {description}
        </p>
      </div>
      <ChevronRight size={16} className="text-zinc-300 group-hover:text-[var(--brand-accent)] self-center" />
    </Link>
  );
}

export default function CustomerProfilePage() {
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
        <div className="max-w-xl mx-auto px-4 py-24 text-center">
          <div className="w-20 h-20 bg-[var(--bg-sunken)] rounded-full flex items-center justify-center mx-auto mb-6">
            <User size={32} className="text-zinc-300" />
          </div>
          <h1 className="text-2xl font-black text-black uppercase tracking-tight">Access Denied</h1>
          <p className="text-zinc-500 text-sm mt-2">Please login to view your account details.</p>
          <Link
            href="/login"
            className="mt-8 inline-block px-8 py-3 bg-black text-white rounded-full font-black text-xs uppercase tracking-widest hover:bg-[var(--brand-accent)] transition-colors"
          >
            Login Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] pb-20">
      <Navbar />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 mb-10 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
          <Link href="/" className="hover:text-black">Home</Link>
          <ChevronRight size={12} />
          <span className="text-black">Your Account</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-[var(--border-default)] pb-10">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-black flex items-center justify-center border-4 border-white shadow-xl">
                <UserCircle size={48} className="text-white opacity-90" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[var(--brand-accent)] rounded-full border-4 border-white flex items-center justify-center text-white shadow-lg">
                <ShieldCheck size={14} />
              </div>
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-black uppercase tracking-tighter leading-none mb-2">
                Hello, {user.name?.split(' ')[0] || 'Member'}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Mail size={12} className="text-[var(--brand-accent)]" />
                  {user.email}
                </span>
                {user.role && (
                  <span className="px-2 py-0.5 bg-[var(--bg-sunken)] border border-[var(--border-default)] text-[9px] font-black text-black uppercase tracking-widest rounded">
                    {user.role}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-black rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-sm"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ProfileCard
            title="Your Orders"
            description="Track, return, or buy things again"
            icon={<Package size={24} />}
            href="/customer/orders"
          />
          <ProfileCard
            title="Login & Security"
            description="Edit login, name, and mobile number"
            icon={<ShieldCheck size={24} />}
            href="/customer/profile/security"
          />
          <ProfileCard
            title="Your Addresses"
            description="Edit addresses for orders and gifts"
            icon={<MapPin size={24} />}
            href="/customer/profile/addresses"
          />
          <ProfileCard
            title="Payment Methods"
            description="Edit or add payment methods"
            icon={<CreditCard size={24} />}
            href="/customer/profile/payments"
          />
          <ProfileCard
            title="Wishlist"
            description="View your saved items and boards"
            icon={<Heart size={24} />}
            href="/customer/profile/wishlist"
          />
          <ProfileCard
            title="Notifications"
            description="View account activity and reminders"
            icon={<Bell size={24} />}
            href="/customer/profile/notifications"
          />
          <ProfileCard
            title="Account History"
            description="View recently viewed and saved items"
            icon={<Clock size={24} />}
            href="/customer/profile/history"
          />
          <ProfileCard
            title="Coupons"
            description="View and manage your reward coupons"
            icon={<TicketPercent size={24} />}
            href="/customer/profile/coupons"
          />
        </div>

        {/* Support Section */}
        <div className="mt-16 p-8 bg-black rounded-xl text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl border border-zinc-800">
          <div className="space-y-4 text-center md:text-left">
            <h2 className="text-xl font-black uppercase tracking-widest text-white">Need Help with your account?</h2>
            <p className="text-zinc-400 text-xs font-bold uppercase tracking-tighter max-w-lg leading-relaxed">
              Our support team is available 24/7 to help you with any account or order related issues. 
              Secure military-grade encryption protects your personal data.
            </p>
          </div>
          <Link
            href="/support"
            className="group flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-black text-xs uppercase tracking-widest hover:bg-[var(--brand-accent)] hover:text-white transition-all shadow-xl"
          >
            Contact Support
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
