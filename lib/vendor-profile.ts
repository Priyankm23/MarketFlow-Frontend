import { VendorProfileData } from "./types";
import { authFetch } from "./auth-fetch";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

const profileEndpoints = [
  `${API_BASE_URL}/vendor/profile`,
  `${API_BASE_URL}/vendors/profile`,
];

export const normalizeVendorStatus = (status?: string) =>
  (status || "PENDING").toUpperCase();

export const isVendorApproved = (status?: string) =>
  normalizeVendorStatus(status) === "APPROVED";

export async function fetchVendorProfile(): Promise<VendorProfileData | null> {
  for (let i = 0; i < profileEndpoints.length; i += 1) {
    const endpoint = profileEndpoints[i];

    const response = await authFetch(endpoint, {
      method: "GET",
      credentials: "include",
    });

    if (response.status === 404 && i < profileEndpoints.length - 1) {
      continue;
    }

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to load vendor profile");
    }

    const payload = await response.json().catch(() => ({}));
    return payload?.data || null;
  }

  return null;
}
