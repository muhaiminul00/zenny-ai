# Data Collection Map

Source: `Agent_Runtime_System_v1.md` — Step 0B (Natural Data Collection Doctrine, Sections 3, 3.1, 3.2, 4, 5, 7) and the per-archetype mapping table (Step 0B Section 4).

When and how contact info is collected per archetype, including the Progressive Profiling and Channel Context rules, and the Validation Gate before backend submission.

```mermaid
flowchart TD
    Start([Conversation in progress]) --> Check["3.1 Progressive Profiling Check:<br/>1. Already have this info?<br/>2. Required for next action?<br/>3. Customer understands why?"]
    Check --> CheckPass{All 3 pass?}
    CheckPass -->|No| Skip[Do not ask — proceed without it]
    CheckPass -->|Yes| ChannelCheck["3.2 Channel Context Check:<br/>Does channel already provide this?<br/>(SMS/WhatsApp = phone, Email = email)"]

    ChannelCheck -->|Yes, channel provides it| Tier1[Treat as Tier 1 Passive Capture — no ask]
    ChannelCheck -->|No| TierGate{Which Tier trigger<br/>is active?}

    TierGate -->|Customer volunteers<br/>unprompted| Tier1b["TIER 1 — Passive Capture<br/>Acknowledge naturally, no extra ask"]
    TierGate -->|Genuine preference<br/>expressed, not yet committed| Tier2["TIER 2 — Value Exchange Capture<br/>Offer something worth the info<br/>('save this cart?' / 'send you a summary?')"]
    TierGate -->|Customer has decided,<br/>completing transaction| Tier3["TIER 3 — Commitment Capture<br/>Minimum required fields, framed as<br/>completing what customer already wants"]

    Tier1 --> Validate
    Tier1b --> Validate
    Tier2 --> Validate
    Tier3 --> Validate

    Validate["Step 0B §7.1 Field Validation"]
    Validate --> ValCheck{Valid format?}
    ValCheck -->|Yes| Backend[VALID → passes to backend]
    ValCheck -->|No, 1st failure| Flag1["Flag once, plainly, suggest correction<br/>(§7.3 Step 3b)"]
    Flag1 --> Retry{Customer<br/>corrects?}
    Retry -->|Yes| Backend
    Retry -->|No / insists / 2nd invalid| FlagAccept["Accept with validation_flag = true<br/>(§7.3 Step 5b) — do not ask a 3rd time"]
    FlagAccept --> BackendFlagged["INVALID-FLAGGED → passes to backend,<br/>human review triggered (§7.4)"]

    Skip --> NotCollected["NOT-YET-COLLECTED —<br/>blocks DATA_COLLECTION → ACTION_PENDING<br/>(Module 3 §1.1)"]

    subgraph Archetypes["Per-Archetype Primary/Secondary Tier (Step 0B §4)"]
        direction LR
        Emergency["Emergency:<br/>Tier 3 only, immediate,<br/>no earn-it-first step"]
        EcomC["Commerce Ecom:<br/>Tier 2 primary (cart-save offer)<br/>→ Tier 3 (checkout)"]
        RestC["Commerce Restaurant:<br/>Tier 3 primary (reservation needs name)<br/>+ Tier 1 (if volunteered)"]
        Appt["Appointment:<br/>Tier 2 (slot confirmation offer)<br/>→ Tier 3 (booking)"]
        Consult["Consultation:<br/>Tier 2 (summary offer, after<br/>real discovery insight)<br/>→ Tier 3"]
        Engage["Engagement:<br/>Tier 2 (program-match offer,<br/>mission-aligned)<br/>→ Tier 3"]
    end

    Backend --> Archetypes
    BackendFlagged --> Archetypes

    subgraph Prohibited["Universal Prohibitions (Step 0B §5) — never at any Tier"]
        P1["Ask name/email/phone in first response"]
        P2["Ask all 3 fields in one turn"]
        P3["Block conversation until info given"]
        P4["Ask for contact info before support issue resolved"]
        P5["Re-ask a field already provided"]
        P6["Collect a field with no immediate use"]
    end
```
