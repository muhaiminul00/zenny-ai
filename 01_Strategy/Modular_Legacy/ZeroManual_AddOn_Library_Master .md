**Add-On Library Master Plan**

Customer Support AI Agent · Team Reference · v1.0 · ZeroManual · 2025

|  |  |  |  |
| --- | --- | --- | --- |
| **36**  total add-ons | **19**  MVP — first sprint | **6**  Universal (all clusters) | **17**  Phase 2 add-ons |

Every add-on the library needs. Organized by task type. Green rows = MVP (build in first sprint: C1 + C3 in parallel). Universal scope = built once, deployed to all clusters.

|  |  |  |  |  |
| --- | --- | --- | --- | --- |
| **Add-on** | **Scope** | **Clusters** | **Phase** | **Effort** |
| **Lookup** | | | | |
| **Availability check** | Cluster | C1 | **MVP** | Medium · 1 day |
| **Booking status** | Cluster | C1 | **MVP** | Medium · 1 day |
| **Order status** | Cluster | C3 | **MVP** | Medium · 1 day |
| **Delivery & tracking status** | Cluster | C3 | **MVP** | Medium · 1 day |
| **Stock / inventory check** | Cluster | C3 | **MVP** | Medium · 1 day |
| Job / service request status | Cluster | C2 | Phase 2 | Medium · 1 day |
| Account info lookup | Cluster | C4 | Phase 2 | Medium · 1 day |
| Subscription / plan info | Cluster | C4 | Phase 2 | Medium · 1 day |
| **Action** | | | | |
| **Book appointment** | Cluster | C1 | **MVP** | Complex · 2–3 days |
| **Cancel / reschedule appointment** | Cluster | C1 | **MVP** | Medium · 1 day |
| **Refund initiation** | Cluster | C3 | **MVP** | Medium · 1 day |
| **Cancel order** | Cluster | C3 | **MVP** | Medium · 1 day |
| Return initiation | Cluster | C3 | Phase 2 | Medium · 1 day |
| Change delivery address | Cluster | C3 | Phase 2 | Medium · 1 day |
| Password / access reset | Cluster | C4 | Phase 2 | Medium · 1 day |
| Subscription change | Cluster | C4 | Phase 2 | Complex · 2–3 days |
| **Info** | | | | |
| **FAQ answer** | Universal | All | **MVP** | Simple · ½ day |
| **Business hours & location** | Universal | All | **MVP** | Simple · ½ day |
| **Pricing / rates** | Universal | All | **MVP** | Simple · ½ day |
| **Cancellation policy** | Universal | All | **MVP** | Simple · ½ day |
| **Service catalog** | Cluster | C1 C2 | **MVP** | Simple · ½ day |
| **Return & refund policy** | Cluster | C3 | **MVP** | Simple · ½ day |
| **Shipping / delivery info** | Cluster | C3 | **MVP** | Simple · ½ day |
| Product / service specs | Cluster | C2 C3 C4 | Phase 2 | Simple · ½ day |
| Feature / how-to guide | Cluster | C4 | Phase 2 | Simple · ½ day |
| **Lead capture** | | | | |
| **Contact / callback request** | Universal | All | **MVP** | Simple · ½ day |
| Quote request form | Cluster | C2 | Phase 2 | Simple · ½ day |
| Service inquiry form | Cluster | C2 | Phase 2 | Simple · ½ day |
| Waitlist signup | Cluster | C1 | Phase 2 | Simple · ½ day |
| Demo / trial request | Cluster | C4 | Phase 2 | Simple · ½ day |
| Donation form | Niche | C2 (NGO) | Phase 2 | Simple · ½ day |
| **Escalation** | | | | |
| **Complaint log** | Universal | All | **MVP** | Simple · ½ day |
| **Dispute / chargeback flag** | Cluster | C3 C4 | **MVP** | Simple · ½ day |
| Urgent / emergency flag | Cluster | C2 | Phase 2 | Simple · ½ day |
| VIP / priority flag | Cluster | C3 | Phase 2 | Simple · ½ day |
| Tech support intake | Cluster | C4 | Phase 2 | Simple · ½ day |

**KEY**

|  |  |
| --- | --- |
| **Label** | **Meaning** |
| **Universal** | All 4 clusters need it. Build once, deploy everywhere. Build these 6 first. |
| **Cluster** | 1–3 clusters need it. Built once per applicable cluster, then reused within it. |
| **Niche** | One niche only. Build last — only when that specific niche is being onboarded. |
| **MVP** | Top priority. First sprint covers C1 (Appointment) + C3 (Commerce) in parallel. |
| **Phase 2** | Start only after MVP is live and validated in production. |
| **Simple · ½ day** | KB-only add-on — no API call required. |
| **Medium · 1 day** | One API call via n8n webhook. |
| **Complex · 2–3 days** | Multi-step flow or multiple API calls. |