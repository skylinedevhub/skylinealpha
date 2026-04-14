# Skyline DevHub

Company website for **Skyline DevHub** — an AI-native development company engineering the digital future of Albanian business. Built with Next.js App Router, WebGL scroll-driven animation, bilingual i18n, and an AI-powered lead capture chatbot.

**Production:** [skylinedevelopmenthub.com](https://skylinedevelopmenthub.com)

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Design System](#design-system)
- [WebGL Shader Engine](#webgl-shader-engine)
- [Interaction Model](#interaction-model)
- [Internationalization (i18n)](#internationalization-i18n)
- [Chatbot & Lead Pipeline](#chatbot--lead-pipeline)
- [Contact Form](#contact-form)
- [Legal Pages](#legal-pages)
- [Testing](#testing)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)

---

## Overview

The site is a single-page experience with five scroll-driven WebGL scenes, a decoupled pagination overlay system, and an AI chatbot that captures project briefs and general inquiries. All content is bilingual (Albanian default, English) and statically generated at build time.

### Key features

- **WebGL raymarched SDF shapes** — 5 procedurally animated 3D scenes driven by scroll position
- **Two-axis interaction** — scroll controls shape morphing; pagination controls content overlays (independent of each other)
- **AI chatbot** — two conversational flows (project brief intake, general inquiry) powered by Gemini 2.5 Flash via the Vercel AI SDK
- **Structured lead extraction** — chat transcripts are parsed into structured briefs via Gemini + Zod schema, then emailed via Resend
- **Contact form** — structured inquiry form (service, company size, budget, email, message) funneled through the same lead pipeline
- **Bilingual** — Albanian (default) and English with middleware-based locale detection
- **Dark/light theme** — respects system preference, toggle syncs CSS variables and WebGL background
- **Monotone grayscale** — no chromatic color anywhere in CSS or shader
- **Case study carousel** — paginated showcase with challenge/solution/results structure
- **Static generation** — both locale pages pre-rendered at build time via `generateStaticParams`
- **Legal compliance** — privacy policy, terms of service, GDPR compliance, and security pages

---

## Architecture

```
                    +----------------------------------+
                    |         WebGL Canvas (z:0)        |
                    |  Raymarched SDF shapes, grayscale |
                    |  Driven by scroll position        |
                    +----------------------------------+
                                    |
          +-------------------------+-------------------------+
          |                         |                         |
+-----------------+   +----------------------+   +--------------------+
| Scroll Cards    |   |   Page Overlays      |   |   Chrome (z:10)    |
| (z:3)           |   |   (z:2)              |   |   Nav, HUD, dots,  |
| Scene-tracking  |   |   Full content       |   |   theme toggle,    |
| summary + CTA   |   |   panels             |   |   lang toggle,     |
| Visible during  |   |   Visible when       |   |   credit, footer   |
| scroll          |   |   page is opened     |   +--------------------+
+-----------------+   +----------------------+
                                    |
                    +----------------------------------+
                    |      ChatBot overlay (z:20)      |
                    |  AI chat (build / inquiry flows)  |
                    |  Streams via /api/chat (Gemini)   |
                    |  Submits leads via /api/lead      |
                    +----------------------------------+
```

### Two independent control axes

| Axis | Input | Controls | State |
|------|-------|----------|-------|
| **Scroll** | Wheel / touch | Shape morphing (5 SDF scenes), HUD, scroll cards | `tgt`, `smooth`, `velocity` |
| **Pagination** | Click (dot / CTA / nav) | Page overlay visibility, shape horizontal pan | `activePage`, `targetOff`, `smoothOff` |

Scroll never affects pagination. Pagination never affects scroll. Scrolling while a page is open closes the page.

### Rendering model

- **Server-rendered content** — `page.tsx` is an async server component. All text comes from the i18n dictionary for the current locale. HTML is pre-rendered at build time.
- **Client-side hydration** — `SkylineEngine` attaches WebGL, scroll handling, and pagination to the server-rendered DOM in a `useEffect`. It finds elements by `id` / `className` / `querySelector` and manipulates them imperatively.
- **Legal pages** — separate routes under `app/[locale]/legal/` with their own layout. No WebGL.

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
npm install
```

### Environment

Create `.env.local` at the project root:

```env
# Required for AI chatbot
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key

# Optional — lead emails. Falls back to console.log if unset.
RESEND_API_KEY=your-resend-api-key
RESEND_FROM=onboarding@resend.dev
LEAD_EMAIL=info@skylinedevelopmenthub.com
```

### Run

```bash
npm run dev      # Dev server on localhost:3000
npm run build    # Production build
npm run start    # Serve production build
npx vitest run   # Run tests once
npm run test     # Tests in watch mode
```

---

## Project Structure

```
skylinedevhub/
|-- app/
|   |-- globals.css                     # Full design system (tokens, layout, components, animations)
|   |-- [locale]/
|   |   |-- layout.tsx                  # Root layout: fonts (Bebas Neue, DM Mono), html lang
|   |   |-- page.tsx                    # Main page: all content from i18n dictionaries
|   |   |-- __tests__/
|   |   |   |-- page.test.tsx           # Page rendering tests
|   |   |-- legal/
|   |       |-- layout.tsx              # Legal pages shared layout with back-to-site nav
|   |       |-- privacy-policy/page.tsx
|   |       |-- terms-of-service/page.tsx
|   |       |-- gdpr-compliance/page.tsx
|   |       |-- security/page.tsx
|   |-- api/
|       |-- chat/route.ts              # Streaming chat endpoint (Gemini 2.5 Flash)
|       |-- lead/route.ts              # Lead capture: extraction + email delivery
|
|-- components/
|   |-- SkylineEngine.tsx              # WebGL shader, scroll system, pagination, HUD, theme
|   |-- ChatBot.tsx                    # AI chatbot (build + inquiry flows)
|   |-- CaseCarousel.tsx               # Paginated case study carousel
|   |-- ContactForm.tsx                # Structured contact form (service, size, budget)
|   |-- LanguageToggle.tsx             # SQ/EN language switcher
|
|-- i18n/
|   |-- config.ts                      # Locale list and default
|   |-- getDictionary.ts               # Async dictionary loader with TypeScript types
|   |-- dictionaries/
|       |-- sq.json                    # Albanian translations (default)
|       |-- en.json                    # English translations
|
|-- middleware.ts                       # i18n routing: redirects / to /{locale}
|-- .marketing-ai/
|   |-- brand-manifest.json            # Brand identity: colors, fonts, tone, components
|-- docs/                              # Design specs and implementation plans
|-- vitest.config.ts                   # Test config: jsdom, React plugin, @ alias
|-- vitest.setup.ts                    # @testing-library/jest-dom matchers
```

### Key files at a glance

| File | What it does |
|------|--------------|
| `app/[locale]/page.tsx` | Async server component rendering all site content from i18n dictionaries |
| `components/SkylineEngine.tsx` | `'use client'` — WebGL shader + compilation, scroll/velocity system, pagination state machine, HUD, theme toggle. Runs in `useEffect`, renders `null` |
| `components/ChatBot.tsx` | `'use client'` — AI chatbot with `useChat` from `@ai-sdk/react`, two flows, transcript submission |
| `components/ContactForm.tsx` | `'use client'` — structured inquiry form posting to `/api/lead` |
| `components/CaseCarousel.tsx` | `'use client'` — paginated case studies with arrow navigation |
| `app/api/chat/route.ts` | `streamText` with Gemini, two system prompts (build vs inquiry) |
| `app/api/lead/route.ts` | `generateText` with Zod schema for structured brief extraction, Resend email |
| `app/globals.css` | Complete design system: tokens, layout, components, reveal animations, responsive |
| `middleware.ts` | Detects browser language from `Accept-Language`, redirects to `/{locale}` |

---

## Design System

### Color: Monotone Grayscale

No chromatic color anywhere. Accent is white (dark mode) or near-black (light mode).

| Token | Dark | Light |
|-------|------|-------|
| `--bg` | `#0a0a0a` | `#f0f0f0` |
| `--fg` | `#e0e0e0` | `#0d0d0d` |
| `--muted` | `#666666` | `#999999` |
| `--accent` | `#ffffff` | `#1a1a1a` |
| `--card-bg` | `rgba(10,10,10,0.82)` | `rgba(240,240,240,0.88)` |
| `--card-border` | `rgba(255,255,255,0.15)` | `rgba(26,26,26,0.18)` |

Theme toggles via `data-theme` attribute on `<html>`. CSS variables swap automatically. The WebGL background (`uBg` uniform) is updated in `SkylineEngine`'s `applyTheme()`.

### Typography

| Role | Font | Sizing |
|------|------|--------|
| Display (h1, h2, stat numbers, scroll card titles) | Bebas Neue 400 | `clamp()` responsive, `line-height: 0.92` |
| Body / UI (everything else) | DM Mono 300/400 | `0.55rem`–`0.78rem`, `letter-spacing: 0.08em`–`0.25em` |

All text is uppercase except body-text paragraphs. Fonts loaded via `next/font` — no external Google Fonts requests.

### Layout

| Token | Value | Usage |
|-------|-------|-------|
| `--ui-inset` | `2rem` | Outer margin for all chrome |
| `--hairline` | `0.0625rem` (1px) | All borders |
| Breakpoint | `37.5em` (600px) | Single responsive breakpoint |

### Split-screen page layout

Page overlays use a **50/50 split** — a frosted glass `.text-card` takes 50% of viewport width, the WebGL shape occupies the other half. Panes alternate sides per page:

| Page | Shape half | Content pane | Pan direction |
|------|-----------|--------------|---------------|
| 0 (Hero) | Centered | Left | `0` |
| 1 (About) | Left | Right | `-1` |
| 2 (Approach) | Right | Left | `1` |
| 3 (Work) | Left | Right | `-1` |
| 4 (Contact) | Right | Left | `1` |

Content panes use `backdrop-filter: blur(12px)` for frosted glass. On mobile (<600px), panes go full width.

### Reveal animations

Page overlay children animate in with staggered delays when `.page.active` is applied:

```
.tag          0s
h1/h2         0.06s
.body-text    0.14s
lists/grids   0.22s
.stat-row     0.26s
.cta          0.32s
.h-line       scale 0 to 1 (no delay)
```

---

## WebGL Shader Engine

### SDF Scenes

Five signed distance function shapes morph between each other as the user scrolls:

| Index | Name | Geometry | Animation |
|-------|------|----------|-----------|
| 0 | ORIGIN | Breathing sphere | Radius oscillates via `sin(t * 1.3)` |
| 1 | TORUS | Rotating torus | XZ rotation at `t * 0.6` |
| 2 | LATTICE | Tumbling box | XY + YZ dual rotation |
| 3 | PRISM | Spinning octahedron | XY rotation at `t * 0.5` |
| 4 | HELIX | Interlocked double-torus | Two tori at offset rotations |

Scenes blend via `mix()` controlled by scroll-derived scene index and blend factor.

### Shader uniforms

| Uniform | Type | Source |
|---------|------|--------|
| `uR` | vec2 | Canvas resolution (px) |
| `uT` | float | Time (seconds since load) |
| `uS` | float | Scroll progress (0–1) |
| `uSc` | float | Scene index (0–3) |
| `uBl` | float | Blend factor (0–1) between scenes |
| `uOff` | float | Horizontal camera offset (pagination) |
| `uBg` | vec3 | Background color (synced with CSS theme) |

### Surface effects

Three procedural texture layers on all shapes:

1. **Noise bands** — horizontal streaks drifting upward (`smoothstep(.35,.65)`, adds 0.12 max brightness)
2. **Edge pulse** — `sin(p.y*6 - uT*0.6)^12` multiplied by Fresnel (thin bright ring sweeping vertically)
3. **Brushed specular** — `noise3(p*28 + uT*0.1)` modulates specular, creating irregular grain

---

## Interaction Model

### Scroll

- `#scroll-spacer` provides 500vh of scroll height
- Custom wheel handler with velocity damping (`0.85^(dt*60)` decay, capped at +/-600)
- `smooth` chases `tgt` via exponential easing (`1 - exp(-dt * 8)`)
- Scroll cards swap based on current scene index each frame

### Pagination

- `openPage(i)` — sets horizontal pan offset, toggles `.page.active`, hides scroll cards
- `closePage()` — resets offset, removes `.active`, shows scroll cards
- `smoothOff` chases `targetOff` via exponential easing (`1 - exp(-dt * 5)`)
- Clicking the same page again closes it (toggle)
- Any scroll/wheel input closes the open page

### Navigation entry points

| Element | Action |
|---------|--------|
| Dot strip (left edge, 5 dots) | Opens corresponding page overlay |
| Top nav links | About, Approach, Work, Contact |
| CTA buttons | In scroll cards and page overlays |
| Chatbot CTAs | Hero "build" and contact "inquiry" open chatbot |
| Wordmark | Returns to page 0 (Hero) |
| Language toggle | SQ / EN switches locale via `next/link` |

---

## Internationalization (i18n)

| Locale | Path | Default |
|--------|------|---------|
| Albanian | `/sq` | Yes |
| English | `/en` | No |

- Translations in `i18n/dictionaries/{sq,en}.json` — must have identical key structure
- `middleware.ts` detects browser language from `Accept-Language` and redirects `/` to `/{locale}`
- Both locale pages are statically generated at build time
- Scene names in the HUD are translated (passed to `SkylineEngine` via prop + `useRef`)

### Dictionary structure

```
meta.title / meta.description
nav.about / approach / work / contact / buildCta
scenes[]                          (5 HUD scene names)
dots[]                            (5 dot hover labels)
themeToggle                       (aria-label)
scrollCards[0-4].tag/title/sub/cta
pages.hero / about / approach / work / contact
footer.privacy / terms / gdpr / security / backToSite
credit
chatbot.buildCta / inquiryCta / titleBuild / titleInquiry / close / ...
contactForm.service / serviceOptions / companySize / sizeOptions / ...
```

### Editing content

1. Edit both `sq.json` and `en.json` — they must have identical keys
2. Titles use `\n` for line breaks (converted to `<br>` in JSX)
3. Soft hyphens use `\u00AD` in JSON strings
4. Company name "Skyline DevHub" and emails are NOT translated
5. The `credit` field uses HTML entities (`&mdash;`)

---

## Chatbot & Lead Pipeline

### Two conversational flows

| Flow | Trigger | System prompt | Purpose |
|------|---------|---------------|---------|
| `build` | Hero CTA, nav CTA, floating button | Project intake assistant | Gather project brief (name, business, site type, features, timeline, email) |
| `inquiry` | Contact page CTA | Service Q&A assistant | Answer questions about Skyline DevHub services |

### Data flow

```
User --> ChatBot.tsx (useChat + DefaultChatTransport) --> /api/chat (streamText, Gemini 2.5 Flash)
               |
               +-- Submit --> /api/lead
                                |-- extractBrief() -- Gemini generateText + Zod schema
                                |   -> structured YAML + JSON brief
                                +-- Resend API -- email to LEAD_EMAIL
```

- **Streaming** — `@ai-sdk/react` `useChat` with `DefaultChatTransport`, streamed via `toUIMessageStreamResponse()`
- **Structured extraction** — on submit, the full transcript is sent to Gemini which extracts a structured brief (client info, project details, summary) using a Zod schema
- **Email delivery** — Resend API sends the brief + raw transcript; falls back to `console.log` when `RESEND_API_KEY` is not set
- **Bilingual responses** — the chatbot responds in whichever language the user writes in

---

## Contact Form

A structured inquiry form on the Contact page with:

- **Service interest** — dropdown (options from i18n dictionary)
- **Company size** — dropdown
- **Budget range** — dropdown
- **Email** — required
- **Message** — optional textarea

Submissions go to `/api/lead` with `flow: "contact-form"`. Unlike chatbot leads, contact form data skips Gemini extraction (already structured) and is emailed directly.

---

## Legal Pages

Four pages under `app/[locale]/legal/`, sharing a layout with back-to-site navigation:

| Route | Content |
|-------|---------|
| `/legal/privacy-policy` | Data collection, usage, rights, cookies |
| `/legal/terms-of-service` | Acceptable use, IP, payments, liability |
| `/legal/gdpr-compliance` | Legal basis, data subject rights, DPA, breach notification |
| `/legal/security` | Infrastructure, encryption, certifications, bug bounty |

Content is in English (standard for Albanian tech companies).

---

## Testing

[Vitest](https://vitest.dev) with jsdom environment and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro).

```bash
npx vitest run   # Run tests once
npm run test     # Watch mode
```

- Tests live alongside routes: `app/[locale]/__tests__/page.test.tsx`
- `@` path alias resolves to project root (matches `tsconfig.json`)
- `@testing-library/jest-dom` matchers available globally via `vitest.setup.ts`

---

## Deployment

Next.js on **Vercel**. GitHub repo connected — pushes to `main` auto-deploy to production.

| | |
|---|---|
| **Repo** | [github.com/skylinedevhub/skylinealpha](https://github.com/skylinedevhub/skylinealpha) |
| **Production** | [skylinedevelopmenthub.com](https://skylinedevelopmenthub.com) |
| **Preview** | [skylinealpha.vercel.app](https://skylinealpha.vercel.app) |
| **Framework** | Next.js (must be set in Vercel project settings) |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_GENERATIVE_AI_API_KEY` | Yes (for chatbot) | Gemini API key for chat streaming and brief extraction |
| `RESEND_API_KEY` | No | Resend API key for email delivery. Falls back to `console.log` |
| `RESEND_FROM` | No | Sender address for lead emails (default: `onboarding@resend.dev`) |
| `LEAD_EMAIL` | No | Recipient for lead emails (default: `info@skylinedevelopmenthub.com`) |

---

## Contributing

### Conventions

- **Next.js App Router** — React server components by default, `'use client'` only where needed
- **Monotone grayscale only** — never introduce chromatic color in CSS or shader
- **Two-axis independence** — scroll and pagination must never affect each other
- **Theme sync** — any CSS theme change must also update the WebGL `uBg` uniform
- **Shader effects are additive** — each texture layer adds to `col`, never multiplies or replaces
- **Split-screen panes** — content pane takes 50% width, shape centered in opposite half
- **Responsive breakpoint** — single breakpoint at `37.5em` (600px)
- **i18n parity** — `sq.json` and `en.json` must always have identical key structure
- **Fonts via next/font** — never use `@import` or `<link>` for Google Fonts
- **All UI text** — DM Mono, uppercase, wide letter-spacing
- **All display text** — Bebas Neue, tight line-height (0.92)

### Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Rendering | Static generation |
| Styling | CSS custom properties (no CSS-in-JS) |
| AI | Vercel AI SDK + Gemini 2.5 Flash |
| Email | Resend |
| Testing | Vitest + React Testing Library |
| Hosting | Vercel |
