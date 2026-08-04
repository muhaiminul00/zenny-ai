# Conversion Engine Flow (Module 3)

Source: `Agent_Runtime_System_v1.md` — Step 3 Module 3, Sections 1.1 (State Machine), 1.2 (Duplicate Protection), 2 (Modes Table), 2.1 (Universal Availability Validation Layer), 3 (Per-Archetype Flows), 4.1 (Partial Conversion), 5 (Failure Handling), 5.1 (Abandonment Detection).

All modes per archetype, unified through one state machine.

```mermaid
flowchart TD
    Start([Intent 03 — from Growth Agent handoff or direct]) --> Payload{Handoff payload<br/>present?}
    Payload -->|Yes| UsePayload["Consume: selected_solution,<br/>captured_contact_fields, resolved_objections —<br/>never re-ask what's already known"]
    Payload -->|No| CleanState[Proceed from clean state]

    UsePayload --> Dup
    CleanState --> Dup

    Dup["1.2 Duplicate Action Protection:<br/>active record exists for same<br/>customer + type + item/time?"]
    Dup -->|Yes| ConfirmExisting["Confirm existing action —<br/>do not create duplicate"]
    Dup -->|No| StateMachine

    StateMachine["1.1 Conversion State Machine"]
    StateMachine --> S1[INTENT_CONFIRMED]
    S1 --> S2[DATA_COLLECTION]

    S2 --> Partial["4.1 Partial Conversion Handling:<br/>ask only for MISSING fields,<br/>one at a time"]
    Partial --> ValGate["Data Validation Gate (Step 0B §7.4):<br/>all required fields VALID or<br/>INVALID-FLAGGED?"]
    ValGate -->|No, field NOT-YET-COLLECTED| Partial
    ValGate -->|Yes| PermCheck["1D.1 Action Permission Check:<br/>cart creation / booking / registration<br/>action-level permission granted?"]

    PermCheck -->|No| ModeFallback[Fall to next Mode B/C]
    PermCheck -->|Yes| S3[ACTION_PENDING — no customer<br/>confirmation sent yet]

    S3 --> AvailCheck{"2.1 Universal Availability<br/>Validation Layer: is the resource<br/>being committed actually available?<br/>(Mode A only)"}
    AvailCheck -->|"Yes, or Mode B/C<br/>(check does not apply)"| ModeRoute
    AvailCheck -->|No| AvailFallback["Offer nearest available<br/>alternative, or fall to next<br/>Mode A → B → C"]
    AvailFallback --> ModeRoute

    ModeRoute{Archetype + Mode}
    ModeRoute -->|Commerce Ecom A| CartAPI[Cart-creation API call]
    ModeRoute -->|Commerce Ecom B| ProductLink[Guided product link]
    ModeRoute -->|Commerce Restaurant| Reservation["Reservation — party size gate ≥10<br/>→ Mode C event handoff"]
    ModeRoute -->|Appointment A| DirectBook[Calendar write]
    ModeRoute -->|Appointment B| RequestBook[Pending booking, human confirms]
    ModeRoute -->|Consultation| ScoreGate["Score Gate: <50 nurture /<br/>50–84 Mode A / ≥85 Mode C priority"]
    ModeRoute -->|Emergency A| CallbackQueue["Callback queue write —<br/>see Emergency_Archetype_Flow.md"]
    ModeRoute -->|Emergency B| InspectionSlot[Inspection slot booking]
    ModeRoute -->|Engagement| Registration[Registration per conversion type]

    CartAPI --> ActionResult
    ProductLink --> S4Confirmed
    Reservation --> ActionResult
    DirectBook --> ActionResult
    RequestBook --> S4Confirmed
    ScoreGate --> ActionResult
    CallbackQueue --> ActionResult
    InspectionSlot --> ActionResult
    Registration --> ActionResult

    ActionResult{External system result?}
    ActionResult -->|Success| S4Confirmed["CONFIRMED —<br/>customer-facing confirmation<br/>ONLY sent from this state"]
    ActionResult -->|Fails, fallback exists| FailedRecoverable["FAILED_RECOVERABLE —<br/>execute fallback smoothly,<br/>no technical language exposed"]
    ActionResult -->|Fails, no safe recovery| FailedEscalation["FAILED_ESCALATION —<br/>Human Handoff, Priority 1<br/>if Emergency dispatch"]
    S3 -->|Customer says<br/>'never mind'| Cancelled["CANCELLED — terminal,<br/>no recovery record"]

    FailedRecoverable --> ModeFallback
    ModeFallback --> S3

    S4Confirmed --> ExitOK([Step 1G End State 1])
    Cancelled --> ExitCancel([Step 1G End State 1 — respected decision])
    FailedEscalation --> ExitHandoff([Step 1G End State 5])
    ConfirmExisting --> ExitOK

    S1 -.->|Customer stops responding| Abandon1["5.1 Abandonment: Recovery Engine<br/>eligibility check if active"]
    S2 -.->|Customer stops responding| Abandon2["5.1 Abandonment: partial data<br/>held as Recovery context"]
    S3 -.->|Customer stops responding| AbandonWait["NOT abandonment yet —<br/>wait for external system result"]
    AbandonWait --> ActionResult

    Abandon1 --> ExitRecovery([Step 1G End State 2])
    Abandon2 --> ExitRecovery
```
