# Marketing Website Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement issues #1 (hero CTA + free prominence), #2 (chatbot visibility), and #4 (SEO, structured data, landing pages, contact form) in the existing Next.js codebase.

**Architecture:** All changes stay within the existing Next.js App Router architecture. New pages use `generateStaticParams` for SSG. New client components follow the existing pattern of `'use client'` with imperative DOM attachment. All text is bilingual (sq/en) via the dictionary system.

**Tech Stack:** Next.js 15 App Router, React 19, Vitest + RTL, existing i18n system

**Security note:** All uses of `dangerouslySetInnerHTML` in this project are safe — content comes exclusively from our own static JSON dictionary files (checked into the repo), never from user input. This pattern is already established in the codebase (see page.tsx line 37 comment).

---

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `app/robots.ts` | Create | robots.txt generation |
| `app/sitemap.ts` | Create | sitemap.xml generation |
| `app/[locale]/layout.tsx` | Modify | Enhanced metadata (OG, Twitter, canonical, hreflang) |
| `app/[locale]/page.tsx` | Modify | JSON-LD script, floating CTA element, contact form |
| `app/globals.css` | Modify | Hero-free prominence styles, floating CTA styles, contact form styles |
| `app/[locale]/solutions/[slug]/page.tsx` | Create | Solution landing pages |
| `components/ContactForm.tsx` | Create | Client-side contact form component |
| `i18n/dictionaries/en.json` | Modify | Add solutions + contact form + floating CTA dictionary keys |
| `i18n/dictionaries/sq.json` | Modify | Add solutions + contact form + floating CTA dictionary keys |
| `app/[locale]/__tests__/seo.test.ts` | Create | Tests for robots, sitemap |
| `app/[locale]/__tests__/metadata.test.tsx` | Create | Tests for OG metadata |
| `app/[locale]/__tests__/solutions.test.tsx` | Create | Tests for solution landing pages |
| `app/[locale]/__tests__/contact-form.test.tsx` | Create | Tests for contact form |

---

### Task 1: robots.txt

**Files:**
- Create: `app/robots.ts`
- Create: `app/[locale]/__tests__/seo.test.ts`

- [ ] **Step 1: Write the failing test**

Create `app/[locale]/__tests__/seo.test.ts`:

```ts
import { describe, it, expect } from "vitest";

describe("robots.txt", () => {
  it("exports a robots config that allows crawling and blocks /api/", async () => {
    const mod = await import("@/app/robots");
    const robots = mod.default();
    expect(robots.rules).toEqual({ userAgent: "*", allow: "/", disallow: "/api/" });
    expect(robots.sitemap).toBe("https://skylinedevelopmenthub.com/sitemap.xml");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run app/[locale]/__tests__/seo.test.ts`
Expected: FAIL — module `@/app/robots` not found

- [ ] **Step 3: Write minimal implementation**

Create `app/robots.ts`:

```ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: "https://skylinedevelopmenthub.com/sitemap.xml",
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run app/[locale]/__tests__/seo.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/robots.ts app/[locale]/__tests__/seo.test.ts
git commit -m "feat: add robots.txt with crawl rules and sitemap pointer"
```

---

### Task 2: sitemap.xml

**Files:**
- Create: `app/sitemap.ts`
- Modify: `app/[locale]/__tests__/seo.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `app/[locale]/__tests__/seo.test.ts`:

```ts
describe("sitemap.xml", () => {
  it("generates URLs for both locales and all legal pages", async () => {
    const mod = await import("@/app/sitemap");
    const sitemap = mod.default();
    const urls = sitemap.map((e: { url: string }) => e.url);

    // Root locale pages
    expect(urls).toContain("https://skylinedevelopmenthub.com/sq");
    expect(urls).toContain("https://skylinedevelopmenthub.com/en");

    // Legal pages (4 per locale = 8)
    expect(urls).toContain("https://skylinedevelopmenthub.com/sq/legal/privacy-policy");
    expect(urls).toContain("https://skylinedevelopmenthub.com/en/legal/privacy-policy");
    expect(urls).toContain("https://skylinedevelopmenthub.com/sq/legal/terms-of-service");
    expect(urls).toContain("https://skylinedevelopmenthub.com/en/legal/terms-of-service");
    expect(urls).toContain("https://skylinedevelopmenthub.com/sq/legal/gdpr-compliance");
    expect(urls).toContain("https://skylinedevelopmenthub.com/en/legal/gdpr-compliance");
    expect(urls).toContain("https://skylinedevelopmenthub.com/sq/legal/security");
    expect(urls).toContain("https://skylinedevelopmenthub.com/en/legal/security");

    // Solution pages (3 per locale = 6)
    expect(urls).toContain("https://skylinedevelopmenthub.com/sq/solutions/ocr-api");
    expect(urls).toContain("https://skylinedevelopmenthub.com/en/solutions/ocr-api");

    // Each entry has alternates
    const sqRoot = sitemap.find((e: { url: string }) => e.url === "https://skylinedevelopmenthub.com/sq");
    expect(sqRoot.alternates.languages.en).toBe("https://skylinedevelopmenthub.com/en");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run app/[locale]/__tests__/seo.test.ts`
Expected: FAIL — module `@/app/sitemap` not found

- [ ] **Step 3: Write minimal implementation**

Create `app/sitemap.ts`:

```ts
import type { MetadataRoute } from "next";

const BASE = "https://skylinedevelopmenthub.com";
const locales = ["sq", "en"] as const;

const legalSlugs = ["privacy-policy", "terms-of-service", "gdpr-compliance", "security"];
const solutionSlugs = ["ocr-api", "compliance-api", "ai-infrastructure"];

function entry(path: string): MetadataRoute.Sitemap[number] {
  return {
    url: `${BASE}${path}`,
    lastModified: new Date(),
    alternates: {
      languages: Object.fromEntries(
        locales.map((l) => [l, `${BASE}/${l}${path.replace(/^\/(sq|en)/, "")}`])
      ),
    },
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    entries.push(entry(`/${locale}`));
    for (const slug of legalSlugs) {
      entries.push(entry(`/${locale}/legal/${slug}`));
    }
    for (const slug of solutionSlugs) {
      entries.push(entry(`/${locale}/solutions/${slug}`));
    }
  }

  return entries;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run app/[locale]/__tests__/seo.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/sitemap.ts app/[locale]/__tests__/seo.test.ts
git commit -m "feat: add sitemap.xml with locale alternates for all pages"
```

---

### Task 3: Enhanced metadata (OpenGraph, Twitter, hreflang)

**Files:**
- Modify: `app/[locale]/layout.tsx`
- Create: `app/[locale]/__tests__/metadata.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `app/[locale]/__tests__/metadata.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";

describe("Layout metadata", () => {
  it("includes OpenGraph and Twitter card metadata", async () => {
    const mod = await import("../layout");
    const { metadata } = mod;
    expect(metadata.openGraph).toBeDefined();
    expect(metadata.openGraph.siteName).toBe("Skyline DevHub");
    expect(metadata.openGraph.type).toBe("website");
    expect(metadata.openGraph.locale).toBe("sq_AL");
    expect(metadata.twitter).toBeDefined();
    expect(metadata.twitter.card).toBe("summary_large_image");
    expect(metadata.metadataBase?.toString()).toBe("https://skylinedevelopmenthub.com/");
    expect(metadata.alternates?.languages).toHaveProperty("sq");
    expect(metadata.alternates?.languages).toHaveProperty("en");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run app/[locale]/__tests__/metadata.test.tsx`
Expected: FAIL — metadata doesn't have openGraph

- [ ] **Step 3: Write minimal implementation**

Modify `app/[locale]/layout.tsx` — replace the existing `metadata` export with:

```ts
export const metadata: Metadata = {
  metadataBase: new URL("https://skylinedevelopmenthub.com"),
  title: {
    default: "Skyline DevHub",
    template: "%s | Skyline DevHub",
  },
  description:
    "AI-native digital solutions and automation-first systems for businesses across Albania.",
  openGraph: {
    siteName: "Skyline DevHub",
    type: "website",
    locale: "sq_AL",
    alternateLocale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
  alternates: {
    languages: {
      sq: "/sq",
      en: "/en",
    },
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run app/[locale]/__tests__/metadata.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/[locale]/layout.tsx app/[locale]/__tests__/metadata.test.tsx
git commit -m "feat: add OpenGraph, Twitter card, and hreflang metadata"
```

---

### Task 4: JSON-LD structured data

**Files:**
- Modify: `app/[locale]/page.tsx`
- Modify: `app/[locale]/__tests__/page.test.tsx`

- [ ] **Step 1: Write the failing test**

Add to `app/[locale]/__tests__/page.test.tsx`:

```tsx
describe("JSON-LD structured data", () => {
  it("renders Organization and WebSite schemas", async () => {
    await renderHome();
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts.length).toBeGreaterThanOrEqual(1);

    const allSchemas: unknown[] = [];
    scripts.forEach((s) => allSchemas.push(JSON.parse(s.textContent || "")));

    const graph = allSchemas.find((s: any) => s["@graph"]) as any;
    expect(graph).toBeDefined();
    const types = graph["@graph"].map((g: any) => g["@type"]);
    expect(types).toContain("Organization");
    expect(types).toContain("WebSite");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run app/[locale]/__tests__/page.test.tsx`
Expected: FAIL — no script tags found

- [ ] **Step 3: Write minimal implementation**

Add JSON-LD to `app/[locale]/page.tsx`. Insert before the `<ChatBot>` component, just before the closing fragment:

```tsx
      <script
        type="application/ld+json"
        /* Safe: all content is from static dictionary files, never user input */
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                name: "Skyline DevHub",
                url: "https://skylinedevelopmenthub.com",
                email: "info@skylinedevelopmenthub.com",
                description: dict.meta.description,
                address: {
                  "@type": "PostalAddress",
                  addressLocality: "Tirana",
                  addressCountry: "AL",
                },
              },
              {
                "@type": "WebSite",
                name: "Skyline DevHub",
                url: `https://skylinedevelopmenthub.com/${locale}`,
                inLanguage: locale === "sq" ? "sq-AL" : "en-US",
              },
            ],
          }),
        }}
      />
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run app/[locale]/__tests__/page.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/[locale]/page.tsx app/[locale]/__tests__/page.test.tsx
git commit -m "feat: add Organization and WebSite JSON-LD structured data"
```

---

### Task 5: Hero "free" prominence (Issue #1)

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: No test needed — this is a CSS-only visual change**

The existing test already verifies the `.hero-free` element exists and contains "free" text. This task enhances its visual styling.

- [ ] **Step 2: Enhance `.hero-free` styles**

In `app/globals.css`, replace the existing `.hero-free` rule:

```css
/* BEFORE */
.hero-free {
  font-weight: 400;
  letter-spacing: 0.12em;
  color: var(--accent);
}

/* AFTER */
.hero-free {
  font-size: 0.85rem;
  font-weight: 400;
  letter-spacing: 0.12em;
  color: var(--accent);
  border: var(--hairline) solid var(--card-border);
  padding: 0.6rem 1rem;
  margin-block-start: 1.5rem;
  display: inline-block;
}
```

- [ ] **Step 3: Run existing tests to verify no regression**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "style: make hero free message more prominent with border and larger text"
```

---

### Task 6: Floating chatbot CTA (Issue #2)

**Files:**
- Modify: `app/[locale]/page.tsx` — add floating CTA element
- Modify: `i18n/dictionaries/en.json` — add `floatingCta` key
- Modify: `i18n/dictionaries/sq.json` — add `floatingCta` key
- Modify: `app/[locale]/__tests__/page.test.tsx` — test floating CTA

- [ ] **Step 1: Write the failing test**

Add to `app/[locale]/__tests__/page.test.tsx`:

```tsx
describe("Issue #2 — Floating chatbot CTA", () => {
  it("renders a floating CTA with data-chatbot-build outside of page overlays", async () => {
    await renderHome();
    const floatingCta = document.getElementById("floating-build-cta");
    expect(floatingCta).toBeInTheDocument();
    expect(floatingCta).toHaveAttribute("data-chatbot-build");
    // Must NOT be inside #pages (it should be visible during scroll)
    const pages = document.getElementById("pages");
    expect(pages?.contains(floatingCta!)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run app/[locale]/__tests__/page.test.tsx`
Expected: FAIL — no element with id `floating-build-cta`

- [ ] **Step 3: Add dictionary keys**

Add to `en.json` at the top level:
```json
"floatingCta": "Build my site — Free"
```

Add to `sq.json` at the top level:
```json
"floatingCta": "Ndërto faqen time — Falas"
```

- [ ] **Step 4: Add floating CTA element to page.tsx**

In `app/[locale]/page.tsx`, add between `<div id="scroll-spacer" />` and `<div id="scroll-cards" ...>`:

```tsx
      <button
        id="floating-build-cta"
        data-chatbot-build
        type="button"
        className="floating-cta"
      >
        {dict.floatingCta}
      </button>
```

- [ ] **Step 5: Add CSS for floating CTA**

Add to `app/globals.css` before the `/* ── mobile ── */` section:

```css
/* ── floating CTA ── */

.floating-cta {
  position: fixed;
  bottom: 5.5rem;
  left: 50%;
  translate: -50% 0;
  z-index: 4;
  padding: 0.55rem 1.5rem;
  border: var(--hairline) solid var(--accent);
  background: var(--card-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: var(--accent);
  font-family: var(--font-mono), monospace;
  font-size: 0.58rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, opacity 0.3s, translate 0.3s;
  white-space: nowrap;
}

.floating-cta:hover {
  background: var(--accent);
  color: var(--bg);
}

.floating-cta.hidden {
  opacity: 0;
  pointer-events: none;
  translate: -50% 0.5rem;
}
```

Also add this line inside the existing `@media (width <= 37.5em)` block:

```css
.floating-cta { bottom: 3.5rem; font-size: 0.52rem; padding: 0.5rem 1.25rem; }
```

- [ ] **Step 6: Run tests to verify**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 7: Commit**

```bash
git add app/[locale]/page.tsx app/globals.css i18n/dictionaries/en.json i18n/dictionaries/sq.json
git commit -m "feat: add floating chatbot CTA visible during scroll (issue #2)"
```

---

### Task 7: Solution landing pages (Issue #4)

**Files:**
- Modify: `i18n/dictionaries/en.json` — add `solutions` keys
- Modify: `i18n/dictionaries/sq.json` — add `solutions` keys
- Create: `app/[locale]/solutions/[slug]/page.tsx`
- Create: `app/[locale]/__tests__/solutions.test.tsx`

- [ ] **Step 1: Add solution dictionary entries**

Add `solutions` key to `en.json` at the top level:

```json
"solutions": {
  "ocr-api": {
    "tag": "OCR API Europe",
    "title": "DOCUMENT\nINTELLIGENCE",
    "body": "Enterprise-grade OCR and document extraction API built for European compliance. Extract structured data from invoices, receipts, IDs, and government forms with AI-native accuracy.",
    "features": [
      { "name": "PDF & Image Processing", "desc": "Multi-format document ingestion" },
      { "name": "Structured Extraction", "desc": "Tables, fields, and entities" },
      { "name": "EU Data Residency", "desc": "GDPR-compliant processing" },
      { "name": "99.2% Accuracy", "desc": "AI-native extraction engine" }
    ],
    "cta": "Start building"
  },
  "compliance-api": {
    "tag": "Compliance API Europe",
    "title": "AUTOMATED\nCOMPLIANCE",
    "body": "Compliance automation for European fintech and regulated industries. KYC verification, AML screening, and audit trail generation.",
    "features": [
      { "name": "KYC Verification", "desc": "Identity and document checks" },
      { "name": "AML Screening", "desc": "Sanctions and PEP lists" },
      { "name": "Audit Trails", "desc": "Immutable compliance records" },
      { "name": "EU Regulations", "desc": "Always current with directives" }
    ],
    "cta": "Start building"
  },
  "ai-infrastructure": {
    "tag": "AI Infrastructure Balkans",
    "title": "AI-NATIVE\nINFRASTRUCTURE",
    "body": "Managed AI infrastructure for Balkan enterprises. From model deployment to workflow automation — purpose-built for regional compliance and data sovereignty.",
    "features": [
      { "name": "Model Deployment", "desc": "GPU compute with EU residency" },
      { "name": "Workflow Automation", "desc": "End-to-end AI pipelines" },
      { "name": "Data Sovereignty", "desc": "Regional compliance built in" },
      { "name": "Managed Operations", "desc": "24/7 monitoring and scaling" }
    ],
    "cta": "Start building"
  }
}
```

Add equivalent `solutions` key to `sq.json`:

```json
"solutions": {
  "ocr-api": {
    "tag": "OCR API Europë",
    "title": "INTELIGJENCË\nDOKUMENTESH",
    "body": "API e nivelit ndërmarrës për OCR dhe nxjerrje dokumentesh, ndërtuar për përputhshmërinë europiane.",
    "features": [
      { "name": "Përpunim PDF & Imazhesh", "desc": "Pranues dokumentesh shumë-formatësh" },
      { "name": "Nxjerrje e Strukturuar", "desc": "Tabela, fusha dhe entitete" },
      { "name": "Rezidencë të Dhënash në BE", "desc": "Përpunim në përputhje me GDPR" },
      { "name": "Saktësi 99.2%", "desc": "Motor nxjerrjeje me bazë AI" }
    ],
    "cta": "Fillo ndërtimin"
  },
  "compliance-api": {
    "tag": "API Përputhshmërie Europë",
    "title": "PËRPUTHSHMËRI\nE AUTOMATIZUAR",
    "body": "Automatizim përputhshmërie për fintech europian dhe industri të rregulluara. Verifikim KYC, kontroll AML dhe gjenerim gjurmësh auditimi.",
    "features": [
      { "name": "Verifikim KYC", "desc": "Kontrolle identiteti dhe dokumentesh" },
      { "name": "Kontroll AML", "desc": "Lista sanksionesh dhe PEP" },
      { "name": "Gjurmë Auditimi", "desc": "Regjistrime përputhshmërie të pandryshueshme" },
      { "name": "Rregullore BE", "desc": "Gjithmonë aktuale me direktivat" }
    ],
    "cta": "Fillo ndërtimin"
  },
  "ai-infrastructure": {
    "tag": "Infrastrukturë AI Ballkan",
    "title": "INFRASTRUKTURË\nME BAZË AI",
    "body": "Infrastrukturë e menaxhuar AI për ndërmarrjet ballkanike. Nga vendosja e modeleve te automatizimi i rrjedhës së punës.",
    "features": [
      { "name": "Vendosje Modelesh", "desc": "Llogaritje GPU me rezidencë në BE" },
      { "name": "Automatizim Rrjedhe Pune", "desc": "Tubacione AI nga fillimi në fund" },
      { "name": "Sovranitet të Dhënash", "desc": "Përputhshmëri rajonale e integruar" },
      { "name": "Operacione të Menaxhuara", "desc": "Monitorim dhe shkallëzim 24/7" }
    ],
    "cta": "Fillo ndërtimin"
  }
}
```

- [ ] **Step 2: Write the failing test**

Create `app/[locale]/__tests__/solutions.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import enDict from "@/i18n/dictionaries/en.json";

vi.mock("@/i18n/getDictionary", () => ({
  getDictionary: vi.fn().mockResolvedValue(enDict),
}));

import SolutionPage from "../../solutions/[slug]/page";

async function renderSolution(slug: string) {
  const jsx = await SolutionPage({
    params: Promise.resolve({ locale: "en", slug }),
  });
  return render(jsx);
}

describe("Solution landing pages", () => {
  it("renders the OCR API page with correct heading", async () => {
    await renderSolution("ocr-api");
    expect(document.querySelector("h1")).toHaveTextContent(/DOCUMENT/);
  });

  it("renders feature list items", async () => {
    await renderSolution("ocr-api");
    const items = document.querySelectorAll(".project-item");
    expect(items.length).toBe(4);
  });

  it("renders a build CTA with data-chatbot-build", async () => {
    await renderSolution("compliance-api");
    const cta = document.querySelector("[data-chatbot-build]");
    expect(cta).toBeInTheDocument();
  });

  it("renders JSON-LD Service schema", async () => {
    await renderSolution("ai-infrastructure");
    const script = document.querySelector('script[type="application/ld+json"]');
    expect(script).toBeInTheDocument();
    const data = JSON.parse(script!.textContent || "");
    expect(data["@type"]).toBe("Service");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run app/[locale]/__tests__/solutions.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 4: Write solution page component**

Create `app/[locale]/solutions/[slug]/page.tsx`:

```tsx
import { getDictionary } from "@/i18n/getDictionary";
import { locales, type Locale } from "@/i18n/config";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

const validSlugs = ["ocr-api", "compliance-api", "ai-infrastructure"] as const;
type Slug = (typeof validSlugs)[number];

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    validSlugs.map((slug) => ({ locale, slug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const dict = await getDictionary(locale as Locale);
  const solution = dict.solutions?.[slug as Slug];
  if (!solution) return {};
  return {
    title: solution.tag,
    description: solution.body,
  };
}

const ArrowIcon = () => (
  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M1 6h10M6 1l5 5-5 5" />
  </svg>
);

export default async function SolutionPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const dict = await getDictionary(locale as Locale);

  const solution = dict.solutions?.[slug as Slug];
  if (!solution) notFound();

  /* Safe: titleHtml only processes static dictionary content, never user input */
  const titleHtml = (text: string) => text.replace(/\n/g, "<br>");

  return (
    <div className="legal-page">
      <nav className="legal-nav">
        <a href={`/${locale}`}>&larr; {dict.footer.backToSite}</a>
      </nav>
      <div className="legal-content">
        <div className="tag">{solution.tag}</div>
        {/* Safe: content from static dictionary files only */}
        <h1 dangerouslySetInnerHTML={{ __html: titleHtml(solution.title) }} />
        <p className="body-text">{solution.body}</p>
        <div className="project-list" style={{ marginBlockStart: "2rem" }}>
          {solution.features.map(
            (f: { name: string; desc: string }, i: number) => (
              <div key={i} className="project-item">
                <span className="project-name">{f.name}</span>
                <span className="project-type">{f.desc}</span>
              </div>
            )
          )}
        </div>
        <button
          data-chatbot-build
          type="button"
          className="cta"
          style={{ marginBlockStart: "2.5rem" }}
        >
          {solution.cta}
          <ArrowIcon />
        </button>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: solution.tag,
            description: solution.body,
            provider: {
              "@type": "Organization",
              name: "Skyline DevHub",
              url: "https://skylinedevelopmenthub.com",
            },
          }),
        }}
      />
    </div>
  );
}
```

- [ ] **Step 5: Run tests to verify**

Run: `npx vitest run app/[locale]/__tests__/solutions.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add app/[locale]/solutions/ i18n/dictionaries/en.json i18n/dictionaries/sq.json app/[locale]/__tests__/solutions.test.tsx
git commit -m "feat: add 3 SEO solution landing pages with JSON-LD and i18n"
```

---

### Task 8: Contact form component (Issue #4)

**Files:**
- Create: `components/ContactForm.tsx`
- Modify: `app/[locale]/page.tsx` — add ContactForm to contact page overlay
- Modify: `i18n/dictionaries/en.json` — add `contactForm` keys
- Modify: `i18n/dictionaries/sq.json` — add `contactForm` keys
- Create: `app/[locale]/__tests__/contact-form.test.tsx`

- [ ] **Step 1: Add dictionary keys**

Add `contactForm` key to `en.json`:

```json
"contactForm": {
  "service": "Service Interest",
  "serviceOptions": ["Custom Development", "AI Integration", "Digital Transformation", "Other"],
  "companySize": "Company Size",
  "sizeOptions": ["1-10", "11-50", "51-200", "200+"],
  "budget": "Budget Range",
  "budgetOptions": ["< €5k", "€5k - €20k", "€20k - €50k", "€50k+"],
  "email": "Email",
  "message": "Message",
  "send": "Send inquiry",
  "sending": "Sending...",
  "sent": "Sent! We will be in touch.",
  "error": "Something went wrong. Please try again."
}
```

Add equivalent to `sq.json`:

```json
"contactForm": {
  "service": "Interes Shërbimi",
  "serviceOptions": ["Zhvillim i Personalizuar", "Integrim AI", "Transformim Digjital", "Tjetër"],
  "companySize": "Madhësia e Kompanisë",
  "sizeOptions": ["1-10", "11-50", "51-200", "200+"],
  "budget": "Buxheti",
  "budgetOptions": ["< €5k", "€5k - €20k", "€20k - €50k", "€50k+"],
  "email": "Email",
  "message": "Mesazhi",
  "send": "Dërgo kërkesën",
  "sending": "Duke dërguar...",
  "sent": "U dërgua! Do t'ju kontaktojmë.",
  "error": "Diçka shkoi keq. Provoni përsëri."
}
```

- [ ] **Step 2: Write the failing test**

Create `app/[locale]/__tests__/contact-form.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import enDict from "@/i18n/dictionaries/en.json";
import ContactForm from "@/components/ContactForm";

describe("ContactForm", () => {
  it("renders service, company size, budget, email, and message fields", () => {
    render(<ContactForm dict={enDict.contactForm} />);
    expect(screen.getByLabelText(/service interest/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/company size/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/budget range/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
  });

  it("renders a submit button", () => {
    render(<ContactForm dict={enDict.contactForm} />);
    expect(screen.getByRole("button", { name: /send inquiry/i })).toBeInTheDocument();
  });

  it("renders service dropdown with 4 options plus empty default", () => {
    render(<ContactForm dict={enDict.contactForm} />);
    const select = screen.getByLabelText(/service interest/i) as HTMLSelectElement;
    expect(select.options.length).toBe(5);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run app/[locale]/__tests__/contact-form.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 4: Write ContactForm component**

Create `components/ContactForm.tsx`:

```tsx
"use client";

import { useState, type FormEvent } from "react";

export interface ContactFormDict {
  service: string;
  serviceOptions: string[];
  companySize: string;
  sizeOptions: string[];
  budget: string;
  budgetOptions: string[];
  email: string;
  message: string;
  send: string;
  sending: string;
  sent: string;
  error: string;
}

export default function ContactForm({ dict }: { dict: ContactFormDict }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("sending");
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flow: "contact-form",
          messages: [
            {
              role: "user",
              content: [
                `Service: ${form.get("service")}`,
                `Company size: ${form.get("companySize")}`,
                `Budget: ${form.get("budget")}`,
                `Email: ${form.get("email")}`,
                `Message: ${form.get("message") || "N/A"}`,
              ].join("\n"),
            },
          ],
        }),
      });
      if (!res.ok) throw new Error();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  if (status === "sent") return <p className="body-text">{dict.sent}</p>;

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="form-field">
        <label htmlFor="cf-service">{dict.service}</label>
        <select id="cf-service" name="service" required>
          <option value="">—</option>
          {dict.serviceOptions.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="cf-size">{dict.companySize}</label>
        <select id="cf-size" name="companySize" required>
          <option value="">—</option>
          {dict.sizeOptions.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="cf-budget">{dict.budget}</label>
        <select id="cf-budget" name="budget" required>
          <option value="">—</option>
          {dict.budgetOptions.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="cf-email">{dict.email}</label>
        <input id="cf-email" name="email" type="email" required autoComplete="email" />
      </div>

      <div className="form-field">
        <label htmlFor="cf-message">{dict.message}</label>
        <textarea id="cf-message" name="message" rows={3} />
      </div>

      <button type="submit" className="cta" disabled={status === "sending"}>
        {status === "sending" ? dict.sending : dict.send}
      </button>
      {status === "error" && <p className="body-text">{dict.error}</p>}
    </form>
  );
}
```

- [ ] **Step 5: Add CSS for the contact form**

Add to `app/globals.css` before the `/* ── mobile ── */` section:

```css
/* ── contact form ── */

.contact-form {
  margin-block-start: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.form-field label {
  font-size: 0.5rem;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: var(--muted);
}

.form-field select,
.form-field input,
.form-field textarea {
  background: transparent;
  border: var(--hairline) solid var(--card-border);
  color: var(--fg);
  font-family: var(--font-mono), monospace;
  font-size: 0.62rem;
  letter-spacing: 0.06em;
  padding: 0.5rem 0.75rem;
  outline: none;
  transition: border-color 0.2s;
}

.form-field select:focus,
.form-field input:focus,
.form-field textarea:focus {
  border-color: var(--accent);
}

.form-field select option {
  background: var(--bg);
  color: var(--fg);
}

.form-field textarea {
  resize: vertical;
  min-height: 3rem;
}
```

- [ ] **Step 6: Add ContactForm to the contact page overlay**

In `app/[locale]/page.tsx`, import ContactForm at the top:

```tsx
import ContactForm from "@/components/ContactForm";
```

Then in the Contact page overlay (data-page="4"), add `<ContactForm dict={dict.contactForm} />` after the existing `contact-grid` div and before the `stat-row` div.

- [ ] **Step 7: Run all tests**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 8: Commit**

```bash
git add components/ContactForm.tsx app/[locale]/page.tsx app/globals.css i18n/dictionaries/en.json i18n/dictionaries/sq.json app/[locale]/__tests__/contact-form.test.tsx
git commit -m "feat: add structured contact form with service/size/budget fields"
```

---

### Task 9: Build verification

- [ ] **Step 1: Run the full test suite**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 2: Run Next.js build**

Run: `npm run build`
Expected: Build succeeds, all pages statically generated

- [ ] **Step 3: Verify solution pages are in the build output**

Check that `/sq/solutions/ocr-api`, `/en/solutions/ocr-api`, etc. appear in the build output.

- [ ] **Step 4: Start dev server and verify in browser**

Run: `npm run dev`
Verify:
- Hero page shows prominent "free" message
- Floating CTA visible during scroll
- Solution pages render at `/en/solutions/ocr-api`, etc.
- Contact form fields render in contact overlay
- `/sitemap.xml` returns valid XML
- `/robots.txt` returns valid rules
