"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { 
  CheckCircle2, 
  CreditCard, 
  Loader2, 
  Lock, 
  ShieldCheck, 
  Smartphone, 
  Globe,
  ArrowRight,
  ChevronLeft
} from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { authFetch } from "@/lib/auth-fetch";
import { API_BASE_URL } from "@/lib/config";

const GATEWAY_NAME = "SwiftPay";
const GATEWAY_HOST = "checkout.swiftpay-india.com";
const GATEWAY_LABEL = `${GATEWAY_NAME} Gateway`;

type PaymentIntent = {
  orderId: string;
  paymentId?: string;
  gatewayRef?: string;
  amount?: number;
  mockCheckoutUrl?: string;
};

type StoredPaymentSession = {
  createdAt: number;
  expiresInSeconds: number;
  intents: PaymentIntent[];
};

const randomEventId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `evt_${crypto.randomUUID()}`;
  }
  return `evt_${Math.random().toString(36).slice(2)}`;
};

const formatAmount = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

const GatewayShell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900">
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 lg:py-20">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8 px-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">{GATEWAY_NAME}</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Secure Payment Terminal</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-500 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
          <div className="flex items-center gap-1.5 border-r border-slate-200 pr-4">
            <Lock size={12} className="text-emerald-500" />
            <span>256-bit SSL</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Globe size={12} />
            <span>{GATEWAY_HOST}</span>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden">
        {children}
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-6 px-4">
        <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-5" />
        <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-8" />
        <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-6" />
        <div className="text-[10px] font-black tracking-[0.2em] text-slate-300 uppercase border-l border-slate-200 pl-10 hidden sm:block">PCI DSS COMPLIANT</div>
      </div>
    </div>
  </div>
);

export default function MockGatewayPage() {
  const router = useRouter();
  const [session, setSession] = useState<StoredPaymentSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [expiry, setExpiry] = useState("12/30");
  const [cvv, setCvv] = useState("123");

  useEffect(() => {
    const raw = sessionStorage.getItem("marketflow-payment-session");
    if (!raw) {
      setLoadingSession(false);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as StoredPaymentSession;
      if (!parsed?.intents || parsed.intents.length === 0) {
        setLoadingSession(false);
        return;
      }
      setSession(parsed);
    } catch {
      setError("Invalid session metadata.");
    } finally {
      setLoadingSession(false);
    }
  }, []);

  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user?.name) setCardName(user.name);
    else if (!cardName) setCardName("Valued Customer");
  }, [user]);

  const totalAmount = useMemo(() => {
    return (session?.intents || []).reduce((sum, intent) => sum + Number(intent.amount || 0), 0);
  }, [session]);

  const firstOrderId = session?.intents?.[0]?.orderId || "";

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || processing || success) return;

    setProcessing(true);
    setError("");

    try {
      await new Promise((resolve) => setTimeout(resolve, 2500));

      for (const intent of session.intents) {
        const transactionId = intent.gatewayRef;
        if (!transactionId) throw new Error(`Transaction fault: Order ${intent.orderId}`);

        const response = await authFetch(`${API_BASE_URL}/payments/webhook`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId: randomEventId(),
            type: "payment.success",
            data: {
              transactionId,
              orderId: intent.orderId,
              paymentId: intent.paymentId,
              amount: intent.amount,
            },
          }),
        });

        if (!response.ok) throw new Error("Verification bridge failure.");
      }

      setSuccess(true);
      sessionStorage.removeItem("marketflow-payment-session");

      window.setTimeout(() => {
        router.push(`/customer/orders/${firstOrderId}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Handshake failed.");
    } finally {
      setProcessing(false);
    }
  };

  if (loadingSession) {
    return (
      <GatewayShell>
        <div className="p-20 text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-6 text-indigo-600" />
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">Initializing Secure Bridge...</p>
        </div>
      </GatewayShell>
    );
  }

  if (!session) {
    return (
      <GatewayShell>
        <div className="max-w-xl mx-auto p-12 text-center space-y-6">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <Lock size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Session Expired</h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            For your security, payment sessions expire after 15 minutes of inactivity. Please return to the store to re-initiate checkout.
          </p>
          <Link
            href="/customer/checkout"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-black transition-colors"
          >
            <ChevronLeft size={16} />
            Return to Store
          </Link>
        </div>
      </GatewayShell>
    );
  }

  return (
    <GatewayShell>
      <div className="grid grid-cols-1 lg:grid-cols-5 h-full">
        {/* Left: Interaction Side */}
        <div className="lg:col-span-3 p-8 sm:p-12 border-r border-slate-100">
          {success ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-12">
              <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center">
                <CheckCircle2 size={48} className="text-emerald-500 animate-bounce" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-900">Transaction Confirmed</h2>
                <p className="text-slate-500 text-sm mt-2 font-medium">Authorization successful. Redirecting you back shortly...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-10">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Payment Details</h2>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mt-1">Pay with Credit or Debit Card</p>
              </div>

              <form onSubmit={handleSubmitPayment} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Cardholder Name</label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="w-full h-14 px-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Card Number</label>
                  <div className="relative">
                    <CreditCard className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full h-14 pl-14 pr-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold tracking-[0.2em] focus:bg-white focus:border-indigo-500 outline-none transition-all"
                      placeholder="XXXX XXXX XXXX XXXX"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Expiry Date</label>
                    <input
                      type="text"
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      className="w-full h-14 px-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all text-center"
                      placeholder="MM/YY"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">CVC / CVV</label>
                    <input
                      type="password"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      className="w-full h-14 px-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all text-center"
                      placeholder="***"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-red-600">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={processing}
                  className="group relative w-full h-16 bg-indigo-600 text-white rounded-2xl font-bold text-sm tracking-wide hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-70 disabled:grayscale flex items-center justify-center gap-3"
                >
                  {processing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Confirm Payment • {formatAmount(totalAmount)}
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              <div className="pt-6 border-t border-slate-100 flex items-center justify-center gap-6">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-tighter">
                  <Smartphone size={14} />
                  Mobile Optimized
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-tighter">
                  <ShieldCheck size={14} />
                  Encrypted
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Summary Side */}
        <div className="lg:col-span-2 bg-slate-50/50 p-8 sm:p-12">
          <div className="space-y-10">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Summary</h2>
              <div className="mt-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Pay</span>
                  <span className="text-2xl font-black text-slate-900 tracking-tighter">{formatAmount(totalAmount)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Order Breakdown</h3>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                {session.intents.map((intent, idx) => (
                  <div key={idx} className="relative pl-4 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-indigo-100 before:rounded-full">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Order Ref</p>
                    <p className="text-xs font-black text-slate-900 truncate mb-1">#{intent.orderId.slice(-12)}</p>
                    <p className="text-sm font-black text-indigo-600">{formatAmount(Number(intent.amount || 0))}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-10 border-t border-slate-200/60">
              <Link
                href="/customer/checkout"
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors"
              >
                <ChevronLeft size={14} />
                Cancel Transaction
              </Link>
            </div>
          </div>
        </div>
      </div>
    </GatewayShell>
  );
}
