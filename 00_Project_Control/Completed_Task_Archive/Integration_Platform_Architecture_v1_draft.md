# Integration Platform Architecture (V1)

## Vision

Build a reusable **Integration Platform** that allows customers to securely connect third-party services to our application using OAuth.

The platform should be:

- Provider-agnostic
- Secure
- Modular
- Easily extensible
- Independent from AI agents and business logic

Every integration should expose the same internal capability model regardless of the provider.

---

# High-Level Architecture

```text
                        Customer Dashboard
                               │
                               ▼
                    Connected Accounts UI
                               │
                               ▼
                    Integration Manager API
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
 OAuth Manager         Capability Manager      Token Manager
        │                      │                      │
        └──────────────┬───────┴──────────────┬───────┘
                       │
                       ▼
               Provider Adapters
                       │
 ┌───────────────┬──────────────┬──────────────┬──────────────┐
 ▼               ▼              ▼              ▼
 Gmail      Google Calendar   Calendly      Shopify
 ▼               ▼              ▼              ▼
 Google OAuth  Google OAuth  Calendly OAuth Shopify OAuth
```

---

# Project Structure

```text
backend/

├── api/
│   └── integrations/
│
├── integrations/
│
│   ├── core/
│   │
│   │   ├── oauth_manager.py
│   │   ├── token_manager.py
│   │   ├── capability_manager.py
│   │   ├── encryption.py
│   │   ├── permissions.py
│   │   └── exceptions.py
│   │
│   ├── providers/
│   │
│   │   ├── gmail/
│   │   ├── google_calendar/
│   │   ├── calendly/
│   │   ├── calcom/
│   │   ├── slack/
│   │   ├── shopify/
│   │   └── woocommerce/
│   │
│   ├── models/
│   │
│   ├── schemas/
│   │
│   └── services/
│
└── database/
```

---

# Core Components

## 1. OAuth Manager

Responsible for the OAuth lifecycle.

Responsibilities

- Generate authorization URLs
- Handle callback
- Exchange authorization code
- Validate state
- PKCE support
- Refresh tokens
- Revoke tokens

Every provider uses this common flow.

---

## 2. Token Manager

Responsible for token lifecycle.

Responsibilities

- Encrypt access tokens
- Encrypt refresh tokens
- Store tokens
- Check expiration
- Refresh automatically
- Delete revoked tokens

Application code should never directly access raw tokens.

---

## 3. Capability Manager

Acts as the translation layer between business logic and providers.

Example

```text
Application

↓

SEND_EMAIL

↓

Capability Manager

↓

Gmail

↓

gmail.send
```

The application never knows provider-specific OAuth scopes.

---

## 4. Provider Adapter

Every provider implements the same interface.

Example

```python
class Provider:

    authorize()

    exchange_code()

    refresh_token()

    revoke()

    get_capabilities()

    validate_connection()
```

Every integration should follow this interface.

Examples

- Gmail
- Google Calendar
- Calendly
- Shopify
- Slack

---

# Connected Accounts

Each customer has their own integrations.

Example

```text
Connected Accounts

✓ Gmail

✓ Google Calendar

✓ Calendly

✕ Slack

✕ Shopify

✓ WooCommerce
```

Each connection stores its own credentials.

---

# Database Design

## integrations

Stores available integrations.

```text
id

name

provider

category

status
```

---

## connected_accounts

Stores each customer's connection.

```text
id

organization_id

provider

account_name

provider_account_id

status

created_at

updated_at
```

---

## oauth_tokens

Stores encrypted OAuth credentials.

```text
id

connected_account_id

access_token

refresh_token

expires_at

scope

token_type

created_at

updated_at
```

---

# Capability Model

The platform works with internal capabilities instead of OAuth scopes.

Example

```text
READ_EMAIL

SEND_EMAIL

CREATE_EMAIL_DRAFT

READ_CALENDAR

CREATE_CALENDAR_EVENT

READ_AVAILABILITY

READ_PRODUCTS

READ_PRODUCT_IMAGES

READ_ORDERS

READ_CUSTOMERS

SEND_NOTIFICATION
```

---

# Provider Mapping

Example

```text
Gmail

gmail.readonly
gmail.send

↓

READ_EMAIL
SEND_EMAIL
```

---

```text
Google Calendar

calendar.events

↓

READ_CALENDAR
CREATE_CALENDAR_EVENT
```

---

```text
Shopify

read_products

read_orders

↓

READ_PRODUCTS
READ_ORDERS
```

---

# Authentication Flow

```text
Customer

↓

Click "Connect Gmail"

↓

OAuth Manager

↓

Redirect to Google

↓

Customer approves

↓

Google returns authorization code

↓

OAuth Manager exchanges code

↓

Token Manager encrypts and stores tokens

↓

Connection becomes active
```

---

# Security Principles

- OAuth 2.0 Authorization Code Flow with PKCE where supported
- Encrypt access and refresh tokens at rest
- Never expose tokens to the frontend
- Validate OAuth `state` parameter
- Automatically refresh expired tokens
- Support revoking integrations
- Use HTTPS for all OAuth callbacks
- Log OAuth events without logging sensitive tokens

---

# Extending the Platform

Adding a new provider should only require:

1. Create a new provider adapter.
2. Configure OAuth credentials.
3. Map provider scopes to internal capabilities.
4. Register the provider.

No changes should be required in:

- AI agents
- Business logic
- API layer
- Capability model

---

# Future Integrations

## Email

- Microsoft Outlook (Microsoft 365)

## Calendar

- Microsoft Outlook Calendar (Microsoft 365)

---

# Technology Stack

The Integration Platform is designed to be **self-hosted**, **modular**, and **low-cost**, with no recurring software licensing fees.

## Core Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Backend Framework | FastAPI | REST API & Integration Platform |
| OAuth Library | Authlib | OAuth 2.0 / OpenID Connect implementation |
| Database | PostgreSQL | Store integrations, accounts, and encrypted OAuth tokens |
| ORM | SQLAlchemy | Database access |
| Server | Existing VPS | Self-hosted deployment |
| Reverse Proxy | Nginx | HTTPS & routing |
| Background Jobs | Celery / ARQ / FastAPI Background Tasks (TBD) | Token refresh & scheduled tasks |

---

# Why Authlib?

Instead of building OAuth from scratch or paying for a managed OAuth platform, the Integration Platform uses **Authlib**, a mature open-source OAuth library.

**Software Cost:** **$0**

Authlib provides:

- OAuth 2.0 Authorization Code Flow
- PKCE support
- OpenID Connect support
- Token exchange
- Token refresh
- State validation
- Provider abstraction
- Security best practices

This allows us to focus on building provider integrations rather than implementing OAuth ourselves.

---

# Development Strategy

The platform is built once and then expanded incrementally.

## Step 1

Build the reusable OAuth infrastructure.

Components:

- OAuth Manager
- Token Manager
- Capability Manager
- Provider Interface
- Connected Accounts
- Token Encryption
- Token Refresh Service

This foundation is shared by every integration.

---

## Step 2

Add providers one by one.

For each new provider, the process is typically:

1. Register a developer application with the provider.
2. Obtain the Client ID and Client Secret.
3. Configure OAuth callback URLs.
4. Define the required provider scopes.
5. Implement the provider adapter.
6. Map provider scopes to internal capabilities.
7. Test the integration.
8. Enable it in the Connected Accounts dashboard.

Because the OAuth infrastructure already exists, adding a new provider becomes a relatively small implementation task rather than building another authentication system.

---

# Long-Term Benefits

Once the foundation is complete:

- Every new provider follows the same architecture.
- Business logic never changes.
- AI agents remain provider-agnostic.
- Only a new Provider Adapter needs to be implemented.
- Maintenance cost stays low.
- No recurring licensing fees for OAuth infrastructure.

---

# Design Principles

- **Provider-agnostic** — Business logic never depends on a specific provider.
- **Capability-driven** — Internal capabilities are the source of truth.
- **Modular** — Each provider is isolated behind a common adapter interface.
- **Secure by default** — OAuth credentials are encrypted and never exposed to clients.
- **Extensible** — New providers can be added with minimal effort.
- **Reusable** — The Integration Platform serves as a standalone infrastructure layer that can support any future product built on top of it.