# Convocore Session Close-Out — v1

```
Purpose: Final sweep before moving from documentation phase to building.
         Nothing here should be assumed resolved just because it isn't
         mentioned elsewhere — this is the single source for "what's
         still loose" before real build work starts.
```

---

## 1. Open Questions / Needs Your Decision / Conflicts

These are real, unresolved — building shouldn't proceed past them silently.

1. **`human-handoff` integration depth** — does a Convocore handoff also need to write an `escalations` row in your database, or is Convocore's own email notification enough? (Adapter Spec Part 8.1/9) Affects whether the Adapter needs a second trigger path beyond normal Tool calls.
2. **Shopify credential exception** — Zenny uses the *client's own* Shopify credentials for this one tool, not Zenny's OAuth platform (unlike every other integration). Is this a deliberate, documented exception, or does it need to change? (Adapter Spec Part 9)
3. **`runtime_module` population method** — should the Adapter infer which Runtime module owns a request by looking up which Tool was called, or should Convocore's node prompts be explicitly told to set a variable naming the module? I lean toward the second option (inferring from tool name arguably counts as the "light business logic" your own rules say adapters must never contain) — but this is a real design call, not yet made. (Adapter Spec Part 3.2/9)
4. **Tool `Key` = Runtime `tool_name` naming convention** — recommended as the default (avoids needing a translation table) but never formally confirmed as binding. Needs to be locked in before the first real Custom Tool gets built, or the convention is already broken before anyone notices.
5. **MCP connection method for the future checklist phase** — Docker vs npx was never re-decided after the retest. Docker sandboxes `run_command` (safer); npx runs it with real host-machine access. Since MCP is now checklist-only (not build), this matters less than it did, but still needs a default before that phase starts.
6. **Convocore's Lead Qualification Funnel vs. your own lead scoring** — Convocore already auto-scores leads (0-100, notification thresholds) if enabled. Does Zenny's own Growth Agent duplicate this, replace it, or ignore it entirely per client? Not discussed yet — see §6 below.
7. **Convocore's AI-generated conversation summary vs. your own** — same question, different data point. See §6.

---

## 2. Real Findings Discussed in Chat But NOT Yet Written Into Any Document

These conclusions were reached in conversation but haven't been folded back into `Convocore_Adapter_Spec_v1.md` or `Convocore_Findings_Required_Updates_v1.md` yet — they exist only in this chat right now, which means they'd be lost if not captured.

1. **Recovery messaging has NO working API solution as of now.** Confirmed dead-end after three investigated paths (WebSocket prompt-field, Campaigns, the messages-overwrite endpoint). Current state: **default/manual only**, pending Convocore's reply to your email. This conclusion isn't recorded anywhere formal yet.
2. **KB fetch design, final version:** cache (30-60s TTL) → if that fails, live retry → if that fails, database fallback. This is a refinement of the earlier "Option A" discussion and has never been written down as the actual three-step chain.
3. **Preemptive `conversation_id`/`convo_id` column** (your request just now, §3 below) — brand new, not recorded anywhere yet.
4. **`kb/stats` bug refinement** — confirmed to be an *empty-KB-only* edge case (works correctly once real content exists), not a general fault. `Convocore_Findings_Required_Updates_v1.md` Finding #9 still describes it in the older, less precise way — needs a wording update.
5. **PATCH `.../messages` endpoint's true behavior** — confirmed via live test to overwrite the stored record without delivering anything to the customer, and confirmed to **destructively replace conversation history** (not append) — this is a genuinely dangerous endpoint if anyone touches it casually later without knowing this. Currently only sits in the REST Live Test log, not flagged anywhere more visible like the Adapter Spec's "known platform risks."

**Recommendation:** these five need a short follow-up pass folding them into the Adapter Spec and Findings doc before building starts, so a future you (or anyone else) reading those docs gets the real, current picture.

---

## 3. Convo ID / Conversation ID — Preemptive Column

**Your request:** add a `conversation_id`/`convo_id` column now, even with no active recovery-message use case, so that whenever a solution arrives (from Convocore or otherwise), no schema change is needed later.

**Where this should go:** on whatever table represents a lead/customer's first contact — most likely `leads` (per client schema) — as a **nullable** `convocore_conversation_id text` column. Nullable because: (a) not every lead will come through Convocore, (b) even for ones that do, this is being added ahead of an active use case.

**Important constraint, given what's now known:** per the confirmed WebSocket-vs-REST distinction, this column is only useful if it's populated with a **WebSocket-originated** conversation ID (the `{agentId}_{suffix}` REST-created kind are confirmed broken for later lookups). So this column should specifically be documented as "must be sourced from a real WebSocket Interact turn, never `POST /convos`" at the point it gets added — otherwise you could end up storing IDs that don't actually work once a recovery solution exists.

**Status:** not yet built. Should go through the same `Template_Migration_Process.md` path as everything else, alongside `control.convocore_agent_map`.

---

## 4. Deferred / Later / Deliberately Not Chased

Everything here was a deliberate choice, not an oversight — listed so it doesn't get silently forgotten either.

- **UI Engine live rendering test** — deferred to a dedicated future sprint, needs a decided element-shortlist first
- **Native Convocore Integrations** (Airtable/Sheets/Calendar/Calendly system tools) — deprioritized, own-OAuth path chosen instead
- **MCP client-side "Connected" badge + populated Tools-list** — never visually confirmed, deprioritized (not currently needed)
- **Simulator tab** — never explored at all
- **`set_variable` internal tool visibility** — low priority, cosmetic curiosity
- **Web-control's ~20 sub-tools** — not individually explored, deferred until an actual use case exists
- **SMS tool** — confirmed per-client-only, never in the default template
- **API-created agent's "simpler interface"** — you noticed a REST-created agent looks structurally different from a dashboard-created one in the Convocore UI. Flagged, never investigated further. Worth remembering if any future automation creates real client agents via API — they may not be equivalent to hand-built ones.
- **The MCP Bug Report v2 + Discord message rewrite** — you said "no hurry, we'll discuss ourselves" and it was never sent. Still sitting unsent. (This is the reminder you asked for earlier in this project.)

---

## 5. Things I Guessed or Recommended That Need Your Explicit Confirmation

Being honest about where I made a judgment call rather than reporting a confirmed fact:

1. **`runtime_module` inference recommendation** (leaning toward "set via variable, not inferred from tool name") — this is my reasoning based on your own "adapters must never contain business logic" rule, not something you've confirmed. See §1 item 3.
2. **Tool Key = Runtime Tool Name as a binding convention** — I recommended it as the simplest design, but you haven't explicitly signed off on it as a rule builders must follow. See §1 item 4.
3. **My original Path 3 assumption was wrong and already corrected** — I initially assumed Zenny had its own WhatsApp/Messenger credentials; you corrected that you don't, and only have integration-level OAuth, not channel-level. Already fixed, listed here only so the correction itself is on record.
4. **The workspace-secret mix-up flag** — earlier in this project, Claude Code used a workspace secret that turned out to belong to a different, real workspace (`Zenny-UI`, `NextGen AI Assistant`) rather than an intended scratch/test one. I flagged this as worth double-checking; I don't believe you ever confirmed whether that was intentional or a genuine mistake on your end. Still open.

---

## 6. Unanswered Question From Earlier This Session

**You never answered this one** — it got skipped when the conversation moved on to writing the Convocore email:

> *Do you want to let the real person behind the Messenger conversation know their chat history got wiped as part of the delivery test?*

Still sitting open. Worth a yes/no before this closes out, since it's a real person who may notice their history is gone.

---

## 7. Convocore Auto-Generated Data — Utilization Review (your request: "make sure we do our best utilization")

This is the deep-dive you asked for — checking whether anything Convocore already computes and gives you for free is at risk of being redundantly rebuilt inside Zenny's own Runtime.

**Confirmed things Convocore already generates/tracks per conversation, that Zenny's system might otherwise duplicate:**

| Convocore already provides | Zenny's likely equivalent | Risk of duplication |
|---|---|---|
| **AI-generated conversation summary** (confirmed live, REST test §8: "AI-generated summary, token usage, node state") | Core Agent or Growth Agent potentially running its own summarization pass | **Real — worth deciding which one is authoritative** |
| **Per-message feedback/sentiment** (`Positive`/`Negative`/`Unset`, confirmed API Reference §9.5) | Any sentiment-analysis logic Zenny's Runtime might run itself | **Real — same question** |
| **Lead Qualification Funnel** — auto-scoring 0-100, notification thresholds, auto-detected `email`/`name`/`address` capture (Master Reference §8, Ground Truth §7.6) | Growth Agent's own lead scoring/qualification logic | **Real — the biggest one.** Two scoring systems for the same lead is a genuine risk of contradictory signals reaching your team. |
| **Analytics** — retention, conversation counts, custom metrics (Master Reference §9, §21.2) | Dashboard's own rollups (Workflow Spec `SCH-005 Metrics Rollup`) | Moderate — could pull from Convocore's Custom Metrics API instead of recomputing everything independently |
| **Tags** on conversations | Any tagging/categorization Zenny might do itself | Low-moderate |
| **`node state`** (which Canvas node a conversation is currently in) | Not something Zenny currently tracks, but potentially useful context for Runtime decisions | New opportunity, not really duplication |

**My honest read, not yet a decision — needs yours:** the **Lead Qualification Funnel** overlap is the one that matters most. If both Convocore and Zenny's Growth Agent independently score/qualify the same lead, you risk two different "is this a good lead" answers reaching your team with no clear tiebreaker. The cleanest options are: (a) disable Convocore's funnel entirely, treat Zenny's Runtime as the sole scorer, or (b) treat Convocore's funnel as a fast, cheap first-pass signal, and have Zenny's Runtime do the authoritative scoring using Convocore's score as one input among others. Worth a real decision, not an assumption either way — I haven't picked one for you.

**Same logic applies more mildly to conversation summaries** — if Convocore already produces a decent AI summary per conversation, pulling it via API (cheap, already computed, zero extra LLM cost) may be strictly better than Core Agent generating its own from scratch, unless there's a specific reason Zenny's summary needs different framing/detail than Convocore's default.

**Recommendation:** before building Growth Agent's lead-scoring or any conversation-summarization logic, do a short, explicit pass on this table — decide per row whether Zenny leans on Convocore's version, builds its own, or does both with a defined precedence rule. Cheap to decide now, expensive to discover as silent duplication after both systems are built.

---

## Document Changelog
- **v1 (this version)** — full close-out sweep at the end of the Convocore documentation/investigation phase. 7 open decisions, 5 undocumented findings, 1 new schema request (preemptive convo_id column), 8 deliberately deferred items, 4 unconfirmed guesses, 1 unanswered question, and a full auto-generated-data utilization review (3 real duplication risks identified, biggest being Lead Qualification Funnel vs. Growth Agent scoring).
