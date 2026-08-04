# External Integration Strategy v1

```
Status:    DRAFT — Architecture Breakthrough resolution document (Problem 2 & 4)
Purpose:   Decide which external provider(s), per integration category, Zenny
           supports in production v1 — and define the provider-agnostic
           pattern (Capability → Router → Provider Branch) so Runtime and
           Workflows never couple to a specific provider.
Position:  Sits alongside n8n_Workflow_Specification_v1.md (frozen), inserted
           before the paused Build Execution Plan resumes. Written in response
           to the Architecture Breakthrough Report v1 (Problems 2 and 4).
Companion: Client_Integration_and_Credential_Platform_v1 (not yet written) —
           that document defines HOW a client connects an account (OAuth
           flows, Supabase credential schema, token refresh, Credential
           Resolver utility). This document defines WHICH provider and WHAT
           it's used for. Neither document duplicates the other.
Explicitly NOT covered here: Voice/Twilio agentic calling (architecture not
           yet decided, flagged as a future document), Convocore-specific
           database schema additions (deferred per your explicit instruction
           until Convocore-side decisions finalize), Commerce-Restaurant and
           Engagement archetypes (deferred, no near-term client expected).
```

---

# PART 1 — Purpose & Scope

## 1.1 Why This Document Exists

The Architecture Breakthrough Report v1 identified that the frozen document
chain (Runtime → Database → Execution Architecture → Integration Contract →
Workflow Specification) carried an unexamined assumption: that Google
Calendar, Gmail, and an unnamed "CRM" were the external providers Zenny would
integrate with. This was never a formally reviewed product decision — it was
inherited from the flow diagrams' own example text (Integration Contract Part
15.2) and from Workflow Specification Part 11's own honest admission that
these were "not yet verified... not yet resolved."

This document is where that decision actually gets made, deliberately,
provider by provider, checked against what each provider's real API supports
today — not assumed from what an n8n node happens to expose.

## 1.2 What This Document Decides

- Which provider(s), per integration category, Zenny supports in v1
  production (not demo-then-production — this is the production decision).
- What each provider is used for, and its real capability boundary.
- The general Capability → Router → Provider Branch pattern that keeps
  Runtime and every Business Workflow provider-agnostic (resolves
  Breakthrough Report Problem 4).
- Which categories are client-configurable (multiple valid providers, client
  picks) versus fixed (one provider, no choice).

## 1.3 What This Document Does NOT Decide

- **How a client actually connects an account** (OAuth consent flow per
  provider, Supabase token storage, token refresh, credential revocation) —
  entirely deferred to `Client_Integration_and_Credential_Platform_v1`.
- **The Supabase schema for storing credentials** — same deferral.
- **Voice/Twilio agentic calling** — not yet designed, explicitly out of
  scope, flagged as a future document.
- **Convocore-specific database fields** (`conversation_id`, agent identifiers,
  etc.) — deferred per your explicit instruction; Convocore-side decisions
  are still finalizing.
- **Whether/how a channel supports re-engagement outside its own send
  window** (e.g., WhatsApp's message-window rules) — flagged as an open item
  in Part 7, not resolved here, since it depends on which chat channels
  Convocore ultimately supports (not yet decided on Convocore's side).

## 1.4 Relationship to Other Documents

```
n8n_Workflow_Specification_v1.md (frozen)
   — named the 3 integration categories (Calendar, Email, Notification) and
     flagged all 3 as unverified. This document resolves that flag.
        ↓
External Integration Strategy v1          ← THIS DOCUMENT
        ↓
Client Integration & Credential Platform v1   (not yet written — the HOW)
        ↓
Build Execution Plan (paused, resumes after both of the above)
```

---

# PART 2 — Integration Categories

Reconstructed from what the 19 frozen Tools (Workflow Spec Part 13) and their
archetypes actually require — not a speculative future-proofing list. Four
categories are genuinely load-bearing for v1:

```
1. Calendar / Scheduling    — Appointment, Consultation, Emergency (optional
                              path), used by CheckAvailability,
                              CreateAppointment, CreateBookingRequest,
                              CreateInspectionSlotBooking, CreateScoredBooking,
                              CancelAppointment
2. Email                     — universal, every archetype; SendEmailReply,
                              Sync Inbox, Categorize Email (Workflow Spec
                              Part 7.7 internal registry)
3. Ecommerce Platform          — Commerce-Ecom only; CreateCart,
                              CheckAvailability (inventory), GetOrderStatus
4. Internal Notification        — universal; Notification Router utility
                              (UTIL-004), every archetype's escalation path
```

Two categories from earlier discussion are **not** separate provider
decisions, resolved instead as *policy*, not *providers* — see Part 6:

```
- Recovery Send Channel  — not a fixed provider; resolved per-lead from
                           source_channel (real column, Database Structure
                           v4 FINAL — leads.source_channel, typed
                           source_channel_enum) plus a client-level policy
                           setting (Part 6.3)
- Emergency Booking Mode  — not a provider; a client-level config toggle
                           between direct-calendar-write and
                           dashboard-request-only (Part 6.4)
```

Two categories considered and explicitly deferred, not decided here:

```
- Voice / Telephony (Twilio)  — flagged, no design yet, future document
- CRM                          — no Tool in the 19-Tool registry actually
                               calls a CRM; Integration Contract Part 15.1's
                               mention of "CRM" was an illustrative example,
                               not a commitment. Not built for v1.
```

---

# PART 3 — Calendar / Scheduling

## 3.1 Providers — v1: Google Calendar, Calendly, Cal.com (client-selectable)

All three verified against their real, current API capability — not against
what n8n's built-in node happens to expose, since none of the three are used
via n8n's native connector node (Part 5 explains why):

| Provider | Create booking | Check availability | Cancel | Auth |
|---|---|---|---|---|
| **Google Calendar** | Yes | Yes (dedicated `freebusy`/availability query) | Yes | OAuth 2.0 |
| **Calendly** | Yes — via Calendly's Scheduling API (2025 release, built explicitly for AI assistants and automation tools, not the older read/webhook-only v2 endpoints) | Yes (`/user_busy_times`, `/user_availability_schedules`) | Yes | OAuth 2.0 or Personal Access Token |
| **Cal.com** | Yes (`POST /v2/bookings`) | Yes (slots/availability endpoint) | Yes | Bearer API key or OAuth 2.0 |

**Why all three, not one:** unlike a typical build where "add another
calendar provider" is deferred as future scope, here none of the three
require n8n's native connector node (all three are called via raw HTTP
Request regardless, per Part 5's pattern) — so there is no asymmetry in
build effort between supporting one provider versus three. The client's
actual calendar system determines which one applies; restricting to a single
provider would only exclude clients for no engineering benefit.

**Why NOT Microsoft Outlook for v1:** Outlook's calendar/email node exists
and is capable, but is being deliberately deferred (per your instruction,
Part 8) rather than added now — a Microsoft 365 client, if one appears
before this is built, would need this document amended via Change Request
first.

## 3.2 Capability Boundary — What's Genuinely Supported at v1

- **Business-level availability only, at the provider-integration layer.**
  Consultation's specialist-availability and Emergency's team-availability
  are **not** solved by adding a calendar provider — a calendar API tells
  you if *a* slot is free, not whether the *right specialist/team* is
  free, unless the client maintains separate calendars per staff member
  and the Runtime is told which one to check. No provider integration in
  this document builds that live capacity/specialist feed; that remains
  deferred to v2 (Workflow Spec Part 7.3). At the Runtime-decision layer,
  this is resolved for v1 — see Part 7, item 2, below: the agent does not
  block or assert unverifiable availability, it routes through the
  client-configurable `dashboard_request` fallback
  (`Agent_Runtime_System_v1.md` Module 3 §2.1) so a human confirms
  capacity instead. Appointment's practitioner-specific booking is a
  separate, already-solved case (calendar availability check, already
  implemented) and is not part of this boundary.
- **Cal.com's API is version-header-sensitive** (`cal-api-version` header
  required on every request, changes over time) — flagged for the Build
  Card that implements this branch, per the Manual's MCP-verification rule;
  not re-verified further here.
- **Calendly's create/cancel capability is new (2025 Scheduling API)** —
  distinct from Calendly's older, more commonly documented v2 endpoints
  (read/webhook-oriented only). Any Build Card implementing this must
  target the Scheduling API specifically, not the older endpoints a quick
  search might surface first.

## 3.3 Config Field

`client_config` requires a new field to record which provider a client
uses (does not exist today — confirmed absent from the live schema):

```
calendar_provider   text   -- 'google_calendar' | 'calendly' | 'cal_com'
```

**Confirmed: single value, one provider per client at a time — not
simultaneous multi-provider.** A client picks one calendar system; switching
later is a config update (new value + new credential), not a multi-provider
merge. This keeps the Router (Part 5) simple — exactly one branch is ever
active per client, never a fan-out across providers.

---

# PART 4 — Email

## 4.1 Provider — v1: Gmail only

**Not Microsoft Outlook, not generic SMTP.** Gmail is the sole v1 email
provider.

**Why not App Password / SMTP as an alternative or fallback:**
- App Passwords require the client to manually generate the password inside
  their own Google Account settings — this breaks the one-click "Connect"
  dashboard flow the whole Credential Platform is built around; there is no
  OAuth redirect equivalent for it.
- App Passwords only ever cover send/read mail — Calendar access still
  requires full OAuth regardless, so using App Password for email doesn't
  reduce total integration complexity, it adds a second, inconsistent
  mechanism alongside OAuth.
- Google has been actively restricting App Password / basic-auth access for
  third-party apps since 2024, with further restrictions continuing — not a
  stable foundation to build new integration work on.
- **Decision: OAuth only, one mechanism, no exceptions.**

## 4.2 Capability Boundary

Full send, reply, draft, read, label, and thread capability is required —
`SendEmailReply` (Tool), Sync Inbox and Categorize Email (internal workflows,
Workflow Spec Part 7.7) both need read+send. Per the OAuth verification
research (Part 8), this places Gmail's scope requirement solidly in
Google's **sensitive** tier at minimum, and potentially **restricted** tier
if the read+send combination is classified that way at review time — this
needs to be confirmed during the actual Google Cloud Console app
configuration, not assumed here.

## 4.3 Config Field

Even though only one provider (Gmail) is supported in v1, the field is added
now — not deferred — so a second provider later is a config/credential
change, not a schema migration:

```
email_provider   text   -- 'gmail' for v1; future values ('outlook',
                            'custom_smtp', etc.) added without a schema
                            change, only a new Router branch (Part 5) plus
                            the corresponding OAuth mechanics in the
                            Client Credential Platform document
```

This mirrors `calendar_provider` (Part 3.3) and `ecommerce_provider` (Part
6.1) exactly — every category gets a provider field from day one, even
categories with only one v1 option, so adding a second provider is never a
second architecture pause like this one.

---

# PART 5 — The Capability → Router → Provider Branch Pattern

This is the direct resolution to Breakthrough Report **Problem 4** (provider
logic leaking into architecture) — extending the same reasoning Execution
Architecture Part 6.13 already applied to *workflow placement* (organize by
business ownership, not by integration) one level deeper, to *provider
selection within a workflow*.

## 5.1 The Pattern

```
CreateAppointment (Tool, WF-003 — Runtime-facing, provider-agnostic name)
   ↓
Schema Resolver (UTIL-001, existing) → client_schema_name
   ↓
Provider Resolver (NEW — see 5.2)  → reads client_config.calendar_provider
   ↓
Switch/Router node inside the Business Workflow
   ├── "google_calendar" branch → raw HTTP Request, Google Calendar API,
   │     Authorization header built from a token fetched via the
   │     Credential Resolver (Client Credential Platform doc, not this one)
   ├── "calendly" branch        → raw HTTP Request, Calendly Scheduling API
   └── "cal_com" branch          → raw HTTP Request, Cal.com API v2
                                    (cal-api-version header set)
   ↓
Each branch normalizes its own response into the SAME Tool response shape
(Integration Contract Part 8 — appointment_id, calendar_event_id, status)
   ↓
Continue: Error Logger → Respond
```

## 5.2 Why NOT n8n's Native Connector Nodes

This is a deliberate, explicit departure from the general node-selection
guidance in Workflow Spec Part 6.7 ("prefer a dedicated node over HTTP
Request wherever one exists"), and the reason must be stated plainly so a
future builder doesn't "fix" this by switching back to the native node:

n8n's native `googleCalendar`, `gmail`, `microsoftOutlook` nodes are built
around **one n8n-stored credential per node**, configured once by a human in
the n8n editor at build time. That model fits Zenny's *own* internal
accounts (if any), but is architecturally wrong for *client* accounts in a
multi-tenant platform — the whole point of the Client Credential Platform is
that each client's own OAuth token lives in Supabase, fetched dynamically per
execution, not pre-configured per node. n8n's HTTP Request node supports
building an `Authorization: Bearer {token}` header from an expression fed by
a prior node's output — this is the supported mechanism this pattern relies
on, confirmed against n8n's own node capability.

**Consequence:** every provider branch, across every category in this
document, is built via HTTP Request node + dynamic credential fetch — never
via a native OAuth-credential-store node. This is uniform across Calendar,
Email, Ecommerce, and Notification.

## 5.4 Modular Connection Principle — Stated Explicitly

This is the actual payoff of Part 5's pattern, and it's worth naming as its
own standing rule rather than leaving it implicit in the reasoning above:

> **A provider is a configuration, not a workflow.** Connecting, switching,
> or disconnecting a provider for a given client is a database change —
> updating `calendar_provider`/`email_provider`/`ecommerce_provider`/
> `notification_option` plus the corresponding credential in Supabase (Client
> Credential Platform document). It is never a workflow edit.

Concretely: if a client switches from Google Calendar to Cal.com, nothing in
n8n is touched. The Switch/Router node (Part 5.1) already has a Cal.com
branch built once, shared by every client who uses it. The only change is
one row in `client_config` and one new credential record — the workflow
itself is completely unaware anything changed.

This is the standing test for whether a future provider integration was
built correctly: **if adding, removing, or switching a client's provider
ever requires opening a workflow in the n8n editor, the modular pattern was
violated somewhere and needs to be fixed** — not treated as an acceptable
one-off. Any Build Card touching a provider branch should be checked against
this test before being marked complete (a natural addition to the Manual's
Fixed Compliance Checklist, Section 10.C.1, when Build Cards for this area
are written).

## 5.5 What a New Provider Costs, Later

Adding a 4th calendar provider, or a 2nd email provider, is: one new branch
in an existing Switch node, in the small number of workflows that already
touch that category, plus the OAuth mechanics for that one provider in the
Credential Platform. It does not touch the Runtime, the Integration
Contract, or any Tool payload — this is the concrete payoff of the pattern,
and the reason this pause was worth taking before Build Cards.

---

# PART 6 — Ecommerce, Notification, Recovery Channel, Emergency Mode

## 6.1 Ecommerce — v1: Shopify, WooCommerce (client-selectable)

**Hard product rule, confirmed:** Zenny does not place orders directly on a
client's live store, by default, ever. The full policy:

```
Customer interacts with agent → agent builds an order/cart request
   ↓
Order request WRITES TO Zenny's own dashboard (Supabase), not the live store
   ↓
Client reviews the request in their dashboard
   ↓
Client approves → THEN, and only then, a draft order may be created on the
                   client's real Shopify/WooCommerce store via that
                   platform's own API
                   ↓
                   Customer is sent a confirmation message with the order
                   details (approved), via the SAME channel-resolution
                   policy as Recovery (Part 6.3) — not a separate mechanism.
Client rejects  → request closed, no store write ever happens
                   ↓
                   Customer is sent a rejection notice, via the same
                   channel-resolution policy as Recovery (Part 6.3).
```

**Confirmed:** both outcomes (approval and rejection) require a customer-
facing confirmation message, and this reuses Part 6.3's channel-resolution
policy exactly rather than inventing a second mechanism — same
`recovery_channel_policy` field, same per-lead `source_channel`/`convoId`
lookup, same email-as-guaranteed-fallback logic. This is a new Tool-level
concern (`CreateCart`'s downstream approval/rejection flow needs to trigger
a send), not yet named in the Workflow Specification's `CreateCart` entry —
flagged as a Change Request against Workflow Spec Part 13.5 in Part 9 below.

**Important clarification, confirmed:** this does not require any change to
the Runtime's existing agentic-booking conversational logic (Runtime System's
Mode A path). The Tool (`CreateCart`) and its payload/response contract
(Workflow Spec Part 13.5) are unchanged — only the *destination* of the
write changes (Zenny's own order-request table, not the live store's order
API). The semi-automatic upgrade path (client opts in to direct placement)
is a v2/later config toggle, not built by default.

**Capability boundary (read side, both providers):** product catalog
(including images and product links, per your instruction), inventory
levels, order history, abandoned/incomplete cart data, customer records.
Both Shopify and WooCommerce expose all of this via their standard REST
Admin APIs.

**Config field:** `ecommerce_provider` — `'shopify' | 'woocommerce'`, new
field, does not exist today.

## 6.2 Internal Notification — v1: client-configurable, Slack and/or Email

**Scope, confirmed and reduced from the earlier draft integration doc:** only
outbound message-send is needed — no channel reading, no member listing, no
user-profile lookup. This is a materially smaller scope than a general
Slack integration would imply, and should be stated explicitly so a future
builder doesn't request broader scopes than needed during Slack app
configuration.

```
Slack:  chat:write only
Email:  reuses the same Gmail credential/mechanism as Part 4 — zero
        additional client setup, since every client already has Email
        configured by definition
```

**Config field, corrected — single value, enum-style, not an array:**

```
notification_option   text   -- 'email' | 'email_slack' | 'email_channel'
```

`'email'` — email only. `'email_slack'` — email + Slack. `'email_channel'`
— email + the same Convocore-channel-reengagement mechanism used by Recovery
(Part 6.3), for escalations that should also reach the customer's original
channel. Single value, no array — matches the same single-value discipline
applied to `calendar_provider` (Part 3.3) and `ecommerce_provider` (Part
6.1). Does not exist today.

## 6.3 Recovery Send Channel — Policy, Not Provider Selection

Per your correction during discussion: this is **not** a fixed
provider choice, and it is **not** purely derived either — it is a
two-layer resolution combining a client-level policy with per-lead
data that already exists in the frozen schema:

```
Layer 1 — Client policy (client_config.recovery_channel_policy, NEW field):
   "email_only"          → always email, regardless of how the lead
                            originally made contact
   "email_plus_source"    → email AND the lead's original contact channel,
                            IF that channel supports a return message
                            at send time

Layer 2 — Per-lead resolution (uses EXISTING schema — leads.source_channel,
   typed source_channel_enum, confirmed live in Database Structure v4 FINAL):
   IF policy = "email_plus_source"
      AND source_channel supports re-engagement at this point in time
      → send via source_channel (+ email)
   ELSE
      → email only (the guaranteed fallback — every client has this,
        since Email is a fixed, non-optional category, Part 4)
```

**Mechanism, corrected and confirmed — this is NOT a direct channel-API
integration.** Zenny/n8n never calls WhatsApp's API, Instagram's API, or
any other channel API directly for re-engagement. **Convocore already owns
every one of those channel connections** (its own WhatsApp Business
integration, Messenger, Instagram, web-chat, Discord — per
`Convocore_Master_Reference_v2/v3.md`'s channel-setup sections), and
Convocore's own Conversation API is what actually delivers a message back
into an existing thread:

```
n8n Recovery Workflow (SendRecoveryMessage, WF-018)
   ↓
Reads the lead's stored convoId + origin (channel) — NEW fields, do not
   exist in the schema today (see below)
   ↓
Calls Convocore's Conversation API directly, reusing the SAME convoId:
   PATCH /agents/{agentId}/convos/{convoId}   (update/re-engage), or
   the WebSocket InteractObject pattern (Convocore_API_Reference_v1.md
   §17.3), sending a new prompt/message into the existing conversation
   ↓
Convocore delivers the message via whichever channel (origin) that
   conversation is already on — WhatsApp, Messenger, Instagram, web-chat,
   etc. — using ITS OWN channel credentials, not Zenny's
   ↓
Convocore's own channel-level rules (e.g., WhatsApp's messaging-window
   restrictions) apply — this is Convocore's operational concern, not
   something Zenny/n8n implements or works around directly
```

**This confirms and corrects Part 6.3's original framing:** "does
source_channel support a return message" is not something Zenny checks
itself — it's a property of Convocore's own channel connection and
messaging-window rules, discovered by attempting the send via Convocore's
API and handling its response, not pre-validated by Zenny.

**New database requirement, flagged, not solved by this document (per your
instruction — Convocore-side decisions still finalizing):** the schema
needs to store, per lead/conversation, at minimum `convoId` and `origin`
(Convocore's own identifiers, confirmed as real fields returned by
Convocore's Conversation API — `Convocore_API_Reference_v1.md` §9.1/9.2) so
the Recovery workflow can make this call later. `leads.source_channel`
(the existing enum) is Zenny's own internal categorization and is
insufficient alone — it doesn't carry the actual `convoId` needed to
re-engage the *specific* conversation thread. **Marked here explicitly as
"add later"** once Convocore's side finalizes, per your instruction — this
document does not add the field, only records that it's needed and why.

**No separate SMS/WhatsApp provider decision is needed for v1** as a result
of this resolution — Zenny never integrates with Twilio, WhatsApp Business
API, or any messaging provider directly for Recovery. Convocore is the only
integration point, and it already handles all of this internally.

## 6.4 Emergency Booking Mode — Client-Configurable

Per your correction: not a fixed "always request, never confirm" rule —
client-configurable between two modes:

```
client_config.emergency_booking_mode (NEW field):
   "direct_calendar"    → CreateInspectionSlotBooking / CreateCallbackQueueEntry
                          writes directly to the client's connected
                          calendar (Part 3), same as CreateAppointment
   "dashboard_request"   → writes to Zenny's own dashboard as a pending
                          request; client confirms before it becomes a real
                          calendar booking
```

**Runtime-level consequence, flagged as a Change Request against
`Agent_Runtime_System_v1.md`, not resolved here:** the agent's own wording
must vary based on this config value — "you're booked" is only correct
under `direct_calendar` mode; under `dashboard_request` mode the agent must
say something to the effect of "I've submitted this request — you'll be
notified once it's confirmed," per your explicit instruction that the agent
must never imply a confirmed booking that hasn't happened. This document
flags the requirement; the actual prompt/wording change belongs to the
Runtime document.

---

# PART 7 — Open Items Carried Forward

Per this project's established discipline (Integration Contract Part 14,
Workflow Spec Part 14) — flagged explicitly, not silently assumed:

1. **`convoId` / `origin` storage** (Part 6.3) — confirmed needed (Convocore's
   Conversation API requires the existing `convoId` to re-engage a specific
   thread), but marked "add later" per your explicit instruction, pending
   Convocore-side decisions finalizing. Not a design gap — a sequencing
   decision.
2. ~~Specialist/team-level availability (Consultation, Emergency,
   Engagement)~~ — **RESOLVED for v1, deferred to v2 by deliberate
   simplification, not an oversight:** a calendar/CRM provider tells you
   if a slot or record is free, not whether the *right* specialist/team
   is available or the *right* program capacity remains — that live
   feed is genuinely not built in v1 and isn't planned until real client
   demand surfaces the need (Workflow Spec Part 7.3, Runtime System
   Appendix C item 13/13a). What v1 resolves is the Runtime-decision
   layer: each of Emergency, Consultation, and Engagement now has a
   client-configurable fallback (`emergency_booking_mode`,
   `consultation_specialist_check_mode`, `engagement_capacity_check_mode`
   — `Agent_Runtime_System_v1.md` Module 3 §2.1, formally added per this
   Change Request), defaulting to `dashboard_request`: the agent never
   asserts availability it cannot verify — it routes to a human-confirmed
   pending request instead. Note this item does **not** include
   Appointment's practitioner-specific booking, which is a separate,
   already-built case (calendar availability check, already implemented
   in Direct Booking Flow) with no gap of any kind. No longer an open
   item at the Runtime-decision layer; the underlying live-data feeds
   remain an explicitly open v2 item.
3. **Google OAuth verification tier** (sensitive vs. restricted, and
   whether the annual CASA security assessment applies) — depends on the
   exact scope combination requested at Google Cloud Console configuration
   time; not knowable with certainty until that step is actually performed.
   **Partially resolved:** the Testing-mode 7-day refresh-token hard expiry
   (confirmed real, no backend workaround) and its required proactive-
   reminder handling are now fully specified in
   `Client_Integration_and_Credential_Platform_v1.md` Part 8.1.1. The
   restricted-vs-sensitive tier classification itself remains genuinely
   unknowable until Google Cloud Console configuration is actually
   attempted.
4. **Voice/Twilio agentic calling** — architecture not yet decided,
   deliberately out of scope for this document.
5. **Whether Convocore's channel-level re-engagement rules (e.g., WhatsApp's
   messaging-window restrictions) ever surface a failure back to n8n**, and
   if so what the Tool Execution Fallback (flagged during earlier
   discussion, belongs to the Client Credential Platform document) should
   do in that case — a real edge case, not yet designed.

---

# PART 8 — Deferred, Not Decided Here

Explicitly out of scope for v1, listed so a future Change Request has a
clear starting point rather than rediscovering these from scratch:

```
Microsoft 365 (Outlook Calendar + Outlook Mail)  — real n8n node exists,
   confirmed capable (calendar + email in one node/credential), deliberately
   not built now per your instruction
Commerce — Restaurant archetype                   — no near-term client
Engagement archetype                                — no near-term client
Voice / Telephony (Twilio)                            — architecture not
   yet designed
CRM integration                                        — no Tool requires
   it; Integration Contract's mention was illustrative, not a commitment
```

---

# PART 9 — Impact on Frozen Documents (Change Requests Raised)

Per `AI_Builder_Operating_Manual_v1.md`'s Change Request process — this
document does not silently alter frozen documents; each impact is named
explicitly:

1. **`n8n_Workflow_Specification_v1.md` Part 11** (External Integrations
   table) — "Google Calendar... not yet verified," "Email Provider (Gmail
   or equivalent)... not yet verified," "Notification Channel... not yet
   decided" are all resolved by this document. Part 11's table should be
   updated to reference this document rather than carrying its own
   now-stale flags.
2. **`n8n_Workflow_Specification_v1.md` Part 13** (per-Tool payload/response
   schemas) — `CreateAppointment`, `CreateBookingRequest`,
   `CreateInspectionSlotBooking`, `CreateCart`, `CheckAvailability` payloads
   may need a `provider` field added, or may rely entirely on the
   `client_config` lookup inside the workflow (Part 5.1) without a
   Runtime-visible provider field at all — **this needs a decision**, not
   assumed here, since it affects whether Runtime ever sees which provider
   is in use (it should not, per Part 5's whole premise) or whether it's a
   pure implementation detail invisible to the Tool contract.
3. **`Agent_Runtime_System_v1.md`** — Emergency Mode wording must vary by
   `emergency_booking_mode` (Part 6.4); this is a genuine content change to
   the Runtime document's prompt/behavior guidance, not just a backend
   config addition.
4. **`Database_Structure_v4_FINAL.md` / `current_state.sql`** — new fields
   needed in `control.client_config` (and synced per-client copies, per the
   existing sync mechanism): `calendar_provider`, `email_provider`,
   `ecommerce_provider`, `notification_option`, `recovery_channel_policy`,
   plus `emergency_booking_mode`. Additionally, per Part 6.3, `convoId` and
   `origin` need to be stored somewhere per lead/conversation (exact table —
   `leads` itself, or a new Convocore-linkage table — is a Database
   Architecture decision, not made here). **None of these are added by this
   document** — schema changes go through `Template_Migration_Process.md`,
   and per your instruction this is deferred until Convocore-side decisions
   finalize (since that migration will likely bundle Convocore fields too).

## 9.1 A Note on "Frozen" Documents

Per your explicit instruction: documents marked "frozen" earlier in this
project (Integration Contract, Workflow Specification, Database Structure)
are not treated as unchangeable simply because they were previously
approved. They are the **best decision made with the information available
at that time** — this document, and the ones that follow it, may require
real Change Requests against them, not just additive appendices. Where this
document identifies a genuine need to alter previously frozen content
(rather than merely add to it), that is named explicitly above, not
smoothed over or left as a passive footnote. The discipline that matters is
not "never touch a frozen document" — it's "never touch one silently."

---

```
ZeroManual · Zenny AI Workforce · External Integration Strategy v1
Resolves Architecture Breakthrough Report v1, Problems 2 and 4.
Built against: n8n_Workflow_Specification_v1.md (frozen v1.0), Integration
Contract v1.0, Agent_Runtime_System_v1.md, Database_Structure_v4_FINAL.md,
current_state.sql. Provider capability verified live: n8n MCP node search
(Google Calendar, Microsoft Outlook, Calendly, Cal.com, Gmail, Slack, Twilio,
WhatsApp nodes) and live web verification of Calendly's Scheduling API,
Cal.com's v2 API, Google OAuth verification requirements, Shopify Custom App
model, Slack app installation model — all dated 2026-07-18 to 2026-08-01.
```
