# Marketing Website Improvements — Design Spec

**Date:** 2026-04-13
**Issues:** #1 (Site Layout), #2 (Chatbot Visibility), #4 (Marketing Improvements)
**Scope:** Changes to the existing Next.js codebase only

## Issues Not Covered

Issues #5 (API Platform), #6 (Developer Portal), #7 (Infrastructure), #8 (Sales Tooling) require separate technology stacks (Python/FastAPI, Terraform, CRM tools) and are out of scope for this codebase.

---

## 1. Hero CTA + Free Prominence (Issue #1)

**Current state:** Hero has `data-chatbot-build` button and `.hero-free` text. Tests pass.

**Changes:**
- Enhance `.hero-free` CSS — larger font size, subtle border/badge treatment, visual weight to draw attention
- Ensure the "free" message is above the fold and prominent on mobile

## 2. Chatbot Visibility (Issue #2)

**Problem:** The chatbot build CTA is only visible when the hero page overlay is open. Users scrolling through scenes don't see it.

**Solution:** Add a persistent floating CTA button visible during scroll (not inside page overlays). Clicking opens the chatbot build flow.

**Implementation:**
- New element in page.tsx: floating CTA with `data-chatbot-build` attribute
- CSS: fixed position, bottom-right corner, z-index above scroll cards but below chatbot overlay
- SkylineEngine.tsx: attach click handler to the new element (same pattern as existing chatbot triggers)
- Hide when chatbot is open, hide when hero page is active (to avoid duplicate CTAs)
- Bilingual — text from dictionary

## 3. SEO Meta Tags + OpenGraph (Issue #4)

**Files:** `app/[locale]/layout.tsx`, `app/[locale]/page.tsx`

**Changes:**
- Add OpenGraph metadata (title, description, type, url, locale, siteName)
- Add Twitter card metadata
- Add canonical URL
- Add alternate language links (hreflang)
- Keep using `generateMetadata` from dictionaries

## 4. JSON-LD Structured Data (Issue #4)

**File:** `app/[locale]/page.tsx`

**Schemas:**
- `Organization` — company name, URL, contact, logo placeholder
- `WebSite` — search action, bilingual
- `LocalBusiness` — Tirana location, services

**Implementation:** `<script type="application/ld+json">` in page component

## 5. sitemap.xml (Issue #4)

**File:** `app/sitemap.ts`

**Coverage:**
- Both locale root pages (`/sq`, `/en`)
- All 4 legal pages per locale (8 URLs)
- Solution landing pages (when added)
- Proper `alternates.languages` for hreflang

## 6. robots.txt (Issue #4)

**File:** `app/robots.ts`

**Rules:**
- Allow all crawlers
- Disallow `/api/`
- Point to sitemap URL

## 7. Solution Landing Pages (Issue #4)

**Route:** `app/[locale]/solutions/[slug]/page.tsx`

**Pages (3):**
- `ocr-api` — OCR API Europe
- `compliance-api` — Compliance API Europe
- `ai-infrastructure` — AI Infrastructure Balkans

**Structure per page:**
- Hero section with keyword-rich H1
- Problem/solution narrative
- Feature list
- CTA to chatbot build flow
- JSON-LD `Service` schema

**i18n:** New dictionary keys under `solutions.*` in both sq.json and en.json

## 8. ROI Calculator (Issue #4)

**Route:** `app/[locale]/roi/page.tsx`
**Component:** `components/ROICalculator.tsx` (`'use client'`)

**Inputs:** Current manual processing time, document volume, employee cost
**Output:** Estimated savings with automation (hours saved, cost reduction, ROI percentage)

**Design:** Grayscale, DM Mono + Bebas Neue, matches existing design system

## 9. Lead Magnet — Free Audit (Issue #4)

**Implementation:** Section on hero page + dedicated route `app/[locale]/audit/page.tsx`

**Flow:**
1. User sees "Free Digital Audit" CTA
2. Enters email + company name
3. Submits to `/api/lead` with `flow: 'audit'`
4. Confirmation message

## 10. Improved Contact Form (Issue #4)

**Route:** Enhanced contact page overlay (page index 4)

**New fields:**
- Service interest (dropdown: Custom Development, AI Integration, Digital Transformation, Other)
- Company size (dropdown: 1-10, 11-50, 51-200, 200+)
- Budget range (dropdown: <€5k, €5k-€20k, €20k-€50k, €50k+)
- Email (required)
- Message (textarea)

**Submission:** POST to `/api/lead` with structured data

---

## Testing Strategy

TDD — tests written first for each deliverable:
- Meta tags: verify OpenGraph and Twitter card tags in rendered output
- JSON-LD: verify schema presence and structure
- sitemap.ts: verify URL generation for all locales
- robots.ts: verify rules
- Landing pages: verify rendering with dictionary content
- ROI calculator: verify calculation logic
- Contact form: verify field presence and submission
- Floating CTA: verify visibility and chatbot trigger

## Design System Compliance

All new components follow existing conventions:
- Monotone grayscale only
- Bebas Neue for display, DM Mono for UI
- Uppercase text with wide letter-spacing
- Single responsive breakpoint at 37.5em
- Split-screen pane layout for new pages
