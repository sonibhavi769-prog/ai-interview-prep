/**
 * Axios HTTP client — preconfigured with the backend base URL, JWT
 * interceptor for auth headers, and automatic token-refresh on 401s.
 */
import axios from "axios";

const API_BASE = "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // send refresh cookie
  headers: { "Content-Type": "application/json" },
});

/* ── Token management ─────────────────────────────────────────── */
let accessToken = null;

export function setAccessToken(token) {
  accessToken = token;
}
export function getAccessToken() {
  return accessToken;
}
export function clearAccessToken() {
  accessToken = null;
}

/* ── Request interceptor: attach Bearer token ─────────────────── */
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

/* ── Response interceptor: silent refresh on 401 ──────────────── */
let isRefreshing = false;
let refreshQueue = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url.includes("/auth/refresh") &&
      !original.url.includes("/auth/login")
    ) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then(() => api(original));
      }

      isRefreshing = true;
      try {
        const { data } = await api.post("/auth/refresh");
        setAccessToken(data.access_token);
        refreshQueue.forEach(({ resolve }) => resolve());
        refreshQueue = [];
        return api(original);
      } catch {
        clearAccessToken();
        refreshQueue.forEach(({ reject }) => reject(error));
        refreshQueue = [];
        window.location.href = "/login";
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
