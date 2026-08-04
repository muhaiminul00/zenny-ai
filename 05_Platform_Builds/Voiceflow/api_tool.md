Got it. Reading all n8n build guides now before touching the tool specs.Now I have everything. Let me also confirm WF-003 escalation exact fields.All three payloads confirmed from source. Now building corrected tool specs in Voiceflow's actual format.

---

## CORRECTIONS FROM SCREENSHOTS + DOC READ

**KB Search:** not an API tool — it's the **Knowledge Base system tool toggle** in the playbook's right panel. Enable it per playbook, or at agent level in System Tools. Done. No API config needed.

**API tools naming:** Voiceflow uses `` prefix on input variable names internally (e.g. `business`, `customer_name`) — these map to body field names sent to n8n.

**WF-003 field name:** n8n expects `reason` not `escalation_reason`. Confirmed from build guide.

---

## TOOL 2 — CREATE LEAD

| Field | Value |
|---|---|
| **Name** | `Create Lead` |
| **Trigger / LLM Description** | "Call this tool immediately after customer_name, customer_email, and customer_phone are all collected. Sends lead data to the backend. Returns lead_id, lead_score, score_tier, and recovery_profile. Do not call before all contact fields are set." |
| **Method** | POST |
| **URL** | `https://n8n-andm.srv1729215.hstgr.cloud/webhook/create-lead` |

**Headers:**
```
Content-Type        : application/json
Authorization    : Bearer zm_demo_vf_2026_x7Kp9LmQ2
```

**Input Variables + Descriptions:**

| Variable name | Description |
|---|---|
| `business` | Business identifier. Always "GlowWell" |
| `archetype` | Archetype type. Always "Appointment" |
| `customer_name` | Customer full name collected during lead capture |
| `customer_email` | Customer email address |
| `customer_phone` | Customer phone number |
| `source_channel` | Channel conversation came in on (Website/WhatsApp etc.) |
| `intent` | Detected customer intent from conversation |
| `urgency_level` | Urgency level. Default "Low" for GlowWell |
| `conversation_summary` | Full AI-assembled conversation summary. Must not be empty |

**Body (Form data):**

| Field name sent to n8n | Variable to pass |
|---|---|
| `business` | `{business}` |
| `archetype` | `{archetype}` |
| `customer_name` | `{customer_name}` |
| `customer_email` | `{customer_email}` |
| `customer_phone` | `{customer_phone}` |
| `source_channel` | `{source_channel}` |
| `intent` | `{intent}` |
| `urgency_level` | `{urgency_level}` |
| `conversation_summary` | `{conversation_summary}` |

**Capture Response (set inside Core Lead Capture playbook):**

| Object path (from n8n) | Save to variable |
|---|---|
| `lead_id` | `lead_id` |
| `lead_score` | `lead_score` |
| `score_tier` | `score_tier` |
| `recovery_profile` | `recovery_profile` |

---

## TOOL 3 — CREATE CONVERSION

| Field | Value |
|---|---|
| **Name** | `Create Conversion` |
| **Trigger / LLM Description** | "Call this tool after preferred_date and preferred_time are both confirmed as exact values, and lead_id already exists. Creates the appointment record and Google Calendar event. Never call without lead_id or without an exact HH:MM time." |
| **Method** | POST |
| **URL** | `https://n8n-andm.srv1729215.hstgr.cloud/webhook/create-conversion` |

**Headers:**
```
Content-Type        : application/json
Authorization       : Bearer zm_demo_vf_2026_x7Kp9LmQ2
```

**Input Variables + Descriptions:**

| Variable name | Description |
|---|---|
| `lead_id` | Lead record ID returned by Create Lead. Required — do not call without this |
| `business` | Business identifier. Always "GlowWell" |
| `conversion_type` | Type of conversion. "Appointment" or "Membership Consultation" |
| `customer_name` | Customer full name |
| `customer_email` | Customer email |
| `customer_phone` | Customer phone |
| `service_requested` | The specific service or membership tier confirmed by customer |
| `package_interest` | Membership package interest if applicable |
| `preferred_date` | Confirmed appointment date in YYYY-MM-DD format |
| `preferred_time` | Confirmed appointment time in HH:MM format — exact, not a bucket |

**Body (Form data):**

| Field name sent to n8n | Variable to pass |
|---|---|
| `lead_id` | `{lead_id}` |
| `business` | `{business}` |
| `conversion_type` | `{conversion_type}` |
| `customer_name` | `{customer_name}` |
| `customer_email` | `{customer_email}` |
| `customer_phone` | `{customer_phone}` |
| `service_requested` | `{service_requested}` |
| `package_interest` | `{package_interest}` |
| `preferred_date` | `{preferred_date}` |
| `preferred_time` | `{preferred_time}` |

**Capture Response (set inside Appointment Assistant playbook):**

| Object path | Save to variable |
|---|---|
| `success` | *(no dedicated variable needed — check for graceful degradation only)* |

---

## TOOL 4 — CREATE ESCALATION

| Field | Value |
|---|---|
| **Name** | `Create Escalation` |
| **Trigger / LLM Description** | "Call this tool when escalation_flag is true. Sends escalation data to the backend for human follow-up. Always include conversation_summary with the escalation reason clearly stated inside it. Include lead_id if it exists — omit if escalation fires before lead creation." |
| **Method** | POST |
| **URL** | `https://n8n-andm.srv1729215.hstgr.cloud/webhook/create-escalation` |

**Headers:**
```
Content-Type        : application/json
Authorization       : Bearer zm_demo_vf_2026_x7Kp9LmQ2
```

**Input Variables + Descriptions:**

| Variable name | Description |
|---|---|
| `lead_id` | Lead record ID if lead already exists. Leave blank if escalation fires before lead capture |
| `business` | Business identifier. Always "GlowWell" |
| `reason` | The specific reason for escalation (e.g. "Refund Request", "Complaint", "VIP Customer") |
| `source` | Always "Voiceflow" |
| `conversation_summary` | Full conversation summary including the escalation reason explicitly stated |

**Body (Form data):**

| Field name sent to n8n | Variable to pass |
|---|---|
| `lead_id` | `{lead_id}` |
| `business` | `{business}` |
| `reason` | `{reason}` |
| `source` | `{source}` |
| `conversation_summary` | `{conversation_summary}` |

**Capture Response (set inside Core Escalation Detection playbook):**

| Object path | Save to variable |
|---|---|
| `escalation_id` | `escalation_id` |
| `priority` | *(read-only — no variable needed, n8n assigns this internally)* |

---

**KB Search:** Enable the **Knowledge Base toggle** in System Tools panel (right side, per playbook or at agent level). Point to `KB_GlowWell`. No API config. Done.

Next: **KB_GlowWell content** (15+ records)?