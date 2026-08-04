**Add-On Anatomy Standard**

Customer Support AI Agent · Builder Reference · v1.0 · ZeroManual · 2025

|  |
| --- |
| **PART A — STANDARDS & CONVENTIONS** |

**1. THE ANATOMY TEMPLATE**

Every add-on must have this template fully completed before any build begins. No template = no build. This is a hard gate.

|  |  |
| --- | --- |
| **ADD-ON ANATOMY TEMPLATE** | |
| **Add-on name** | *[name]* |
| **Task type** | *[ ] Lookup [ ] Action [ ] Info [ ] Lead capture [ ] Escalation* |
| **Scope** | *[ ] Universal [ ] Cluster: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_ [ ] Niche: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_* |
| **Clusters** | *\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_* |
| **Build phase** | *[ ] MVP [ ] Phase 2* |
| **1. Intent triggers (5–8 phrases)** | *phrase 1 · phrase 2 · phrase 3 · phrase 4 · phrase 5 ...* |
| **2. Required inputs** | *input 1 (required / optional) · input 2 ...* |
| **3. Integration hook** | *webhook: {verb}-{entity} OR KB:{section-name}* |
| **4. Personalization slots** | *each slot on its own line: {slot\_name} — purpose* |
| **5. Fallback behavior** | *Pattern \_\_\_ → Pattern \_\_\_ if fails → final state* |
| **Status** | *[ ] Template done [ ] n8n built [ ] VF flow built [ ] Unit tested [ ] Int. tested [ ] In library* |

**2. WEBHOOK NAMING CONVENTION**

Format: {verb}-{entity} · kebab-case, all lowercase · Info add-ons use KB:{section-name} instead of a webhook.

|  |  |  |
| --- | --- | --- |
| **Verb** | **When to use** | **Example hooks** |
| get | Read a single resource | get-order-status · get-account-info · get-booking-status |
| list | Fetch multiple items or options | list-available-slots · list-products |
| check | Verify or validate something | check-stock-availability · check-promo-code |
| create | Create a new record or submit a form | create-appointment · create-refund-request · create-support-ticket · create-quote-request |
| update | Modify an existing record | update-delivery-address · update-appointment |
| cancel | Cancel or revoke a record | cancel-order · cancel-appointment |
| send | Trigger a notification | send-confirmation · send-escalation-alert |

Edge cases: (1) Never combine two actions into one hook — keep atomic. (2) Breaking interface change → append -v2 suffix. (3) New verb needed → document in webhook registry first, no unilateral naming.

**3. VARIABLE SLOT FORMAT & TIERS**

Format: {snake\_case\_name} · Single curly braces · No abbreviations · Native Voiceflow syntax — no adaptation needed.

|  |  |  |
| --- | --- | --- |
| **Tier** | **Slot** | **Purpose** |
| Universal (set once, everywhere) | agent\_name | Agent identity name — 'Nova', 'Alex' |
|  | client\_name | Business name — used in greetings and all responses |
|  | tone\_profile | Tone preset — friendly / professional / formal |
|  | escalation\_contact | Where escalation alerts route (Slack channel or email) |
|  | active\_add\_on\_list | Which add-ons are enabled — drives Detect routing logic |
|  | specialist\_label | Human handoff label — 'our team' / 'a domain expert' / 'our roofing specialist' |
| Shared optional (set if applicable) | currency\_symbol | Used by commerce add-ons |
|  | timezone | Used by any add-on that shows times or dates |
|  | contact\_phone | Business phone — fallback contact method |
|  | contact\_email | Business email — fallback contact method |
| Add-on specific (defined per add-on) | e.g. return\_window\_days | Unique to that add-on's logic. Documented in its anatomy template. |

**4. FALLBACK PATTERN CATALOG**

|  |
| --- |
| **Philosophy:** Graceful degradation. Customers never see the seam. No error language, no system terminology. Every pattern feels like a natural conversation move. Clients who want a human feel configure {specialist\_label} to make handoffs completely invisible as AI transitions. |

|  |  |  |  |
| --- | --- | --- | --- |
| **Pattern** | **Triggers when** | **Customer hears** | **What actually happens** |
| A — Input retry | Input missing, wrong format, or no match in system | 'I couldn't find anything with those details — could you double-check the order number for me?' | Silent: retries with corrected input · Max 2 attempts · 2nd fail → D |
| B — Silent retry | API timeout or first-call failure (service likely up but slow) | 'Let me check that for you...' [natural pause] then continues normally | Silent: 1 automatic retry · Success → continue · Fail → C |
| C — Graceful redirect | API down, credentials revoked, or data unavailable after retry | 'I'd like to make sure this gets handled properly — could I take your email and have someone follow up directly?' | Silent: logs failure · collects contact · n8n fires alert to {escalation\_contact} |
| D — Warm handoff | Negative keywords, 3+ failures, explicit request, sensitive topic | 'Let me get you to our {specialist\_label} who can take care of this for you.' | Silent: full context payload to human · Human sees transcript + reason + summary |

**5. BUILD GATE CHECKLIST**

Every add-on must pass every gate before moving to the next stage.

Pre-build — template:

* Add-on name, task type, scope, and cluster confirmed
* All 5 anatomy components filled — no blanks
* Intent triggers: minimum 5 phrases, reviewed for coverage
* Integration hook: verified against the webhook naming convention
* Personalization slots: all add-on-specific slots identified
* Fallback pattern assigned with complete chain (e.g. B → A → C)

Build — n8n:

* Webhook workflow created with exact name from anatomy template
* Workflow tested with sample payload — happy path verified
* Error handling confirmed to match the assigned fallback pattern

Build — Voiceflow:

* Flow built strictly against the completed anatomy template
* Intent triggers added to NLU training
* All variable slots referenced with correct {snake\_case} format
* Fallback patterns A–D implemented per template specification

Test:

* Unit: happy path — expected input produces correct output
* Unit: bad input — Pattern A triggers correctly
* Unit: API failure simulation — Pattern B or C triggers correctly
* Integration: full end-to-end Voiceflow → n8n → response verified

Publish:

* Add-on published to library as Beta (never directly to Stable)
* Anatomy template marked complete in backlog tool
* Add-on card status updated in project management tool

|  |
| --- |
| **PART B — PHASE 1 MVP ADD-ONS (19 COMPLETED TEMPLATES)** |

All 19 MVP add-ons with completed anatomy templates. These serve as both the build specification and the gold-standard reference for how all future add-ons should be documented.

|  |
| --- |
| **LOOKUP** |

|  |  |
| --- | --- |
| **Availability check** Lookup · Cluster · C1 | |
| **1. Intent triggers** | do you have availability · are you free on [date] · what time slots do you have · can I book for [date] · is there an opening · any appointments available · check availability · when can I come in |
| **2. Required inputs** | Preferred date (required)  Service type (optional)  Party size or staff preference (optional) |
| **3. Integration hook** | list-available-slots |
| **4. Personalization slots** | {booking\_lead\_time\_hours} — minimum notice required before a booking can be made  {max\_advance\_days} — maximum days in advance the customer can book |
| **5. Fallback behavior** | B → A (suggest different date or time) → C |

|  |  |
| --- | --- |
| **Booking status** Lookup · Cluster · C1 | |
| **1. Intent triggers** | what time is my appointment · check my booking · confirm my reservation · when is my appointment · is my booking confirmed · look up my reservation · booking status · my reservation details |
| **2. Required inputs** | Customer email (required) OR booking reference number (required) |
| **3. Integration hook** | get-booking-status |
| **4. Personalization slots** | {booking\_id\_label} — how to refer to the reference ID (e.g. 'confirmation code', 'reservation number') |
| **5. Fallback behavior** | A (ask to verify reference) → C if still not found |

|  |  |
| --- | --- |
| **Order status** Lookup · Cluster · C3 | |
| **1. Intent triggers** | where is my order · track my order · order status · has my order shipped · when will my order arrive · check my order · what happened to my order · order tracking |
| **2. Required inputs** | Order ID (required) OR customer email (pulls most recent order) |
| **3. Integration hook** | get-order-status |
| **4. Personalization slots** | {order\_id\_label} — 'order number' / 'reference number' / 'order ID'  {tracking\_url\_template} — deep-link pattern to carrier tracking page (optional) |
| **5. Fallback behavior** | A (ask to verify order ID) → C |

|  |  |
| --- | --- |
| **Delivery & tracking status** Lookup · Cluster · C3 | |
| **1. Intent triggers** | track my delivery · where is my parcel · delivery status · has it been dispatched · when will it be delivered · delivery tracking · shipping status · track my parcel |
| **2. Required inputs** | Order ID or tracking number (required) |
| **3. Integration hook** | get-delivery-tracking |
| **4. Personalization slots** | {carrier\_name} — shipping carrier shown to customer (e.g. 'DHL', 'Royal Mail')  {standard\_delivery\_days} — fallback estimate shown when live tracking is unavailable |
| **5. Fallback behavior** | B → A (ask for tracking number directly) → C |

|  |  |
| --- | --- |
| **Stock / inventory check** Lookup · Cluster · C3 | |
| **1. Intent triggers** | is [product] in stock · do you have [product] available · is [product] available · stock check · when will [product] be back · product availability · out of stock · availability check |
| **2. Required inputs** | Product name or SKU (required) |
| **3. Integration hook** | check-stock-availability |
| **4. Personalization slots** | {out\_of\_stock\_message} — shown when unavailable (e.g. 'Sign up for a restock alert', 'Available for pre-order') |
| **5. Fallback behavior** | A (clarify product name if unrecognised) → C if API unavailable |

|  |
| --- |
| **ACTION** |

|  |  |
| --- | --- |
| **Book appointment** Action · Cluster · C1 | |
| **1. Intent triggers** | book an appointment · make a reservation · schedule a visit · book a table · reserve a spot · I'd like to book · set up an appointment · book a session |
| **2. Required inputs** | Date (required)  Time slot (required — from Availability check or customer input)  Service type (required)  Customer name (required)  Email or phone (required) |
| **3. Integration hook** | create-appointment |
| **4. Personalization slots** | {confirmation\_channel} — how confirmation is sent: 'email' / 'SMS' / 'both'  {cancellation\_window\_hours} — free cancellation window in hours  {booking\_confirmation\_text} — post-booking message shown to customer |
| **5. Fallback behavior** | B → A (offer different time slot) → C · Note: multi-step — internally chains with Availability check |

|  |  |
| --- | --- |
| **Cancel / reschedule appointment** Action · Cluster · C1 | |
| **1. Intent triggers** | cancel my appointment · reschedule my booking · change my appointment · I can't make it · move my booking to · cancel my reservation · I need to reschedule · change my appointment time |
| **2. Required inputs** | Booking reference or email (required)  Intent: cancel or reschedule (required)  New preferred date and time (required for reschedule only) |
| **3. Integration hook** | cancel-appointment (cancel) / update-appointment (reschedule) |
| **4. Personalization slots** | {cancellation\_window\_hours} — minimum notice before fee applies  {late\_cancel\_policy} — policy summary for cancellations outside window  {reschedule\_allowed} — boolean, whether reschedule is permitted |
| **5. Fallback behavior** | A (verify booking) → if outside window, A (state policy) → D if disputed |

|  |  |
| --- | --- |
| **Refund initiation** Action · Cluster · C3 | |
| **1. Intent triggers** | I want a refund · return this item · get my money back · refund request · item was damaged · not as described · process a refund · I'd like to return this |
| **2. Required inputs** | Order ID (required)  Items to refund (required)  Reason for refund (required) |
| **3. Integration hook** | create-refund-request |
| **4. Personalization slots** | {refund\_window\_days} — days after purchase eligible for refund  {refund\_limit} — max amount agent can approve without human review  {refund\_method} — 'original payment method' / 'store credit' |
| **5. Fallback behavior** | A (verify order) → if amount exceeds {refund\_limit} → D (warm handoff, agent cannot auto-approve above limit) |

|  |  |
| --- | --- |
| **Cancel order** Action · Cluster · C3 | |
| **1. Intent triggers** | cancel my order · I want to cancel · stop my order · don't send my order · cancel before it ships · I changed my mind about my order · order cancellation · cancel purchase |
| **2. Required inputs** | Order ID (required)  Reason (optional) |
| **3. Integration hook** | cancel-order |
| **4. Personalization slots** | {cancellation\_cutoff\_description} — when cancellation is still possible (shown to customer)  {already\_shipped\_message} — what to say if order has already dispatched |
| **5. Fallback behavior** | A (verify order ID) → if order already shipped, A (inform + route to Refund initiation add-on) → C |

|  |
| --- |
| **INFO** |

|  |  |
| --- | --- |
| **FAQ answer** Info · Universal · All | |
| **1. Intent triggers** | how does · what is your · can you explain · I have a question about · tell me about · what are your · how do I · I need to know about |
| **2. Required inputs** | Customer question — free text, no structured input needed |
| **3. Integration hook** | KB:faq-general + KB:faq-[cluster] |
| **4. Personalization slots** | — (universal and shared slots apply) |
| **5. Fallback behavior** | A (ask to rephrase) → A (offer topic options) → D if two rephrase attempts fail |

|  |  |
| --- | --- |
| **Business hours & location** Info · Universal · All | |
| **1. Intent triggers** | what are your hours · are you open · when do you close · opening hours · where are you located · what time do you open · business hours · are you open today |
| **2. Required inputs** | None (day or date optional for specific-day queries) |
| **3. Integration hook** | KB:business-info |
| **4. Personalization slots** | — (universal and shared slots apply) |
| **5. Fallback behavior** | A (rephrase) only — static KB content, rarely fails |

|  |  |
| --- | --- |
| **Pricing / rates** Info · Universal · All | |
| **1. Intent triggers** | how much does it cost · what are your prices · pricing · rates · how much is · what do you charge · price list · how much for |
| **2. Required inputs** | Service or product name (optional — general vs specific query) |
| **3. Integration hook** | KB:pricing |
| **4. Personalization slots** | {pricing\_disclaimer} — optional caveat appended to price responses (e.g. 'Prices may vary. Contact us for an exact quote.') |
| **5. Fallback behavior** | A (ask to specify which service or product if query is too broad) |

|  |  |
| --- | --- |
| **Cancellation policy** Info · Universal · All | |
| **1. Intent triggers** | what is your cancellation policy · can I cancel for free · cancellation fee · when can I cancel · cancel without charge · cancellation terms · what happens if I cancel · refund if I cancel |
| **2. Required inputs** | None |
| **3. Integration hook** | KB:cancellation-policy |
| **4. Personalization slots** | — (universal and shared slots apply) |
| **5. Fallback behavior** | A (rephrase) only |

|  |  |
| --- | --- |
| **Service catalog** Info · Cluster · C1 C2 | |
| **1. Intent triggers** | what services do you offer · what do you do · what can you help me with · show me your services · what packages do you have · menu · what treatments do you offer · services list |
| **2. Required inputs** | Category preference (optional — narrows results) |
| **3. Integration hook** | KB:service-catalog |
| **4. Personalization slots** | {catalog\_label} — 'menu' (restaurant) / 'services' (salon) / 'treatments' (spa) / 'packages' (cleaning) |
| **5. Fallback behavior** | A (ask for category) → A (show general catalog overview) |

|  |  |
| --- | --- |
| **Return & refund policy** Info · Cluster · C3 | |
| **1. Intent triggers** | what is your return policy · can I return this · how do returns work · return process · return policy · how long to return · return window · return conditions |
| **2. Required inputs** | None (order date optional for eligibility check) |
| **3. Integration hook** | KB:return-policy |
| **4. Personalization slots** | — (universal and shared slots apply) |
| **5. Fallback behavior** | A (rephrase) only |

|  |  |
| --- | --- |
| **Shipping / delivery info** Info · Cluster · C3 | |
| **1. Intent triggers** | how long does delivery take · shipping information · delivery options · how much is shipping · free shipping · do you ship to · delivery times · international shipping |
| **2. Required inputs** | Destination (optional — for region-specific queries) |
| **3. Integration hook** | KB:shipping-info |
| **4. Personalization slots** | {free\_shipping\_threshold} — shown in response when applicable (e.g. 'Free shipping on orders over £50') |
| **5. Fallback behavior** | A (ask for region if query is too broad) → A (provide general shipping info) |

|  |
| --- |
| **LEAD CAPTURE** |

|  |  |
| --- | --- |
| **Contact / callback request** Lead capture · Universal · All | |
| **1. Intent triggers** | I want to speak to someone · call me back · contact request · I'd like to be contacted · talk to someone · request a call · get in touch · send me a message |
| **2. Required inputs** | Customer name (required)  Email or phone (required)  Preferred contact time (optional)  Brief reason (optional) |
| **3. Integration hook** | create-callback-request |
| **4. Personalization slots** | {response\_time} — 'We'll get back to you within {response\_time}' (e.g. '24 hours', '1 business day') |
| **5. Fallback behavior** | B → C if submission fails (C collects contact info as backup path) |

|  |
| --- |
| **ESCALATION** |

|  |  |
| --- | --- |
| **Complaint log** Escalation · Universal · All | |
| **1. Intent triggers** | I want to make a complaint · this is unacceptable · I want to complain · terrible service · I'm very unhappy · lodge a complaint · I have a serious issue · I'm extremely disappointed |
| **2. Required inputs** | Issue description (required)  Order or booking reference (optional)  Customer contact info for follow-up (required) |
| **3. Integration hook** | create-support-ticket (flag: complaint=true) |
| **4. Personalization slots** | {complaint\_sla} — promised response time shown after logging (e.g. 'We'll respond within 4 hours') |
| **5. Fallback behavior** | D immediately after logging — all complaints route to human. Never leave in automated flow. |

|  |  |
| --- | --- |
| **Dispute / chargeback flag** Escalation · Cluster · C3 C4 | |
| **1. Intent triggers** | I didn't authorize this charge · unauthorized transaction · I want to dispute · charge dispute · fraudulent charge · money taken incorrectly · this charge is wrong · dispute this payment |
| **2. Required inputs** | Transaction reference or order ID (required)  Amount in dispute (required)  Date of charge (required) |
| **3. Integration hook** | create-support-ticket (flag: dispute=true, priority=high) |
| **4. Personalization slots** | {dispute\_team\_label} — 'our payments team' / 'our fraud team' / 'our finance team' |
| **5. Fallback behavior** | D immediately — financial disputes always go directly to human. Zero automated handling. |