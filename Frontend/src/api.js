// src/api.js  —  Central API service for Prompt Mastery backend
// Place this file at: src/api.js

const BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:5000";

// ── Token helpers ──────────────────────────────────────────────────────────────
export const getAccessToken  = () => localStorage.getItem("access_token");
export const getRefreshToken = () => localStorage.getItem("refresh_token");

export const saveTokens = (access, refresh) => {
  localStorage.setItem("access_token",  access);
  localStorage.setItem("refresh_token", refresh);
};

export const clearTokens = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
};

// ── Base fetch wrapper ─────────────────────────────────────────────────────────
async function request(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };

  const token = getAccessToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) throw new Error(data.message || data.error || "Request failed");
  return data;
}

// ── Auth endpoints ─────────────────────────────────────────────────────────────

/** POST /api/auth/signup */
export async function register({ name, email, password }) {
  const data = await request("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
  if (data.access_token) saveTokens(data.access_token, data.refresh_token);
  return data;
}

/** POST /api/auth/login */
export async function login({ email, password }) {
  const data = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (data.access_token) saveTokens(data.access_token, data.refresh_token);
  return data;
}

/** POST /api/auth/logout  (requires access token) */
export async function logout() {
  try {
    await request("/api/auth/logout", { method: "POST" });
  } finally {
    clearTokens();
  }
}

/** POST /api/auth/refresh  (uses refresh token) */
export async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) throw new Error("No refresh token");

  const data = await request("/api/auth/refresh", {
    method: "POST",
    headers: { Authorization: `Bearer ${refresh}` },
  });
  if (data.access_token) localStorage.setItem("access_token", data.access_token);
  return data;
}

/** GET /api/auth/me */
export async function getMe() {
  return request("/api/auth/me");
}

/** POST /api/auth/forgot-password */
export async function forgotPassword(email) {
  return request("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

/** POST /api/auth/reset-password */
export async function resetPassword(token, password) {
  return request("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}