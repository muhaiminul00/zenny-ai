# Zenny Dashboard — Full Technical Documentation

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Infrastructure & Services](#2-infrastructure--services)
3. [Supabase — Database & Auth](#3-supabase--database--auth)
4. [n8n — Workflow Automation](#4-n8n--workflow-automation)
5. [Google Cloud — OAuth & APIs](#5-google-cloud--oauth--apis)
6. [Frontend — React Dashboard](#6-frontend--react-dashboard)
7. [Full System Flow Diagrams](#7-full-system-flow-diagrams)
8. [New Client Onboarding — Step by Step](#8-new-client-onboarding--step-by-step)
9. [Google Access Revocation](#9-google-access-revocation)
10. [Token Lifecycle & Auto-Refresh](#10-token-lifecycle--auto-refresh)
11. [Security Model](#11-security-model)
12. [Environment Variables & Config Reference](#12-environment-variables--config-reference)
13. [Known Limitations](#13-known-limitations)

---

## 1. System Overview

Zenny Dashboard is a multi-tenant client portal for the Zenny AI product (built on Convocore). Each client logs in with their own account, sees their own Gmail + Calendar data via a Google OAuth connection, and interacts with an embedded Convocore AI iframe.

**Core principle:** the frontend holds zero secrets and zero Google tokens. All token storage and API calls happen server-side in n8n, backed by Supabase.

```
Client Browser
  → Supabase Auth (login gate)
  → Dashboard UI (React, Netlify)
      ↳ Convocore iframe
      ↳ Gmail card  ─┐
      ↳ Calendar card─┤→ n8n webhooks → Google APIs
      ↳ Google Connect panel → Google OAuth → n8n → Supabase
```

---

## 2. Infrastructure & Services

| Service | Role | URL / Identifier |
|---|---|---|
| **Frontend** | React+Vite SPA | https://lighthearted-dasik-281e47.netlify.app |
| **Supabase** | DB, Auth, token store | Project: `zenny-dashboard` / `bzckrqgasqiglsgqyzft` |
| **n8n** | Workflow automation (OAuth, API calls) | https://n8n-andm.srv1729215.hstgr.cloud |
| **Google Cloud** | OAuth 2.0, Gmail API, Calendar API | Project linked to OAuth client ID below |
| **Convocore** | AI chat, embedded via iframe | https://zenny-ai.convocore.ai/app/na/client |

### Supabase project

- **Name:** zenny-dashboard
- **Project ID:** `bzckrqgasqiglsgqyzft`
- **URL:** `https://bzckrqgasqiglsgqyzft.supabase.co`
- **Region:** `ap-south-1` (Mumbai — closest to Dhaka)
- **Anon (public) key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6Y2tycWdhc3FpZ2xzZ3F5emZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4Nzg4MTIsImV4cCI6MjEwMDQ1NDgxMn0.9QUrjMhxVprcmLgVnDMCzIbfTJQQqBVQ3G63gK4pMMM`
- **Service role key:** never in frontend; only in n8n credential `Zenny Vault Service Role`

### Google OAuth app

- **Client ID:** `675383568069-bd4dkb2jbgaff11sd7s7v0r8h0cs6rsk.apps.googleusercontent.com`
- **Redirect URI (n8n callback):** `https://n8n-andm.srv1729215.hstgr.cloud/webhook/zenny/oauth/callback`
- **Scopes granted by clients:** `gmail.readonly`, `calendar.events.readonly`
- **App status:** Testing (⚠ refresh tokens expire after 7 days until Published)

---

## 3. Supabase — Database & Auth

### 3.1 Auth configuration

- **Provider:** Email + password (manually enabled)
- **Self-signup:** DISABLED (invite-only — admin creates each client account)
- **Email confirm:** bypassed via "Auto Confirm User" on user creation
- **Session management:** supabase-js on frontend handles session persistence + auto-refresh of Supabase JWTs

### 3.2 Tables

#### `google_oauth_config` — singleton row, app-level Google credentials

```sql
id             smallint PRIMARY KEY DEFAULT 1   -- enforces singleton
client_id      text NOT NULL
client_secret  text NOT NULL
redirect_uri   text NOT NULL
dashboard_url  text NOT NULL DEFAULT ''
updated_at     timestamptz NOT NULL DEFAULT now()
CONSTRAINT google_oauth_config_singleton CHECK (id = 1)
```

Access: **service_role only** (RLS deny-all). n8n reads this to build consent URLs + exchange codes. Frontend never touches it.

Current values:
- `client_id` = Google OAuth client ID
- `redirect_uri` = `https://n8n-andm.srv1729215.hstgr.cloud/webhook/zenny/oauth/callback`
- `dashboard_url` = `https://lighthearted-dasik-281e47.netlify.app/`

#### `google_connections` — per-client Google OAuth tokens

```sql
client_key              text PRIMARY KEY        -- = Supabase auth user UUID
email                   text                    -- client's Google account email
refresh_token           text NOT NULL           -- long-lived; used to mint access tokens
access_token            text                    -- cached; 1hr TTL
access_token_expires_at timestamptz
scope                   text                    -- granted scopes
status                  text NOT NULL DEFAULT 'connected'  -- 'connected' | 'expired'
connected_at            timestamptz NOT NULL DEFAULT now()
updated_at              timestamptz NOT NULL DEFAULT now()
```

Access: **service_role only** (RLS deny-all). `client_key` = `auth.users.id::text`.

Indexes: `idx_google_connections_email` on `email`

#### `oauth_state` — short-lived CSRF nonces

```sql
state       text PRIMARY KEY       -- random UUID generated per connect attempt
client_key  text NOT NULL          -- which user initiated this flow
created_at  timestamptz NOT NULL DEFAULT now()
```

Access: **service_role only**. Inserted at connect start, deleted after callback. Prevents forged OAuth callbacks.

Index: `idx_oauth_state_created` on `created_at` (for cleanup of stale states)

#### `clients` — profile mirror of auth.users

```sql
id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
email        text
display_name text
created_at   timestamptz NOT NULL DEFAULT now()
```

RLS policy: `clients_select_own` — logged-in user may only `SELECT` their own row.

Auto-populated by trigger:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.clients (id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 3.3 RLS summary

| Table | anon / logged-in users | service_role (n8n) |
|---|---|---|
| `google_oauth_config` | ❌ no access | ✅ full access |
| `google_connections` | ❌ no access | ✅ full access |
| `oauth_state` | ❌ no access | ✅ full access |
| `clients` | ✅ own row SELECT only | ✅ full access |

---

## 4. n8n — Workflow Automation

**n8n host:** `https://n8n-andm.srv1729215.hstgr.cloud`

**Credential used by all Supabase HTTP nodes:** `Zenny Vault Service Role`
- Type: Supabase API
- Host: `https://bzckrqgasqiglsgqyzft.supabase.co`
- Key: Supabase `service_role` secret (bypasses RLS)

### 4.1 Workflow registry

| Workflow name | n8n ID | Webhook path | Method | Purpose |
|---|---|---|---|---|
| `zenny-oauth-start` | `ZrZK3yJhDRJY09eO` | `/webhook/zenny/oauth/start` | GET | Begin Google OAuth dance |
| `zenny-oauth-callback` | `iezC44TWQopzQ2Lh` | `/webhook/zenny/oauth/callback` | GET | Exchange code → store tokens |
| `zenny-gmail-multitenant` | `e2Q6E3BJ2kSGq8eX` | `/webhook/zenny/gmail` | GET | Per-client Gmail fetch |
| `zenny-calendar-multitenant` | `UoLg4pnYiGWEkyDP` | `/webhook/zenny/calendar` | GET | Per-client Calendar fetch |

All 4 are **published (active)** in production.

### 4.2 Workflow: `zenny-oauth-start`

**Trigger:** `GET /webhook/zenny/oauth/start?client_key=<USER_UUID>`

**Node chain:**

1. **Webhook** — receives `client_key` from query param (= Supabase user UUID sent by frontend)
2. **Get OAuth Config** — HTTP GET `google_oauth_config?id=eq.1` → reads `client_id`, `client_secret`, `redirect_uri` from Supabase via service_role
3. **Generate State** — Code node creates a random UUID as CSRF state value
4. **Store State** — HTTP POST to Supabase `oauth_state` — inserts `{state, client_key}`
5. **Build Consent URL** — Code node assembles:
   ```
   https://accounts.google.com/o/oauth2/v2/auth
     ?client_id=<client_id>
     &redirect_uri=<redirect_uri>
     &response_type=code
     &scope=https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.events.readonly
     &access_type=offline
     &prompt=consent
     &state=<state_uuid>
   ```
6. **Redirect To Google** — 302 redirect to the consent URL

### 4.3 Workflow: `zenny-oauth-callback`

**Trigger:** `GET /webhook/zenny/oauth/callback?code=<AUTH_CODE>&state=<STATE_UUID>`

Google redirects here after user grants consent.

**Node chain:**

1. **Webhook** — receives `code` + `state` from Google redirect
2. **Lookup State** — HTTP GET `oauth_state?state=eq.<state>` via Supabase → recovers `client_key`. If not found → redirect back to dashboard with `?error=invalid_state`
3. **Get OAuth Config** — reads `client_id`, `client_secret`, `redirect_uri` from Supabase
4. **Exchange Code** — HTTP POST `https://oauth2.googleapis.com/token`:
   ```json
   {
     "client_id": "...",
     "client_secret": "...",
     "code": "<AUTH_CODE>",
     "redirect_uri": "...",
     "grant_type": "authorization_code"
   }
   ```
   → returns `access_token` (1hr) + `refresh_token` (long-lived)
5. **Get Email** — HTTP GET `https://www.googleapis.com/oauth2/v2/userinfo` with Bearer token → gets client's Google email
6. **Store Tokens** — HTTP POST/UPSERT to Supabase `google_connections`:
   ```json
   {
     "client_key": "<user_uuid>",
     "email": "<google_email>",
     "refresh_token": "<refresh_token>",
     "access_token": "<access_token>",
     "scope": "gmail.readonly calendar.events.readonly",
     "status": "connected"
   }
   ```
7. **Redirect Success** — 302 to `<dashboard_url>?connected=1`
8. **Cleanup State** — HTTP DELETE `oauth_state?state=eq.<state>` — removes used nonce

### 4.4 Workflow: `zenny-gmail-multitenant`

**Trigger:** `GET /webhook/zenny/gmail` with `Authorization: Bearer <supabase_access_token>` header

**Node chain:**

1. **Webhook** — receives request with auth header
2. **Verify Session** — HTTP GET `https://bzckrqgasqiglsgqyzft.supabase.co/auth/v1/user` with the Bearer token → Supabase validates JWT, returns user object including `id`. If 401 → respond `{connected: false}`.
3. **Read Client** — Code node: `client_key = response.id` (UUID from verified JWT — cannot be spoofed)
4. **Get Gmail Connection** — HTTP GET `google_connections?client_key=eq.<client_key>&select=refresh_token,status` via service_role
5. **Has Token?** — If node: checks `refresh_token` present
   - **False branch** → `Respond Not Connected`: `{connected: false, unreadCount: 0, messages: []}`
6. **Get Config** — reads `client_id` + `client_secret` from `google_oauth_config`
7. **Refresh Access Token** — HTTP POST `https://oauth2.googleapis.com/token`:
   ```json
   {
     "client_id": "...",
     "client_secret": "...",
     "refresh_token": "<stored_refresh_token>",
     "grant_type": "refresh_token"
   }
   ```
   → returns fresh `access_token`. This happens **on every request** — no caching.
8. **List Messages** — HTTP GET `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10&labelIds=INBOX&labelIds=UNREAD` with `Authorization: Bearer <access_token>`
9. **Has Messages?** — If node: checks items array
   - **False branch** → `Respond Empty Inbox`: `{connected: true, unreadCount: 0, messages: []}`
10. **Explode IDs** — SplitInBatches: iterates over message IDs
11. **Get Message** — HTTP GET per message ID → full message metadata (From, Subject, snippet, labelIds)
12. **Format Messages** — Code node: maps to `{id, from, subject, snippet, date, unread: bool}`
13. **Respond Data**:
    ```json
    {
      "connected": true,
      "unreadCount": <n>,
      "messages": [{...}, ...]
    }
    ```

All responses include `Access-Control-Allow-Origin: *` header.

### 4.5 Workflow: `zenny-calendar-multitenant`

**Trigger:** `GET /webhook/zenny/calendar` with `Authorization: Bearer <supabase_access_token>` header

Same auth verification as Gmail (steps 1–4 identical), then:

5. **Has Token?** — False → `{connected: false, events: []}`
6. **Get Config** — reads OAuth credentials
7. **Refresh Access Token** — same as Gmail
8. **Get Events** — HTTP GET:
   ```
   https://www.googleapis.com/calendar/v3/calendars/primary/events
     ?timeMin=<now ISO>
     &singleEvents=true
     &orderBy=startTime
     &maxResults=10
   ```
   with Bearer token. `alwaysOutputData: true` (handles empty calendar without breaking)
9. **Format Events** — Code node: maps to `{id, title, start, end, location, attendees}`
10. **Respond Data**:
    ```json
    {
      "connected": true,
      "events": [{...}, ...]
    }
    ```

---

## 5. Google Cloud — OAuth & APIs

### 5.1 APIs enabled

- Gmail API
- Google Calendar API
- Google OAuth2 API (for userinfo endpoint)

### 5.2 OAuth consent screen

- **Type:** External
- **Status:** Testing (⚠ MUST be Published for production use)
- **Scopes:** `gmail.readonly`, `calendar.events.readonly` (both "sensitive" → require Google verification to go public)
- **Test users:** manually allowlisted while in Testing mode

### 5.3 OAuth credential

- **Type:** Web Application
- **Authorized redirect URI:** `https://n8n-andm.srv1729215.hstgr.cloud/webhook/zenny/oauth/callback`

### 5.4 Token types

| Token | TTL | Where stored | Used for |
|---|---|---|---|
| Authorization code | ~10 min, one-use | Never stored | Exchanged for tokens at callback |
| Access token | 1 hour | Supabase `google_connections.access_token` (cached) | Calling Gmail / Calendar APIs |
| Refresh token | Until revoked* | Supabase `google_connections.refresh_token` | Minting new access tokens |

*Testing mode: 7 days. Production: indefinite (until user revokes or password change)

---

## 6. Frontend — React Dashboard

**Stack:** Vite + React + TypeScript  
**Deploy:** Netlify — `https://lighthearted-dasik-281e47.netlify.app`  
**Auth lib:** `@supabase/supabase-js`

### 6.1 Supabase client (`src/supabaseClient.ts`)

```ts
import { createClient } from "@supabase/supabase-js";
export const supabase = createClient(
  "https://bzckrqgasqiglsgqyzft.supabase.co",
  "<ANON_KEY>"  // public key, safe in frontend
);
```

### 6.2 Auth gate flow

```
App mounts
  → supabase.auth.getSession()
  → supabase.auth.onAuthStateChange() subscription
  → session exists? → render Dashboard
  → no session? → render Login screen
      → user submits email+password
      → supabase.auth.signInWithPassword({ email, password })
      → success → session set → Dashboard renders
```

Logout: `supabase.auth.signOut()`

Supabase-js **auto-refreshes the Supabase JWT** silently (every ~50 min). No client action needed.

### 6.3 Auth header helper

```ts
async function authHeader() {
  const { data: { session } } = await supabase.auth.getSession();
  return session ? { Authorization: `Bearer ${session.access_token}` } : {};
}
```

Used on every webhook call. Always fetches a fresh session (not cached) to avoid stale tokens after Google redirect.

### 6.4 Webhook calls

```ts
// Gmail
fetch("https://n8n-andm.srv1729215.hstgr.cloud/webhook/zenny/gmail",
      { headers: await authHeader() })

// Calendar
fetch("https://n8n-andm.srv1729215.hstgr.cloud/webhook/zenny/calendar",
      { headers: await authHeader() })
```

No `client_key` in URL — identity comes from the JWT, verified server-side by n8n.

### 6.5 ConnectGooglePanel component

Reads `?connected=1` from URL on mount (set by n8n callback redirect). Shows green dot + "reconnect" option if connected. On click:

```
window.location.href = 
  `https://n8n-andm.srv1729215.hstgr.cloud/webhook/zenny/oauth/start?client_key=${userUUID}`
```

The `userUUID` comes from `supabase.auth.getSession()` → `session.user.id`.

### 6.6 Dashboard panels

- **Left/main (65%):** Convocore iframe — `src="https://zenny-ai.convocore.ai/app/na/client"`, `allow="microphone; camera"`
- **Right sidebar (35%):**
  - ConnectGooglePanel
  - Gmail card (unread badge, message list)
  - Calendar card (upcoming events list)

### 6.7 Styling

- Dark-first, CSS variables
- Fonts: Sora (headings/buttons), Inter (body) via Google Fonts
- Accent: `#7C5CFF` (purple), `#F59E0B` (amber sparingly)
- Card background: `#141317`, border: `#2a2830`
- No Tailwind, no UI kit, all inline/CSS variable based

---

## 7. Full System Flow Diagrams

### 7.1 Login flow

```
Client opens dashboard URL
  → supabase.getSession() → no session
  → Login screen renders
  → Client enters email + password
  → supabase.signInWithPassword()
  → Supabase Auth validates
  → Returns session (JWT access_token + refresh_token)
  → Dashboard renders with Convocore iframe + Gmail + Calendar cards
  → Cards call n8n webhooks with Bearer token
  → n8n verifies token → looks up client's Google tokens → fetches data → returns JSON
  → Cards render data
```

### 7.2 Google Connect flow (one-time per client)

```
Client clicks "Connect Google"
  → Frontend calls supabase.getSession() → gets user.id
  → Redirects browser to: /webhook/zenny/oauth/start?client_key=<user_uuid>

n8n: zenny-oauth-start
  → Reads google_oauth_config from Supabase
  → Generates random state UUID
  → Stores {state, client_key} in oauth_state table
  → Builds Google consent URL
  → 302 → accounts.google.com (Gmail+Calendar scopes, offline access)

Google consent screen
  → Client reviews scopes
  → Client clicks Allow
  → Google 302 → /webhook/zenny/oauth/callback?code=<AUTH_CODE>&state=<STATE>

n8n: zenny-oauth-callback
  → Reads state → looks up oauth_state → recovers client_key
  → Reads client_id + client_secret from Supabase
  → POST oauth2.googleapis.com/token → gets refresh_token + access_token
  → GET googleapis.com/oauth2/v2/userinfo → gets email
  → UPSERT google_connections (client_key, email, refresh_token, ...)
  → DELETE oauth_state (cleanup)
  → 302 → dashboard?connected=1

Dashboard
  → ConnectGooglePanel reads ?connected=1
  → Shows green dot "Connected"
  → Gmail + Calendar cards re-fetch → now return data
```

### 7.3 Data fetch flow (every page load / refresh)

```
Dashboard card fetches /webhook/zenny/gmail (or /calendar)
  with Authorization: Bearer <supabase_jwt>

n8n: zenny-gmail-multitenant
  → GET /auth/v1/user with Bearer → Supabase validates JWT → returns user {id}
  → client_key = user.id (cannot be spoofed)
  → GET google_connections WHERE client_key = user.id → gets refresh_token
  → If no token: return {connected: false, messages: []}
  → POST oauth2.googleapis.com/token (refresh_token → fresh access_token)
  → GET gmail.googleapis.com/... with access_token
  → Format → return JSON

Frontend card renders the data
```

---

## 8. New Client Onboarding — Step by Step

### Step 1: Admin creates Supabase account

1. Supabase Dashboard → `zenny-dashboard` project
2. Authentication → Users → **Add user** → **Create new user**
3. Enter client's email + password
4. **Check "Auto Confirm User"** (CRITICAL — no SMTP configured, email confirm won't work)
5. Click Create

**What happens automatically:**
- `auth.users` row created
- `handle_new_user` trigger fires
- `clients` row auto-inserted with `{id: user_uuid, email}`

### Step 2: Share credentials with client

Send client their email + password via secure channel (not this chat).

### Step 3: Client logs in to dashboard

Client opens `https://lighthearted-dasik-281e47.netlify.app`  
→ Login screen → enters email + password → Dashboard loads  
→ Convocore iframe loads immediately  
→ Gmail + Calendar cards show "not connected" state

### Step 4: Client connects Google (one-time)

1. Client clicks **"Connect Google"** in the Connect panel
2. Browser redirects to Google consent screen
3. Client selects their Google account → clicks Allow
4. Browser redirects back to dashboard with `?connected=1`
5. Gmail + Calendar cards now load their data

**What happens in backend (n8n + Supabase):**
- `google_connections` row created with `client_key = user.uuid`
- `refresh_token` stored — this is the long-lived credential for all future fetches
- `oauth_state` row deleted (cleanup)

### Step 5: Ongoing usage

- Client logs in → cards load their own Gmail + Calendar automatically
- No further action needed unless Google access expires or is revoked
- Supabase session auto-refreshes every ~50 min (supabase-js handles this)
- Google access_token auto-refreshed on every card load by n8n

---

## 9. Google Access Revocation

### Who can revoke

1. **Client manually** — `myaccount.google.com/permissions` → remove Zenny
2. **Admin (you)** — delete the `google_connections` row in Supabase:
   ```sql
   DELETE FROM public.google_connections WHERE client_key = '<user_uuid>';
   ```
3. **Google automatically** — password change, account compromise detection, Testing mode 7-day expiry

### What happens when revoked

- Next card load: n8n calls `oauth2.googleapis.com/token` with stored `refresh_token`
- Google returns `{"error": "invalid_grant"}`
- n8n currently responds with `{connected: false}` (silent failure)
- ConnectGooglePanel shows "not connected" state
- **No automatic reconnect** — requires explicit user action (Google security requirement)

### Revoking dashboard access entirely

To remove a client's dashboard access:

1. Supabase → Authentication → Users → find user → **Delete user**
2. `ON DELETE CASCADE` on `clients.id` auto-deletes their `clients` row
3. Delete their `google_connections` row manually (not cascaded):
   ```sql
   DELETE FROM public.google_connections WHERE client_key = '<user_uuid>';
   ```

---

## 10. Token Lifecycle & Auto-Refresh

### Supabase session tokens (dashboard login)

| Token | TTL | Refresh mechanism |
|---|---|---|
| `access_token` (JWT) | 1 hour | supabase-js auto-refreshes silently |
| `refresh_token` | 60 days | supabase-js stores in localStorage |

supabase-js detects expiry and calls `supabase.auth.refreshSession()` automatically. Zero code needed. Client stays logged in across page reloads and browser sessions.

### Google tokens (per-client API access)

| Token | TTL | Refresh mechanism |
|---|---|---|
| `access_token` | 1 hour | n8n refreshes on every webhook call |
| `refresh_token` (Testing) | 7 days | ❌ no auto-refresh; requires re-consent |
| `refresh_token` (Production) | Until revoked | ❌ no auto-refresh needed (stays valid) |

**Access token refresh — fully automatic, every request:**

1. Card loads → frontend calls n8n webhook with Supabase Bearer token
2. n8n reads stored `refresh_token` from Supabase
3. n8n POSTs to `oauth2.googleapis.com/token` → gets fresh `access_token`
4. n8n uses fresh token to call Gmail / Calendar APIs
5. Returns data to frontend

Client never sees this. No re-prompting. Happens on every single fetch.

**Refresh token expiry — requires user action:**

- Testing mode: 7 days (hard limit, Google policy)
- Production mode: effectively indefinite
- When expired: Google returns `invalid_grant`
- Current behavior: cards show "not connected" silently
- Recommended fix (not yet built): detect `invalid_grant`, set `status='expired'` in Supabase, return `{connected: false, reason: 'expired'}`, frontend shows "Reconnect Google" CTA

**Does the system automatically refresh refresh tokens? No.**
Google does not issue new refresh tokens automatically. The stored refresh_token is fixed. Only a new OAuth consent flow generates a new one.

---

## 11. Security Model

### Authentication chain

```
Client → Supabase email+password login
       → Supabase JWT issued (signed HS256)
       → JWT sent in Authorization header to n8n
       → n8n calls Supabase /auth/v1/user to verify JWT (not self-verify)
       → Supabase returns user {id}
       → n8n uses id as client_key — cannot be spoofed by URL manipulation
```

### What's protected

- **No self-signup** — only admin-created accounts can log in
- **No client can access another client's data** — identity comes from cryptographically-verified JWT, not URL params
- **Tokens never hit the browser** — refresh_token + access_token live only in Supabase (service_role protected)
- **Google access is read-only** — scopes `gmail.readonly` + `calendar.events.readonly` only; nothing can be sent, deleted, or modified
- **CSRF protection on OAuth** — random `state` nonce generated per connect attempt, verified at callback, deleted after use

### What's NOT protected / known gaps

- `?connected=1` URL param is cosmetic only — ConnectGooglePanel reads it to show status but doesn't verify real connection. Hard refresh loses the state. (Fix: read `connected` from webhook response instead of URL)
- No rate limiting on n8n webhooks
- Google app in Testing mode: 7-day token expiry exposes re-consent friction
- No `invalid_grant` detection → expired tokens show generic "not connected" with no explanation

---

## 12. Environment Variables & Config Reference

### Frontend (in source, not .env — these are public)

```ts
SUPABASE_URL = "https://bzckrqgasqiglsgqyzft.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
N8N_GMAIL_WEBHOOK = "https://n8n-andm.srv1729215.hstgr.cloud/webhook/zenny/gmail"
N8N_CALENDAR_WEBHOOK = "https://n8n-andm.srv1729215.hstgr.cloud/webhook/zenny/calendar"
N8N_OAUTH_START = "https://n8n-andm.srv1729215.hstgr.cloud/webhook/zenny/oauth/start"
CONVOCORE_URL = "https://zenny-ai.convocore.ai/app/na/client"
```

### n8n credential: `Zenny Vault Service Role`

```
Type: Supabase API
Host: https://bzckrqgasqiglsgqyzft.supabase.co
Key: <service_role secret — from Supabase → Settings → API>
```

### Supabase `google_oauth_config` table (row id=1)

```
client_id:     675383568069-bd4dkb2jbgaff11sd7s7v0r8h0cs6rsk.apps.googleusercontent.com
client_secret: <stored in Supabase, never shown>
redirect_uri:  https://n8n-andm.srv1729215.hstgr.cloud/webhook/zenny/oauth/callback
dashboard_url: https://lighthearted-dasik-281e47.netlify.app/
```

---

## 13. Known Limitations

| Issue | Impact | Fix |
|---|---|---|
| Google app in Testing mode | refresh_token expires after 7 days; clients must reconnect weekly | Publish app to Production (requires Google verification of sensitive scopes, takes days–weeks) |
| No `invalid_grant` detection | Expired/revoked token shows generic "not connected" — confusing | Add error catch in Gmail/Calendar workflows, set `status='expired'`, return `reason` field, frontend shows "Reconnect" CTA |
| `?connected=1` status is URL-only | Hard refresh or account switch shows wrong status | Read real status from webhook `connected` field instead of URL param |
| No SMTP for Supabase | Can't use "Invite user" email flow; must use Create User + Auto Confirm + manual password sharing | Configure SMTP in Supabase → smtp settings, or use Supabase Invite flow after SMTP set up |
| No rate limiting on n8n | Webhooks accessible to anyone with URL | Add IP allowlist or secret header check in n8n |
| Old project (`zenny-vault`, `kmhzosyljpzheqvfuyzm`) still exists | Orphaned; old `test-client` row in it | Delete the old Supabase project when confirmed everything is on `zenny-dashboard` |
| n8n credential points to new project | If credential is updated to wrong host, all 4 workflows break silently | Keep `Zenny Vault Service Role` host = `https://bzckrqgasqiglsgqyzft.supabase.co` |
