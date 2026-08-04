# Batch 3 — Round 2 — Platform Independence Principle

```
Task:      Add the Implementation Independence principle to Agent_Runtime_System_v1.md
Scope:     PRINCIPLE ONLY. Explicitly NOT a full retrofit of existing
           implementation-specific references throughout the document.
Status:    Approved with a deliberately narrow scope — see "Why This Is
           Narrow" below.
```

---

## Why This Is Narrow

The original proposal for this patch was to abstract every existing reference to Airtable, n8n, Voiceflow, and the Integration Contract throughout the entire document (Step 0C's "Airtable-held Lead/Conversion/Recovery records," Module 4's "grounded in n8n Recovery Engine Build Guide," and dozens more instances). That is a large, valuable, but separate task — doing it inside this round risks touching approved content across nearly every module simultaneously, which is exactly the kind of scope creep this whole build process has been careful to avoid.

**This round does one thing:** state the governing principle explicitly, once, in a prominent location. It does NOT touch any existing reference to Airtable/n8n/Voiceflow elsewhere in the document. Those references remain as-is — accurate descriptions of the *current* implementation — and get abstracted in a dedicated future pass (tracked as a to-do, not done now).

---

## The Patch

**Insert as a new section near the top of the document, immediately after the document header and before Step 0A begins — this should be one of the first things a reader encounters, since it governs how to read every implementation-specific reference that follows:**

```markdown
## Architecture Principle: Implementation Independence

This document defines runtime behavior — what the agent thinks, decides,
and does. It does not define permanent implementation choices.

**The runtime defines WHAT happens. Implementation decides HOW.**

Wherever this document references a specific system (Airtable, n8n,
Voiceflow, Convocore, the Integration Contract), that reference describes
the *current* implementation layer — accurate today, not a permanent
architectural commitment. The underlying pattern is always more general
than the specific tool:

```
Pattern:  "Save to Business Data Layer" — currently implemented via Airtable
Pattern:  "Execute Action Tool" — currently implemented via n8n
Pattern:  "Conversation platform" — currently implemented via Voiceflow/Convocore
```

**Why this matters:** Zenny's roadmap includes migration to a different
execution stack as the platform matures (a custom SaaS architecture — the
specifics are a separate infrastructure decision, not defined here). This
runtime document is deliberately written to be the layer that survives
that migration unchanged. A future engineer replacing Airtable with a
different data layer, or n8n with a different orchestration engine, should
be able to read this document and know exactly what the new implementation
must do — the runtime logic does not need to be redesigned, only
re-implemented.

**What this principle does NOT do:** It does not retroactively abstract
every existing implementation-specific reference in this document. Those
references remain in place, accurately describing the current build, until
a dedicated future pass updates them. This principle establishes the
reading lens: when you see "Airtable" in this document, read it as
"the current Business Data Layer implementation," not as an assumption
that Airtable is permanent.

**Status: PRINCIPLE ESTABLISHED. Full retrofit of existing
implementation-specific references is tracked as a separate future task,
not part of this document's current scope.**
```

---

## Also Required: Create the Tracking Item

Add a new entry to Appendix B (Step 4 Architecture Flags) or create an
Appendix C if more appropriate — your judgment on which fits better given
current document structure:

```markdown
FLAG — Implementation Reference Retrofit (Future Task, Not Current Scope):
  This document contains numerous specific references to Airtable, n8n,
  Voiceflow/Convocore, and the Integration Contract, written when those
  were the only implementation targets. The Implementation Independence
  principle (document header) establishes the correct reading lens for
  these references now, but a future dedicated pass should audit every
  such reference and rewrite it in abstracted pattern form (per the
  principle's examples) — this is explicitly NOT done in Batch 3 Round 2,
  to avoid uncontrolled scope creep touching approved content across
  every module simultaneously. Schedule as its own task when platform
  migration planning becomes concrete.
```

---

### Round 2 Completion

1. Confirm the Implementation Independence principle is added near the document top, before Step 0A.
2. Confirm the tracking flag is added to Appendix B or a new Appendix C.
3. Confirm NO other section of the document was touched — this round makes zero changes to any existing Airtable/n8n/Voiceflow reference anywhere else in the file. Grep for "Airtable," "n8n," and "Voiceflow" across the full document and confirm the only NEW occurrence is inside the principle section itself (as examples) — everything else should show identical line content to before this round.

**STOP after Round 2. Report back, including the grep confirmation. Do not proceed to Round 3 without confirmation.**
