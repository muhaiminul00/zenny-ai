# Phase 5 Dashboard Data Flow (BC-013)

```
Status:    Reference for the next Build Card (Phase 5 UI). Not a new
           architecture document — a short map of what each dashboard
           touches. Full design reasoning lives in Planning_to_Build_
           Transition_v1.md Part 4 Phase 5, Client_Onboarding_Sequence_
           Spec.md, and n8n_Workflow_Specification_v1.md Part 13 (5
           Tool entries updated BC-013 with the parallel-write CR).
```

## 5A — Inventory Dashboard

| | |
|---|---|
| Reads | Nothing in Zenny's DB — product/inventory is never stored here (confirmed, Findings doc Part 1.7). Dashboard reads/writes directly against a to-be-built inventory UI backing store (not yet designed — out of BC-013 scope). |
| Writes | Triggers a sync workflow → Convocore's KB via API (`POST`/`PATCH /agents/{agentId}/kb`) — **workflow not yet built** (Findings doc Part 3.3, carried forward since BC-005/BC-009 as a known future `SCH-{NNN}` item). |
| Agent-side read | Convocore KB only, never Zenny's DB directly. |

## 5B — Order Lookup Dashboard

| | |
|---|---|
| Reads | `{schema}.orders` (new, BC-013) joined to `{schema}.conversions_ecom`/`conversions_restaurant` via `conversion_id` for the actual order content (items, cart_value). `orders` is the review/state layer, not a content duplicate. |
| Writes | Dashboard approve/reject action updates `orders.status`, `reviewed_by`, `reviewed_at`. On approve, a workflow (not yet built) pushes to the real store (Shopify/WooCommerce) and updates `provider_order_id`/`push_attempted_at`/`push_error`. |
| n8n workflow | `CreateCart` (WF-005, existing) writes the initial `orders` row at `pending_review`. The approve→push workflow is new, not yet built — out of BC-013 scope (schema only). |

## 5C — Appointment Booking Dashboard

| | |
|---|---|
| Reads | `{schema}.appointments` (new, BC-013 — deployed to `public`, `tpl_appointment`, `tpl_commerce`, `tpl_emergency`, `tpl_consultation`) joined to the archetype-specific conversions table for content. `authoritative_source` tells the dashboard whether to trust `client_calendar_event_id` (fetch live from the provider) or treat the stored row as the record of truth (`our_db_fallback`). |
| Writes | Not written directly by the dashboard in normal operation — populated by the parallel-write Tools below. Dashboard writes only on manual reconciliation (client fixes a `push_failed`/fallback record by hand). |
| n8n workflows | `CreateAppointment` (WF-003), `CreateReservation` (WF-006), `CreateInspectionSlotBooking` (WF-009), `CreateScoredBooking` (WF-010) — all 4 updated with the parallel-write contract BC-013 (Workflow Spec Part 13.3/13.6/13.9/13.10). `CheckAvailability` (WF-002) reads client-calendar-first, `appointments` as fallback (Part 13.2). None of the 4 write-side Tools are built yet (Phase 8) — BC-013 only updated their documented contracts and built the table they'll write to. |
| Naming note | The `appointments` table deployed to `tpl_commerce` tracks **restaurant reservations**, not scheduling appointments — same generic shape (conversion_id + write-status tracking, no archetype-specific columns) reused across every archetype that needs parallel-write tracking, not a naming mismatch to "fix" later. |

## 5D — Onboarding Form Dashboard

| | |
|---|---|
| Reads | `control.clients`, `control.client_config`, `control.template_versions` (for current template version per archetype). |
| Writes | `control.clients`, `control.client_config` directly (per `Client_Onboarding_Sequence_Spec.md` Step 4) — then must trigger Steps 2, 3, 5–7 of that same spec (copy template schema, register exposed schemas, initial sync, RLS/grant verification). |
| **Open, not decided:** Step 3 (Register Exposed Schemas) has no SQL/MCP mechanism — confirmed empirically during the spec's own test. The real Phase 5 Build Card for 5D needs to decide: manual Supabase Dashboard step remains human-in-the-loop even with an automated form, or a new n8n workflow using the Supabase Management API + a project-admin-scoped service account gets built. Flagged in BC-012, still unresolved. |
| n8n workflow | Step 8 of the Onboarding Sequence Spec ("Connect n8n Workflows") is a documented handoff, not itself a workflow — the form's own trigger-the-provisioning-sequence workflow doesn't exist yet. |

---

## Cross-cutting notes

- **`Template_Migration_Process.md` is out of dashboard scope entirely** — deliberately manual-only (no UI), confirmed in BC-012's discovery pass. None of the 4 dashboards need to expose anything for it.
- **Directus itself is still unverified** — Planning doc Part 6 item 7 flags this as the real Phase 5 Build Card's first action, not done by BC-013 (schema-only card).
- **`get_advisors` clean** after all of BC-013's migrations — only the pre-existing, deliberate RLS-no-policy posture on the new tables, nothing new.
