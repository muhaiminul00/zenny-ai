# Integration Platform V1

## Overview

The platform is built around **business capabilities**, **not provider-specific OAuth scopes**.

Each integration provider (Google, Shopify, Slack, etc.) will internally map its OAuth scopes to our standardized capability model. This allows the rest of the application and AI agents to remain provider-agnostic.

---

# 1. Email

## Gmail

### Capabilities

- Read emails
- Search emails
- Read email threads
- Read attachments
- Download attachments
- Send emails
- Create drafts
- Update drafts
- Reply to emails
- Read labels
- Create labels
- Apply labels
- Remove labels
- Archive emails
- Mark emails as read/unread

### Future Integrations

- Microsoft Outlook (Microsoft 365)

---

# 2. Calendar

## Google Calendar

### Capabilities

- Read calendars
- Read availability (Free/Busy)
- Read events
- Create events
- Update events
- Delete events
- Read attendees
- Invite attendees

---

## Calendly

### Capabilities

- Read event types
- Read availability
- Read scheduled events
- Create bookings
- Cancel bookings
- Reschedule bookings

---

## Cal.com

### Capabilities

- Read event types
- Read availability
- Read bookings
- Create bookings
- Cancel bookings
- Reschedule bookings

### Future Integrations

- Microsoft Outlook Calendar (Microsoft 365)

---

# 3. Team Notifications

## Slack

### Capabilities

- Send messages
- Read channels
- Read channel members
- Read user profiles

---

# 4. E-commerce

## Shopify

### Capabilities

- Read products
- Read product variants
- Read product images
- Read collections
- Read inventory
- Read orders
- Read abandoned/incomplete checkouts
- Read customers

### Order Policy

The AI **does not place orders directly**.

Instead it will:

- Recommend products
- Build an order request
- Build a checkout/cart or draft order (future)
- Send the request for merchant approval
- Create the order only after merchant approval (if enabled)

---

## WooCommerce

### Capabilities

- Read products
- Read product variants
- Read product images
- Read categories
- Read inventory
- Read orders
- Read abandoned/incomplete carts (if supported)
- Read customers

### Order Policy

Uses the same approval workflow as Shopify.

---

# Internal Capability Architecture

The application should **never** rely on provider-specific OAuth scopes.

Instead, it uses a unified capability model.

## Internal Capabilities

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

## Provider Mapping Example

### Gmail

```text
gmail.readonly
gmail.send
gmail.labels
        │
        ▼
READ_EMAIL
SEND_EMAIL
MANAGE_LABELS
```

### Google Calendar

```text
calendar.events
calendar.readonly
        │
        ▼
READ_CALENDAR
CREATE_CALENDAR_EVENT
READ_AVAILABILITY
```

### Shopify

```text
read_products
read_orders
read_customers
        │
        ▼
READ_PRODUCTS
READ_ORDERS
READ_CUSTOMERS
```

---

# Architecture Principle

The platform should always operate using **business capabilities**, while OAuth provider scopes remain an implementation detail.

Benefits:

- AI agents remain provider-agnostic.
- New providers can be added without changing application logic.
- OAuth scope management stays isolated within each provider implementation.
- Easier maintenance and long-term scalability.