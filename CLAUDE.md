# Skyline DevHub

Development company website — AI-native digital solutions for Albanian businesses. Next.js App Router with WebGL scroll-driven animation, bilingual i18n (Albanian default / English), and a decoupled pagination system for content overlays.

## Architecture

```
                    ┌──────────────────────────────────┐
                    │         WebGL Canvas (z:0)        │
                    │  Raymarched SDF shapes, grayscale │
                    │  Driven by scroll position        │
                    └──────────────────────────────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          │                         │                         │
┌─────────────────┐   ┌──────────────────────┐   ┌────────────────────┐
│ Scroll Cards    │   │   Page Overlays      │   │   Chrome (z:10)    │
│ (z:3)           │   │   (z:2)              │   │   Nav, HUD, dots,  │
│ Scene-tracking  │   │   Full content       │   │   theme toggle,    │
│ summary + CTA   │   │   panels             │   │   lang toggle,     │
│ Visible during  │   │   Visible when       │   │   credit, footer   │
│ scroll          │   │   page is opened     │   └────────────────────┘
└─────────────────┘   └──────────────────────┘
                                    │
                    ┌──────────────────────────────────┐
                    │      ChatBot overlay (z:20)      │
                    │  AI chat (build / inquiry flows)  │
                    │  Streams via /api/chat (Gemini)   │
                    │  Submits leads via /api/lead      │
                    └──────────────────────────────────┘
```

### Two independent control axes

| Axis | Input | Controls | State variables |
|------|-------|----------|-----------------|
| **Scroll** | Wheel / touch | Shape morphing (5 SDF scenes), HUD, scroll cards | `tgt`, `smooth`, `velocity` |
| **Pagination** | Click (dot / CTA / nav) | Page overlay visibility, shape horizontal pan | `activePage`, `targetOff`, `smoothOff` |

Scroll never affects pagination. Pagination never affects scroll. Scrolling while a page is open closes the page.

### Key files

| File | Purpose |
|------|---------|
| `app/[locale]/layout.tsx` | Root layout: `next/font` loading (Bebas Neue, DM Mono), html `lang` attribute, CSS import |
| `app/[locale]/page.tsx` | Main page: all content rendered from i18n dictionaries, `generateMetadata`, `generateStaticParams` |
| `app/globals.css` | Full design system: tokens, layout, components, reveal animations, responsive breakpoint, legal page styles |
| `components/SkylineEngine.tsx` | `'use client'` — WebGL shader + compilation, scroll/velocity system, pagination state machine, HUD, theme toggle. Runs entirely in `useEffect`, renders `null` |
| `components/LanguageToggle.tsx` | `'use client'` — SQ/EN switcher using `next/link` |
| `components/ChatBot.tsx` | `'use client'` — AI chatbot with two flows (build project brief / general inquiry). Uses `@ai-sdk/react` `useChat` with `DefaultChatTransport`. Streams via `/api/chat`, submits leads via `/api/lead` |
| `components/CaseCarousel.tsx` | `'use client'` — Paginated case study carousel with arrow navigation, slide transitions, and result metrics display |
| `app/api/chat/route.ts` | Chat streaming endpoint — Gemini 2.5 Flash via AI SDK `streamText`, two system prompts (build vs inquiry flow) |
| `app/api/lead/route.ts` | Lead capture endpoint — extracts structured brief from transcript via Gemini `generateText` + Zod schema, emails via Resend API |
| `i18n/dictionaries/sq.json` | Albanian translations (default language) |
| `i18n/dictionaries/en.json` | English translations |
| `i18n/config.ts` | Locale list and default locale |
| `i18n/getDictionary.ts` | Async dictionary loader with TypeScript types |
| `middleware.ts` | i18n routing: redirects `/` to `/{locale}` based on `Accept-Language` header |
| `.marketing-ai/brand-manifest.json` | Brand identity manifest: colors, fonts, tone, components, pages, design system metadata |
| `vitest.config.ts` | Test config: jsdom environment, React plugin, `@` path alias |
| `app/[locale]/__tests__/page.test.tsx` | Page rendering tests: hero content, chatbot CTAs, nav structure, language toggle |

### Rendering model

- **Server-rendered content** — `page.tsx` is an async server component. All text comes from the dictionary for the current locale. HTML is pre-rendered at build time via `generateStaticParams`.
- **Client-side hydration** — `SkylineEngine` attaches WebGL, scroll handling, and pagination to the server-rendered DOM in a `useEffect`. It finds elements by `id` / `className` / `querySelector` and manipulates them imperatively.
- **Legal pages** — Separate routes under `app/[locale]/legal/` with their own layout. No WebGL on these pages.

## i18n

| Locale | Path | Default |
|--------|------|---------|
| Albanian | `/sq` | Yes |
| English | `/en` | No |

- Translations live in `i18n/dictionaries/{sq,en}.json`
- Middleware detects browser language via `Accept-Language` and redirects
- Both locale pages are statically generated at build time
- Fonts loaded via `next/font` (Bebas Neue, DM Mono) — no external Google Fonts request
- Scene names in the HUD are translated (passed to `SkylineEngine` via `sceneNames` prop and a `useRef`)

### Editing content

All translatable text is in the JSON dictionaries. To change copy:

1. Edit both `sq.json` and `en.json` — they must have identical key structure
2. Titles use `\n` for line breaks (converted to `<br>` in JSX)
3. Soft hyphens use `\u00AD` in JSON strings
4. Company name "Skyline DevHub" and email addresses are NOT translated
5. The `credit` field uses HTML entities (`&mdash;`)

Dictionary structure:
```
meta.title / meta.description    — page <title> and meta description
nav.about / approach / work / contact / buildCta
scenes[]                         — HUD scene names (5 entries)
dots[]                           — dot strip hover labels (5 entries)
themeToggle                      — aria-label for theme button
scrollCards[0-4].tag/title/sub/cta
pages.hero / about / approach / work / contact
footer.privacy / terms / gdpr / security / backToSite
credit
chatbot.buildCta / inquiryCta / titleBuild / titleInquiry / close / submit / submitting / placeholder / buildGreeting / inquiryGreeting / success / error
```

## Legal Pages

Four legal pages under `app/[locale]/legal/`:

| Route | Content |
|-------|---------|
| `/legal/privacy-policy` | Privacy policy — data collection, usage, rights, cookies |
| `/legal/terms-of-service` | Terms — acceptable use, IP, payments, liability |
| `/legal/gdpr-compliance` | GDPR — legal basis, data subject rights, DPA, breach notification |
| `/legal/security` | Security practices — infrastructure, encryption, certifications, bug bounty |

These share a layout (`legal/layout.tsx`) with back-to-site navigation. Content is in English (standard for Albanian tech companies). A thin fixed footer on the main page links to all four.

## Design System

### Color — Monotone Grayscale

No chromatic color anywhere — CSS or shader. Accent is white (dark) or near-black (light).

| Token | Dark | Light |
|-------|------|-------|
| `--bg` | `#0a0a0a` | `#f0f0f0` |
| `--fg` | `#e0e0e0` | `#0d0d0d` |
| `--muted` | `#666666` | `#999999` |
| `--accent` | `#ffffff` | `#1a1a1a` |
| `--card-bg` | `rgba(10,10,10,0.82)` | `rgba(240,240,240,0.88)` |
| `--card-border` | `rgba(255,255,255,0.15)` | `rgba(26,26,26,0.18)` |

Theme is toggled via `data-theme` attribute on `<html>`. CSS variables swap automatically. WebGL background (`uBg` uniform) is updated in `SkylineEngine`'s `applyTheme()`.

### Typography

| Role | Font | Sizing |
|------|------|--------|
| Display (h1, h2, stat-num, sc-title) | Bebas Neue (via `next/font`) | `clamp(2rem, Xvw, Yrem)`, `line-height: 0.92` |
| Body / UI (everything else) | DM Mono 300/400 (via `next/font`) | `0.55rem` - `0.78rem`, `letter-spacing: 0.08em - 0.25em` |

All text is uppercase (`text-transform: uppercase`) except body-text paragraphs.

### Spacing and Layout

| Token | Value | Usage |
|-------|-------|-------|
| `--ui-inset` | `2rem` | Outer margin for all chrome elements |
| `--nav-x` | `calc(--ui-inset + 0.125rem)` | Dot strip and theme toggle horizontal position |
| `--hairline` | `0.0625rem` (1px) | All borders |
| Pane padding | `6rem 4rem` (desktop), `5rem 1.5rem` (mobile) | |

### Split-screen page layout

Page overlays use a **50/50 split-screen** design. The `.text-card` is a full-viewport-height frosted glass pane taking 50% of the screen width. The WebGL shape occupies the other 50%, centered in its half.

| Class | Alignment | Border (dividing edge) | Shape half |
|-------|-----------|------------------------|------------|
| `.text-card` (default) | Left 50% | `border-right` | Right |
| `.text-card.right` | Right 50% (`margin-inline-start: auto`) | `border-left` | Left |

The pane uses `backdrop-filter: blur(12px)` for a frosted glass effect. On mobile (37.5em or below), panes go `width: 100%`.

### Pagination pan directions

| Page | panDir | Shape half | Content pane |
|------|--------|-----------|--------------|
| 0 (Hero) | `0` | Centered | Left |
| 1 (About) | `-1` | Left | Right |
| 2 (Approach) | `1` | Right | Left |
| 3 (Work) | `-1` | Left | Right |
| 4 (Contact) | `1` | Right | Left |

### Reveal animation system

Page overlay children start at `opacity: 0` and animate in when `.page.active` is applied. Staggered delays:

```
.tag         ->  0s
h1/h2        ->  0.06s
.body-text   ->  0.14s
lists/grids  ->  0.22s
.stat-row    ->  0.26s
.cta         ->  0.32s
.h-line      ->  scale 0 to 1 (no delay)
```

## WebGL Shader

### SDF Scenes (scroll-driven)

| Index | Name | Geometry | Animation |
|-------|------|----------|-----------|
| 0 | ORIGIN | Breathing sphere | Radius oscillates via `sin(t * 1.3)` |
| 1 | TORUS | Rotating torus | XZ rotation at `t * 0.6` |
| 2 | LATTICE | Tumbling box | XY + YZ dual rotation |
| 3 | PRISM | Spinning octahedron | XY rotation at `t * 0.5` |
| 4 | HELIX | Interlocked double-torus | Two tori at offset rotations |

Scenes blend via `mix()` controlled by `uSc` (scene index) and `uBl` (blend factor 0 to 1).

### Uniforms

| Uniform | Type | Source |
|---------|------|--------|
| `uR` | vec2 | Canvas resolution (px) |
| `uT` | float | Time (seconds since load) |
| `uS` | float | Scroll progress (0 to 1) — drives `pal()` |
| `uSc` | float | Scene index (0 to 3) |
| `uBl` | float | Blend factor (0 to 1) between scenes |
| `uOff` | float | Horizontal camera offset (pagination pan) |
| `uBg` | vec3 | Background color (synced with CSS theme) |

### Surface effects

Three procedural texture layers on all shapes:

1. **Noise bands** — horizontal streaks drifting upward. `smoothstep(.35,.65)`. Adds `0.12` max brightness.
2. **Edge pulse** — `sin(p.y*6 - uT*0.6)^12` multiplied by Fresnel. Thin bright ring sweeping vertically.
3. **Brushed specular** — `noise3(p*28 + uT*0.1)` modulates specular highlight, creating irregular grain.

## Interaction Model

### Scroll
- `#scroll-spacer` provides 500vh of scroll height
- Custom wheel handler with velocity damping (`0.85^(dt*60)` decay, plus/minus 600 cap)
- `smooth` chases `tgt` via exponential easing (`1 - exp(-dt * 8)`)
- Scroll cards swap based on current scene index in the frame loop

### Pagination
- `openPage(i)` — sets `targetOff`, toggles `.page.active`, hides scroll cards
- `closePage()` — resets offset to 0, removes `.active`, shows scroll cards
- `smoothOff` chases `targetOff` via exponential easing (`1 - exp(-dt * 5)`)
- Clicking same page again closes it (toggle behavior)
- Any scroll input (wheel) calls `closePage()`

### Navigation entry points
- **Dot strip** — 5 clickable dots, left edge, hover shows label via `::after`
- **Top nav links** — About, Approach, Work, Contact
- **CTA buttons** — in both scroll cards and page overlays
- **Chatbot CTAs** — hero page "build" CTA and contact page "inquiry" CTA open the chatbot overlay
- **Wordmark** — clicks to page 0
- **Language toggle** — SQ / EN bordered buttons in nav

## Chatbot & Lead Pipeline

### Two chatbot flows

| Flow | Trigger | System prompt | Purpose |
|------|---------|---------------|---------|
| `build` | Hero CTA, nav CTA | Project intake assistant | Gather project brief (name, business, site type, features, timeline, email) |
| `inquiry` | Contact page CTA | Service Q&A assistant | Answer questions about Skyline DevHub's services |

### Architecture

```
User ──► ChatBot.tsx (useChat) ──► /api/chat (streamText, Gemini 2.5 Flash)
                │
                └── Submit ──► /api/lead
                                 ├── extractBrief() ── Gemini generateText + Zod schema
                                 │   → structured YAML + JSON brief
                                 └── Resend API ── email to LEAD_EMAIL
```

- **Streaming** — `@ai-sdk/react` `useChat` with `DefaultChatTransport`, streamed via `toUIMessageStreamResponse()`
- **Structured extraction** — on submit, the full transcript is sent to Gemini which extracts a structured brief (client info, project details, summary) via a Zod schema
- **Email delivery** — Resend API sends the brief + raw transcript. Falls back to `console.log` when `RESEND_API_KEY` is not set
- **Environment variables** — `GOOGLE_GENERATIVE_AI_API_KEY` (required for chat), `RESEND_API_KEY` (optional), `RESEND_FROM` (optional), `LEAD_EMAIL` (defaults to `info@skylinedevelopmenthub.com`)

### Case Studies Carousel

The Work page uses `CaseCarousel.tsx` — a client-side paginated carousel rendering case studies with challenge/solution/results structure. Navigation via arrow buttons, counter shows `{current}/{total}`. Case data lives in the i18n dictionaries under `pages.work.cases[]`.

## Development

```bash
npm run dev      # Next.js dev server on localhost:3000
npm run build    # production build
npm run start    # serve production build locally
npx vitest run   # run tests (4 tests, jsdom + React Testing Library)
npm run test     # vitest in watch mode
```

## Testing

Vitest with jsdom environment and React Testing Library. Config in `vitest.config.ts`, setup in `vitest.setup.ts`.

- Tests live alongside routes: `app/[locale]/__tests__/page.test.tsx`
- `@` path alias resolves to project root (matches `tsconfig.json`)
- `@testing-library/jest-dom` matchers available globally via setup file

## Deployment

Next.js on Vercel. GitHub repo connected — pushes to `main` auto-deploy to production.

- **Repo**: github.com/skylinedevhub/skylinealpha
- **Production URLs**: `skylinealpha.vercel.app`, `skylinedevelopmenthub.com`, `www.skylinedevelopmenthub.com`
- **Framework**: Next.js (must be set in Vercel project settings)

## Conventions

- **Next.js App Router** — React server components by default, `'use client'` only where needed
- **Monotone grayscale only** — never introduce chromatic color in CSS or shader
- **Two-axis independence** — scroll and pagination must never affect each other
- **Theme sync** — any CSS theme change must also update the WebGL `uBg` uniform
- **Shader effects are additive** — each texture layer adds to `col`, never multiplies or replaces
- **Split-screen panes** — content pane takes 50% width, shape centered in opposite half (panDir: `[0, -1, 1, -1, 1]`)
- **Responsive breakpoint** — single breakpoint at `37.5em` (600px), hides dot strip and nav links
- **i18n parity** — `sq.json` and `en.json` must always have identical key structure
- **Fonts via next/font** — never use `@import` or `<link>` for Google Fonts
- **All UI text** — DM Mono, uppercase, wide letter-spacing
- **All display text** — Bebas Neue, tight line-height (0.92)
