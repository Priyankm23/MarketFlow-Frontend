"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import {
  CheckCircle2,
  ChevronLeft,
  Loader2,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";
import { API_BASE_URL } from "@/lib/config";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
);

type PaymentIntent = {
  orderId: string;
  paymentId?: string;
  gatewayRef?: string;
  amount?: number;
  mockCheckoutUrl?: string;
  clientSecret?: string;
  stripeClientSecret?: string;
};

type StoredPaymentSession = {
  createdAt: number;
  expiresInSeconds: number;
  intents: PaymentIntent[];
};

const formatAmount = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

const GatewayShell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-[var(--bg-base)] text-black antialiased">
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8 px-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white shadow-lg">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-black">
              Stripe Checkout
            </h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
              Secure Payment Terminal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-semibold text-zinc-500 bg-white px-4 py-2 rounded-full border border-[var(--border-default)] shadow-sm">
          <div className="flex items-center gap-1.5 border-r border-[var(--border-default)] pr-4">
            <Lock size={12} className="text-green-600" />
            <span>TLS Encrypted</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>Powered by Stripe</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-[var(--border-default)] shadow-[0_18px_45px_rgba(0,0,0,0.08)] overflow-hidden">
        {children}
      </div>
    </div>
  </div>
);

type StripePaymentFormProps = {
  amount: number;
  firstOrderId: string;
  onSuccess: () => void;
};

function StripePaymentForm({
  amount,
  firstOrderId,
  onSuccess,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || processing) return;

    setProcessing(true);
    setError("");

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || "Unable to validate payment details.");
      setProcessing(false);
      return;
    }

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/customer/orders/${firstOrderId}`,
      },
      redirect: "if_required",
    });

    if (result.error) {
      setError(result.error.message || "Payment failed. Please try again.");
      setProcessing(false);
      return;
    }

    onSuccess();
    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
          Card / UPI / Wallet / Bank
        </p>
        <div className="rounded-2xl border border-[var(--border-default)] bg-white p-4">
          <PaymentElement />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <p className="text-[10px] font-black uppercase tracking-widest text-red-600">
            {error}
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || !elements || processing}
        className="w-full h-14 bg-[var(--brand-accent)] text-white rounded-2xl font-black text-sm tracking-wide hover:bg-black transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {processing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          `Pay ${formatAmount(amount)}`
        )}
      </button>
    </form>
  );
}

export default function StripeGatewayPage() {
  const [session, setSession] = useState<StoredPaymentSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [success, setSuccess] = useState(false);
  const [sessionError, setSessionError] = useState("");
  const [fallbackClientSecret, setFallbackClientSecret] = useState("");
  const [loadingFallbackSecret, setLoadingFallbackSecret] = useState(false);

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
      setSessionError("Invalid payment session metadata.");
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
  const firstIntentAmount = Number(session?.intents?.[0]?.amount || 0);

  const stripeClientSecret =
    session?.intents?.[0]?.clientSecret ||
    session?.intents?.[0]?.stripeClientSecret ||
    fallbackClientSecret ||
    "";

  useEffect(() => {
    const hasSecretInSession =
      Boolean(session?.intents?.[0]?.clientSecret) ||
      Boolean(session?.intents?.[0]?.stripeClientSecret);

    if (
      !session ||
      hasSecretInSession ||
      !firstOrderId ||
      firstIntentAmount <= 0
    ) {
      return;
    }

    let active = true;

    const createFallbackIntent = async () => {
      setLoadingFallbackSecret(true);
      setSessionError("");

      try {
        const payload = {
          orderId: firstOrderId,
          amount: firstIntentAmount,
        };

        const endpoints = [
          `${API_BASE_URL}/payments/create-payment-intent`,
          "/api/v1/payments/create-payment-intent",
        ];

        for (const endpoint of endpoints) {
          const response = await authFetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            continue;
          }

          const data = await response.json().catch(() => ({}));
          const secret =
            data?.clientSecret ||
            data?.data?.clientSecret ||
            data?.stripeClientSecret ||
            data?.data?.stripeClientSecret;

          if (secret && active) {
            setFallbackClientSecret(secret);
            return;
          }
        }

        if (active) {
          setSessionError(
            "Unable to initialize Stripe payment intent. Please retry checkout.",
          );
        }
      } catch {
        if (active) {
          setSessionError(
            "Unable to initialize Stripe payment intent. Please retry checkout.",
          );
        }
      } finally {
        if (active) {
          setLoadingFallbackSecret(false);
        }
      }
    };

    void createFallbackIntent();

    return () => {
      active = false;
    };
  }, [session, firstOrderId, firstIntentAmount]);

  const options = useMemo(
    () =>
      stripeClientSecret
        ? {
            clientSecret: stripeClientSecret,
            appearance: {
              theme: "stripe" as const,
            },
          }
        : undefined,
    [stripeClientSecret],
  );

  const onSuccess = () => {
    setSuccess(true);
    sessionStorage.removeItem("marketflow-payment-session");

    window.setTimeout(() => {
      window.location.assign(`/customer/orders/${firstOrderId}`);
    }, 1200);
  };

  if (loadingSession) {
    return (
      <GatewayShell>
        <div className="p-20 text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-6 text-[var(--brand-accent)]" />
          <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">
            Initializing Stripe checkout...
          </p>
        </div>
      </GatewayShell>
    );
  }

  if (!session) {
    return (
      <GatewayShell>
        <div className="max-w-xl mx-auto p-12 text-center space-y-6">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <Lock size={32} />
          </div>
          <h1 className="text-2xl font-black text-black">Session Expired</h1>
          <p className="text-zinc-500 text-sm leading-relaxed">
            For your security, payment sessions expire after inactivity. Please
            return to checkout and re-initiate payment.
          </p>
          <Link
            href="/customer/checkout"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-[var(--brand-accent)] transition-colors"
          >
            <ChevronLeft size={16} />
            Return to checkout
          </Link>
        </div>
      </GatewayShell>
    );
  }

  if (!stripeClientSecret) {
    return (
      <GatewayShell>
        <div className="max-w-xl mx-auto p-12 text-center space-y-6">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <Lock size={32} />
          </div>
          <h1 className="text-2xl font-black text-black">Stripe Not Ready</h1>
          <p className="text-zinc-500 text-sm leading-relaxed">
            {loadingFallbackSecret
              ? "Preparing Stripe secure session..."
              : "Payment intent did not include a Stripe client secret. Please retry checkout."}
          </p>
          {sessionError && (
            <p className="text-xs text-red-600 font-semibold">{sessionError}</p>
          )}
          <Link
            href="/customer/checkout"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-[var(--brand-accent)] transition-colors"
          >
            <ChevronLeft size={16} />
            Back to checkout
          </Link>
        </div>
      </GatewayShell>
    );
  }

  return (
    <GatewayShell>
      <div className="grid grid-cols-1 lg:grid-cols-5 h-full">
        <div className="lg:col-span-3 p-8 sm:p-12 border-r border-[var(--border-default)]">
          {success ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-12">
              <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center">
                <CheckCircle2 size={48} className="text-green-600" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-black">
                  Payment Confirmed
                </h2>
                <p className="text-zinc-500 text-sm mt-2 font-medium">
                  Redirecting to your order details...
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-black text-black">
                  Payment Details
                </h2>
                <p className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mt-1">
                  Complete your purchase securely with Stripe
                </p>
              </div>

              {options ? (
                <Elements stripe={stripePromise} options={options}>
                  <StripePaymentForm
                    amount={totalAmount}
                    firstOrderId={firstOrderId}
                    onSuccess={onSuccess}
                  />
                </Elements>
              ) : null}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-zinc-50/70 p-8 sm:p-12">
          <div className="space-y-10">
            <div>
              <h2 className="text-lg font-bold text-black">Summary</h2>
              <div className="mt-4 p-4 bg-white rounded-2xl border border-[var(--border-default)] shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                    Total Pay
                  </span>
                  <span className="text-2xl font-black text-black tracking-tighter">
                    {formatAmount(totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                Order Breakdown
              </h3>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                {session.intents.map((intent, idx) => (
                  <div
                    key={idx}
                    className="relative pl-4 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-red-100 before:rounded-full"
                  >
                    <p className="text-[10px] font-bold text-zinc-400 uppercase">
                      Order Ref
                    </p>
                    <p className="text-xs font-black text-black truncate mb-1">
                      #{intent.orderId.slice(-12)}
                    </p>
                    <p className="text-sm font-black text-[var(--brand-accent)]">
                      {formatAmount(Number(intent.amount || 0))}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-10 border-t border-[var(--border-default)]">
              <Link
                href="/customer/checkout"
                className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-[var(--brand-accent)] transition-colors"
              >
                <ChevronLeft size={14} />
                Cancel Payment
              </Link>
            </div>
          </div>
        </div>
      </div>
    </GatewayShell>
  );
}
