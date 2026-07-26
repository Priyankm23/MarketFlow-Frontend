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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 px-1">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/Stripe-Logo.png"
            alt="Stripe"
            className="h-9 sm:h-10 w-auto object-contain"
          />
        </div>

        <div className="flex items-center gap-3 text-xs font-medium text-zinc-600 bg-white px-3.5 py-1.5 rounded-md border border-[var(--border-default)] shadow-sm">
          <div className="flex items-center gap-1.5 border-r border-[var(--border-default)] pr-3">
            <Lock size={13} className="text-emerald-600" />
            <span>256-Bit SSL Encrypted</span>
          </div>
          <div className="flex items-center gap-1 text-zinc-500">
            <span>Powered by Stripe</span>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-md border border-[var(--border-default)] shadow-sm overflow-hidden">
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
        <label className="block text-xs font-semibold text-zinc-600">
          Payment Method
        </label>
        <div className="rounded-md border border-[var(--border-default)] bg-white p-4 sm:p-5 shadow-sm">
          <PaymentElement />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 rounded-md border border-red-200 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
          <p className="text-xs font-medium text-red-600 leading-relaxed">
            {error}
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || !elements || processing}
        className="w-full h-12 bg-black hover:bg-zinc-800 text-white rounded-md font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm cursor-pointer"
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
    const raw = sessionStorage.getItem("markivo-payment-session");
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
    sessionStorage.removeItem("markivo-payment-session");

    window.setTimeout(() => {
      window.location.assign(`/customer/orders/${firstOrderId}`);
    }, 1200);
  };

  if (loadingSession) {
    return (
      <GatewayShell>
        <div className="p-16 text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-black" />
          <p className="text-xs font-semibold text-zinc-500">
            Initializing secure checkout...
          </p>
        </div>
      </GatewayShell>
    );
  }

  if (!session) {
    return (
      <GatewayShell>
        <div className="max-w-md mx-auto p-10 text-center space-y-5">
          <div className="w-12 h-12 bg-zinc-100 text-black rounded-md flex items-center justify-center mx-auto">
            <Lock size={24} />
          </div>
          <h1 className="text-xl font-bold text-black tracking-tight">
            Session Expired
          </h1>
          <p className="text-zinc-500 text-xs leading-relaxed">
            For your security, payment sessions expire after inactivity. Please
            return to checkout to re-initiate your payment.
          </p>
          <Link
            href="/customer/checkout"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-md bg-black text-white text-xs font-bold hover:bg-zinc-800 transition-colors shadow-sm"
          >
            <ChevronLeft size={16} />
            Return to Checkout
          </Link>
        </div>
      </GatewayShell>
    );
  }

  if (!stripeClientSecret) {
    return (
      <GatewayShell>
        <div className="max-w-md mx-auto p-10 text-center space-y-5">
          <div className="w-12 h-12 bg-zinc-100 text-black rounded-md flex items-center justify-center mx-auto">
            <Lock size={24} />
          </div>
          <h1 className="text-xl font-bold text-black tracking-tight">
            Stripe Session Not Ready
          </h1>
          <p className="text-zinc-500 text-xs leading-relaxed">
            {loadingFallbackSecret
              ? "Preparing secure Stripe session..."
              : "Payment intent did not include a Stripe client secret. Please retry checkout."}
          </p>
          {sessionError && (
            <p className="text-xs text-red-600 font-medium">{sessionError}</p>
          )}
          <Link
            href="/customer/checkout"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-md bg-black text-white text-xs font-bold hover:bg-zinc-800 transition-colors shadow-sm"
          >
            <ChevronLeft size={16} />
            Back to Checkout
          </Link>
        </div>
      </GatewayShell>
    );
  }

  return (
    <GatewayShell>
      <div className="grid grid-cols-1 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-[var(--border-default)]">
        {/* Left Column: Form */}
        <div className="lg:col-span-3 p-6 sm:p-10">
          {success ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-10">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
                <CheckCircle2 size={36} className="text-emerald-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-black tracking-tight">
                  Payment Confirmed
                </h2>
                <p className="text-zinc-500 text-xs mt-1.5 font-medium">
                  Redirecting to your order details...
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-black tracking-tight">
                  Payment Details
                </h2>
                <p className="text-xs text-zinc-500 mt-1 font-medium">
                  Complete your purchase securely via Stripe
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

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-2 bg-zinc-50/60 p-6 sm:p-10">
          <div className="space-y-8">
            <div>
              <h2 className="text-base font-bold text-black">Summary</h2>
              <div className="mt-3 p-4 bg-white rounded-md border border-[var(--border-default)] shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-500">
                    Total Payable
                  </span>
                  <span className="text-2xl font-bold text-black tracking-tight">
                    {formatAmount(totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-black uppercase tracking-wide">
                Order Breakdown
              </h3>
              <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1 scrollbar-hide">
                {session.intents.map((intent, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white border border-[var(--border-default)] rounded-md space-y-1 shadow-sm"
                  >
                    <p className="text-[11px] font-medium text-zinc-500">
                      Order Ref
                    </p>
                    <p className="text-xs font-bold text-black truncate">
                      #{intent.orderId}
                    </p>
                    <p className="text-xs font-bold text-black pt-0.5">
                      {formatAmount(Number(intent.amount || 0))}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-[var(--border-default)]">
              <Link
                href="/customer/checkout"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-black transition-colors"
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
