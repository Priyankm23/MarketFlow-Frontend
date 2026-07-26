"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { useAuthStore } from "@/lib/store";
import { CheckCircle2, Clock3, ShieldAlert } from "lucide-react";
import {
  fetchVendorProfile,
  normalizeVendorStatus,
} from "@/lib/vendor-profile";
import { API_BASE_URL } from "@/lib/config";
import { VendorProfileData } from "@/lib/types";
import { authFetch } from "@/lib/auth-fetch";

type VendorFormState = {
  businessName: string;
  storeCategory: string;
  taxId: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
};

const initialFormState: VendorFormState = {
  businessName: "",
  storeCategory: "",
  taxId: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  country: "India",
  pincode: "",
};

const registerEndpoints = [
  `${API_BASE_URL}/vendors/register`,
  `${API_BASE_URL}/vendor/register`,
];

const stageTitle = ["Business Info", "Address", "Documents"];

export default function VendorApplyPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [form, setForm] = useState<VendorFormState>(initialFormState);
  const [govIdFile, setGovIdFile] = useState<File | null>(null);
  const [businessDocFile, setBusinessDocFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [existingProfile, setExistingProfile] =
    useState<VendorProfileData | null>(null);

  const isVendorRole = useMemo(
    () => user?.role?.toUpperCase() === "VENDOR",
    [user?.role],
  );
  const existingStatus = normalizeVendorStatus(existingProfile?.status);

  useEffect(() => {
    if (!existingProfile || existingStatus !== "APPROVED") return;

    const timeoutId = window.setTimeout(() => {
      router.push("/vendor/dashboard");
    }, 1200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [existingProfile, existingStatus, router]);

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      if (!user || !isVendorRole) {
        if (active) setLoadingProfile(false);
        return;
      }

      try {
        const profile = await fetchVendorProfile();
        if (active) {
          setExistingProfile(profile);
        }
      } catch {
        if (active) {
          setExistingProfile(null);
        }
      } finally {
        if (active) {
          setLoadingProfile(false);
        }
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, [isVendorRole, user]);

  const updateField = (key: keyof VendorFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const getServerMessage = async (response: Response) => {
    const data = await response.json().catch(() => ({}));
    return (
      data?.message ||
      data?.error ||
      data?.statusMessage ||
      "Vendor registration failed. Please try again."
    );
  };

  const validateStep = (step: number) => {
    if (step === 1) {
      if (!form.businessName.trim()) return "Business Name is required.";
      if (!form.storeCategory.trim()) return "Store Category is required.";
      return "";
    }

    if (step === 2) {
      if (!form.addressLine1.trim()) return "Address Line 1 is required.";
      if (!form.city.trim()) return "City is required.";
      if (!form.state.trim()) return "State is required.";
      if (!form.country.trim()) return "Country is required.";
      if (!form.pincode.trim()) return "Pincode is required.";
      return "";
    }

    if (step === 3) {
      if (!govIdFile || !businessDocFile) {
        return "Please upload both required documents.";
      }
    }

    return "";
  };

  const nextStep = () => {
    const message = validateStep(currentStep);
    if (message) {
      setErrorMessage(message);
      return;
    }

    setErrorMessage("");
    setCurrentStep((prev) => Math.min(3, prev + 1));
  };

  const prevStep = () => {
    setErrorMessage("");
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!user) {
      setErrorMessage("Please sign in first to apply as a vendor.");
      return;
    }

    if (!isVendorRole) {
      setErrorMessage("You cannot become a vendor for your selected role.");
      return;
    }

    if (existingProfile) {
      setErrorMessage(
        "Your vendor profile already exists. Please use Vendor Profile for updates.",
      );
      return;
    }

    const message = validateStep(3);
    if (message) {
      setErrorMessage(message);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = new FormData();

      payload.append("businessName", form.businessName.trim());
      payload.append("storeCategory", form.storeCategory.trim());
      if (form.taxId.trim()) payload.append("taxId", form.taxId.trim());
      payload.append("addressLine1", form.addressLine1.trim());
      if (form.addressLine2.trim()) {
        payload.append("addressLine2", form.addressLine2.trim());
      }
      payload.append("city", form.city.trim());
      payload.append("state", form.state.trim());
      payload.append("country", form.country.trim());
      payload.append("pincode", form.pincode.trim());
      payload.append("govId", govIdFile as File);
      payload.append("businessDoc", businessDocFile as File);

      let finalResponse: Response | null = null;
      let finalMessage = "";

      for (let i = 0; i < registerEndpoints.length; i += 1) {
        const endpoint = registerEndpoints[i];

        const response = await authFetch(endpoint, {
          method: "POST",
          credentials: "include",
          body: payload,
        });

        if (response.status === 404 && i < registerEndpoints.length - 1) {
          continue;
        }

        finalResponse = response;
        finalMessage = await getServerMessage(response);
        break;
      }

      if (!finalResponse) {
        throw new Error("Could not reach vendor registration endpoint.");
      }

      if (!finalResponse.ok) {
        if (finalResponse.status === 401 || finalResponse.status === 403) {
          throw new Error("You cannot become a vendor for your selected role.");
        }
        throw new Error(finalMessage);
      }

      setSuccessMessage("Vendor registration submitted successfully.");
      setForm(initialFormState);
      setGovIdFile(null);
      setBusinessDocFile(null);
      setCurrentStep(1);

      setTimeout(() => {
        router.push("/vendor/dashboard");
      }, 900);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to submit vendor application.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-black antialiased">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <section className="rounded-md border border-[var(--border-default)] bg-white p-6 sm:p-8 shadow-sm">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-black tracking-tight">
              Become a Vendor
            </h1>
            <p className="mt-1 text-xs sm:text-sm font-medium text-zinc-500">
              Complete this form to register your business for selling products on Markivo.
            </p>
          </div>

          {!user && (
            <div className="mb-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-xs font-medium text-amber-800">
              Please{" "}
              <Link href="/login" className="underline font-bold text-black">
                sign in
              </Link>{" "}
              with a <strong>VENDOR</strong> account to submit this form.
            </div>
          )}

          {user && !isVendorRole && (
            <div className="mb-5 rounded-md border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
              You cannot become a vendor for your selected role.
            </div>
          )}

          {loadingProfile && user && isVendorRole && (
            <div className="mb-5 rounded-md border border-[var(--border-default)] bg-zinc-50 p-4">
              <p className="text-xs font-medium text-zinc-500">
                Checking your vendor profile status...
              </p>
            </div>
          )}

          {!loadingProfile && existingProfile && (
            <div
              className={`mb-5 rounded-md border p-4 sm:p-5 ${
                existingStatus === "APPROVED"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : existingStatus === "REJECTED"
                    ? "border-red-200 bg-red-50 text-red-900"
                    : "border-amber-200 bg-amber-50 text-amber-900"
              }`}
            >
              <div className="flex items-start gap-3">
                {existingStatus === "APPROVED" && (
                  <CheckCircle2 className="h-5 w-5 mt-0.5 text-emerald-600 shrink-0" />
                )}
                {existingStatus === "PENDING" && (
                  <Clock3 className="h-5 w-5 mt-0.5 text-amber-600 shrink-0" />
                )}
                {existingStatus === "REJECTED" && (
                  <ShieldAlert className="h-5 w-5 mt-0.5 text-red-600 shrink-0" />
                )}

                <div className="flex-1">
                  <p className="text-sm font-bold text-black">
                    Vendor Profile Already Exists
                  </p>
                  <span className="mt-1.5 inline-flex rounded-md border border-current/20 px-2.5 py-0.5 text-xs font-semibold">
                    {existingStatus}
                  </span>

                  <p className="mt-2 text-xs font-medium leading-relaxed">
                    {existingStatus === "APPROVED" &&
                      "Your account is active. Redirecting you to the dashboard."}
                    {existingStatus === "PENDING" &&
                      "Your application is under review. You can track details in your profile."}
                    {existingStatus === "REJECTED" &&
                      "Your application needs updates. Review your profile and contact support if needed."}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      href="/vendor/dashboard"
                      className="inline-flex items-center justify-center rounded-md bg-black px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800 transition-colors shadow-sm"
                    >
                      Open Dashboard
                    </Link>
                    <Link
                      href="/vendor/profile"
                      className="inline-flex items-center justify-center rounded-md border border-[var(--border-default)] bg-white px-4 py-2 text-xs font-bold text-black hover:bg-zinc-50 transition-colors shadow-sm"
                    >
                      Open Profile
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="mb-5 rounded-md border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-700">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="mb-5 rounded-md border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-medium text-emerald-700">
              {successMessage}
            </div>
          )}

          {!loadingProfile && !existingProfile && (
            <>
              {/* Step indicator tabs */}
              <div className="mb-6 grid grid-cols-3 gap-2 sm:gap-3">
                {stageTitle.map((title, index) => {
                  const step = index + 1;
                  const active = currentStep === step;
                  const completed = currentStep > step;

                  return (
                    <div
                      key={title}
                      className={`rounded-md border px-3 py-2 text-xs sm:text-sm text-center font-bold transition-all ${
                        active
                          ? "border-black bg-black text-white shadow-sm"
                          : completed
                            ? "border-zinc-300 bg-zinc-100 text-zinc-900"
                            : "border-[var(--border-default)] bg-white text-zinc-400"
                      }`}
                    >
                      {step}. {title}
                    </div>
                  );
                })}
              </div>

              <form
                onSubmit={handleSubmit}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                {currentStep === 1 && (
                  <>
                    <div className="sm:col-span-2">
                      <label
                        htmlFor="businessName"
                        className="block text-xs font-semibold text-zinc-700 mb-1.5"
                      >
                        Business Name *
                      </label>
                      <input
                        id="businessName"
                        value={form.businessName}
                        onChange={(e) =>
                          updateField("businessName", e.target.value)
                        }
                        className="w-full rounded-md border border-[var(--border-default)] bg-white px-3.5 py-2.5 text-sm text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                        placeholder="Local Market Store"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label
                        htmlFor="storeCategory"
                        className="block text-xs font-semibold text-zinc-700 mb-1.5"
                      >
                        Store Category *
                      </label>
                      <input
                        id="storeCategory"
                        value={form.storeCategory}
                        onChange={(e) =>
                          updateField("storeCategory", e.target.value)
                        }
                        className="w-full rounded-md border border-[var(--border-default)] bg-white px-3.5 py-2.5 text-sm text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                        placeholder="Fashion, Electronics, Groceries"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label
                        htmlFor="taxId"
                        className="block text-xs font-semibold text-zinc-700 mb-1.5"
                      >
                        Tax ID (optional)
                      </label>
                      <input
                        id="taxId"
                        value={form.taxId}
                        onChange={(e) => updateField("taxId", e.target.value)}
                        className="w-full rounded-md border border-[var(--border-default)] bg-white px-3.5 py-2.5 text-sm text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                        placeholder="GSTIN or tax number"
                      />
                    </div>
                  </>
                )}

                {currentStep === 2 && (
                  <>
                    <div className="sm:col-span-2">
                      <label
                        htmlFor="addressLine1"
                        className="block text-xs font-semibold text-zinc-700 mb-1.5"
                      >
                        Address Line 1 *
                      </label>
                      <input
                        id="addressLine1"
                        value={form.addressLine1}
                        onChange={(e) =>
                          updateField("addressLine1", e.target.value)
                        }
                        className="w-full rounded-md border border-[var(--border-default)] bg-white px-3.5 py-2.5 text-sm text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                        placeholder="Street, area, landmark"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label
                        htmlFor="addressLine2"
                        className="block text-xs font-semibold text-zinc-700 mb-1.5"
                      >
                        Address Line 2 (optional)
                      </label>
                      <input
                        id="addressLine2"
                        value={form.addressLine2}
                        onChange={(e) =>
                          updateField("addressLine2", e.target.value)
                        }
                        className="w-full rounded-md border border-[var(--border-default)] bg-white px-3.5 py-2.5 text-sm text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                        placeholder="Apartment, suite, floor"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="city"
                        className="block text-xs font-semibold text-zinc-700 mb-1.5"
                      >
                        City *
                      </label>
                      <input
                        id="city"
                        value={form.city}
                        onChange={(e) => updateField("city", e.target.value)}
                        className="w-full rounded-md border border-[var(--border-default)] bg-white px-3.5 py-2.5 text-sm text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="state"
                        className="block text-xs font-semibold text-zinc-700 mb-1.5"
                      >
                        State *
                      </label>
                      <input
                        id="state"
                        value={form.state}
                        onChange={(e) => updateField("state", e.target.value)}
                        className="w-full rounded-md border border-[var(--border-default)] bg-white px-3.5 py-2.5 text-sm text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="country"
                        className="block text-xs font-semibold text-zinc-700 mb-1.5"
                      >
                        Country *
                      </label>
                      <input
                        id="country"
                        value={form.country}
                        onChange={(e) => updateField("country", e.target.value)}
                        className="w-full rounded-md border border-[var(--border-default)] bg-white px-3.5 py-2.5 text-sm text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="pincode"
                        className="block text-xs font-semibold text-zinc-700 mb-1.5"
                      >
                        Pincode *
                      </label>
                      <input
                        id="pincode"
                        value={form.pincode}
                        onChange={(e) => updateField("pincode", e.target.value)}
                        className="w-full rounded-md border border-[var(--border-default)] bg-white px-3.5 py-2.5 text-sm text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                      />
                    </div>
                  </>
                )}

                {currentStep === 3 && (
                  <>
                    <div>
                      <label
                        htmlFor="govId"
                        className="block text-xs font-semibold text-zinc-700 mb-1.5"
                      >
                        Government ID * (file)
                      </label>
                      <input
                        id="govId"
                        type="file"
                        onChange={(e) =>
                          setGovIdFile(e.target.files?.[0] || null)
                        }
                        className="w-full rounded-md border border-[var(--border-default)] bg-white px-3.5 py-2 text-sm text-black file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-black hover:file:bg-zinc-200 transition-colors"
                        accept=".pdf,.png,.jpg,.jpeg,.webp"
                      />
                      {govIdFile && (
                        <p className="mt-1 text-xs text-zinc-500 font-medium">
                          Selected: {govIdFile.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="businessDoc"
                        className="block text-xs font-semibold text-zinc-700 mb-1.5"
                      >
                        Business Document * (file)
                      </label>
                      <input
                        id="businessDoc"
                        type="file"
                        onChange={(e) =>
                          setBusinessDocFile(e.target.files?.[0] || null)
                        }
                        className="w-full rounded-md border border-[var(--border-default)] bg-white px-3.5 py-2 text-sm text-black file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-black hover:file:bg-zinc-200 transition-colors"
                        accept=".pdf,.png,.jpg,.jpeg,.webp"
                      />
                      {businessDocFile && (
                        <p className="mt-1 text-xs text-zinc-500 font-medium">
                          Selected: {businessDocFile.name}
                        </p>
                      )}
                    </div>
                  </>
                )}

                <div className="sm:col-span-2 mt-4 flex flex-col sm:flex-row gap-3">
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="inline-flex items-center justify-center rounded-md border border-[var(--border-default)] bg-white px-5 py-2.5 text-xs font-bold text-black hover:bg-zinc-50 transition-colors shadow-sm cursor-pointer"
                    >
                      Back
                    </button>
                  )}

                  {currentStep < 3 ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      disabled={!user || !isVendorRole}
                      className="inline-flex items-center justify-center rounded-md bg-black px-6 py-2.5 text-xs font-bold text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm cursor-pointer"
                    >
                      Continue
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting || !user || !isVendorRole}
                      className="inline-flex items-center justify-center rounded-md bg-black px-6 py-2.5 text-xs font-bold text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm cursor-pointer"
                    >
                      {isSubmitting
                        ? "Submitting..."
                        : "Submit Vendor Registration"}
                    </button>
                  )}

                  <Link
                    href="/vendor/dashboard"
                    className="inline-flex items-center justify-center rounded-md border border-[var(--border-default)] bg-white px-5 py-2.5 text-xs font-bold text-black hover:bg-zinc-50 transition-colors shadow-sm"
                  >
                    Go to Dashboard
                  </Link>
                </div>
              </form>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
