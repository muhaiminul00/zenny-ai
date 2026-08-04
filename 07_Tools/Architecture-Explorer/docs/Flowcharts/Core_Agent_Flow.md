# Core Agent Flow (Module 1)

Source: `Agent_Runtime_System_v1.md` — Step 3 Module 1, Sections A–E plus B.1, Customer Verification Rule, Escalation Priority Classification, Off-Topic Counter Reset Rule.

All 5 Core Agent sub-flows. Core Agent is always active — no module gate.

```mermaid
flowchart TD
    Start([Intent routed to Core Agent]) --> Which{Which sub-flow?}

    Which -->|Intent 01, no KB match yet| FAQ["A. FAQ Handler"]
    Which -->|Intent 04| Support["B. Support Handler"]
    Which -->|Intent 05| Complaint["C. Complaint Handler"]
    Which -->|Intent 07 or agent-triggered| Handoff["D. Human Handoff Handler"]
    Which -->|Intent 09| OffTopic["E. Off-Topic Handler"]

    %% FAQ Handler
    FAQ --> FAQSearch[Query Business Memory / KB]
    FAQSearch --> FAQConf{Confidence per<br/>Step 1D.2}
    FAQConf -->|High| FAQAnswer[Answer directly]
    FAQConf -->|Medium| FAQClarify[Answer confirmed part,<br/>1 clarifying question]
    FAQConf -->|Low/Conflicting| FAQAttempt{Clarification<br/>attempts used?}
    FAQAttempt -->|< 2| FAQAsk[Ask clarifying question]
    FAQAsk --> FAQSearch
    FAQAttempt -->|= 2| FAQEscalate["'I don't have a confirmed answer —<br/>let me connect you' → Handoff"]
    FAQAnswer --> ExitOK([Step 1G End State 1])
    FAQClarify --> ExitOK
    FAQEscalate --> Handoff

    %% Support Handler
    Support --> SupDetect["Detect existing customer via<br/>Customer Memory match by contact method<br/>(never by name — 0C §4.1)"]
    SupDetect --> SupVerify{"Customer Verification Rule:<br/>Zero / Low-Risk / High-Risk action?"}
    SupVerify -->|Zero-Risk, in Session Memory| SupProceed[Proceed, no check]
    SupVerify -->|Low-Risk| SupLight[Confirm one known identifier]
    SupVerify -->|High-Risk| SupHigh{Verification<br/>process configured?}
    SupHigh -->|Yes| SupVerified[Complete verification, then act]
    SupHigh -->|No| Handoff
    SupProceed --> SupResolve{Resolved within<br/>Core Agent authority?}
    SupLight --> SupResolve
    SupVerified --> SupResolve
    SupResolve -->|Yes| SupBridge["B.1 Support → Opportunity Detection:<br/>customer opens NEW need unprompted?"]
    SupResolve -->|No, needs permission<br/>Core Agent doesn't hold| Handoff
    SupResolve -->|Reveals complaint| Complaint
    SupBridge -->|Yes, Growth ON| ToRevenue["Hand off to Growth Agent<br/>(Module 2) — Core Agent never opens<br/>the sales moment itself"]
    SupBridge -->|Yes, Growth OFF| SupFactual[Answer factually from KB only]
    SupBridge -->|No new need| ExitOK

    %% Complaint Handler
    Complaint --> CompAck["Acknowledge SPECIFICALLY —<br/>name the problem, confirm expectation,<br/>commit to a direction (not generic apology)"]
    CompAck --> CompNoSell[No sell/upsell during sequence]
    CompNoSell --> CompDiagnose[Diagnose using Customer Memory<br/>+ current Business Memory]
    CompDiagnose --> CompOffer{Within Core Agent's<br/>action-level permissions?}
    CompOffer -->|Yes, customer accepts| CompResolved[Resolved, confirm satisfaction]
    CompOffer -->|No — refund/legal/safety,<br/>2 failed attempts, or Low/Conflicting confidence| Handoff
    CompResolved --> CompRecovery{Recovery opportunity<br/>exists, separately?}
    CompRecovery -->|Yes| ExitOK
    CompRecovery -->|No| ExitOK

    %% Human Handoff Handler
    Handoff --> HOEntry{Explicit request<br/>or agent-triggered?}
    HOEntry --> HOMessage["'Connecting you with someone who can<br/>help further — I'll make sure they<br/>have full context' — never apologetic"]
    HOMessage --> HOPriority["Escalation Priority Classification:<br/>P1 Immediate / P2 Standard / P3 Review"]
    HOPriority --> HOContext[Pass conversation_summary,<br/>intent history, escalation reason]
    HOContext --> HOTransfer([Step 1G End State 5])
    HOTransfer -.-> HOReturn{Later: human<br/>interaction ends}
    HOReturn -->|Case 1: resolved| ReturnAI[Return to AI]
    HOReturn -->|Case 2: sensitive ongoing| StayHuman[Human retains ownership]
    HOReturn -->|Case 3: unrelated new request| ReturnAI
    ReturnAI --> ResumeNote["AI acknowledges context briefly —<br/>never claims to have handled<br/>the human portion itself"]

    %% Off-Topic Handler
    OffTopic --> OTRedirect["Acknowledge briefly, redirect —<br/>never ignore"]
    OTRedirect --> OTCount{Redirect count?}
    OTCount -->|< 2| OTWait[Wait for next message]
    OTWait --> OTReclassify{On-topic on<br/>return?}
    OTReclassify -->|Yes| OTReset["Counter resets to 0 —<br/>route normally"]
    OTReclassify -->|No| OTRedirect
    OTCount -->|= 2, still off-topic| OTClose["Close politely —<br/>Step 1G End State 4<br/>(no meaningful intent, no recovery)"]

    subgraph Fallback["Section 3 — Empty KB Fallback"]
        FB1["FAQ query returns Low Confidence<br/>on every question by definition"]
        FB2["Skip to ONE clarification attempt<br/>(not full 2-attempt cycle)"]
        FB3["Escalate immediately —<br/>empty KB is a config gap,<br/>not a communication problem"]
        FB1 --> FB2 --> FB3
    end
```
