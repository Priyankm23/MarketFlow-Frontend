"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { DeliveryHeader } from "@/components/delivery-header";
import { FileText, Loader2, ShieldCheck, CheckCircle2, ChevronRight, Scale } from "lucide-react";

export default function DeliveryTermsPage() {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleContinue = async () => {
    if (!accepted || submitting) return;
    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    router.push("/delivery/dashboard");
  };

  const policies = [
    { title: "Safe Handling", desc: "Handle every package with care and avoid tampering or damage during transit." },
    { title: "Timely Delivery", desc: "Attempt delivery within the assigned time windows to maintain high service levels." },
    { title: "Verification", desc: "Always verify recipient details or collect necessary OTPs before package handover." },
    { title: "Professionalism", desc: "Maintain professional conduct with all customers and vendor partners at all times." },
    { title: "Platform Safety", desc: "Follow all platform safety guidelines and report any escalations immediately through the app." }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-body pb-20" style={{ fontFamily: "var(--font-dm-sans)" }}>
      <DeliveryHeader
        title="Agreement"
        subtitle="Review partner terms."
      />

      <div className="mx-auto mt-8 max-w-2xl px-4 space-y-6">
        <section className="bg-slate-950 rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200 text-white relative overflow-hidden text-center">
           <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-orange-600/20 rounded-full blur-3xl" />
           <div className="w-20 h-20 bg-orange-600/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-orange-500/20">
              <Scale size={32} className="text-orange-500" />
           </div>
           <h1 className="text-2xl font-black text-white tracking-tight">Terms & Conditions</h1>
           <p className="mt-2 text-xs font-bold text-slate-500 uppercase tracking-widest">Markivo Logistics Network</p>
        </section>

        <section className="space-y-4">
          {policies.map((policy, idx) => (
            <div key={idx} className="bg-white rounded-3xl p-6 border border-border shadow-sm flex items-start gap-4 transition-all hover:shadow-md group">
               <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0 group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors">
                  <span className="text-xs font-black">{idx + 1}</span>
               </div>
               <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">{policy.title}</h3>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed font-medium">{policy.desc}</p>
               </div>
            </div>
          ))}
        </section>

        <section className="bg-white rounded-[2rem] p-8 border border-border shadow-sm">
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative flex items-center mt-0.5">
               <input
                type="checkbox"
                className="peer h-5 w-5 cursor-pointer appearance-none rounded-lg border-2 border-slate-200 transition-all checked:bg-orange-600 checked:border-orange-600"
                checked={accepted}
                onChange={(event) => setAccepted(event.target.checked)}
              />
              <CheckCircle2 size={12} className="absolute left-1 top-1.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
            </div>
            <div className="flex-1">
               <p className="text-sm font-black text-slate-700 group-hover:text-orange-600 transition-colors tracking-tight">Accept Partner Agreement</p>
               <p className="mt-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">By checking, you agree to Markivo's operational standards.</p>
            </div>
          </label>

          <button
            type="button"
            onClick={handleContinue}
            disabled={!accepted || submitting}
            className="mt-8 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-6 py-4.5 text-sm font-black uppercase tracking-widest text-white hover:bg-orange-700 shadow-xl shadow-orange-200 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed h-14"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Finalizing...
              </>
            ) : (
              <>
                Launch Workspace <ChevronRight size={18} />
              </>
            )}
          </button>
        </section>

        <p className="text-[10px] text-center font-black text-slate-400 uppercase tracking-[0.3em] pt-4 opacity-50">
          SECURE PARTNER AUTHENTICATION
        </p>
      </div>
    </div>
  );
}
