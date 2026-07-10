// src/api.js — Central API service for Prompt Mastery backend

const BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:5001";

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

/** POST /api/auth/logout */
export async function logout() {
  try {
    await request("/api/auth/logout", { method: "POST" });
  } finally {
    clearTokens();
  }
}

/** POST /api/auth/refresh */
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

// ── Progress endpoints ─────────────────────────────────────────────────────────

/** GET /api/user/progress — load progress from MongoDB */
export async function getProgress() {
  return request("/api/user/progress");
}

/** POST /api/user/progress — save progress to MongoDB */
export async function saveProgress(progressData) {
  return request("/api/user/progress", {
    method: "POST",
    body: JSON.stringify(progressData),
  });
}

// ── Prompt History endpoints ───────────────────────────────────────────────────

/** GET /api/user/prompt-history — load all history entries from MongoDB */
export async function getPromptHistory() {
  return request("/api/user/prompt-history");
}

/** POST /api/user/prompt-history — save one entry to MongoDB */
export async function savePromptHistoryEntry(entry) {
  return request("/api/user/prompt-history", {
    method: "POST",
    body: JSON.stringify(entry),
  });
}

/** DELETE /api/user/prompt-history/:id — delete one entry */
export async function deletePromptHistoryEntry(id) {
  return request(`/api/user/prompt-history/${id}`, { method: "DELETE" });
}

/** DELETE /api/user/prompt-history — wipe all history for this user */
export async function clearPromptHistory() {
  return request("/api/user/prompt-history", { method: "DELETE" });
}

// ── Saved Prompts endpoints ───────────────────────────────────────────────────

/** GET /api/user/saved-prompts — load all saved prompts from MongoDB */
export async function getSavedPrompts() {
  return request("/api/user/saved-prompts");
}

/** POST /api/user/saved-prompts — save one prompt to MongoDB */
export async function saveSavedPromptEntry(entry) {
  return request("/api/user/saved-prompts", {
    method: "POST",
    body: JSON.stringify(entry),
  });
}

/** DELETE /api/user/saved-prompts/:id — delete one saved prompt */
export async function deleteSavedPromptEntry(id) {
  return request(`/api/user/saved-prompts/${id}`, { method: "DELETE" });
}

/** DELETE /api/user/saved-prompts — wipe all saved prompts for this user */
export async function clearSavedPrompts() {
  return request("/api/user/saved-prompts", { method: "DELETE" });
}