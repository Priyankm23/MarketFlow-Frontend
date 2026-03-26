"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CreditCard, Loader2, Lock } from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";
import { API_BASE_URL } from "@/lib/config";
const GATEWAY_NAME = "IndigoPay";
const GATEWAY_HOST = "pay.indigopay-secure.com";
const GATEWAY_LABEL = `${GATEWAY_NAME} Checkout`;

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
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `evt_${crypto.randomUUID()}`;
  }
  return `evt_${Math.random().toString(36).slice(2)}`;
};

const formatAmount = (amount: number) => `₹${amount.toLocaleString()}`;

const GatewayShell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-[radial-gradient(circle_at_15%_15%,#EEF2FF,transparent_45%),radial-gradient(circle_at_85%_85%,#E0E7FF,transparent_40%),#F8FAFC] text-slate-900">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(30,41,59,0.14)] overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </div>
            <span className="inline-flex items-center rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs sm:text-sm font-semibold text-indigo-800">
              {GATEWAY_LABEL}
            </span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
            <Lock className="h-3.5 w-3.5 text-indigo-600" />
            {GATEWAY_HOST}
          </div>
        </div>
        {children}
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

  const [cardName, setCardName] = useState("Priya Customer");
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
      setError("Invalid payment session. Please retry checkout.");
    } finally {
      setLoadingSession(false);
    }
  }, []);

  const totalAmount = useMemo(() => {
    return (session?.intents || []).reduce(
      (sum, intent) => sum + Number(intent.amount || 0),
      0,
    );
  }, [session]);

  const firstOrderId = session?.intents?.[0]?.orderId || "";

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || processing || success) {
      return;
    }

    setProcessing(true);
    setError("");

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      for (const intent of session.intents) {
        const transactionId = intent.gatewayRef;
        if (!transactionId) {
          throw new Error(
            `Missing gateway reference for order ${intent.orderId}`,
          );
        }

        const response = await authFetch(`${API_BASE_URL}/payments/webhook`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
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

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(
            payload?.message ||
              payload?.error ||
              `Webhook confirmation failed for order ${intent.orderId}`,
          );
        }
      }

      setSuccess(true);
      sessionStorage.removeItem("marketflow-payment-session");

      window.setTimeout(() => {
        router.push(`/customer/orders/${firstOrderId}`);
      }, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setProcessing(false);
    }
  };

  if (loadingSession) {
    return (
      <GatewayShell>
        <div className="px-6 py-20 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3 text-indigo-600" />
          <p className="text-slate-600">Redirecting to {GATEWAY_NAME}...</p>
        </div>
      </GatewayShell>
    );
  }

  if (!session) {
    return (
      <GatewayShell>
        <div className="max-w-3xl mx-auto px-6 py-16">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-4">
            <h1 className="text-3xl font-semibold text-slate-900">
              Secure Session Missing
            </h1>
            <p className="text-slate-600">
              Please return to checkout and create a payment session again.
            </p>
            <Link
              href="/customer/checkout"
              className="inline-flex px-5 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700"
            >
              Return to MarketFlow
            </Link>
          </div>
        </div>
      </GatewayShell>
    );
  }

  return (
    <GatewayShell>
      <div className="px-4 py-6 sm:px-6 sm:py-8 bg-slate-900 text-slate-100 border-b border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-indigo-300/90">
              Independent Payment Service
            </p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-semibold">
              {GATEWAY_LABEL}
            </h1>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-800/90 border border-slate-700 px-4 py-2 text-sm font-semibold">
            <CreditCard className="w-4 h-4 text-indigo-300" />
            VISA
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-5 gap-8">
          <section className="lg:col-span-3 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            {success ? (
              <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center space-y-3">
                <CheckCircle2 className="w-14 h-14 text-green-600 mx-auto" />
                <h2 className="text-2xl font-semibold text-green-700">
                  Payment Successful
                </h2>
                <p className="text-green-700/90">
                  Payment was approved. Returning you to your order timeline.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitPayment} className="space-y-5">
                <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
                  You are completing this payment on {GATEWAY_NAME}. This page
                  is separate from MarketFlow.
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700">
                    Card Number
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="4242 4242 4242 4242"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-700">
                      Expiry
                    </label>
                    <input
                      type="text"
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="MM/YY"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-700">
                      CVV
                    </label>
                    <input
                      type="password"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="123"
                      required
                    />
                  </div>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={processing}
                  className="w-full px-5 py-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-semibold disabled:opacity-60 inline-flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing Payment...
                    </>
                  ) : (
                    `Pay ${formatAmount(totalAmount)}`
                  )}
                </button>
              </form>
            )}
          </section>

          <aside className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 h-fit">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Payment Summary
            </h2>
            <div className="space-y-3 text-sm">
              {(session.intents || []).map((intent, index) => (
                <div
                  key={`${intent.orderId}-${index}`}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                >
                  <p className="text-slate-500">Order</p>
                  <p className="font-mono text-slate-900 break-all">
                    {intent.orderId}
                  </p>
                  <p className="text-slate-500 mt-2">Gateway Ref</p>
                  <p className="font-mono text-slate-900 break-all">
                    {intent.gatewayRef || "-"}
                  </p>
                  <p className="text-slate-500 mt-2">Amount</p>
                  <p className="font-semibold text-slate-900">
                    {formatAmount(Number(intent.amount || 0))}
                  </p>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-200 mt-5 pt-4 flex items-center justify-between">
              <span className="text-slate-500">Total</span>
              <span className="text-xl font-bold text-indigo-600">
                {formatAmount(totalAmount)}
              </span>
            </div>

            <Link
              href="/customer/checkout"
              className="mt-6 inline-flex text-sm font-medium text-slate-600 hover:text-indigo-700"
            >
              Cancel and return to checkout
            </Link>
          </aside>
        </div>
      </div>
    </GatewayShell>
  );
}
