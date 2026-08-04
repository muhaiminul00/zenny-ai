**Demo Build Plan**

Zenny AI · Sales Demo Sprint · v1.0 · ZeroManual · 2025

**STRATEGY**

|  |
| --- |
| **Demo first.** Demos convert leads and validate what features matter before production is built. The demo flows built in this sprint become the templates for the production add-on library. No throwaway work. |

Build 6 working demos in 8 days. Every demo is live and interactive — not a recording. Prospects can send real WhatsApp messages, watch bookings hit a real calendar, and see their CRM populate in real time during the sales call.

Two demo brands cover all 12 Phase 1 niches: Lumière Spa & Salon (C1 — all booking niches) and Ember & Co. (C3 — ecommerce). The same agent flow is reskinned per niche in under 30 minutes during a custom pitch.

|  |  |  |
| --- | --- | --- |
| **Option** | **When** | **Tradeoff** |
| Pause production, full team on demos | Small team (<3 builders) | Fastest demos, 10-day production delay |
| Parallel: split team | 3+ builders available | Demos + production Steps 5–6 simultaneously |

**DEMO INVENTORY**

|  |  |  |  |  |
| --- | --- | --- | --- | --- |
| **Demo** | **Purpose in sales call** | **Channels** | **Build time** | **Priority** |
| Core Agent — Lumière (C1) | Lead magnet. Shows the full agent live on WA | WA, IG, FB | 2 days | #1 |
| Core Agent — Ember & Co. (C3) | Ecommerce proof. Order tracking, returns | WA, FB | 1.5 days | #2 |
| Standalone Booking Engine | For leads who only want booking, no full agent | WA | 0.5 days | #3 |
| Revenue Dashboard | Shows ROI proof. The 'morning email' moment | Browser | 1 day | #4 |
| CRM Auto-Sync | Shown live within core agent demo. No separate build. | Built-in | 0 days | #4 |
| Lead Recovery Engine | Shows outbound follow-up firing automatically | WA | 0.5 days | #5 |
| Email Inbox Manager | Email triage + AI draft reply on screen | Email | 1.5 days | #6 |

Total: 7–8 build days. CRM sync is demonstrated live as part of the core agent demo — the HubSpot contact appears during the conversation.

**DEMO BRANDS**

Two fictional brands. Both feel like real deployed clients. Designed to resonate with Dubai and Canadian markets.

|  |  |
| --- | --- |
| **Lumière Spa & Salon** |  |
| Industry | Spa & Salon (covers all C1: gym, restaurant, travel agency with minor copy changes) |
| Feel | Dubai luxury aesthetic — bilingual (English / Arabic greetings) |
| Agent name | Luna |
| Services | Hair, nails, skincare, massage, packages |
| Booking via | Calendly free account + Google Calendar (both linked) |
| CRM | HubSpot free — 'Lumière Leads' pipeline |
| Covers | Restaurant (bookings), Gym (class bookings), Travel (consultation bookings) |

|  |  |
| --- | --- |
| **Ember & Co.** |  |
| Industry | Lifestyle ecommerce (covers all C3 niche scenarios) |
| Feel | Modern Canadian / global D2C brand |
| Agent name | Ember |
| Products | 10–15 fashion/lifestyle items. Pre-loaded Shopify Partner dev store. |
| Orders | 20+ test orders with realistic data (names, addresses, statuses) |
| CRM | HubSpot free — 'Ember Customers' pipeline |
| Covers | Order tracking, returns, refunds, shipping FAQ, product availability |

**PREREQUISITES — SET UP ON DAY 1**

Do all of these on Day 1 before any building starts. Takes 3–4 hours total.

|  |  |  |
| --- | --- | --- |
| **Tool** | **What to do** | **Cost** |
| ConvoCore | Sign up for agency plan. Connect one WhatsApp Business number + Lumière IG + Lumière FB page. | Agency plan (paid) |
| Dedicated WA number | Get a new SIM/number purely for demo agent. Do not reuse a personal number. Connect to ConvoCore. | ~$5/mo or eSIM |
| Voiceflow | Create new project 'ZennyDemo'. Two sub-agents: Lumière, Ember. Keep separate from any production workspace. | Existing plan |
| n8n | Should already be running on Hetzner VPS. Create a new folder 'Demo Workflows' inside it. | Existing |
| Shopify Partner | Sign up at partners.shopify.com → create a free development store called 'Ember & Co.' Add 15 products and 25 test orders with varied statuses. | Free |
| Calendly | Create a free account. Add service types matching Lumière menu. Embed a real calendar link. | Free |
| HubSpot Free | Create account. Two pipelines: 'Lumière Leads' and 'Ember Customers'. No contacts yet — agent will populate. | Free |
| Google Sheets | Create 'ZennyDemo\_Analytics' sheet with headers: date, session\_id, channel, add\_on\_used, resolution, csat\_score, escalated. | Free |
| Looker Studio | Connect to the Google Sheets above. Build 1-page dashboard (see Day 5 spec). Seed with 30 realistic records first. | Free |
| Gmail test account | Create demo@[yourdomain].com or a Gmail alias. Pre-write 5 sample emails (mix: booking inquiry, complaint, order question, lead, spam). | Free |
| GoHighLevel | Start 14-day trial for the GHL CRM sync demo. Set up one 'Lumière' sub-account. | Free trial |

**BUILD TIMELINE — 8 DAYS**

|  |
| --- |
| **Day 1 — Setup (3–4 hrs)** Complete all prerequisites above. Set up all accounts. Populate Shopify dev store. Seed Google Sheets with 30 fake records. |

|  |
| --- |
| **Day 2 — Lumière Agent Build (full day)** Build the Lumière flow in Voiceflow. Connect to ConvoCore (WA + IG). Test all flows in Voiceflow preview before connecting live channel. |

* Greeting: English default, Arabic variant if first message is Arabic
* FAQ flow: services, prices, hours, location — KB-based answers
* Booking flow: collect service + date/time → check Calendly availability → confirm
* Cancel/reschedule flow
* Lead capture: collect name + phone/email for callback
* Escalation: negative keywords → warm handoff to {specialist\_label}
* CSAT: 1–5 rating after resolution

|  |
| --- |
| **Day 3 — Ember Agent + n8n Lumière integrations (full day)** Build Ember agent flows. Simultaneously wire Lumière n8n integrations. |

* Ember flows: order status, return initiation, shipping FAQ, product availability, escalation
* n8n — Lumière booking: Voiceflow webhook → Calendly API → create event → confirm to Voiceflow
* n8n — Lumière lead capture: Voiceflow webhook → HubSpot create contact → return confirmation
* n8n — Lumière CSAT: session end webhook → Google Sheets row appended
* End of Day 3 test: WA message → Luna books appointment → Calendly shows event → HubSpot shows contact

|  |
| --- |
| **Day 4 — Ember n8n integrations (full day)** Wire all Ember n8n workflows. End of day: full ecommerce demo working on WA. |

* n8n — order status: Voiceflow webhook → Shopify API get order by email/ID → return formatted status
* n8n — return initiation: Voiceflow webhook → Shopify create return → log to HubSpot
* n8n — CSAT: session end → Google Sheets row appended
* n8n — CRM sync: all sessions write channel, intent, resolution to HubSpot interaction log
* End of Day 4 test: WA message → Ember checks order status (live Shopify data) → HubSpot interaction logged

|  |
| --- |
| **Day 5 — Revenue Dashboard + Standalone Booking (full day)** Build the Looker Studio dashboard. Build the simple standalone booking flow. |

* Looker Studio dashboard (1 page): Leads this week, Bookings this week, CSAT avg, Resolution rate, Active channels, Top add-on used
* Seed Google Sheets with realistic data for the past 14 days before connecting Looker
* Test: trigger a Lumière conversation → confirm row appears in Sheets → confirm dashboard updates within 1 minute
* Standalone Booking Engine: Voiceflow simple flow (5 steps: greet → service? → date? → send Calendly link → confirm + notify team via n8n)
* Connect Standalone Booking to a second ConvoCore channel (or same channel, different test number)

|  |
| --- |
| **Day 6 — Lead Recovery Engine (half day)** Build the outbound follow-up n8n workflow. |

* n8n scheduled workflow: every hour, check Google Sheets for conversations where intent=lead\_capture AND no booking created AND time\_since > 24h
* For matching rows: send WA message via ConvoCore API — 'Hi [name], just checking if you’d like to book…'
* Sequence: Follow-up 1 (24h) → Follow-up 2 (48h) → Final nudge (72h) → stop
* For demo: manually trigger the workflow to show the follow-up message arriving on WA live

|  |
| --- |
| **Day 7 — Email Inbox Manager (full day)** Build the email triage module using n8n + Claude API. |

* n8n polls Gmail test account every 5 minutes via Gmail API
* For each new email: n8n sends full email content to Claude API (claude-sonnet-4-20250514) with system prompt — classify intent + draft reply in brand voice + flag urgency level
* n8n labels the email in Gmail (intent tag) and stores: sender, subject, intent, draft reply, urgency in Google Sheets
* Optionally: n8n creates a draft reply in Gmail automatically (shows in Gmail 'Drafts')
* Pre-write 5 demo emails in the test inbox: (1) booking inquiry, (2) angry complaint, (3) refund request, (4) cold lead, (5) spam. Demo shows each one being classified and drafted.
* Backup: if live demo is unreliable, record a 90-second Loom of the flow. Live demo preferred.

|  |
| --- |
| **Day 8 — Polish, Test, Demo Scripts (full day)** Full end-to-end testing. Team demo rehearsal. Record backup Looms for every module. |

* Run the full demo script (Section 6 below) from start to finish twice — fix anything that breaks
* Record one Loom backup per module in case live demo fails during a call
* Add a few more realistic WhatsApp test conversations to warm up the number (WA flags new numbers with low activity)
* Brief the sales team: walk through the demo script, explain what each moment proves
* Create a demo checklist: what tabs to have open, what WA messages to pre-type, order of screens

**DEMO SPECIFICATIONS**

|  |  |
| --- | --- |
| **Demo 1: 24/7 AI Revenue Agent — Lumière** · Prospect types into WA, Luna books the appointment live. Switch to HubSpot — contact just appeared. Switch to IG — same Luna, same agent. Under 5-second response every time. | |
| **Channels** | 2 days |
| **Integration** | WA (primary) · Instagram DM · Facebook Messenger |
| **The wow moment** | Calendly booking + HubSpot CRM sync. n8n wires both. |

|  |  |
| --- | --- |
| **Demo 2: 24/7 AI Revenue Agent — Ember & Co.** · Prospect asks 'where is my order ORD-1042?' — Ember pulls the live Shopify order status and returns it in 3 seconds. Show HubSpot: interaction logged automatically. | |
| **Channels** | 1.5 days |
| **Integration** | WA · Facebook Messenger |
| **The wow moment** | Shopify live API for order status and returns. |

|  |  |
| --- | --- |
| **Demo 3: Standalone Booking Engine** · 5 messages end-to-end: intent → service → date → Calendly link sent → booking confirmed. Calendar blocks immediately. Good for prospects who say 'I just need booking, not the full agent.' | |
| **Channels** | 0.5 days |
| **Integration** | WhatsApp |
| **The wow moment** | Calendly API via n8n. Simple fixed flow, no AI core. |

|  |  |
| --- | --- |
| **Demo 4: Revenue Dashboard** · Share the Looker Studio link during the call. Show: 14 leads this week, 6 bookings, 4.3 CSAT avg, 82% resolution rate. Then trigger a test conversation — watch the counter tick up in near-real-time. | |
| **Channels** | 1 day |
| **Integration** | Browser (Looker Studio link sent to prospect) |
| **The wow moment** | Google Sheets → Looker Studio live connection. |

|  |  |
| --- | --- |
| **Demo 5: Lead Recovery Engine** · Show the n8n workflow on screen. Trigger it manually. Prospect watches a WhatsApp follow-up message arrive on their (or a demo) phone in real time. 'This fires automatically 24 hours after a lead goes cold.' | |
| **Channels** | 0.5 days |
| **Integration** | WhatsApp (outbound message from n8n) |
| **The wow moment** | n8n → ConvoCore API (outbound WA message send). |

|  |  |
| --- | --- |
| **Demo 6: Email Inbox Manager** · Show the 5 pre-written emails in the inbox. Trigger n8n manually. Watch each email get labelled by intent and a draft reply appear in the Drafts folder. 'Your team only sees what needs a human — the rest is handled.' | |
| **Channels** | 1.5 days |
| **Integration** | Email (Gmail / Outlook) |
| **The wow moment** | Gmail API → n8n → Claude API for classification + draft. |

**THE DEMO SCRIPT — 10 MINUTES**

This is the sequence for a live sales call. Keep the call moving. Every step proves a specific promise from the offer.

|  |
| --- |
| **Setup before the call:** Three browser tabs open: ConvoCore dashboard, HubSpot CRM, Looker Studio dashboard. WA on phone or web. 5 demo emails pre-loaded in test inbox. |

|  |  |  |
| --- | --- | --- |
| **Min** | **What you do** | **What it proves** |
| 0:00 | Open with: 'I’m going to show you Zenny live right now — I’ll send a WhatsApp message and you’ll see it respond.' Send first WA message to Lumière agent. | Immediate credibility. It’s live. |
| 0:30 | Show Luna’s response in under 5 seconds. Continue the conversation: ask about prices, then ask to book. | <60-second response. 24/7 availability. FAQ handling. |
| 2:30 | Complete the booking. Switch screen to Google Calendar / Calendly. Show the appointment just created. | Direct-to-calendar booking. Live integration, not a recording. |
| 3:30 | Switch to HubSpot. Show the contact that just appeared automatically. | CRM Auto-Sync. Zero manual data entry. |
| 4:30 | Send Looker Studio link to prospect (or screen share). Walk through: leads this week, bookings, CSAT. | Revenue Dashboard. ROI proof. 'This is your morning email every day.' |
| 6:00 | Open Instagram DM. Send same question to Luna. Same response, different channel. Then show FB Messenger. | Multi-channel unified. One brain, every channel. |
| 7:30 | Trigger Lead Recovery manually. Show WA follow-up arriving. 'This fires 24 hours after any lead goes cold.' | Lead Recovery Engine. Automatic revenue recovery. |
| 8:30 | Open Email Inbox Manager demo. Trigger n8n. Show 5 emails being classified, draft replies appearing. | Email Inbox Manager. Team gets hours back per week. |
| 9:30 | Ask: 'Which of your channels is the biggest headache right now?' — let them name a pain point. | Consultative close. Sets up the strategy session. |

|  |
| --- |
| **If the live demo breaks:** Use the backup Loom recording for that module. Say 'Let me show you a recording of this from an earlier session.' Keep moving. One broken module does not kill a demo. |

**PARALLEL PRODUCTION WORK**

The demo sprint does not replace the production build guide — it runs before it or alongside it.

|  |  |  |  |
| --- | --- | --- | --- |
| **Track** | **Who** | **What** | **Outputs** |
| Demo sprint (this doc) | Builder(s) A | All 6 demos per the 8-day timeline above | Working demos, sales team trained, backup Looms ready |
| Production: Steps 5–6 | Builder(s) B (if available) | Step 5: Universal core spec. Step 6: Integration adapter map. | Core spec sheet + adapter map (from pre-build guide) |
| After demo sprint | Full team | Resume production build guide from Step 5 (or 7 if Step 5–6 done in parallel) | Production system built on validated demo learnings |

The Lumière and Ember Voiceflow flows built in this sprint are NOT throwaway work. They become the first-client UAT flows and the reference templates for the C1 and C3 add-on library builds.