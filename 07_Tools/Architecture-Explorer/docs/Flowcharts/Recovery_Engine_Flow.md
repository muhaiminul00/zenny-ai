# Recovery Engine Flow (Module 4)

Source: `Agent_Runtime_System_v1.md` — Step 3 Module 4, Sections 2 (Trigger Definition), 3/3.1 (Profiles + Time Suppression), 4 (Message Logic), 5 (Suppression Rules incl. Pre-Record Opt-Out), 6/6.1 (Stop Conditions + Reply Handling), 7.1 (Ownership Rule), 8 (Enterprise Sources A–I).

Trigger → cadence → suppression → stop, across all 9 recovery-opportunity sources.

```mermaid
flowchart TD
    Start([Recovery-eligible moment]) --> Source{Source A–I?}

    Source -->|A| ConvoAbandon["AI Conversation Abandonment<br/>(Step 1G End State 2/4)"]
    Source -->|B–I| External["External Event Entry Point (1.0.1):<br/>cart/checkout/payment/booking/form<br/>abandonment, proposal expiry,<br/>reactivation, review trigger"]

    ConvoAbandon --> Intake
    External --> Intake

    Intake["Universal Intake Rule (§8)"]
    Intake --> Lock{"1.H Global Active Issue Lock"}
    Lock -->|Human owns| Pause1[Pause — do not create/send]
    Lock -->|Live conversation active| Pause2[Pause — surface as context]
    Lock -->|No lock| Suppressed

    Suppressed{"Customer opted out?<br/>Suppression record exists?<br/>(§5, incl. pre-record opt-out)"}
    Suppressed -->|Yes| DoNotRecover([Do not recover])
    Suppressed -->|No| ConvertedCheck{Lead Status<br/>Converted/Closed?}
    ConvertedCheck -->|Yes| DoNotRecover
    ConvertedCheck -->|No| Trigger

    Trigger["§2 Exact Trigger Moment<br/>(per archetype)"]
    Trigger --> CreateRecord[Create Recovery Record]
    CreateRecord --> Profile["§3 Select Cadence Profile"]

    Profile --> ProfileTable{Archetype}
    ProfileTable -->|Emergency| P1["15min → 6hr → 24hr, 3 steps"]
    ProfileTable -->|Appointment| P2["1hr → 24hr → 3d → 7d, 4 steps"]
    ProfileTable -->|Commerce Ecom| P3["30min → 24hr → 72hr, 3 steps"]
    ProfileTable -->|Commerce Restaurant| P4["1hr → 24hr, 2 steps"]
    ProfileTable -->|Consultation| P5["1d → 3d → 7d → 14d → 30d, 5 steps, score-aware"]
    ProfileTable -->|Engagement| P6["1d → 7d → 21d, 3 steps"]

    P1 --> Schedule
    P2 --> Schedule
    P3 --> Schedule
    P4 --> Schedule
    P5 --> Schedule
    P6 --> Schedule

    Schedule[Step Due] --> LiveCheck["Universal Cadence Rule:<br/>re-read Lead Status LIVE<br/>before every send"]
    LiveCheck --> StopCheck{"Converted / Escalated /<br/>Closed / Opted-out /<br/>Spam-complaint (email)?"}
    StopCheck -->|Yes| StopEnforce["§6 Stop Condition Enforcement"]
    StopCheck -->|No| TimeWindow["§3.1 Time-of-Day Suppression:<br/>8am–8pm local? (Emergency step 1 exempt)"]

    TimeWindow -->|Outside window| Hold["Hold — send at next window open,<br/>gap calculated from ORIGINAL schedule,<br/>not delayed send time"]
    Hold --> LiveCheck
    TimeWindow -->|Inside window, or Emergency step 1| BuildMessage["§4 Recovery Message Logic:<br/>step-based (non-scored) or<br/>score-tier-based (Consultation)"]

    BuildMessage --> Reference["Reference conversation_summary +<br/>selected_solution — NEVER frequency/<br/>count data (0C §4 privacy)"]
    Reference --> Send[Send via configured channel]
    Send --> UpdateStep[Increment step, set next_follow_up]
    UpdateStep --> Schedule

    Send -.->|Customer replies| ReplyHandle["§6.1 Recovery Reply Handling:<br/>STOP cadence immediately"]
    ReplyHandle --> FreshLoad["Load fresh: conversation_summary,<br/>recovery_context, CURRENT Business Memory"]
    FreshLoad --> NewSession["Re-enter Universal Runtime (Step 1)<br/>as Returning Lead — NOT a<br/>continuation of the cadence"]

    StopEnforce --> StatusMap{Which condition?}
    StatusMap -->|Converts| Completed["Recovery Status → Completed<br/>(never 'Failed' — the customer<br/>did not fail)"]
    StatusMap -->|Opts out| Stopped1[Recovery Status → Stopped]
    StatusMap -->|Escalates| Paused["Recovery Status → Paused<br/>(§7.1 Ownership Rule)"]
    StatusMap -->|Max steps reached| Stopped2[Recovery Status → Stopped]

    Paused --> Resume{Resumption trigger?}
    Resume -->|A: customer replies| ReplyHandle
    Resume -->|B: human closes task,<br/>no reply| ResumeCheck{Max steps<br/>reached during pause?}
    ResumeCheck -->|No, not Converted/Stopped/Completed| ResumeActive["Resume from next<br/>scheduled step"]
    ResumeCheck -->|Yes| Stopped2
    Resume -->|C: live conversation ends<br/>without conversion| Reevaluate["Re-evaluate per Module 3 §5.1 —<br/>resume or create new record"]
    ResumeActive --> Schedule
```
