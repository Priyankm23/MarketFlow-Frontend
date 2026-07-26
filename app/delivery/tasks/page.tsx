"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  AlertCircle,
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
            credentials: "include",
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
      <div className="min-h-screen bg-[var(--bg-base)] text-black antialiased">
        <DeliveryHeader
          title="Coverage Setup"
          subtitle="Configure serviceable areas."
        />
        <div className="grid place-items-center px-4 py-20">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-black mb-3" />
            <p className="text-xs font-semibold text-zinc-500">
              Checking coverage setup...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-black antialiased pb-20">
      <DeliveryHeader
        title="Coverage Area"
        subtitle="Manage locations where you deliver."
      />

      <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        {/* INFO CARD */}
        <section className="bg-white rounded-md p-6 border border-[var(--border-default)] shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-md bg-zinc-100 border border-zinc-200 flex items-center justify-center text-black shrink-0">
            <Globe size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-black tracking-tight">
              Serviceable Regions
            </h2>
            <p className="mt-1 text-xs text-zinc-500 font-medium leading-relaxed">
              Optimize your earnings by selecting active zones. Our system matches you with orders in these high-demand areas.
            </p>
          </div>
        </section>

        {/* CURRENT COVERAGE */}
        <section className="bg-white rounded-md border border-[var(--border-default)] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border-default)] flex items-center justify-between bg-zinc-50">
            <div className="flex items-center gap-2">
              <Truck size={16} className="text-zinc-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-black">
                Active Delivery Zones
              </h3>
            </div>
            <span className="bg-zinc-100 text-black px-2.5 py-0.5 rounded-md text-xs font-bold border border-zinc-200">
              {existingCoveragePincodes.length} ZONES
            </span>
          </div>

          <div className="p-6">
            {existingCoveragePincodes.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-zinc-100 rounded-md flex items-center justify-center mx-auto mb-3 text-zinc-400">
                  <Search size={24} />
                </div>
                <p className="text-xs font-semibold text-zinc-500">
                  No zones configured yet
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {existingCoveragePincodes.map((coverage) => (
                  <span
                    key={coverage}
                    className="inline-flex items-center gap-2 rounded-md bg-zinc-50 border border-zinc-200 px-3 py-2 text-xs font-bold text-black shadow-sm"
                  >
                    <MapPin size={12} className="text-black" />
                    {coverage}
                  </span>
                ))}
              </div>
            )}

            {!showForm && (
              <button
                type="button"
                className="mt-6 w-full inline-flex items-center justify-center gap-2 h-10 rounded-md bg-black text-white text-xs font-bold hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer"
                onClick={() => setShowForm(true)}
              >
                <Plus size={16} />
                Update Zones
              </button>
            )}
          </div>
        </section>

        {/* SETUP FORM */}
        {showForm && (
          <section className="bg-white rounded-md p-6 border border-[var(--border-default)] shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-4">
              <div>
                <h3 className="text-base font-bold text-black tracking-tight">
                  Configure Zones
                </h3>
                <p className="text-xs text-zinc-500 font-medium mt-0.5">
                  Select regions to add to your partner profile
                </p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="h-8 w-8 rounded-md bg-zinc-100 flex items-center justify-center text-zinc-600 hover:text-black transition-colors border border-zinc-200 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleSubmitCoverage}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700">
                    State
                  </label>
                  <select
                    value={selectedState}
                    disabled
                    className="w-full h-10 rounded-md border border-zinc-200 bg-zinc-100 px-3 text-xs font-bold text-zinc-500 appearance-none"
                  >
                    <option value="Gujarat">Gujarat</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="city" className="text-xs font-semibold text-zinc-700">
                    City
                  </label>
                  <select
                    id="city"
                    value={selectedCity}
                    onChange={(event) => {
                      setSelectedCity(event.target.value);
                      setSelectedArea("");
                      setError("");
                    }}
                    className="w-full h-10 rounded-md border border-[var(--border-default)] bg-white px-3 text-xs font-bold text-black focus:outline-none focus:border-black transition-all"
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

              <div className="space-y-1.5">
                <label htmlFor="area" className="text-xs font-semibold text-zinc-700">
                  Area
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <select
                    id="area"
                    value={selectedArea}
                    onChange={(event) => {
                      setSelectedArea(event.target.value);
                      setError("");
                    }}
                    disabled={!selectedCity}
                    className="flex-1 h-10 rounded-md border border-[var(--border-default)] bg-white px-3 text-xs font-bold text-black focus:outline-none focus:border-black disabled:bg-zinc-100 disabled:text-zinc-400 transition-all"
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
                    className="h-10 inline-flex items-center justify-center gap-1.5 rounded-md bg-zinc-100 text-black px-4 text-xs font-bold border border-zinc-200 hover:bg-zinc-200 transition-colors shadow-sm cursor-pointer"
                  >
                    <Plus size={15} /> Add
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--border-default)]">
                <p className="text-xs font-semibold text-zinc-700 mb-3">
                  Selected Areas
                </p>
                {selectedCoverageAreas.length === 0 ? (
                  <div className="bg-zinc-50 rounded-md p-4 text-center border border-dashed border-zinc-200">
                    <p className="text-xs font-medium text-zinc-400">
                      Add areas from the dropdown above...
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedCoverageAreas.map((item) => (
                      <span
                        key={`${item.city}-${item.area}`}
                        className="inline-flex items-center gap-2 rounded-md bg-black px-3 py-1.5 text-xs font-bold text-white shadow-sm"
                      >
                        {item.city} - {item.area}
                        <button
                          type="button"
                          onClick={() => handleRemoveArea(item)}
                          className="rounded-md bg-zinc-800 p-0.5 hover:bg-zinc-700 transition-colors ml-0.5 cursor-pointer"
                        >
                          <X className="h-3 w-3 text-white" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3.5 rounded-md bg-red-50 border border-red-200 flex items-center gap-2 text-red-700 text-xs font-medium">
                  <AlertCircle size={16} className="shrink-0" /> {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-md bg-black text-white text-xs font-bold hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" /> Confirm & Save Setup
                  </>
                )}
              </button>
            </form>
          </section>
        )}

        <div className="bg-white rounded-md p-4 border border-[var(--border-default)] flex items-center gap-3 shadow-sm">
          <div className="bg-zinc-100 p-2 rounded-md border border-zinc-200 shrink-0 text-black">
            <Plus size={16} />
          </div>
          <p className="text-xs font-medium text-zinc-600 leading-relaxed">
            Pro-tip: Update your coverage regularly to stay flexible and receive more local delivery assignments.
          </p>
        </div>
      </div>
    </div>
  );
}
