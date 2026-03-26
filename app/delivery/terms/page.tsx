"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { DeliveryHeader } from "@/components/delivery-header";
import { FileText, Loader2, ShieldCheck } from "lucide-react";

export default function DeliveryTermsPage() {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleContinue = async () => {
    if (!accepted || submitting) return;
    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    router.push("/delivery/dashboard");
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6">
      <DeliveryHeader
        title="Terms & Conditions"
        subtitle="Read and accept partner terms before accessing delivery tasks."
      />

      <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-border bg-card p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-indigo-100 p-2.5 text-indigo-700">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-body text-2xl font-semibold text-foreground tracking-normal">
              Delivery Partner Terms & Conditions
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Mock content for now. This will be replaced by platform legal
              terms.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3 text-sm text-foreground">
          <div className="rounded-lg border border-border bg-secondary/20 p-3">
            1. Handle every package with care and avoid tampering.
          </div>
          <div className="rounded-lg border border-border bg-secondary/20 p-3">
            2. Attempt delivery within assigned time windows.
          </div>
          <div className="rounded-lg border border-border bg-secondary/20 p-3">
            3. Verify recipient details before handover.
          </div>
          <div className="rounded-lg border border-border bg-secondary/20 p-3">
            4. Use professional conduct with customers and vendors.
          </div>
          <div className="rounded-lg border border-border bg-secondary/20 p-3">
            5. Follow platform safety and escalation procedures.
          </div>
        </div>

        <label className="mt-5 flex items-start gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            className="mt-1"
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
          />
          I have read and agree to the delivery partner terms.
        </label>

        <button
          type="button"
          onClick={handleContinue}
          disabled={!accepted || submitting}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Processing...
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4" /> Continue To Dashboard
            </>
          )}
        </button>
      </div>
    </div>
  );
}
