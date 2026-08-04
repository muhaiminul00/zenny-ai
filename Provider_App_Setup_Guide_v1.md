# Provider App Setup & Developer Configuration Guide v1

```
Status:    DRAFT — handoff document for manual provider app registration
Purpose:   Step-by-step instructions for registering ZeroManual's own OAuth
           apps (Google, Shopify, Slack, Calendly, Cal.com) and setting up
           the WooCommerce manual-key path — everything needed to produce
           the Client ID/Secret pairs that go into control.oauth_apps
           (Client_Integration_and_Credential_Platform_v1.md Part 4.2).
Audience:  This document is written to be handed directly to a teammate
           executing these steps — not a developer reading architecture.
           Plain, sequential, one provider at a time.
Position:  Sits below Client_Integration_and_Credential_Platform_v1.md.
           That document defines the schema and mechanism; this document
           is the literal task list to produce the credentials that
           schema stores.
Research basis: every step below was verified against live provider
           documentation and current community reports (not recalled from
           training) as of 2026-08-01. Where provider UIs are known to be
           unstable or actively changing, this is flagged explicitly
           rather than presented as a fixed click-path — verify against
           the provider's own live docs at execution time, linked
           throughout.
Correction pass: Calendly's scope discrepancy resolved (real, granular
           scopes confirmed, Part 4.3) via direct fetch of Calendly's live
           scopes documentation. Cal.com's token lifetime (60min/1yr)
           confirmed via a deprecated endpoint from a different product
           tier — noted as likely representative, not certain (Part 5.6).
           WooCommerce confirmed to have no expiry mechanism at all,
           directly from WooCommerce's official REST API docs (Part 6.4).
Naming:    Every OAuth app/consent-screen registration in this guide uses
           "ZeroManual" as the registered app name — ZeroManual.com is the
           company's real domain; Zenny is a product operating on a
           subdomain of it. Providers show clients the registered app's
           name on their consent/authorization screens, so that name must
           match the real, verifiable entity — never "Zenny" for anything
           provider-facing. "Zenny" is still correct wherever this guide
           refers to the product dashboard itself (e.g., "paste the key
           into the Zenny dashboard") — the distinction is: ZeroManual is
           who providers see: Zenny is what the client uses.
```

---

# PART 0 — Before You Start

## 0.1 What You're Producing, Per Provider

For each provider, the end goal is the same: **one Client ID + one Client
Secret**, belonging to ZeroManual (not any individual client), which gets
entered into `control.oauth_apps` (per
`Client_Integration_and_Credential_Platform_v1.md` Part 4.2). Some
providers also produce a third value (Calendly's Webhook Signing Key,
Slack's Bot Token pattern) — noted per provider below.

## 0.2 One Redirect URI to Have Ready First

Every OAuth provider needs to know where to send the user back after they
approve access. This is the Supabase Edge Function's callback URL (per
`Client_Integration_and_Credential_Platform_v1.md` Part 5.1) —
**confirm this exact URL with the engineering side before starting any
provider's setup**, since every provider registration below asks for it,
and getting it wrong means redoing that step. It will look like:

```
https://kmhzosyljpzheqvfuyzm.supabase.co/functions/v1/oauth-callback
```

## 0.3 A Note on These Instructions

Provider dashboards change their layout more often than you'd expect —
one provider covered here (Shopify) changed its entire app-creation system
on January 1, 2026, and its exact menu location was still being asked
about in community forums within the past few months. Where a step says
"navigate to X" and it doesn't match what you see, search the provider's
own current developer documentation for the exact current path — the
*task* described here is accurate; the *exact menu label* may have moved.
Links to each provider's live docs are included per section for this
reason.

## 0.4 General Pattern Across Every Provider

Worth knowing before you start, so nothing below feels arbitrary:

- **Changing scopes after creation often re-triggers a review or requires
  reinstalling** (confirmed for Slack and Cal.com specifically, likely true
  more broadly) — decide the full scope list *before* creating the app,
  rather than adding scopes incrementally as you discover you need them.
  Under-scoping now costs you a redo later; that's the trade to make
  consciously.
- **Client Secrets are shown once, at creation, and never again** —
  confirmed for Google, Calendly, and Cal.com. Copy it immediately into a
  password manager or directly into Supabase Vault (per
  `Client_Integration_and_Credential_Platform_v1.md` Part 4.4) — do not
  plan to "come back and get it later."

---

# PART 1 — Google (Calendar + Gmail, one shared app)

**Live reference:** https://developers.google.com/identity/protocols/oauth2
and https://developers.google.com/workspace/guides/create-credentials

## 1.1 Create the Project

1. Go to [Google Cloud Console](https://console.cloud.google.com).
2. Create a new project (or select an existing one) — name it something
   identifiable, e.g. "ZeroManual Production."

## 1.2 Enable the APIs

3. Navigate to **APIs & Services → Library**.
4. Search for and enable **Google Calendar API**.
5. Search for and enable **Gmail API**.

## 1.3 Configure the OAuth Consent Screen ("Google Auth Platform")

**Note:** as of 2026, this is called "Google Auth Platform" in the
console, not the older "OAuth consent screen" label some tutorials still
use.

6. Navigate to **Google Auth Platform → Branding** (if you see "Google
   Auth platform not configured yet," click **Get Started**).
7. Under **App Information**: enter an app name (this is what clients see
   on the consent screen — make it recognizable, e.g. "ZeroManual").
8. **User support email**: an email clients can contact with questions.
9. Under **Audience**: select **External** (this app is used by clients
   outside your own organization — not "Internal").
10. Continue through **Data Access** — this is where you'll declare scopes
    (Part 1.4 below).

## 1.4 Scopes to Request

**Do not use `readonly` scopes** — a prior internal test build used
`gmail.readonly`/`calendar.events.readonly`, which is insufficient for
production. Real Tools need write access:

```
https://www.googleapis.com/auth/calendar        (full Calendar read/write)
https://www.googleapis.com/auth/gmail.modify     (read + send + label,
                                                   NOT gmail.readonly)
```

**These are Sensitive scopes** (per Google's classification) — this means
Google's verification process applies (see Part 1.7). If Gmail's full
access lands in Google's Restricted tier at review time, an additional
annual security assessment applies — this is determined by Google during
review, not something you can pre-check with certainty.

## 1.5 Create the OAuth Client

11. Navigate to **Google Auth Platform → Clients → Create Client**.
12. **Application type: Web application.**
13. **Name:** internal label only (not client-facing).
14. **Authorized redirect URIs:** paste the exact callback URL from Part
    0.2.
15. Click **Create**.
16. **Copy the Client ID and Client Secret immediately** — the secret may
    not be retrievable again without generating a new one.

## 1.6 Add Test Users (Required While in Testing Mode)

17. Navigate to **Google Auth Platform → Audience**.
18. Under **Test users**, add the Google account email for each client
    you're onboarding during this period — up to 100 total.

## 1.7 The 7-Day Refresh Token Expiry — Read This Before Onboarding Any Client

**Confirmed, no workaround exists:** while this app is in Testing status,
Google automatically revokes every refresh token exactly 7 days after it
was granted — regardless of use. This is not fixable by refreshing early.
The only fix is completing Google's verification process (Part 1.8) and
switching Publishing Status from Testing to Production — a manual,
UI-only action with no API equivalent.

**Practical consequence during this period:** every client connected via
this app will need to manually reconnect Google every 7 days until
verification clears. Per
`Client_Integration_and_Credential_Platform_v1.md` Part 8.1.1, the system
sends a proactive reminder before this happens — but the reconnect itself
is unavoidable and should be mentioned to early clients directly (e.g.,
during the onboarding call, per your own plan for smoothing OAuth
adoption) so it isn't a surprise.

**Additional, separate reasons a refresh token can silently stop working**
even after verification (confirmed via Google's own documentation, worth
knowing generally): the user revokes access manually, the refresh token
goes unused for 6 months, or the user changes their Google account
password (specifically for tokens holding Gmail scopes). None of these are
bugs — they're expected, and the audit log
(`Client_Integration_and_Credential_Platform_v1.md` Part 6.3) will capture
whichever one occurs via the raw error Google returns.

## 1.8 Submitting for Verification (Do This Now, in Parallel)

19. Once ready, go to **Google Auth Platform → Verification Center** (or
    the equivalent submission flow) and submit for review.
20. Required for submission: app name/logo/support email matching your
    real, live app; a privacy policy published at your domain and linked
    on the consent screen; written justification for each requested scope
    explaining exactly why your app needs it.
21. Timeline: typically 2–6 weeks; can be longer if Gmail's scope lands in
    the Restricted tier (requiring an additional CASA security
    assessment). **Start this now** — per the earlier decision, this
    should not wait for the rest of the build to finish.

---

# PART 2 — Shopify (shared app, Authorization Code Grant)

**Live reference:** https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens
and https://www.apideck.com/blog/how-to-create-a-shopify-public-oauth-app

## 2.1 Important Context Before Starting

**Shopify's app-creation system changed on January 1, 2026** — the old
"Custom App" workflow (where a merchant copies a token straight from
their own admin panel) is discontinued for new apps. The current path,
described below, uses a standard OAuth-style Authorization Code Grant —
structurally similar to Google's flow, not a per-client setup. **This UI
is newer and has been reported as inconsistent in community forums as
recently as within the past few months** — if a step below doesn't match
what you see, search "Shopify Dev Dashboard [task]" for the current exact
location rather than assuming the instructions here are wrong.

## 2.2 Create the App

1. Log into your [Shopify Partner account](https://partners.shopify.com).
2. Navigate to the **Apps** section (may also be reached via the **Dev
   Dashboard**, per Shopify's 2026 restructuring).
3. Click **Create app**, choose the **Public app** / standalone OAuth path
   (not "Custom app" — that path is being phased out for new merchants).

## 2.3 Configure Redirect URL and Scopes

4. Find **App setup** (or **Configuration**) for the app you created.
5. **Allowed redirection URL(s):** paste the exact callback URL from Part
   0.2. This must match exactly what's sent in the actual OAuth request —
   no trailing-slash mismatches.
6. **API access scopes:** select only what's needed. Based on
   `External_Integration_Strategy_v1.md` Part 6.1's confirmed scope
   (read + dashboard-approval-draft-order, never direct order placement):

```
read_products
read_orders
read_customers
read_inventory
write_draft_orders   (needed only for the post-approval draft-order step,
                       NOT for direct order creation — the platform never places
                       a live order without client approval)
```

**One scope needs a separate, additional approval:** `read_all_orders` (if
needed for historical order data beyond Shopify's default 60-day window)
requires a *separate* review submitted through the Partner Dashboard,
which Shopify states can take up to 7 business days — request this early
and separately if historical order access is actually needed, don't
assume it's covered by the general app review.

7. Click **Create app** / **Save**.

## 2.4 Copy Credentials

8. Your **Client ID (API key)** and **Client Secret (API secret key)** are
   shown on the app's settings page — Shopify's documentation sometimes
   uses each pair of terms interchangeably; they're the same values.

## 2.5 No Review Gate for This Path

Confirmed: the standard Authorization Code Grant / public-app path used
here does not require Shopify's App Store review process (that review is
only for apps listed publicly in Shopify's App Store, which this is not).
Usable immediately once created.

## 2.6 Token Behavior

The Authorization Code Grant flow produces a **long-lived access token**
that does not expire until the client uninstalls the app — no equivalent
of Google's 7-day Testing-mode trap. (A separate flow, "Client Credentials
Grant," produces a 24-hour token requiring daily refresh — **do not use
that flow**; it's intended for apps you install on your own store, not for
a multi-tenant SaaS connecting to client stores.)

---

# PART 3 — Slack (shared app, no review gate)

**Live reference:** https://docs.slack.dev/authentication/installing-with-oauth/
and https://api.slack.com/quickstart

## 3.1 Create the App

1. Go to [api.slack.com/apps](https://api.slack.com/apps).
2. Click **Create New App → From scratch**.
3. Name the app (e.g., "ZeroManual") and select a development workspace (any
   workspace you control — used only for building, not a real client's).

**Faster alternative, recommended:** Slack and n8n's own documentation
both suggest creating **From a manifest** instead — pasting a JSON block
that pre-configures scopes and redirect URL in one step, rather than
clicking through multiple screens. Consider this if the person executing
this has any JSON comfort; it reduces the multi-step process below to one
paste.

## 3.2 Add Bot Token Scopes

4. In the left sidebar, open **OAuth & Permissions**.
5. Scroll to **Scopes → Bot Token Scopes**, click **Add an OAuth Scope**.
6. Add exactly: `chat:write` — per
   `External_Integration_Strategy_v1.md` Part 6.2's confirmed reduced
   scope (send-only, no channel reading, no member lookup needed).

**Decide the full scope list now, not incrementally** — adding a scope
later requires reinstalling the app, which generates a brand new Bot
Token, meaning the stored credential in Supabase would need manual
updating.

## 3.3 Install and Get the Token

7. Scroll up, click **Install to Workspace** (or **Request to Install**
   if the workspace requires admin approval).
8. Review the permissions screen, click **Allow**.
9. Back on **OAuth & Permissions**, copy the **Bot User OAuth Token** — it
   starts with `xoxb-`.

## 3.4 For Multi-Workspace Installation (Every Future Client)

This single app registration is reused for every client — each client's
own workspace admin clicks ZeroManual's own "Add to Slack" OAuth button
(standard OAuth v2 flow, not the "Install to Workspace" button used above
for your own dev/test workspace) and gets their own separate `xoxb-`
token. No per-client app creation needed.

## 3.5 No Review Gate

Confirmed: unless this app is publicly listed in Slack's App Directory
(not needed for this use case), there is no review process. Usable
immediately.

## 3.6 Token Behavior

Bot tokens do not expire on their own — they remain valid until an admin
uninstalls the app, someone manually revokes it, or the app's scopes are
changed (triggering a reinstall and new token, per 3.2 above).

---

# PART 4 — Calendly (self-service, no review gate)

**Live reference:** https://developer.calendly.com/creating-an-oauth-app

## 4.1 Create a Developer Account

1. Go to [developer.calendly.com](https://developer.calendly.com) and
   sign up using GitHub or Google — **this is a separate developer
   account, not your regular Calendly user login.**

## 4.2 Create the OAuth App

2. From **My Apps**, click **Create new app**.
3. Fill in the app name.
4. **Redirect URI:** paste the exact callback URL from Part 0.2.
   - Note: for the Sandbox environment, `http://localhost` URIs are
     permitted for early testing; **Production requires HTTPS.**
5. **Environment type:** start with **Sandbox** for initial testing;
   create a **separate, second app for Production** when ready to connect
   real client accounts — Calendly explicitly recommends not reusing one
   app across both.

## 4.3 Scopes — Resolved, Real Scope Catalog Confirmed

**Correction to this guide's earlier draft, which flagged a discrepancy —
now resolved via Calendly's live, current documentation
(developer.calendly.com/scopes).** Real, granular scopes do exist and are
required. The earlier conflicting claim ("Calendly does not use
traditional OAuth scopes") does not match Calendly's current, authoritative
documentation and should be disregarded.

**Important mechanical detail:** scopes are not selected via a checkbox
during app creation — they are appended as a `scope` parameter (space-
separated) directly on the authorization URL when initiating the OAuth
flow. For newly created apps, **no API access is granted at all until
scopes are explicitly requested** — there is no default/full-access
fallback.

**Scopes needed, based on `External_Integration_Strategy_v1.md` Part 3's
Calendar requirements** (availability check, create/cancel booking):

```
availability:read           (user_busy_times, availability schedules)
event_types:read              (needed to know what can be booked)
scheduled_events:read           (read existing bookings)
scheduled_events:write            (create event invitees = book;
                                   cancel = cancellation endpoint)
users:read                          (needed for the Get current user
                                   test call in Part 4.4 below)
```

Sample authorization URL shape (values illustrative):

```
https://auth.calendly.com/oauth/authorize
  ?client_id=CLIENT_ID
  &redirect_uri=REDIRECT_URI
  &response_type=code
  &scope=availability:read event_types:read scheduled_events:read scheduled_events:write users:read
```

**One important behavior to know:** a `:write` scope implicitly includes
the matching `:read` scope in the same domain — `scheduled_events:write`
alone would cover both create and read for that domain — but requesting
both explicitly above is harmless and clearer for whoever reviews this
later.

## 4.4 Copy Credentials

6. After creation, copy the **Client ID**, **Client Secret**, and
   **Webhook Signing Key** immediately — Calendly states these values
   cannot be viewed again after this step.

## 4.5 No Review Gate

Confirmed: Calendly has no formal app review process. The Sandbox →
Production step is a self-service configuration change, not a submission
for approval.

## 4.6 One Real Constraint on the Client's Side

**Webhooks (and possibly some organization-wide API access) require the
client's own Calendly account to be on a paid Premium tier or above** —
confirmed via Calendly's own documentation. A client on Calendly's free
plan may not support everything this integration needs. Worth checking
during a client's onboarding call if they mention using Calendly.

## 4.7 Token Behavior

Access tokens are short-lived (2 hours) — normal, expected, handled by the
Token Refresh Sweep
(`Client_Integration_and_Credential_Platform_v1.md` Part 6.1). Refresh
tokens do not expire on their own — no 7-day trap like Google's.

---

# PART 5 — Cal.com (manual human review — start early, expect delay)

**Live reference:** https://cal.com/docs/api-reference/v2/oauth and
https://cal.com/help/apps-and-integrations/oauth

## 5.1 Important Context Before Starting

**Confirmed: this is the one provider in this guide with a real,
unpredictable wait.** Unlike every other provider here, Cal.com requires a
human admin to manually review and approve the OAuth client — no
published timeline exists anywhere in their documentation. Submit this
one first, today, before any other provider setup, so the wait runs in
parallel with everything else rather than becoming a late-discovered
bottleneck.

## 5.2 Create the OAuth Client

1. Go directly to
   [app.cal.com/settings/developer/oauth](https://app.cal.com/settings/developer/oauth).
2. Fill in the app details.
3. **Redirect URIs:** paste the exact callback URL from Part 0.2 (up to
   10 URIs can be registered per client, if needed for multiple
   environments).
4. **Scopes:** select at least one — required, the form will not let you
   proceed without it. Match to
   `External_Integration_Strategy_v1.md` Part 3's Calendar requirements
   (booking read/create/cancel, availability read).
5. Submit.

## 5.3 What Happens Next

The client enters a **"pending"** state and is not usable by anyone except
the client owner (i.e., whoever is logged in, executing this step) for
testing purposes — other users cannot authorize through it yet. An admin
at Cal.com reviews it and sends an email once accepted or rejected.

**Useful, confirmed detail:** because the owner can still test a pending
client, engineering can build and verify the Cal.com integration works
correctly *before* the review clears — the review only blocks *other
users* (real clients), not development/testing work. This means Cal.com's
review wait does not need to block the build itself.

## 5.4 If Approval Doesn't Come, or Takes Too Long

Per the confirmed decision in
`Client_Integration_and_Credential_Platform_v1.md` Part 8.5: migrate this
provider to its **Bearer API key** authentication instead of OAuth. This
requires no review — a client generates their own Cal.com API key
(prefixed `cal_`) and pastes it into the Zenny dashboard directly,
mechanically similar to the WooCommerce flow (Part 6 below) rather than a
one-click OAuth Connect experience.

## 5.5 A Caution for Later — Changing Scopes Re-Triggers Review

Confirmed: adding new scopes to an already-approved Cal.com OAuth client
sets it back to "pending" and requires a fresh review. Decide the full
scope list now (Part 5.2) rather than planning to expand it after
approval — an unplanned scope change later means going through Cal.com's
unpredictable review wait a second time.

## 5.6 Token Behavior — Confirmed, With a Caveat

Cal.com's own "Managed Users" token-refresh endpoints (a separate,
specialized product tier from the standard OAuth Client flow used in Part
5.2 above) document: **access token valid 60 minutes, refresh token valid
1 year**, using refresh token rotation (each refresh issues both a new
access token and a new refresh token).

**Caveat, stated plainly:** the two specific endpoints this figure comes
from are themselves marked deprecated by Cal.com ("will be removed in the
future") — they belong to Cal.com's Managed Users product, not the
standard OAuth Client flow this guide's Part 5.2 walks through. The 60-
minute/1-year figures are the best available evidence of Cal.com's general
token-lifetime philosophy, consistent across both deprecated endpoints,
but should be **reconfirmed against whatever token response the standard
OAuth Client flow actually returns** once a real Cal.com token is issued —
don't assume the exact same numbers apply without checking the real
response payload from the flow in Part 5.2.

**What is not in question:** either way, Cal.com does not resemble
Google's 7-day Testing-mode trap — no source found anything suggesting a
short, hard-revoked refresh token tied to app-review status.

---

# PART 6 — WooCommerce (no OAuth — manual key entry)

**Live reference:** WooCommerce's own REST API documentation, via the
client's own WordPress admin (WooCommerce → Settings → Advanced → REST
API) — there is nothing to register on ZeroManual's side for this provider.

## 6.1 Why This Provider Is Different From Every Other Section Here

Confirmed in
`Client_Integration_and_Credential_Platform_v1.md` Part 8.3: WooCommerce
is self-hosted WordPress, not a centralized platform — there is no OAuth
consent screen, no redirect flow, and nothing for ZeroManual to register in
advance. **Skip Parts 0.2's redirect URI entirely for this provider — it
does not apply.**

## 6.2 What the Client Has to Do (and What This Means for Onboarding)

The client must, on their own WordPress site:

1. Log into their WordPress admin.
2. Navigate to **WooCommerce → Settings → Advanced → REST API**.
3. Click **Add key** (or **Create an API key**).
4. Set permissions to **Read/Write**.
5. Generate the key — WooCommerce will display a **Consumer Key** and
   **Consumer Secret**, shown once.
6. The client copies both values and pastes them into the Zenny dashboard's
   plain form for this connection (no redirect, no OAuth screen).

## 6.3 Flagged Requirement — This Needs a Real Onboarding Guide

**This is the single highest-friction connection step in this entire
document**, precisely because there is no one-click alternative. Per
`Client_Integration_and_Credential_Platform_v1.md` Part 13.7: the
client-facing onboarding guide (a separate deliverable, not yet written)
must include a detailed, screenshot-level walkthrough of these exact
WordPress admin steps — a client unfamiliar with WordPress's admin panel
can genuinely get lost in this navigation without one. Do not assume this
step is self-explanatory the way clicking "Connect" is for every other
provider in this guide.

## 6.4 Token Behavior — Confirmed, No Expiry Mechanism Exists

**Confirmed directly via WooCommerce's official REST API documentation:**
Consumer Key/Secret pairs have no expiry mechanism at all. This isn't an
oversight in the documentation — WooCommerce's REST API uses HTTP Basic
Auth (Consumer Key as username, Consumer Secret as password), not an OAuth
token exchange, so there is no access-token/refresh-token pair, no
expiry timestamp, and nothing for a Token Refresh Sweep
(`Client_Integration_and_Credential_Platform_v1.md` Part 6.1) to act on
for this provider. The credential remains valid until the client manually
revokes it from their own WooCommerce admin.

**Practical consequence:** WooCommerce connections should be explicitly
excluded from the Token Refresh Sweep's scope, not merely skipped by
having no `refresh_token_secret_id` populated (Part 4.2.1's derived-method
logic already handles that correctly) — worth confirming the sweep's query
filters out `provider = 'woocommerce'` rows entirely rather than querying
them and finding nothing to do, for efficiency at scale.

---

# PART 7 — Summary Table

| Provider | Review gate? | Wait | Token behavior | Redirect URI needed? |
|---|---|---|---|---|
| Google | Yes, formal | 2–6+ weeks; Testing mode usable immediately with 7-day refresh-token trap | Long-lived once verified | Yes |
| Shopify | No | None | Long-lived (until uninstall) | Yes |
| Slack | No | None | Never expires (until revoked/reinstalled) | N/A (install-button flow) |
| Calendly | No | None | Access: 2hr; Refresh: never expires | Yes |
| Cal.com | Yes, manual human | Unpublished, unpredictable | Access ~60min, refresh ~1yr (confirmed via deprecated endpoint, likely representative — reconfirm against live OAuth Client flow) | Yes |
| WooCommerce | N/A — no OAuth | N/A | No expiry mechanism at all — Basic Auth, valid until manually revoked | No |

---

# PART 8 — What To Do With These Credentials Once Collected

Every Client ID + Client Secret produced above goes into
`control.oauth_apps` (one row per provider), with the secret stored via
Supabase Vault — never as plaintext, never in a spreadsheet, never in
Slack/email to yourself. Refer to
`Client_Integration_and_Credential_Platform_v1.md` Part 4.4 for the exact
storage mechanism. This document's job ends at "you have the
credentials" — getting them into the database correctly is that
document's responsibility, not this one's.

---

# PART 9 — Open Items From This Research Pass

1. ~~Calendly's scope-selection discrepancy~~ — **RESOLVED.** Real,
   granular scopes confirmed via Calendly's live scopes documentation
   (Part 4.3). The earlier conflicting claim was not accurate against
   current documentation.
2. **Cal.com's token expiry behavior** — **partially resolved.** 60-minute
   access / 1-year refresh confirmed, but sourced from a deprecated
   endpoint belonging to a different product tier (Managed Users) than the
   standard OAuth Client flow this guide uses (Part 5.6). Reconfirm
   against the actual token response once a real Cal.com OAuth Client
   token is issued.
3. **Shopify's exact current menu location for redirect URL
   configuration** — community reports show this moved at least once
   during 2025–2026 and was still unresolved in recent threads. Use
   Shopify's own live documentation as the authority at execution time,
   not the specific menu path implied above.
4. ~~WooCommerce's Consumer Key/Secret expiry, if any~~ — **RESOLVED.**
   Confirmed via WooCommerce's official REST API documentation: no expiry
   mechanism exists. Basic Auth credential, valid until manually revoked
   (Part 6.4).

---

```
ZeroManual · Zenny AI Workforce · Provider App Setup & Developer Configuration Guide v1
Companion to Client_Integration_and_Credential_Platform_v1.md and
External_Integration_Strategy_v1.md. All provider setup steps verified against
live documentation and current community reports, 2026-08-01. Provider UIs change
without notice — where this guide's click-path and a provider's live interface
disagree, the provider's own current documentation is authoritative.
```
