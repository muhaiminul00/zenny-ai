# Zenny SaaS Initial Architecture Plan
## Phase 2 Foundation — LangGraph Runtime

## Purpose
Replace third-party conversation platforms with Zenny's own AI employee runtime while keeping the existing architecture philosophy.

Current:
Channels -> Voiceflow/Convocore -> n8n -> Database -> Dashboard

Future:
Channels -> Zenny LangGraph Runtime -> n8n -> PostgreSQL -> Zenny Dashboard

## Core Principle
Do not build a Voiceflow clone. Build an AI Workforce Operating System.

## Technology Stack

Frontend:
- Next.js
- React
- Tailwind

Backend:
- Python FastAPI
- LangGraph

Database:
- PostgreSQL (Supabase initially)
- pgvector for knowledge retrieval

Memory:
- Redis for short-term conversation state
- PostgreSQL for long-term memory

Automation:
- n8n remains the execution layer

Hosting:
- Vercel: frontend
- Railway/Render/Fly.io: backend
- Supabase: database/storage/auth
- VPS: n8n

## LangGraph Runtime Flow

Customer Message
↓
Load Agent Config
↓
Load Conversation Memory
↓
Intent Detection
↓
Select Archetype Playbook
↓
RAG Knowledge Search
↓
Tool Execution
↓
Generate Response
↓
Save Memory

## Multi Tenant Model

organizations
- id
- name
- plan

users
- id
- organization_id
- role

agents
- id
- organization_id
- archetype
- configuration

conversations
- agent_id
- messages

leads
conversions
metrics

## Agent Configuration Philosophy

One engine. Many configurations.

Emergency Agent:
- Low freedom
- Dispatcher style
- Booking focused

Consultation Agent:
- High freedom
- Discovery focused
- Qualification driven

## n8n Responsibility

LangGraph thinks.
n8n executes.

n8n keeps:
- CRM sync
- Calendar
- Notifications
- Recovery workflows
- Email workflows

## Build Phases

Phase 2A:
- Build LangGraph runtime
- Replace Voiceflow
- Keep n8n + existing services

Phase 2B:
- Build internal Zenny admin UI
- Agent creation
- Knowledge upload
- Analytics

Phase 3:
- Full external SaaS
- Billing
- Self-service onboarding

## Final Goal

Move from:

100 clients = 100 chatbot projects

to:

100 clients = 100 database configurations running on one Zenny AI engine.
