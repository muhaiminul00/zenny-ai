# Service Routing Map

Source: `Agent_Runtime_System_v1.md` — Step 1D (Module Routing), Step 1D.1 (Action Permission Check), and each module's own Purpose/Scope/Activation section (Module 1 §1, Module 2 §1, Module 3 §1, Module 4 §1, Module 5 §1).

Which module activates under which configuration state — module-level gate first, then action-level gate.

```mermaid
flowchart TD
    Start([Intent Classified + Config Loaded]) --> Core{Intent 04/05/06/07?}

    Core -->|Yes| CoreAgent["Core Agent (Module 1)<br/>ALWAYS ON — no config gate<br/>overrides all other modules"]
    Core -->|No| RevCheck{Intent 01/02?}

    RevCheck -->|Yes| RevGate{Growth Agent<br/>module ON?}
    RevGate -->|Yes| RevenueAgent["Growth Agent (Module 2)<br/>Discovery / Recommendation / Objection"]
    RevGate -->|No| CoreFAQFallback[Core Agent FAQ Handler only]

    RevCheck -->|No| ConvCheck{Intent 03?}
    ConvCheck -->|Yes| ConvGate{Conversion Engine<br/>module ON?}
    ConvGate -->|Yes| ConvPermCheck["1D.1 Action Permission Check:<br/>specific action (cart/booking/registration)<br/>enabled for this deployment?"]
    ConvPermCheck -->|Yes| ConversionEngine["Conversion Engine (Module 3)<br/>Mode A/B/C per archetype"]
    ConvPermCheck -->|No| ModeFallback[Fall to next available Mode<br/>or human handoff]
    ConvGate -->|No| ConvFallback["'Bookings handled by our team' + Tier 3 capture offer"]

    ConvCheck -->|No| ObjCheck{Intent 08?}
    ObjCheck -->|Yes| RevGate2{Growth Agent ON?}
    RevGate2 -->|Yes| RevenueObjection[Growth Agent Objection Handling]
    RevGate2 -->|No| CoreFactual[Core Agent factual-only response]

    ObjCheck -->|No| OffTopicCheck{Intent 09/10?}
    OffTopicCheck -->|Yes| CoreAgent

    CoreAgent --> ExitState[Step 1G Exit State]
    CoreFAQFallback --> ExitState
    RevenueAgent --> RevExit{Buying signal /<br/>Intent 03 detected?}
    RevExit -->|Yes| ConvGate
    RevExit -->|No| ExitState
    ConversionEngine --> ModuleExit[Step 1G End State 1/2]
    ModeFallback --> ModuleExit
    ConvFallback --> ExitState
    RevenueObjection --> ExitState
    CoreFactual --> ExitState

    ModuleExit --> RecoveryCheck{"Step 1G: Open Opportunity<br/>or Disengaged with intent?"}
    RecoveryCheck -->|Yes| RecGate{Recovery Engine<br/>module ON?}
    RecGate -->|Yes| RecoveryEngine["Recovery Engine (Module 4)<br/>creates record per archetype trigger"]
    RecGate -->|No| NoRecord["System ends gracefully —<br/>no record, no follow-up"]
    RecoveryCheck -->|No| Done([Conversation Closed])

    RecoveryEngine --> EmailGate{Email Manager<br/>module ON?}
    EmailGate -->|Yes, Email is<br/>preferred channel| EmailManager["Email Manager (Module 5)<br/>executes delivery per Recovery cadence"]
    EmailGate -->|No| OtherChannel[Fall to next configured channel<br/>e.g. Convocore WhatsApp/SMS]

    NoRecord --> Done
    EmailManager --> Done
    OtherChannel --> Done

    subgraph Legend["Module Activation Gates (all independent)"]
        L1["Core Agent: always ON, no gate"]
        L2["Growth Agent: config flag + Step 1D.1 action permissions"]
        L3["Conversion Engine: config flag + per-mode action permissions"]
        L4["Recovery Engine: config flag, evaluated only at Step 1G exit"]
        L5["Email Manager: config flag, serves as delivery layer for<br/>Recovery/Conversion/Growth/Core outbound (Module 5 §2.2)"]
    end
```
