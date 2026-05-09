"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authFetch } from "@/lib/auth-fetch";
import { DeliveryHeader } from "@/components/delivery-header";
import { 
  Loader2, 
  MapPin, 
  Plus, 
  ShieldCheck, 
  Truck, 
  X, 
  Search, 
  Globe, 
  ChevronRight, 
  AlertCircle 
} from "lucide-react";
import { API_BASE_URL } from "@/lib/config";

const DELIVERY_API_BASE_URL = `${API_BASE_URL}/delivery`;

type DeliveryCoverageResponse = {
  success?: boolean;
  status?: string;
  message?: string;
  data?: string[] | { coveragePincodes?: string[] };
};

const GUJARAT_COVERAGE: Record<
  string,
  Array<{ area: string; pincode: string }>
> = {
  Surat: [
    { area: "Vesu", pincode: "395007" },
    { area: "Athwa", pincode: "395001" },
    { area: "Adajan", pincode: "395009" },
    { area: "Katargam", pincode: "395004" },
  ],
  Ahmedabad: [
    { area: "Navrangpura", pincode: "380009" },
    { area: "Maninagar", pincode: "380008" },
    { area: "Bopal", pincode: "380058" },
    { area: "Satellite", pincode: "380015" },
  ],
  Vadodara: [
    { area: "Alkapuri", pincode: "390007" },
    { area: "Fatehgunj", pincode: "390002" },
    { area: "Gotri", pincode: "390021" },
    { area: "Manjalpur", pincode: "390011" },
  ],
  Rajkot: [
    { area: "Kalawad Road", pincode: "360005" },
    { area: "Yagnik Road", pincode: "360001" },
    { area: "Kuvadva Road", pincode: "360003" },
    { area: "Raiya Road", pincode: "360007" },
  ],
};

type SelectedCoverageArea = {
  city: string;
  area: string;
  pincode: string;
};

export default function DeliveryTasksPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [existingCoveragePincodes, setExistingCoveragePincodes] = useState<
    string[]
  >([]);
  const [selectedState] = useState("Gujarat");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [selectedCoverageAreas, setSelectedCoverageAreas] = useState<
    SelectedCoverageArea[]
  >([]);
  const [submitting, setSubmitting] = useState(false);

  const cityOptions = useMemo(() => Object.keys(GUJARAT_COVERAGE), []);

  const areaOptions = useMemo(() => {
    if (!selectedCity) return [];
    return GUJARAT_COVERAGE[selectedCity] || [];
  }, [selectedCity]);

  const coveragePincodes = useMemo(() => {
    return Array.from(
      new Set(
        selectedCoverageAreas.map(
          (item) => `${item.city} - ${item.area}(${item.pincode})`,
        ),
      ),
    );
  }, [selectedCoverageAreas]);

  useEffect(() => {
    let active = true;

    const loadCoveragePincodes = async () => {
      try {
        const response = await authFetch(
          `${DELIVERY_API_BASE_URL}/coverage-pincodes`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        if (!active) return;

        if (!response.ok) {
          if (response.status === 404) {
            setExistingCoveragePincodes([]);
            setShowForm(true);
            setLoading(false);
            return;
          }

          const payload = await response.json().catch(() => ({}));
          setError(payload?.message || "Unable to fetch coverage pincodes.");
          setLoading(false);
          return;
        }

        const payload: DeliveryCoverageResponse = await response
          .json()
          .catch(() => ({}));

        const coverageData = Array.isArray(payload?.data)
          ? payload.data
          : payload?.data?.coveragePincodes || [];

        setExistingCoveragePincodes(coverageData);
        setShowForm(coverageData.length === 0);
        setLoading(false);
      } catch {
        if (!active) return;
        setError("Unable to fetch coverage pincodes. Please try again.");
        setLoading(false);
      }
    };

    void loadCoveragePincodes();

    return () => {
      active = false;
    };
  }, []);

  const handleSubmitCoverage = async (event: React.FormEvent) => {
    event.preventDefault();

    if (coveragePincodes.length === 0) {
      setError("Please add at least one area to build coverage pincodes.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const response = await authFetch(`${DELIVERY_API_BASE_URL}/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ coveragePincodes }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setError(payload?.message || "Could not save coverage locations.");
        setSubmitting(false);
        return;
      }

      router.push("/delivery/terms");
    } catch {
      setError("Could not save coverage locations.");
      setSubmitting(false);
    }
  };

  const handleAddArea = () => {
    if (!selectedCity || !selectedArea) {
      setError("Please select both city and area.");
      return;
    }

    const mappedArea = areaOptions.find(
      (option) => option.area === selectedArea,
    );
    if (!mappedArea) {
      setError("Invalid area selected.");
      return;
    }

    const alreadyAdded = selectedCoverageAreas.some(
      (item) => item.city === selectedCity && item.area === selectedArea,
    );

    if (alreadyAdded) {
      setError("This area is already added.");
      return;
    }

    setSelectedCoverageAreas((prev) => [
      ...prev,
      {
        city: selectedCity,
        area: mappedArea.area,
        pincode: mappedArea.pincode,
      },
    ]);
    setSelectedArea("");
    setError("");
  };

  const handleRemoveArea = (target: SelectedCoverageArea) => {
    setSelectedCoverageAreas((prev) =>
      prev.filter(
        (item) => !(item.city === target.city && item.area === target.area),
      ),
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 font-body">
        <DeliveryHeader
          title="Coverage Setup"
          subtitle="Configure serviceable areas."
        />
        <div className="grid place-items-center px-4 py-20">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-orange-600 mb-4" />
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">
              Checking coverage setup...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-slate-50 font-body pb-20"
      style={{ fontFamily: "var(--font-dm-sans)" }}
    >
      <DeliveryHeader
        title="Coverage Area"
        subtitle="Manage locations where you deliver."
      />

      <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
        {/* INFO CARD */}
        <section className="bg-slate-950 rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200 text-white relative overflow-hidden">
           <div className="absolute right-0 top-0 w-32 h-32 bg-orange-600 rounded-bl-[5rem] opacity-20" />
           <div className="relative z-10">
              <div className="flex items-center gap-3 text-orange-500 mb-4">
                <div className="bg-orange-500/10 p-2.5 rounded-2xl border border-orange-500/20">
                  <Globe size={24} />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">Logistics Network</p>
                   <h2 className="text-xl font-black text-white tracking-tight">Serviceable Regions</h2>
                </div>
              </div>

              <p className="text-sm text-slate-400 leading-relaxed max-w-md font-medium">
                Optimize your earnings by selecting active zones. Our system matches you with orders in these high-demand areas.
              </p>
           </div>
        </section>

        {/* CURRENT COVERAGE */}
        <section className="bg-white rounded-[2.5rem] border border-border shadow-sm overflow-hidden">
           <div className="px-8 py-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
              <div className="flex items-center gap-2">
                 <Truck size={16} className="text-slate-400" />
                 <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Active Delivery Zones</h3>
              </div>
              <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
                {existingCoveragePincodes.length} ZONES
              </span>
           </div>
           
           <div className="p-8">
              {existingCoveragePincodes.length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-slate-50 rounded-[1.25rem] flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-inner">
                    <Search size={32} className="text-slate-200" />
                  </div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No zones configured</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2.5">
                  {existingCoveragePincodes.map((coverage) => (
                    <span
                      key={coverage}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-700 shadow-sm transition-all hover:border-orange-200 hover:bg-orange-50/30"
                    >
                      <MapPin size={12} className="text-orange-500" />
                      {coverage}
                    </span>
                  ))}
                </div>
              )}

              {!showForm && (
                <button
                  type="button"
                  className="mt-8 w-full inline-flex items-center justify-center gap-2 rounded-[1.5rem] bg-orange-600 px-6 py-4 text-sm font-black uppercase tracking-widest text-white hover:bg-orange-700 shadow-xl shadow-orange-200 transition-all active:scale-[0.98]"
                  onClick={() => setShowForm(true)}
                >
                  <Plus size={18} />
                  Update Zones
                </button>
              )}
           </div>
        </section>

        {/* SETUP FORM */}
        {showForm && (
          <section className="bg-white rounded-[2.5rem] p-8 border border-orange-100 shadow-2xl shadow-orange-900/10 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex items-center justify-between mb-8">
                <div>
                   <h3 className="text-lg font-black text-slate-900 tracking-tight">Configure Zones</h3>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Select regions to add</p>
                </div>
                <button 
                  onClick={() => setShowForm(false)}
                  className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors border border-slate-100 shadow-sm"
                >
                  <X size={20} />
                </button>
             </div>

             <form className="space-y-6" onSubmit={handleSubmitCoverage}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">State</label>
                    <div className="relative">
                      <select
                        value={selectedState}
                        disabled
                        className="w-full h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-400 appearance-none shadow-inner"
                      >
                        <option value="Gujarat">Gujarat</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="city" className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 ml-1">City</label>
                    <select
                      id="city"
                      value={selectedCity}
                      onChange={(event) => {
                        setSelectedCity(event.target.value);
                        setSelectedArea("");
                        setError("");
                      }}
                      className="w-full h-12 rounded-2xl border border-orange-100 bg-white px-4 text-sm font-black text-slate-900 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-600 outline-none transition-all shadow-sm"
                    >
                      <option value="">Select city</option>
                      {cityOptions.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="area" className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 ml-1">Area</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <select
                      id="area"
                      value={selectedArea}
                      onChange={(event) => {
                        setSelectedArea(event.target.value);
                        setError("");
                      }}
                      disabled={!selectedCity}
                      className="flex-1 h-12 rounded-2xl border border-orange-100 bg-white px-4 text-sm font-black text-slate-900 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-600 outline-none transition-all shadow-sm disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200"
                    >
                      <option value="">
                        {selectedCity ? "Select area" : "Select city first"}
                      </option>
                      {areaOptions.map((area) => (
                        <option
                          key={`${selectedCity}-${area.area}`}
                          value={area.area}
                        >
                          {area.area} ({area.pincode})
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={handleAddArea}
                      className="h-12 inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-50 px-6 text-xs font-black uppercase tracking-widest text-orange-700 border border-orange-100 hover:bg-orange-100 transition-all active:scale-95 shadow-sm shadow-orange-100"
                    >
                      <Plus size={16} /> Add
                    </button>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-50">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 ml-1">New Selection</p>
                  {selectedCoverageAreas.length === 0 ? (
                    <div className="bg-slate-50 rounded-[1.5rem] p-6 text-center border border-dashed border-slate-200">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic opacity-60">Ready to pick zones...</p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2.5">
                      {selectedCoverageAreas.map((item) => (
                        <span
                          key={`${item.city}-${item.area}`}
                          className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-[11px] font-black text-white shadow-lg shadow-orange-200 animate-in zoom-in duration-300"
                        >
                          {item.city} - {item.area}
                          <button
                            type="button"
                            onClick={() => handleRemoveArea(item)}
                            className="rounded-lg bg-white/20 p-1 hover:bg-white/30 transition-colors ml-1"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {error && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-center gap-3 text-rose-700 text-xs font-black shadow-sm">
                     <AlertCircle size={16} className="shrink-0" /> {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-[1.5rem] bg-slate-950 px-6 py-4.5 text-sm font-black uppercase tracking-[0.2em] text-white hover:bg-black shadow-2xl shadow-slate-200 transition-all active:scale-[0.98] disabled:opacity-60 h-14"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-5 w-5" /> Confirm Setup
                    </>
                  )}
                </button>
             </form>
          </section>
        )}

        <div className="bg-white/50 rounded-2xl p-5 border border-orange-100/50 flex items-center gap-4">
           <div className="bg-white p-2.5 rounded-[1rem] border border-orange-100 shadow-sm shrink-0">
              <Plus size={18} className="text-orange-600" />
           </div>
           <p className="text-[10px] font-black text-orange-700/60 uppercase tracking-widest leading-relaxed">
             Pro-tip: Update your coverage regularly to stay flexible and find more orders.
           </p>
        </div>
      </div>
    </div>
  );
}
