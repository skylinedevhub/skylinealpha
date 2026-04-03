# Chatbot → Site Generation → Email Pipeline

**Date:** 2026-04-03
**Status:** Approved
**Scope:** Priority feature for skylinealpha (skylinedevhub.vercel.app)

## Problem

Skyline DevHub needs to convert site visitors into leads by demonstrating value immediately. Albanian businesses without websites need to see what their online presence *could* look like. The existing AlbWeb v2 project proved that LLM-generated single-page sites (Tailwind CDN, GSAP, Alpine.js, bilingual) are indistinguishable from $3-5K agency builds.

## Solution

A chatbot integrated into the Skyline site's Contact section collects business information through conversation, then generates and emails a free prototype site within 24 hours.

## User Flow

1. Customer visits skylinedevhub.vercel.app, scrolls through the WebGL experience
2. Reaches Contact section (page overlay 4)
3. Clicks **"Get Your Free Site"** CTA (new second button below existing contact CTA)
4. Contact card transitions to chatbot card (same frosted-glass split-screen style)
5. AI chatbot asks about their business: name, category, services, location, hours, description, style preferences
6. Customer provides email address and contact info
7. Chatbot confirms: "Your free site preview will arrive within 24 hours"
8. Behind the scenes: lead saved → site generated → deployed → emailed

## Architecture

```
┌─────────────────────────────────────────────────┐
│              skylinealpha (Next.js 15)           │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐ │
│  │ Contact  │→ │ Chatbot  │→ │ Thank You     │ │
│  │ Card     │  │ Card     │  │ Card          │ │
│  │ (+CTA)   │  │ (AI SDK) │  │               │ │
│  └──────────┘  └────┬─────┘  └───────────────┘ │
│                      │                           │
│  ┌───────────────────┴───────────────────────┐  │
│  │              API Routes                    │  │
│  │                                            │  │
│  │  /api/chat        Streaming AI conversation│  │
│  │  /api/leads       Save lead to Supabase    │  │
│  │  /api/generate    Generate HTML + deploy   │  │
│  │  /api/cron/leads  Fallback processor       │  │
│  │                                            │  │
│  │  /demo/[slug]     Serve generated HTML     │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
└──────────────┬──────────┬──────────┬─────────────┘
               │          │          │
        ┌──────┴──┐  ┌────┴───┐  ┌──┴──────┐
        │Supabase │  │ Vercel │  │ Resend  │
        │ (leads) │  │  Blob  │  │ (email) │
        └─────────┘  │ (HTML) │  └─────────┘
                      └────────┘
```

## Frontend Components

### 1. Contact Card Modification

Add a second CTA button to the existing Contact page overlay (page 4):

```
[existing contact content]
[existing CTA: "Back to Top"]
[new CTA: "Get Your Free Site →"]  ← triggers card transition
```

### 2. Chatbot Card (`components/ChatbotCard.tsx`)

- Client component using AI SDK's `useChat` hook
- Styled to match the existing `.text-card` frosted-glass design
- Grayscale color scheme, DM Mono font, uppercase labels
- Replaces the Contact card with a slide/fade transition
- Message bubbles: user messages right-aligned, AI messages left-aligned
- Input field at the bottom with send button
- Minimal: no avatar, no typing indicator animation beyond a simple "..." 
- When the AI calls the `saveLead` tool, transition to Thank You state

### 3. Thank You Card

- Same frosted-glass card style
- Confirms: email address, "your preview arrives within 24 hours"
- CTA to return to the main site scroll

### 4. Demo Route (`app/demo/[slug]/page.tsx`)

- Dynamic route that fetches generated HTML from Vercel Blob
- Serves as a full-page HTML document (no Next.js chrome)
- URL pattern: `skylinedevhub.vercel.app/demo/rrushi-i-arte`

## Backend

### API Route: `/api/chat`

- Vercel AI SDK `streamText` with Claude as initial provider
- System prompt instructs Claude to:
  - Act as a friendly Skyline DevHub representative
  - Collect: business name, category (from predefined list), services/offerings, location/city, business hours, contact phone, brief description, any style preferences
  - Be conversational but efficient (aim for 5-8 exchanges)
  - Call the `saveLead` tool when all required fields are collected
- Tool definition: `saveLead` with structured schema matching the leads table
- Bilingual: responds in the language the customer uses

### API Route: `/api/leads`

- POST endpoint called by the chatbot's `saveLead` tool handler
- Validates and saves to Supabase `leads` table
- Sets status to `pending`
- Triggers `/api/generate` asynchronously (fire and forget)

### API Route: `/api/generate`

- Accepts a lead ID
- Fetches lead data from Supabase
- Selects category design system prompt
- Calls Claude with: business data + design system prompt → complete HTML output
- Stores HTML in Vercel Blob
- Updates lead with `demo_url` and status `generated`
- Sends email via Resend with the demo URL
- Updates status to `delivered`

### API Route: `/api/cron/leads`

- Runs every 30 minutes via Vercel Cron
- Finds leads with status `pending` older than 10 minutes (generation trigger failed)
- Re-triggers generation for each
- Also retries `generated` leads where email sending failed

## Data Model

### Supabase: `leads` table

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| slug | text | URL-safe business identifier (unique) |
| business_name | text | Business name |
| category | text | One of: restaurant, auto_service, beauty_salon, dental_clinic, construction, retail, hotel, generic |
| services | text[] | List of services/offerings |
| location | text | City/address |
| hours | text | Business hours description |
| phone | text | Contact phone |
| description | text | Brief business description |
| style_preferences | text | Any style notes from conversation |
| email | text | Customer email |
| contact_name | text | Customer name |
| contact_info | jsonb | Additional contact details |
| demo_url | text | Generated demo URL |
| blob_url | text | Vercel Blob storage URL |
| status | text | pending → generating → generated → delivered → failed |
| conversation_id | text | Chat session reference |
| created_at | timestamptz | When lead was created |
| updated_at | timestamptz | Last status change |

### Status Flow

```
pending → generating → generated → delivered
                ↓           ↓
              failed      failed
```

## Design System Prompts

Stored in `lib/prompts/categories/` as TypeScript template functions. Each prompt:

1. Defines the visual identity: color palette, typography pairing, layout structure
2. Specifies required sections: hero, about, services/menu, testimonial, gallery, contact/location, footer
3. Includes technical constraints: Tailwind v4 CDN, GSAP + ScrollTrigger, Alpine.js, Google Fonts, Unsplash images
4. Accepts business data as structured input
5. Outputs complete, self-contained HTML

Categories to create (MVP):
- Restaurant
- Auto Service  
- Beauty Salon
- Dental Clinic
- Construction Materials
- Generic (fallback for uncategorized businesses)

Reference output: https://site-v2-omega-indol.vercel.app/ (5 example sites)

## Email Template

Sent via Resend. Simple, on-brand:

- Subject: "Your free site preview is ready — {business_name}"
- Body: brief intro, prominent link to demo URL, note that this is a preview, CTA to reply for questions
- Matches Skyline grayscale aesthetic

## External Services

| Service | Purpose | Setup |
|---------|---------|-------|
| **Supabase** | Leads database | New project or existing, `leads` table migration |
| **Vercel Blob** | Generated HTML storage | `@vercel/blob`, env var `BLOB_READ_WRITE_TOKEN` |
| **Resend** | Transactional email | `resend` package, env var `RESEND_API_KEY` |
| **Anthropic (via AI SDK)** | Chat + generation | `@ai-sdk/anthropic`, env var `ANTHROPIC_API_KEY` |

## Out of Scope (Future)

- Local model support
- Customer dashboard / login
- Site editing after generation
- Payment / upsell flow
- Analytics on generated sites
- Multiple design iterations per lead
- Social media scraping for enrichment
- Multi-page generated sites
