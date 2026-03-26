"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { authFetch } from "@/lib/auth-fetch";
import { DeliveryHeader } from "@/components/delivery-header";
import { Loader2, MapPin, Plus, ShieldCheck, Truck, X } from "lucide-react";
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
      <div className="min-h-screen bg-background">
        <DeliveryHeader
          title="Coverage Setup"
          subtitle="Configure serviceable areas before accepting deliveries."
        />
        <div className="grid place-items-center px-4 py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
            <p className="mt-3 text-sm text-muted-foreground">
              Checking delivery coverage setup...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-background px-4 py-8 sm:px-6 font-body"
      style={{ fontFamily: "var(--font-dm-sans)" }}
    >
      <DeliveryHeader
        title="Coverage Setup"
        subtitle="Configure serviceable areas before accepting deliveries."
      />

      <div className="mx-auto max-w-3xl mt-6">
        <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div className="flex items-center gap-2 text-indigo-700">
            <Truck className="h-5 w-5" />
            <p className="text-sm font-semibold">Delivery Coverage Setup</p>
          </div>

          <div className="mt-5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
            {existingCoveragePincodes.length === 0
              ? "Your delivery profile does not have coverage locations yet."
              : "Coverage pincodes loaded from your delivery profile."}
          </div>

          {existingCoveragePincodes.length > 0 ? (
            <div className="mt-4">
              <p className="text-xs font-medium text-foreground">
                Current Coverage
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {existingCoveragePincodes.map((coverage) => (
                  <span
                    key={coverage}
                    className="inline-flex items-center rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-foreground"
                  >
                    {coverage}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {!showForm ? (
            <button
              type="button"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              onClick={() => setShowForm(true)}
            >
              <MapPin className="h-4 w-4" />
              Add Or Update Coverage
            </button>
          ) : (
            <form className="mt-5 space-y-4" onSubmit={handleSubmitCoverage}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground">
                    State
                  </label>
                  <select
                    value={selectedState}
                    disabled
                    className="mt-2 w-full rounded-lg border border-border bg-secondary/30 px-3 py-2 text-sm"
                  >
                    <option value="Gujarat">Gujarat</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="city"
                    className="text-sm font-medium text-foreground"
                  >
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
                    className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-500"
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

              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-end">
                <div>
                  <label
                    htmlFor="area"
                    className="text-sm font-medium text-foreground"
                  >
                    Area
                  </label>
                  <select
                    id="area"
                    value={selectedArea}
                    onChange={(event) => {
                      setSelectedArea(event.target.value);
                      setError("");
                    }}
                    disabled={!selectedCity}
                    className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-500 disabled:opacity-60"
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
                </div>

                <button
                  type="button"
                  onClick={handleAddArea}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
                >
                  <Plus className="h-4 w-4" /> Add Area
                </button>
              </div>

              <div>
                <p className="text-xs font-medium text-foreground">
                  Selected Areas
                </p>
                {selectedCoverageAreas.length === 0 ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    No area selected yet.
                  </p>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedCoverageAreas.map((item) => (
                      <span
                        key={`${item.city}-${item.area}`}
                        className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-700"
                      >
                        {item.city} - {item.area}({item.pincode})
                        <button
                          type="button"
                          onClick={() => handleRemoveArea(item)}
                          className="rounded-full p-0.5 hover:bg-indigo-200"
                          aria-label={`Remove ${item.area}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-2">
                {existingCoveragePincodes.length > 0 ? (
                  <button
                    type="button"
                    className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-secondary"
                    onClick={() => {
                      setShowForm(false);
                      setError("");
                    }}
                  >
                    Cancel
                  </button>
                ) : null}

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" /> Save And Continue
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </section>

        <p className="mt-4 text-xs text-muted-foreground">
          Already configured? Go to{" "}
          <Link
            href="/delivery/dashboard"
            className="text-indigo-700 hover:underline"
          >
            delivery dashboard
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
