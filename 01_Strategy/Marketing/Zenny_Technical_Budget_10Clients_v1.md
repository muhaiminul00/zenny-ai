# ZENNY — Technical Budget: 10 Recurring Clients (Production)

**Scope:** infrastructure to run all 4 services — AI Chatbot, Social Media Integration, Analytics Dashboard, AI Email Manager — for 10 paying, recurring clients. Production only, single tier, no build/test phase.

## Monthly Cost

| Tool | Covers | Cost/mo |
|---|---|---|
| Convocore White Label | AI Chatbot + Social Media Integration (WhatsApp/Messenger/Instagram, no extra fee) + built-in usage analytics — required from client #1 for multi-client management | **$199** |
| Hostinger VPS (`srv1881104`) | Hosts n8n (AI Email Manager workflows) + Zenny dashboard | **$19.49** |
| Supabase | Client/lead/order/conversation data | $0 (free tier — see below) |
| Pinecone | Knowledge-base embeddings | $0 (free tier — see below) |
| Notion | Internal KB/docs (not client-facing) | $0 (free tier — see below) |
| Analytics Dashboard page | New `dashboard.zeromanuals.com/analytics` page on the already-built dashboard | $0 (no new infra) |
| AI Email Manager | n8n + client's own Gmail/Outlook API | $0 (no separate email service) |
| **Total** | | **$218.49/mo** (~**$21.85/client/mo**) |

🚩 **Voice is not included** (per instruction). White Label bundles 3 Twilio numbers + 10 call lines at no extra cost if switched on later; beyond that, +$3/mo per extra number and +$5/mo per extra call line.

## Free-Tier Reality Check (at 10 clients)

| Tool | Free tier holds? | Approx. real ceiling | Next tier if exceeded |
|---|---|---|---|
| Supabase | ✅ Yes — 500MB DB / 5GB bandwidth is comfortable at this scale | ~40–60 clients (depends on conversation volume, not exact) | Pro — $25/mo (8GB DB, 250GB bandwidth) |
| Pinecone | ✅ Yes — 2GB storage / 2M writes-per-mo covers 10 clients' KB embeddings | ~30–50 clients (depends on KB size/client) | Standard/Builder — ~$20/mo starter |
| Notion | ✅ Yes — not client-count driven; internal use only | N/A (driven by team size, not clients) | Plus — $10/user/mo if team grows |

Estimates above are sizing approximations, not load-tested against real traffic — re-check once real usage data exists.

## Bottom Line

10 clients cost **$218.49/mo total**, all on free tiers except Convocore White Label ($199) and the VPS ($19.49). No other paid tools required to hit 10 recurring clients.
