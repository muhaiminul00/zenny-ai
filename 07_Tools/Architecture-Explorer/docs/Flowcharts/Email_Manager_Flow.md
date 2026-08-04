# Email Manager Flow (Module 5)

Source: `Agent_Runtime_System_v1.md` — Step 3 Module 5, Sections 2.1–2.9 (Inbox Intelligence Model), 3 (Autonomy Levels), 3.2 (Reply Style: Scripted vs. Generative), 3.3 (Level 2 Learning Loop, renumbered from 3.1 in Batch 3 Round 4), 4 (5-Condition Gate), 5 (Categorization), 6 (Confidence), 7/7.1 (Outbound Scope + Campaign Boundary), 8 (Edge Cases).

All 3 autonomy levels, unified through the same intake pipeline.

```mermaid
flowchart TD
    Start([Inbound email received]) --> Normalize[Normalize: sender, subject, body, thread ID]
    Normalize --> Attach["2.6 Attachment Intelligence:<br/>classify if present"]
    Attach --> AttachType{Type?}
    AttachType -->|Identity/Payment Sensitive| ForceEscalate[Always escalate — never processed]
    AttachType -->|Customer Evidence / Business<br/>Doc / Unknown / none| Categorize
    AttachType -->|Recruiting| ExitOps1([Route to Job Application — exits customer logic])

    Categorize["5. Email Categorization"]
    Categorize --> CatType{Customer-facing<br/>or Operational?}
    CatType -->|Operational: Vendor/Media/<br/>Job App/Spam/Misdirected/Legal| ExitOps2([Route to operations —<br/>never enters reply logic])
    CatType -->|Customer-facing:<br/>Lead/Support/Complaint/Refund/<br/>Booking/General/Partnership/Proposal| Priority

    Priority["2.8 SLA and Priority Queue:<br/>Complaint/Refund, VIP, emergency<br/>language, open escalation, age"]
    Priority --> IdentityRes["2.7 Channel Identity Resolution:<br/>Verified/Probable/Weak match tier"]
    IdentityRes --> Lock["2.9 Global Active Issue Lock"]
    Lock -->|Human owns / live conversation active| Surface[Surface as context, do not<br/>process independently]
    Lock -->|No lock| Level

    Level{Autonomy Level<br/>configured}

    Level -->|Level 1| L1Sum[Summarize + notify human]
    L1Sum --> L1End(["ALL replies human-authored —<br/>no exceptions"])

    Level -->|"Level 2 or 3"| ReplyStyle["3.2 Reply Style config<br/>(per category): scripted | generative<br/>— Complaint/Refund always-escalate<br/>regardless of this setting"]
    ReplyStyle --> Level2Or3{Autonomy Level}
    Level2Or3 -->|Level 2| L2Draft[Generate full draft reply]
    L2Draft --> L2Queue[Queue for human approval]
    L2Queue --> L2Decision{Human action?}
    L2Decision -->|Approve| L2Send[Send as-is]
    L2Decision -->|Edit| L2EditSend["Send edited version<br/>→ 3.3 Learning Loop capture"]
    L2Decision -->|Reject| L2Human[Human takes over manually]
    L2EditSend --> LearningLoop["3.3: categorize edit —<br/>tone/scope/factual/escalation-violation"]
    LearningLoop --> LearningRoute{Category?}
    LearningRoute -->|Tone/Scope| FlagPref[Flag for KB/preference update<br/>— requires human approval]
    LearningRoute -->|Factual| FlagKB[Flag potential KB gap<br/>— requires architect review]
    LearningRoute -->|Escalation violation| FlagRule[Flag rule gap —<br/>architect-level only]

    Level2Or3 -->|Level 3| Gate["4. 5-Condition Gate"]
    Gate --> G1{"1. Answer exists in KB?"}
    G1 -->|No| DraftPath
    G1 -->|Yes| G2{"2. No pricing exception?"}
    G2 -->|No| DraftPath
    G2 -->|Yes| G3{"3. No refund discussion?"}
    G3 -->|No| EscalatePath
    G3 -->|Yes| G4{"4. No complaint?"}
    G4 -->|No| EscalatePath
    G4 -->|Yes| G5{"5. Confidence sufficient?<br/>(High only — 6. Confidence and Escalation)"}
    G5 -->|No| DraftPath
    G5 -->|Yes| AutoSend["Generate reply → send<br/>autonomously"]

    GateFail{"Multiple conditions fail?"}
    G1 -.-> GateFail
    G2 -.-> GateFail
    GateFail -->|"Escalation failures present<br/>(3 or 4)"| EscalatePath
    GateFail -->|"Only draft failures<br/>(1, 2, 5)"| DraftPath

    DraftPath[Draft path — falls back to<br/>Level 2 behavior for this email]
    EscalatePath["Escalation path — never drafted,<br/>never sent, routes to human directly"]

    DraftPath --> L2Queue
    EscalatePath --> HumanQueue([Human Handoff, per Priority §2.8])

    AutoSend --> ThreadUpdate["2.3 Thread Lifecycle update:<br/>WAITING-CUSTOMER"]
    L2Send --> ThreadUpdate
    L2EditSend --> ThreadUpdate

    ThreadUpdate --> BounceCheck{Delivery result?}
    BounceCheck -->|Delivered| ThreadOK([Thread proceeds normally])
    BounceCheck -->|Bounced| BounceFlag["Flag for human review,<br/>no auto-resend, try alternate channel"]
    BounceCheck -->|Spam-Complaint| SpamTrigger["Trigger Module 4 §5 item 5<br/>Suppression immediately"]

    subgraph Outbound["7/7.1 — Module-Triggered Outbound (not a reply)"]
        O1["Recovery Engine cadence messages"]
        O2["Booking/appointment confirmations<br/>— bypass 5-Condition Gate<br/>(transactional, already-certain facts)"]
        O3["Consultation summaries"]
        O4["Welcome sequences"]
        O5["NOT handled: mass campaigns,<br/>cold outbound, segmented lists"]
    end

    TimeCheck["Time-of-Day Suppression (Module 4 §3.1):<br/>applies to transactional outbound EXCEPT<br/>immediate confirmations"]

    O1 --> TimeCheck
    O3 --> TimeCheck
    O4 --> TimeCheck
```
