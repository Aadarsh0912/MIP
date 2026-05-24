# Prompt Mastery — Flask JWT Backend

Full authentication backend for the Prompt Mastery app.
**Stack:** Flask · MongoDB · JWT (access + refresh tokens) · bcrypt · SMTP email

---

## Project structure

```
backend/
├── app.py               ← Flask app factory + entry point
├── config.py            ← All config, env-driven
├── extensions.py        ← PyMongo + JWTManager instances
├── auth.py              ← bcrypt hash / verify (your original file)
├── setup_db.py          ← One-time MongoDB index creation
├── requirements.txt
├── .env.example         ← Copy to .env and fill in values
├── models/
│   └── user.py          ← User CRUD + serializer
├── routes/
│   ├── auth.py          ← /api/auth/* endpoints
│   └── user.py          ← /api/user/* endpoints (protected)
└── utils/
    ├── validators.py    ← Input validation helpers
    └── email.py         ← SMTP password-reset email
```

---

## Setup

```bash
# 1. Clone / copy the backend folder into your project
cd backend

# 2. Create a virtual environment
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment variables
cp .env.example .env
# → Edit .env with your MongoDB URI, JWT secrets, and Gmail credentials

# 5. Create MongoDB indexes (run ONCE)
python setup_db.py

# 6. Start the server
python app.py
# Server runs at http://localhost:5000
```

---

## API Reference

All endpoints are prefixed with `/api`.
Protected endpoints require: `Authorization: Bearer <access_token>`

### Auth endpoints

| Method | Endpoint                   | Auth?    | Description                          |
|--------|----------------------------|----------|--------------------------------------|
| POST   | `/api/auth/signup`         | No       | Create account, returns tokens       |
| POST   | `/api/auth/login`          | No       | Sign in, returns tokens              |
| POST   | `/api/auth/refresh`        | Refresh  | Issue new access token               |
| POST   | `/api/auth/logout`         | Any JWT  | Revoke a token                       |
| GET    | `/api/auth/me`             | Access   | Get current user profile             |
| POST   | `/api/auth/forgot-password`| No       | Send reset email                     |
| POST   | `/api/auth/reset-password` | No       | Set new password using reset token   |

### User endpoints (all require access token)

| Method | Endpoint                   | Description                          |
|--------|----------------------------|--------------------------------------|
| GET    | `/api/user/profile`        | Get own profile                      |
| PATCH  | `/api/user/profile`        | Update name                          |
| POST   | `/api/user/change-password`| Change password (requires current)   |
| DELETE | `/api/user/account`        | Soft-delete account                  |

---

## Request / Response examples

### POST /api/auth/signup
```json
// Request body
{ "name": "Alex", "email": "alex@example.com", "password": "Secret123" }

// 201 Response
{
  "message": "Account created successfully.",
  "user": { "id": "...", "name": "Alex", "email": "alex@example.com", "created_at": "..." },
  "access_token":  "eyJ...",
  "refresh_token": "eyJ..."
}
```

### POST /api/auth/login
```json
// Request body
{ "email": "alex@example.com", "password": "Secret123" }

// 200 Response — same shape as signup
```

### POST /api/auth/refresh
```
Authorization: Bearer <refresh_token>

// 200 Response
{ "access_token": "eyJ..." }
```

### POST /api/auth/logout
```
Authorization: Bearer <access_token>   ← or refresh token

// 200 Response
{ "message": "Logged out successfully." }
```
> Call this **twice** — once with the access token, once with the refresh token —
> to fully log out a user on all devices.

### POST /api/auth/forgot-password
```json
{ "email": "alex@example.com" }
// Always 200 (prevents email enumeration)
{ "message": "If that email is registered, a reset link has been sent." }
```

### POST /api/auth/reset-password
```json
{ "token": "<token from email>", "password": "NewPass456", "confirm_password": "NewPass456" }
// 200
{ "message": "Password reset successfully. You can now sign in." }
```

---

## Connecting to AuthPage.jsx

Replace the stub `handleSubmit` functions in both `LoginForm` and `SignupForm`
with real API calls. Store the tokens in `localStorage` (or `sessionStorage`
if you prefer session-only persistence):

```js
// utils/api.js  — add this file to your frontend
const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export async function apiLogin(email, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Login failed");
  localStorage.setItem("access_token",  data.access_token);
  localStorage.setItem("refresh_token", data.refresh_token);
  return data.user;
}

export async function apiSignup(name, email, password) {
  const res = await fetch(`${BASE}/api/auth/signup`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ name, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Signup failed");
  localStorage.setItem("access_token",  data.access_token);
  localStorage.setItem("refresh_token", data.refresh_token);
  return data.user;
}

export async function apiLogout() {
  const token = localStorage.getItem("access_token");
  if (token) {
    await fetch(`${BASE}/api/auth/logout`, {
      method:  "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  }
  const refresh = localStorage.getItem("refresh_token");
  if (refresh) {
    await fetch(`${BASE}/api/auth/logout`, {
      method:  "POST",
      headers: { Authorization: `Bearer ${refresh}` },
    });
  }
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

export async function apiRefresh() {
  const refresh = localStorage.getItem("refresh_token");
  if (!refresh) throw new Error("No refresh token");
  const res = await fetch(`${BASE}/api/auth/refresh`, {
    method:  "POST",
    headers: { Authorization: `Bearer ${refresh}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error("Session expired");
  localStorage.setItem("access_token", data.access_token);
  return data.access_token;
}
```

Add `VITE_API_URL=http://localhost:5000` to your frontend `.env`.

---

## Password validation rules

| Rule                        | Login | Signup |
|-----------------------------|-------|--------|
| Required                    | ✓     | ✓      |
| Min 8 characters            |       | ✓      |
| Max 128 characters          |       | ✓      |
| At least one letter         |       | ✓      |
| At least one number         |       | ✓      |

---

## Security notes

- Passwords are hashed with **bcrypt** (your original `auth.py` is unchanged)
- JWT secrets are env-only — never hardcoded
- Login errors never reveal whether the email or password was wrong
- Forgot-password always returns 200 to prevent user enumeration
- Revoked tokens are stored with a MongoDB **TTL index** — the collection
  auto-cleans itself, no cron job needed
- CORS is restricted to origins listed in `CORS_ORIGINS`
- All inputs are validated before touching the database
