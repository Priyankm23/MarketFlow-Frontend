"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { DeliveryHeader } from "@/components/delivery-header";
import { FileText, Loader2, CheckCircle2, ChevronRight, Scale } from "lucide-react";

export default function DeliveryTermsPage() {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleContinue = async () => {
    if (!accepted || submitting) return;
    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    router.push("/delivery/dashboard");
  };

  const policies = [
    {
      title: "Safe Package Handling",
      desc: "Handle every package with extreme care and avoid tampering or damage during transit.",
    },
    {
      title: "Timely Delivery Commitment",
      desc: "Attempt delivery within assigned time windows to maintain high customer satisfaction.",
    },
    {
      title: "Recipient Verification",
      desc: "Always verify delivery destination and collect necessary OTP or signature upon handover.",
    },
    {
      title: "Professional Conduct",
      desc: "Maintain professional, respectful interactions with all customers and vendor partners.",
    },
    {
      title: "Platform Safety & Escalations",
      desc: "Follow platform safety guidelines and report any logistics issues immediately through the partner app.",
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-black antialiased pb-20">
      <DeliveryHeader
        title="Partner Agreement"
        subtitle="Review Markivo logistics network operational terms & standards."
      />

      <div className="mx-auto mt-8 max-w-2xl px-4 sm:px-6 space-y-6">
        {/* Banner */}
        <section className="bg-white rounded-md border border-[var(--border-default)] p-6 sm:p-8 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-md bg-zinc-100 border border-zinc-200 flex items-center justify-center text-black shrink-0">
            <Scale size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-black tracking-tight">
              Terms & Operational Conditions
            </h1>
            <p className="mt-1 text-xs text-zinc-500 font-medium leading-relaxed">
              As an active delivery partner on the Markivo Network, you agree to adhere to strict safety, accuracy, and timeliness benchmarks on all assigned fulfillment tasks.
            </p>
          </div>
        </section>

        {/* Policy Checklist */}
        <section className="space-y-3">
          {policies.map((policy, idx) => (
            <div
              key={idx}
              className="bg-white rounded-md p-5 border border-[var(--border-default)] shadow-sm flex items-start gap-4"
            >
              <div className="w-7 h-7 rounded-md bg-zinc-100 border border-zinc-200 flex items-center justify-center text-black font-bold text-xs shrink-0">
                {idx + 1}
              </div>
              <div>
                <h3 className="text-xs font-bold text-black">{policy.title}</h3>
                <p className="mt-0.5 text-xs text-zinc-500 font-medium leading-relaxed">
                  {policy.desc}
                </p>
              </div>
            </div>
          ))}
        </section>

        {/* Acceptance Box */}
        <section className="bg-white rounded-md p-6 border border-[var(--border-default)] shadow-sm space-y-6">
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative flex items-center mt-0.5">
              <input
                type="checkbox"
                className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-zinc-300 transition-all checked:bg-black checked:border-black"
                checked={accepted}
                onChange={(event) => setAccepted(event.target.checked)}
              />
              <CheckCircle2
                size={12}
                className="absolute left-0.5 top-0.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"
              />
            </div>
            <div>
              <p className="text-xs font-bold text-black group-hover:text-zinc-700 transition-colors">
                Accept Partner Agreement
              </p>
              <p className="mt-0.5 text-[11px] font-medium text-zinc-500">
                By checking, you confirm compliance with Markivo operational standards.
              </p>
            </div>
          </label>

          <button
            type="button"
            onClick={handleContinue}
            disabled={!accepted || submitting}
            className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-md bg-black text-white text-xs font-bold hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Confirming Agreement...
              </>
            ) : (
              <>
                Launch Workspace <ChevronRight size={16} />
              </>
            )}
          </button>
        </section>

        <p className="text-[10px] text-center font-bold text-zinc-400 uppercase tracking-widest pt-2">
          SECURE PARTNER AUTHENTICATION & LOGISTICS NETWORK
        </p>
      </div>
    </div>
  );
}
