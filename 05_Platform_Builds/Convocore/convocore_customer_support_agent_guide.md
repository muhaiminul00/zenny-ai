# 🎯 Complete ConvoCore Customer Support AI Agent Setup Guide

> **Last Updated:** June 30, 2026 | **Source:** docs.convocore.ai (Full Documentation Scrape)

---

## Table of Contents

1. [How ConvoCore Works](#1-how-convocore-works)
2. [Getting Started: Creating Your Agent](#2-getting-started-creating-your-agent)
3. [Designing Your Agent's Appearance](#3-designing-your-agents-appearance)
4. [Building the Knowledge Base](#4-building-the-knowledge-base)
5. [Writing the System Prompt](#5-writing-the-system-prompt)
6. [Configuring Initial Messages](#6-configuring-initial-messages)
7. [Agent Settings Deep Dive](#7-agent-settings-deep-dive)
8. [Tools & Integrations](#8-tools--integrations)
9. [Live Handoff to Human Agents](#9-live-handoff-to-human-agents)
10. [Lead Qualification Funnel](#10-lead-qualification-funnel)
11. [UI Engine for Rich Interactions](#11-ui-engine-for-rich-interactions)
12. [Multi-Channel Deployment](#12-multi-channel-deployment)
13. [Analytics & Monitoring](#13-analytics--monitoring)
14. [Voice Capabilities](#14-voice-capabilities)
15. [Canvas for Advanced Flows](#15-canvas-for-advanced-flows)
16. [Pricing & Credits](#16-pricing--credits)
17. [Optimization & Best Practices](#17-optimization--best-practices)
18. [Troubleshooting](#18-troubleshooting)

---

## 1. How ConvoCore Works

ConvoCore is an AI agent platform that lets you build, deploy, and manage text and voice agents across multiple channels from a single dashboard.

### Core Workflow (5 Steps)

| Step | Action | Details |
|------|--------|---------|
| **1. Create** | Build your agent | Customize appearance, voice, and behavior |
| **2. Prepare Data** | Add knowledge | Upload PDFs, scrape URLs, write docs |
| **3. Build & Develop** | Refine prompts | A/B test, adjust system prompts, add tools |
| **4. Deploy** | Launch channels | Web widget, WhatsApp, Instagram, Facebook, Discord, Telegram, Voice |
| **5. Monitor** | Track & manage | Real-time transcripts, analytics, live handoff |

### Architecture Overview

```
User Query → Channel (Web/WhatsApp/etc.) → ConvoCore Runtime → RAG (Knowledge Base) → LLM → Response
                                    ↓                              ↓
                              Tools/Integrations              Vector Database
                                    ↓                              ↓
                              External APIs                 Retrieved Chunks
```

### RAG System (Retrieval Augmented Generation)

ConvoCore uses **RAG** to ground AI responses in your actual data:

1. **User Query** → Submitted by customer
2. **Retrieval** → System searches Knowledge Base (vector database) for relevant chunks
3. **Augmentation** → Retrieved info is added to LLM context
4. **Generation** → LLM generates accurate, contextual response
5. **Response** → Delivered to user via their channel

**Key Benefits:**
- Reduces AI hallucinations (made-up info)
- Provides up-to-date, domain-specific answers
- Aligns responses with your brand voice and policies

---

## 2. Getting Started: Creating Your Agent

### Step-by-Step Agent Creation

**Step 1:** Sign up at [convocore.ai](https://convocore.ai) and log into the dashboard.

**Step 2:** Click "Create Agent" and choose your agent type:
- **Text Agent** (chat widget, WhatsApp, etc.)
- **Voice Agent** (phone calls, web calling)
- **Both**

**Step 3:** Choose your base model (recommendations for customer support):
- **GPT-4o** ($0.003/1K input, $0.012/1K output) — Best overall quality
- **Claude 3.5 Sonnet** ($0.004/1K input, $0.018/1K output) — Excellent for complex reasoning
- **GPT-4o Mini** ($0.001/1K input, $0.001/1K output) — Budget-friendly, still very capable
- **Gemini 2.5 Flash** ($0.0008/1K input, $0.0015/1K output) — Most cost-effective

**Step 4:** Save your agent. You'll get a unique Agent ID for deployment.

---

## 3. Designing Your Agent's Appearance

Navigate to your agent's **Designer** tab to customize the look and feel.

### 3.1 Overview Section

| Field | Purpose | Example |
|-------|---------|---------|
| **Title** | Agent name displayed to users | `SupportBot` |
| **Description** | Short tagline or CTA | `Any questions? I'm here to help!` |
| **Branding** | Agency/client branding | `⚡Powered by YourAgency:youragency.com⚡` |

### 3.2 Appearance Settings

- **Font Family**: Choose from Google Fonts (e.g., `DM Sans`). Type `inherit` to match your website font.
- **Widget Language**: Use ISO 639-1 codes (e.g., `en`, `es`, `fr`). Select "Automatic" to pull website language.
- **Buttons Layout**:
  - **Vertical** (standard) — Standard stacked buttons
  - **Horizontal** — Side-by-side buttons
  - **In Footer** — Buttons at bottom (great for follow-up questions like Copilot/Perplexity)

### 3.3 Launch Avatars

Upload images (max 0.5MB each, square 400x400px recommended):

| Avatar Type | Where It Appears |
|-------------|-----------------|
| **Launch Avatar** | Chat bubble icon |
| **Header Image** | Top-left corner of widget |
| **Banner Image** | Top of chat window |
| **Chat Avatar** | Next to AI messages |
| **Background Image** | Behind chat messages (low opacity) |

### 3.4 Custom Theme

- **Preset Themes**: 6 predefined themes (light/dark mode)
- **Autogen Theme**: Automatically generates theme from your primary color (recommended)
- **Manual Colors**: Input HEX codes directly (e.g., `#F34534`)

**Tip:** Use the [ColorPick Eyedropper](https://chromewebstore.google.com/detail/colorpick-eyedropper/ohcpnigalekghcmgcdcenkpelffpdolg) Chrome extension to grab your brand colors.

### 3.5 Testing Before Launch

| Test Method | Purpose |
|-------------|---------|
| **Prototype** | Shareable demo link for client testing |
| **Demo** | See how widget looks as a chat bubble on a website |

---

## 4. Building the Knowledge Base

The Knowledge Base (KB) is the foundation of your customer support agent. It uses RAG to retrieve accurate information.

### 4.1 Adding Data Sources

#### Method 1: File Upload
Supports: `.txt`, `.pdf`, `.docx`, `.doc`, `.csv`, `.xlsx`

**Steps:**
1. Go to Knowledge section → "Add Data Source" → "File"
2. Select documents from your computer
3. Upload and wait for processing

#### Method 2: URL Scraper
Automatically extracts data from websites.

**Steps:**
1. Go to Knowledge → "Add Data Source" → "URL"
2. Enter URL or sitemap XML
3. Click "Fetch" to retrieve URLs
4. Scrape and save as individual documents
5. Review and remove unwanted pages

**Cost:** X credits per page crawled ($0.001 per page)

#### Method 3: Direct Text Entry
Paste text directly into the KB editor.

### 4.2 Structuring KB Documents

**Format matters!** Proper structure improves retrieval accuracy.

**For OpenAI models (GPT):** Use Markdown
```markdown
# Product X User Manual

## 1. Introduction
- Overview of Product X
- Key features and benefits

## 2. Getting Started
- Unboxing and setup
- Initial configuration

## 3. Troubleshooting
- Common issues and solutions
- Contacting support
```

**For Anthropic models (Claude):** Use XML tags
```xml
<ProductManual>
  <Section>
    <Title>1. Introduction</Title>
    <Subsection>Overview of Product X</Subsection>
    <Subsection>Key features</Subsection>
  </Section>
  <Section>
    <Title>2. Troubleshooting</Title>
    <Subsection>Common issues</Subsection>
  </Section>
</ProductManual>
```

### 4.3 Enhancing Searchability

Every document should include:

| Field | Purpose | Example |
|-------|---------|---------|
| **Document Description** | 2-3 sentence summary | "This doc outlines our return policy..." |
| **Tags** | Keywords for search | `customer-service, returns, refunds, policy` |

### 4.4 Adjusting KB Settings

**Max Chunks Retrievable:**
- Default: 3-4 chunks
- For >10 documents: Increase to 6 chunks
- Range: 1-10 chunks

**⚠️ Warning:** Higher chunks = more tokens = more credits consumed.

**Search Similarity Prompt:**
Customize how the AI generates search keywords. Must include `{chat_history}` variable.

**Example Search Similarity Prompt:**
```markdown
# You are an advanced AI tasked with generating relevant search keywords.
Use the chat history to create accurate keywords for searching our knowledge base.

## This is the chat history: {chat_history}

# Steps:
1. Analyze the chat history and context
2. Identify main themes, topics, and keywords
3. Generate a list of specific, relevant keywords

Output your list of keywords, separated by commas.
```

**Test with "Preview KB"** before going live.

### 4.5 Version History

KB documents include built-in version history:
- Review last saved versions
- See when versions were saved
- Restore older versions
- Identify who changed the document

---

## 5. Writing the System Prompt

The system prompt is the **most critical** part of your agent. It defines behavior, tone, and capabilities.

### 5.1 Critical Variables

**MUST include these variables in your prompt:**
- `{kb_context}` — Retrieved chunks from Knowledge Base
- `{about_context}` — Agent context/about info

Without these, the agent won't know the retrieved RAG data.

### 5.2 Customer Support System Prompt Template

```markdown
# ROLE
You are {agent_name}, the AI customer support assistant for {company_name}.
You help customers with questions about our products, services, policies, and troubleshooting.

# PERSONALITY & TONE
- Friendly, professional, and empathetic
- Use the customer's first name when known
- Keep responses concise but thorough
- Use emojis sparingly to add warmth
- Never make promises you can't keep

# KNOWLEDGE BASE
You have access to our knowledge base. Use the retrieved information to answer questions accurately.
{kb_context}
{about_context}

# CAPABILITIES
1. Answer product questions using the knowledge base
2. Help with troubleshooting steps
3. Explain policies (returns, refunds, shipping)
4. Escalate to human agents when needed
5. Collect feedback and ratings

# RULES
- Always check the knowledge base before answering factual questions
- If you don't know something, say so honestly — never make up information
- For complex technical issues or billing disputes, offer to connect with a human agent
- Never share sensitive customer data with other users
- Follow GDPR/privacy guidelines
- If a user is frustrated or angry, acknowledge their feelings and offer solutions

# ESCALATION TRIGGERS
Offer live handoff when:
- User explicitly asks for a human
- Issue requires account access or sensitive data
- Technical issue beyond knowledge base scope
- User expresses strong dissatisfaction
- Billing or refund disputes

# RESPONSE FORMAT
- Start with a brief acknowledgment
- Provide the answer using knowledge base info
- Offer follow-up help
- End with a friendly closing
```

### 5.3 Prompt Engineering Techniques

**Chain of Thought (CoT):**
Break complex problems into steps:
```markdown
When troubleshooting, follow these steps:
1. Identify the symptom
2. Check common causes from KB
3. Provide step-by-step solution
4. Ask if the issue is resolved
5. If not, escalate to human support
```

**Few-Shot Learning:**
Provide examples for the AI to learn from:
```markdown
Example interaction:
User: "My order hasn't arrived yet"
AI: "I understand your concern. Let me help you track your order. Could you please provide your order number? Once I have that, I can check the status for you."

Now respond to the user's actual query following this style.
```

### 5.4 Global Prompts (For Multi-Agent Consistency)

Create reusable prompt templates shared across agents:

**Use Cases:**
- Company-wide brand voice guidelines
- Legal/compliance rules (GDPR, CCPA)
- Industry-specific knowledge (healthcare, finance)
- Seasonal campaign messaging
- Handoff protocols

**Limits:**
- Max 10 global prompts per agent
- Changes apply immediately to all assigned agents
- Appended to base system prompt at runtime

---

## 6. Configuring Initial Messages

### 6.1 Initial Message (Simple)

Set predefined starter messages that appear when a user opens the chat.

**Features:**
- Add multiple variants (random one shown each time)
- Generate variants using AI
- Markdown support

**Example Variants:**
```markdown
Variant 1:
Hi! I'm **SupportBot** from {company_name}. I'm here to help with any questions about our products, orders, or policies. What can I assist you with today? 🚀

Variant 2:
Hello there! 👋 Welcome to {company_name}. I'm your AI assistant, ready to answer questions and guide you through our services. How can I help?

Variant 3:
Greetings! This is the **{company_name} AI assistant**. I'm here to help you with any information you need. Feel free to ask your questions! 🌟
```

### 6.2 Initial Prompt (Advanced)

Overrides the initial message and instructs the AI on what to write as the first message. More powerful and flexible.

**Max characters:** 10,000

**Example for Customer Support:**
```markdown
Greet the user warmly with their name if available. 
Introduce yourself as {company_name}'s AI support assistant.
Mention that you can help with:
- Product questions
- Order status
- Troubleshooting
- Policy inquiries

Generate 3 helpful buttons they might want to click:
1. "Track My Order"
2. "Product Support"
3. "Talk to a Human"
```

**⚠️ Warning:** Enabling UI Engine increases credit usage.

---

## 7. Agent Settings Deep Dive

Navigate to your agent's **Settings** tab.

### 7.1 Core Settings

| Setting | Description | Recommendation |
|---------|-------------|----------------|
| **Enable/Disable Agent** | Toggle operational status | Keep enabled for production |
| **Scroll Animation** | Smooth scrolling during responses | Enable for better UX |
| **Record Transcripts** | Save all interactions | Enable for analytics |
| **Sound Effects** | Play notification sounds | Enable for engagement |
| **Forget Chat History** | Don't persist history on user device | Disable for continuity |
| **Autostart With Popup** | Auto-open widget on page load | **Disable** to save credits |
| **Proactive Message** | Welcome message on load | Use 1-line message instead of autostart |
| **Chat End Message** | Message when chat ends | "Thanks for chatting! Rate your experience" |
| **AI Introduction Message** | Initial message | Must declare AI per Meta requirements |

### 7.2 Advanced Settings

| Setting | Default | Purpose |
|---------|---------|---------|
| **Message Delay** | 1000ms | Delay between messages |
| **User Input Delay** | 6000ms | Wait time before submitting final query |
| **Monthly Interactions Limit** | 0 (unlimited) | Cap monthly usage |
| **Interactions per User** | 0 (unlimited) | Limit per user session |
| **Monthly AI Tokens Limit** | 0 (unlimited) | Cap token usage |
| **Credits Limit** | 0 (unlimited) | Monthly/annual credit cap |
| **Prefer HTTP** | Off | Use HTTP instead of websockets |
| **Enable Handoff Popup** | Off | Show handoff UI |
| **Fixed Handoff Popup** | Off | Always show handoff button |
| **Always Show Handoff** | Off | Show regardless of availability |
| **Enable AI Translation** | Off | Requires OpenAI API key |
| **Speech-to-Text** | Off | Voice input (1 credit per request) |
| **Quick Upload Button** | Off | Allow file attachments |

### 7.3 Custom CSS

Override default styling:

```css
/* Change chat window size */
#vg-mother-container {
  width: 400px !important;
  height: 600px !important;
}

/* Reposition widget */
.vg-root {
  bottom: 20px !important;
  right: 20px !important;
}

/* Hide proactive popup */
.vg-proactive-message--container {
  display: none !important;
}

/* Customize action buttons */
.vg-action-btn {
  background-color: #0078d7 !important;
  color: white !important;
  font-size: 16px !important;
}

/* Hide end-of-chat ratings */
.vg-chat-end {
  display: none !important;
}
```

---

## 8. Tools & Integrations

Tools (functions) let your agent perform actions beyond just answering questions.

### 8.1 Default Tools

| Tool | Purpose | Warning |
|------|---------|---------|
| **KB-Search** | Queries knowledge base | Don't modify — breaks core functionality |
| **Live-Handoff** | Transfers to human agent | Don't modify — breaks core functionality |

### 8.2 Creating Custom Tools

**Step 1:** Go to Tools tab → "+ New Tool"

**Step 2:** Choose type:
- Create custom tool
- Select from preset templates (SendEmail, etc.)

**Step 3:** Configure settings:

| Field | Description | Example |
|-------|-------------|---------|
| **Server URL** | Webhook endpoint | `https://hook.eu2.make.com/...` |
| **Server Key** | Authentication key | `fws5j13b27tq93nrp...` |
| **Tool Description** | What the tool does | "Send an email to the user" |

**Step 4:** Define parameters:

| Parameter | Description |
|-----------|-------------|
| **Parameter Key** | Short name (e.g., `to`, `subject`, `html`) |
| **Default Value** | Preset value (optional) |
| **Type** | String, Number, Boolean |
| **Body or Header** | Where parameter goes in request |
| **Description** | Clear explanation for the LLM |

**Step 5:** Save and test with "Preview LLM"

**Step 6:** Assign tool to your agent

### 8.3 System Prompt Integration for Tools

Tell the agent WHEN and HOW to use each tool:

```markdown
# TOOL INSTRUCTIONS

You have access to the following tools:

1. **sendEmail** — Send an email to the user
   Use when: User requests email confirmation, asks for documentation, or wants follow-up via email
   Parameters needed:
   - to: User's email address
   - subject: Email subject line
   - html: Email body content
   Always confirm the email address with the user before sending.

2. **createSupportTicket** — Create a support ticket in our system
   Use when: Issue cannot be resolved immediately, requires investigation, or needs specialist attention
   Parameters needed:
   - customerName: Full name
   - email: Email address
   - issueDescription: Detailed problem description
   - priority: low, medium, high, urgent
   Always provide the ticket number to the user.

3. **scheduleCallback** — Schedule a callback from a human agent
   Use when: User prefers phone contact, issue is complex, or user is frustrated
   Parameters needed:
   - customerName: Full name
   - phoneNumber: Phone number with country code
   - preferredDate: YYYY-MM-DD format
   - preferredTime: HH:MM format
   - reason: Brief reason for callback
   Always confirm all details before scheduling.
```

### 8.4 Native Integrations

#### Google Calendar
- **Setup:** Integrations → Google Calendar → Connect → Grant permissions
- **Use:** Check availability, book appointments, send invites
- **Best for:** Scheduling support calls, demo bookings

#### Google Sheets
- **Setup:** Integrations → Google Sheets → Connect → Select sheet
- **Use:** Log leads, track support tickets, manage customer data
- **Best for:** Lead capture, data logging, CRM workflows

#### Gmail
- **Setup:** Integrations → Functions → Gmail → Connect
- **Use:** Read incoming emails, auto-reply, manage support inbox
- **Config:** Reply delay, when to reply, tone, length

#### Calendly
- **Setup:** Integrations → Calendly → Connect → Select event types
- **Use:** Show availability, provide booking links
- **Methods:** `list_event_types`, `check_availability`, `list_scheduled_events`

#### Airtable
- **Setup:** Integrations → Airtable → Connect → Select bases
- **Use:** Full CRUD operations on records
- **Methods:** `read`, `create`, `update`, `upsert`

#### Shopify
- **Setup:** Create Shopify app → Configure scopes (read_orders, read_products, read_product_listings) → Connect in ConvoCore
- **Use:** Check order status, browse products (read-only)
- **Best for:** E-commerce customer support

---

## 9. Live Handoff to Human Agents

### 9.1 Setting Up Handoff

**Step 1:** Agent Settings → Enable "Enable handoff popup"

**Step 2:** (Optional) Enable "Fixed handoff popup" for persistent button

**Step 3:** Assign agent to an Organization (for client dashboard access)

**Step 4:** Create a user who can access the client dashboard

### 9.2 How Handoff Works

**For Users:**
- Click "Talk to a Human" or handoff popup
- Wait for human agent to accept
- If no response, user can submit a form with email and message

**For Agents (Dashboard):**
- Hear ringing sound + notification when handoff requested
- Click notification or find conversation marked with "!"
- Click "Handle chat" to take over
- Click "Pass Chat to AI" to return control

### 9.3 Managing Notifications

Configure in client dashboard:
- **Channel:** Email or browser push notification
- **Events:** All messages or requests only

### 9.4 Best Practices

- Respond to handoff requests promptly
- Inform users when taking over from AI
- Establish team protocols for shift coverage
- Monitor conversation tab for intervention opportunities

---

## 10. Lead Qualification Funnel

Automatically score leads and trigger notifications based on conversation quality.

### 10.1 How It Works

1. **Conversation Analysis** — Evaluates after each AI response
2. **Score Calculation** — Assigns points based on completed qualification steps
3. **Notification Trigger** — Sends email when threshold is met

### 10.2 Setting Up

**Step 1:** Agent → Prompt tab → "Lead Scoring & Funnel" → Enable

**Step 2:** Define Qualification Steps (must total exactly 100 points):

| Step Name | Points | Description |
|-----------|--------|-------------|
| Contact Info Collected | 15 | User provided email or phone |
| Budget Disclosed | 20 | User mentioned budget range |
| Timeline Confirmed | 20 | User specified when they need solution |
| Use Case Explained | 15 | User described their problem/need |
| Decision Authority | 15 | User confirmed they can make purchase decisions |
| Product Interest Shown | 15 | User asked about specific products/features |

**Step 3:** Configure Notifications:
- Enable email notifications
- Set trigger: Score threshold (e.g., 70) OR specific steps completed
- Add recipients (workspace members or custom emails)
- Toggle "Require contact info" before sending

**Step 4:** (Optional) Use AI Assist to auto-generate steps based on your system prompt

### 10.3 System Prompt Integration

When enabled, qualification criteria are automatically added to your system prompt, helping the AI naturally gather information during conversation.

### 10.4 Whitelabel Branding

For agency clients, notifications automatically use your branding:
- Agency logo and colors
- Custom domain in conversation links
- Agency email sender address
- Your business address in footer

**Prerequisites:**
1. Agency account created
2. Theme configured (logo, colors, company name)
3. Custom domain setup
4. Email domain configured

---

## 11. UI Engine for Rich Interactions

The UI Engine lets your agent create interactive elements beyond text.

**⚠️ Experimental feature — test thoroughly before production use.**

### 11.1 Enabling UI Engine

Agent → Prompts tab → Check "UI Engine" checkbox → Save

### 11.2 Available Components

#### Buttons
```markdown
Generate three buttons:
1. "Track My Order"
2. "Browse Products"
3. "Talk to a Human"
```

#### Cards
```markdown
Create a card with:
- Title: "Premium Support Plan"
- Description: "Get priority support with 24/7 availability"
- Button: "Learn More"
```

#### Carousels
```markdown
Generate a carousel of 3 product cards. Each card should have:
- Product image [URL]
- Product name
- Price
- "Add to Cart" button
```

#### Forms & Inputs
```markdown
Create a contact form with:
- Name (text input)
- Email (email input)
- Issue (text area)
- Submit button
```

#### Images
```markdown
Display an image:
URL: https://example.com/product-image.jpg
```

#### iFrames
```markdown
Show this YouTube video:
<iframe width="400" height="200" src="https://www.youtube.com/embed/..." frameborder="0" allowfullscreen></iframe>
```

### 11.3 Best Practices

- Mix text with UI components for balanced interactions
- Use components relevant to conversation context
- Start with essential info, then enhance with UI
- Test structured instructions vs. creative freedom
- **Claude 3.5 Sonnet** is best for generating UI elements

### 11.4 Credit Impact

UI Engine increases credit consumption per response due to additional instructions. Monitor usage in the Usage tab.

---

## 12. Multi-Channel Deployment

### 12.1 Website Deployment

#### Popup Widget (Recommended)
```html
<div id="VG_OVERLAY_CONTAINER"></div>
<script defer>
    (function() {
        window.VG_CONFIG = {
            ID: "YOUR_AGENT_ID",
            region: 'eu', // or 'na'
            render: 'bottom-right',
            stylesheets: [
                "https://vg-bunny-cdn.b-cdn.net/vg_live_build/styles.css",
            ],
        }
        var VG_SCRIPT = document.createElement("script");
        VG_SCRIPT.src = "https://vg-bunny-cdn.b-cdn.net/vg_live_build/vg_bundle.js";
        VG_SCRIPT.defer = true;
        document.body.appendChild(VG_SCRIPT);
    })()
</script>
```

#### Embedded Chat
```html
<div style="width: 500px; height: 500px;" id="VG_OVERLAY_CONTAINER"></div>
<!-- Same script as above, but render: 'full-width' -->
```

#### iFrame
```html
<iframe
    src="https://convocore.ai/app/eu/render/YOUR_AGENT_ID/iframe"
    style="width: 100%; height: 100vh;"
    frameborder="0">
</iframe>
```

#### Advanced Configuration
```javascript
window.VG_CONFIG = {
  ID: "YOUR_AGENT_ID",
  region: 'eu',
  render: 'bottom-right',
  user: {
    name: "John Doe",
    email: "johndoe@example.com",
    phone: "+1234567890",
  },
  userID: "CUSTOM_USER_ID",
  autostart: true,
  stylesheets: [
    "https://vg-bunny-cdn.b-cdn.net/vg_live_build/styles.css",
  ],
}
```

**Platform-Specific Guides:**
- **Shopify:** Add to `theme.liquid` before `</body>`
- **WordPress:** Use "Insert Headers and Footers" plugin or edit `footer.php`
- **Wix:** Use Custom Code feature in Editor
- **Webflow:** Add to "Custom Code" in page settings
- **Squarespace:** Use Code Injection feature

### 12.2 WhatsApp Integration

**Prerequisites:** Facebook Business account, WhatsApp Business API

**Steps:**
1. Create Facebook App (developers.facebook.com)
2. Add WhatsApp product to app
3. Paste callback URL and verify token from ConvoCore → Channels → WhatsApp
4. Subscribe to "messages" webhook field
5. Generate permanent access token via business.facebook.com
6. Copy Phone Number ID, Business Account ID, and token to ConvoCore
7. Test by sending message to WhatsApp number

**Meta Rules:**
- Must declare AI interaction to users
- Must declare when human takes over
- 24-hour messaging window applies
- Enable 2FA on Facebook and Instagram accounts
- Instagram buttons may not work on web — use mobile app for testing

### 12.3 Facebook & Instagram (Meta Channels)

**Steps:**
1. Create Facebook Page
2. Connect Instagram Business account to same Facebook Page
3. In ConvoCore: Channels → Connect Meta Channels → Continue with Meta
4. Select same business portfolio
5. Choose Facebook Page and Instagram Page
6. Verify connection

### 12.4 Discord Integration

**Steps:**
1. ConvoCore → Channels → Discord → Connect
2. Click "Add to Discord" → Select server → Grant permissions
3. In Discord: Channel → Integrations → Webhooks → New Webhook → Copy URL
4. Paste webhook URL in ConvoCore
5. Right-click channel → Copy Channel ID → Paste in ConvoCore
6. Test with `ping` command

### 12.5 Telegram Integration

**Steps:**
1. Open Telegram → Search "@BotFather" → Send `/newbot`
2. Set name and username (must end in 'bot')
3. Save the bot token
4. Send `/start` to activate bot
5. ConvoCore → Channels → Telegram → Paste token → Save & Test

### 12.6 Voice (Twilio)

**Steps:**
1. ConvoCore → Voice Setup → Phone Numbers
2. Purchase or view available Twilio numbers
3. Click "Assign" to connect to your agent
4. Cost: ~10 credits/minute (~$0.083/min)

### 12.7 Web Calling

1. Voice Setup → Advanced & Settings → Enable "Web Calling"
2. Widget will show Call Button
3. Deploy widget using standard script

---

## 13. Analytics & Monitoring

### 13.1 Key Metrics

| Metric | What It Shows |
|--------|---------------|
| **Monthly Interactions** | Total interactions over time |
| **AI Tokens Usage** | Cost optimization tracking |
| **Total Conversations** | Distinct chat sessions |
| **Avg Messages per Chat** | Conversation depth |
| **Avg Seconds per Chat** | Efficiency measure |
| **User Retention** | Messages before users leave |
| **Time Retention** | Duration of engagement |
| **GeoAnalytics** | Geographic distribution of users |

### 13.2 Time Range Selection

- Presets: Last 1 hour, 24 hours, 7 days, 30 days, 90 days, 1 year
- Custom date ranges

### 13.3 Custom Metric Charts

Create personalized dashboards:
- **Line Charts** — Trends over time
- **Bar/Column Charts** — Comparisons
- **Pie/Donut Charts** — Proportions
- **Number Charts** — Single KPIs

### 13.4 Handoff Analytics

| Metric | Description |
|--------|-------------|
| **Total Accepted Handovers** | Handoffs accepted by live agents |
| **Average Response Time** | Time to respond to customer messages |
| **Average Handling Time (AHT)** | Duration from acceptance to completion |

Tracks per-agent and per-organization performance.

### 13.5 Agent Tester

Automatically test your agent with AI-driven conversations:

**Test Modes:**
- Full Test (all features)
- Prompt Only
- Prompt + Tools
- Prompt + KB

**Results:**
- Quality Score (out of 10)
- Response Quality ✅/⚠️/❌
- Tool Usage analysis
- KB Accuracy analysis
- Conversation Flow assessment
- Actionable recommendations

**Credit Cost:** Uses gemini-2.5-flash pricing (very affordable)

---

## 14. Voice Capabilities

### 14.1 Features

- **Real-Time Transcription** (Deepgram, AssemblyAI)
- **Speech Generation** (ElevenLabs, Google Cloud, OpenAI)
- **Phone Integration** (Twilio)
- **Web Calling** (browser-based)
- **Advanced Settings** (Patience Factor, Background Noise, Call Recording)

### 14.2 Voice Pricing Breakdown

| Component | Cost Range |
|-----------|------------|
| Platform Fee | $0.03/min |
| Speech-to-Text | $0.0088 – $0.0143/min |
| Text-to-Speech | $0.0110 – $0.0770/min |
| LLM | Varies (bring own keys to save 20x) |
| Telephony (Twilio) | $0.01 – $0.02/min |

**Budget Config:** ~$0.052/min ($5.20 per 100 min)
**Premium Config:** ~$0.090/min ($9 per 100 min)

### 14.3 Google Gemini Live

All-in-one voice solution:
- Google Gemini Live: $0.02/min
- ConvoCore Platform: $0.03/min
- **Total without phone:** $0.05/min ($5 per 100 min)
- **Total with Twilio:** $0.06-0.07/min ($6-7 per 100 min)

---

## 15. Canvas for Advanced Flows

Canvas is a visual flow builder for complex agent scenarios.

### 15.1 Why Use Canvas?

- Single prompt + limited tools = basic agents
- **Canvas = multiple prompts + multiple tools + conditional logic**

### 15.2 Node Types

| Node Type | Purpose |
|-----------|---------|
| **Start Node** | Entry point (one per flow) |
| **Default Nodes** | Operations/decision points |
| **End Nodes** | Conversation endpoints |
| **Global Nodes** | Reusable across entire flow |

### 15.3 Node Configuration

Each node has:
- **Overview** — Name, description, instructions
- **LLM Configuration** — Temperature, max tokens, rewind level
- **Tools Integration** — Connect APIs/webhooks
- **Knowledge Base** — Enable RAG, set chunk count
- **Router Configuration** — Conditional branching logic

### 15.4 Key Parameters

| Parameter | Range | Effect |
|-----------|-------|--------|
| **Temperature** | 0-1 | 0.1 = precise, 0.9 = creative |
| **Max Tokens** | 1-∞ | Response length limit |
| **Rewind Level** | 0-3 | How many previous nodes to reference |

### 15.5 Variables

Store and pass data across nodes:
- Create in Variable Drawer
- Use `{` shortcut in Text Editor
- Mark as Global for cross-node access

### 15.6 Example: Customer Support Flow

```
[Start Node] → "Greet user, identify issue type"
    ↓
[Router] → Issue category?
    ├── Product Question → [KB Node] → Search KB → Answer
    ├── Order Issue → [Shopify Tool Node] → Check order → Respond
    ├── Technical Problem → [Troubleshoot Node] → Steps → Resolved?
    │                                    ↓
    │                               Yes → [End Node]
    │                               No → [Handoff Node]
    └── Billing → [Handoff Node] → Connect to human
```

---

## 16. Pricing & Credits

### 16.1 Simple Pricing

**1 USD = 1,000 Credits**

### 16.2 Plans

| Plan | Price | Key Features |
|------|-------|--------------|
| **Free** | $0 | 5 agents, all channels, basic analytics, live handoff |
| **Pay as You Go** | $20/month + usage | 100 agents, $5 free credits, remove branding, BYO API keys, priority support |
| **Enterprise** | $1,000+/month | Custom features, on-premise, no markup on provider costs, dedicated support |

### 16.3 Add-ons

| Add-on | Price |
|--------|-------|
| Whitelabel | $200/month |
| Workspace seat | $10/month |
| Client seat | $15/month |
| Concurrent call line | $5/month |
| Twilio phone number | $3/month |

### 16.4 Credit Usage

| Feature | Cost |
|---------|------|
| Each interaction | $0.001 |
| Custom channel fee | $0.001 |
| Page crawled | $0.001 |
| Speech-to-Text | $0.0088-0.0143/min |
| Text-to-Speech | $0.0110-0.0770/min |

### 16.5 LLM Pricing (Per 1K Tokens)

**Budget Models:**
- GPT-4o Mini: $0.001 input / $0.001 output
- Gemini 2.5 Flash: $0.0008 input / $0.0015 output
- Claude 3.5 Haiku: $0.001 input / $0.005 output

**Premium Models:**
- GPT-4o: $0.003 input / $0.012 output
- Claude 3.5 Sonnet: $0.004 input / $0.018 output
- Claude Opus 4: $0.019 input / $0.095 output

**💡 Pro Tip:** Bring your own API keys (OpenAI, Anthropic, Google) to save up to 20x on LLM costs. Available on Pay as You Go+.

### 16.6 Affiliate Program

Earn **30% lifetime commission** on all referral purchases.

---

## 17. Optimization & Best Practices

### 17.1 Credit Optimization

**Two changes that saved one user 95% of credits:**

1. **Use Latest Widget Code** (`vg-bunny-cdn.b-cdn.net` instead of legacy CDN)
2. **Disable Autostart & Initial Prompt**
   - Autostart costs 1 credit per visit
   - Initial prompt can cost up to 50 credits per visit if long

### 17.2 Knowledge Base Best Practices

- Structure documents with clear headings
- Add descriptions and tags to every document
- Use 3-4 chunks for small KBs, 6+ for large KBs
- Preview KB before going live
- Maintain version history

### 17.3 Prompt Best Practices

- Always include `{kb_context}` and `{about_context}`
- Use Chain of Thought for complex tasks
- Provide few-shot examples for specific formats
- Keep prompts concise to preserve token budget
- Test with Agent Tester before deployment

### 17.4 Customer Support Specific Tips

- Set temperature to 0.2-0.3 for factual, consistent responses
- Enable handoff for billing/sensitive issues
- Use lead qualification to identify hot prospects
- Configure proactive messages to engage visitors
- Monitor analytics for common questions → add to KB
- Set up tools for common actions (check order, book call, create ticket)

### 17.5 Multi-Channel Tips

- Customize tone per channel (more formal for email, casual for chat)
- Instagram: Test on mobile app (web buttons may not work)
- WhatsApp: Be mindful of 24-hour messaging window
- Meta: Must declare AI interaction to users
- Voice: Keep responses under 30 seconds, use conversational language

---

## 18. Troubleshooting

### 18.1 Common Issues

| Issue | Solution |
|-------|----------|
| Agents not showing | Check region in URL/header, clear cache |
| Widget hidden behind elements | Set z-index to 9999 in custom CSS |
| WhatsApp not connecting | Verify Business ID, refresh token, check number status |
| Custom domain fails | Check DNS records, wait 24h for propagation |
| KB not working | Ensure `{chat_history}` is in search similarity prompt |
| Tools not triggering | Verify tool is assigned to agent, check system prompt instructions |
| High credit usage | Disable autostart, use latest widget code, bring own API keys |
| Agent not following global prompt | Check for conflicts, verify assignment, start fresh conversation |

### 18.2 Support Resources

- **Email:** support@convocore.ai
- **Discord:** [Join Discord](https://discord.com/invite/5zvdYwhZa7)
- **Documentation:** [docs.convocore.ai](https://docs.convocore.ai)

---

## Quick Reference: Customer Support Agent Setup Checklist

### Phase 1: Foundation
- [ ] Create agent (choose text + voice if needed)
- [ ] Select model (GPT-4o or Claude 3.5 Sonnet recommended)
- [ ] Design appearance (colors, fonts, avatars)
- [ ] Write system prompt (include `{kb_context}`, `{about_context}`)
- [ ] Set up initial message variants

### Phase 2: Knowledge
- [ ] Upload support docs, FAQs, policies
- [ ] Scrape help center website URLs
- [ ] Add descriptions and tags to all docs
- [ ] Adjust KB settings (3-6 chunks)
- [ ] Test with Preview KB

### Phase 3: Tools
- [ ] Connect Google Calendar (for scheduling)
- [ ] Connect Google Sheets (for lead logging)
- [ ] Set up Shopify/Airtable if e-commerce
- [ ] Create custom tools (support ticket, email, callback)
- [ ] Add tool instructions to system prompt
- [ ] Test tools with Preview LLM

### Phase 4: Handoff
- [ ] Enable handoff popup
- [ ] Set up organization and user access
- [ ] Configure notifications (email/push)
- [ ] Train team on handoff workflow

### Phase 5: Lead Qualification
- [ ] Enable Lead Scoring & Funnel
- [ ] Define qualification steps (total = 100 points)
- [ ] Set notification threshold (e.g., 70 points)
- [ ] Add notification recipients
- [ ] Test with low threshold

### Phase 6: Deployment
- [ ] Deploy website widget (popup or embedded)
- [ ] Connect WhatsApp (if needed)
- [ ] Connect Meta channels (if needed)
- [ ] Connect Discord/Telegram (if needed)
- [ ] Set up voice/Twilio (if needed)
- [ ] Test on all channels

### Phase 7: Monitoring
- [ ] Review analytics daily (first week)
- [ ] Check conversation quality
- [ ] Monitor handoff metrics
- [ ] Track lead qualification scores
- [ ] Optimize KB based on missed questions
- [ ] Run Agent Tester regularly

---

> **This guide was compiled from the complete ConvoCore documentation at docs.convocore.ai. For the latest updates, always refer to the official docs.**
