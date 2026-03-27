// Centralized API configuration
const raw =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://marketflow-backend-lxfz.onrender.com/api/v1";
const trimmed = raw.replace(/\/+$/, "");
const apiV1 = trimmed.endsWith("/api/v1") ? trimmed : `${trimmed}/api/v1`;

export const API_BASE_URL = apiV1;

export default API_BASE_URL;
