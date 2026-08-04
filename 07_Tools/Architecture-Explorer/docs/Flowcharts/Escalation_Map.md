# Escalation Map

Source: `Agent_Runtime_System_v1.md` — Step 1E (Priority Order), Step 2 §4 (Freedom Boundary Enforcement — what requires human takeover regardless of freedom level), Module 1 §D (Human Handoff Handler + Escalation Priority Classification), Module 3 §5 (Failure Handling escalation cases), Module 4 §7.1 (Recovery Ownership), Module 5 §4 (5-Condition Gate escalation conditions), Step 1.H (Global Active Issue Lock), Step 4 Emergency §8 (Human Queue Unavailable — the general/reusable rule, authored against Emergency and cross-referenced by every other archetype's own Escalation Boundaries §8). This map covers the cross-module escalation mechanics shared by all 5 archetypes; each archetype's own additional, archetype-specific escalation triggers (e.g., Restaurant's safety-relevant dietary P2, Appointment's special-request P2/P3, Consultation's score ≥85 Mode C) are detailed in that archetype's own flowchart file, not duplicated here.

All escalation triggers across every module/step, unified into one routing map, with Escalation Priority Classification (P1/P2/P3) applied consistently.

```mermaid
flowchart TD
    Trigger([Escalation-eligible signal detected]) --> Source{Trigger source}

    Source -->|Intent 07 — explicit<br/>human request| Always["Always honored immediately —<br/>regardless of freedom level or<br/>agent confidence (Step 2 §4)"]
    Source -->|Intent 05 — Complaint,<br/>2 failed resolution attempts| ComplaintEsc[Core Agent Complaint Handler<br/>escalation path]
    Source -->|Intent 06 — Refund/<br/>legal/safety dimension| RefundEsc[Always escalates —<br/>no discount/refund authority<br/>held by any module]
    Source -->|FAQ Handler — 2 clarification<br/>attempts exhausted| FAQEsc[Core Agent §A escalation]
    Source -->|Confidence Gate Low/Conflicting<br/>on a matter requiring action| ConfEsc["Step 1D.2 — never act on<br/>Low/Conflicting confidence"]
    Source -->|Action-level permission gap,<br/>no fallback available| PermEsc[Step 1D.1 escalation]
    Source -->|Conversion dispatch/booking<br/>action fails, no safe recovery| ConvEsc["Module 3 §5 FAILED_ESCALATION —<br/>Emergency dispatch failure is the<br/>single highest-severity case"]
    Source -->|Email: Refund or Complaint<br/>category, or Legal/Compliance<br/>or Media/Press| EmailEsc["Module 5 §4 — 5-Condition Gate<br/>Conditions 3/4, never drafted,<br/>never auto-sent"]
    Source -->|Consultation score ≥ 85| ScoreEsc["Module 3 Consultation Mode C —<br/>human priority handoff"]
    Source -->|"Genuine life-safety hazard<br/>(Emergency archetype)"| SafetyEsc["Step 0A Universal Psychology<br/>Override — supersedes ALL<br/>other logic, Priority 1"]

    Classify["Escalation Priority Classification<br/>(Module 1 §D)"]
    Always --> Classify
    ComplaintEsc --> Classify
    RefundEsc --> Classify
    FAQEsc --> Classify
    ConfEsc --> Classify
    PermEsc --> Classify
    ConvEsc --> Classify
    EmailEsc --> Classify
    ScoreEsc --> Classify
    SafetyEsc --> Classify

    Classify --> P1{Priority 1 — IMMEDIATE?}
    P1 -->|"Active safety, severe complaint/<br/>trust failure, urgent operational<br/>failure, customer in distress,<br/>Consultation score ≥85"| P1Route[Immediate human pickup]
    P1 -->|No| P2{Priority 2 — STANDARD?}
    P2 -->|"Permission gap, account<br/>modification, refund/cancellation,<br/>unclear after 2 attempts"| P2Route[Standard queue response time]
    P2 -->|No| P3["Priority 3 — REVIEW:<br/>improvement feedback, uncommon<br/>question, low-urgency follow-up"]
    P3 --> P3Route[Async review, no immediate<br/>response needed]

    P1Route --> LockCheck
    P2Route --> LockCheck
    P3Route --> LockCheck

    LockCheck["1.H Global Active Issue Lock:<br/>does this customer already have<br/>an owner?"]
    LockCheck -->|Human already owns| Consolidate["Queue to SAME human —<br/>do not create a second,<br/>redundant escalation record"]
    LockCheck -->|No existing owner| NewHandoff["Module 1 §D Human Handoff Handler:<br/>message delivered, context passed<br/>(conversation_summary, intent history,<br/>escalation reason)"]

    NewHandoff --> HumanAvail{Human available<br/>in queue?}
    HumanAvail -->|Yes| Delivered(["Step 1G End State 5"])
    HumanAvail -->|No| Unmanned["Human Queue Unavailable<br/>(general rule, authored in Step 4<br/>Emergency §8, reusable by other<br/>archetypes)"]
    Unmanned --> UnmannedRule["Never say 'no one available' + stop.<br/>Escalation record still created at<br/>logged priority. Customer-facing<br/>timing communicated honestly,<br/>not a promise that can't be kept."]
    UnmannedRule --> Delivered

    Consolidate --> Delivered

    Delivered -.-> ReturnPath{Human interaction<br/>concludes}
    ReturnPath -->|Case 1: resolved| ReturnAI["Return to AI —<br/>Module 1 §D"]
    ReturnPath -->|"Case 2: sensitive<br/>ongoing (refund dispute,<br/>legal, high-value negotiation)"| StaysHuman["Human retains ownership —<br/>AI does not resume this thread"]
    ReturnPath -->|Case 3: unrelated<br/>new request| ReturnAI

    ReturnAI --> RecoveryNote["Recovery Engine does NOT create/<br/>continue a record while human<br/>owned the conversation<br/>(Module 4 §7.1 / Step 1G End State 5)"]
```
