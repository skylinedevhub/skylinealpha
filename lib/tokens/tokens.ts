/**
 * Skyline DevHub — Design Tokens (source of truth)
 * Drop at: lib/tokens/tokens.ts
 *
 * Generate CSS with: npm run tokens:build
 * (see handoff/build-tokens.mjs for the generator)
 */

export const colors = {
  dark: {
    bg: "#0a0a0a",
    fg: "#e0e0e0",
    muted: "#666666",
    accent: "#ffffff",
    cardBg: "rgba(10, 10, 10, 0.82)",
    cardBorder: "rgba(255, 255, 255, 0.15)",
  },
  light: {
    bg: "#f0f0f0",
    fg: "#0d0d0d",
    muted: "#999999",
    accent: "#1a1a1a",
    cardBg: "rgba(240, 240, 240, 0.88)",
    cardBorder: "rgba(26, 26, 26, 0.18)",
  },
  /** The only chromatic token. Strict escape hatch — see CLAUDE.md §3. */
  state: {
    accent: "oklch(78% 0.14 45)",
  },
} as const;

// Named `typography` (not `type`) because `import { type X }` is TS's
// type-only-import syntax. Node 24's native .ts stripper parses a bare
// `type` inside `import { ... }` as that modifier, corrupting the whole
// destructured import and producing "does not provide an export named …"
// on every other name in the list. Locally Node 20 → tsx → esbuild
// tolerates it, so the issue only surfaces on Vercel's Node 24.
export const typography = {
  displayXl: {
    size: "clamp(3rem, 8vw, 6.5rem)",
    lineHeight: "0.92",
    tracking: "0.03em",
  },
  displayLg: {
    size: "clamp(2.2rem, 6vw, 5rem)",
    lineHeight: "0.92",
    tracking: "0.03em",
  },
  displayMd: {
    size: "clamp(1.4rem, 2.5vw, 2rem)",
    lineHeight: "0.92",
    tracking: "0.03em",
  },
  tag: { size: "0.6rem", lineHeight: "1.4", tracking: "0.25em" },
  ui: { size: "0.62rem", lineHeight: "1.4", tracking: "0.18em" },
  body: { size: "0.78rem", lineHeight: "1.8", tracking: "0.04em" },
  micro: { size: "0.55rem", lineHeight: "1.4", tracking: "0.15em" },
} as const;

export const space = {
  hair: "0.0625rem",
  uiInset: "2rem",
  paneX: "4rem",
  paneY: "6rem",
  paneXMobile: "1.5rem",
  paneYMobile: "5rem",
} as const;

export const motion = {
  easeSkyline: "cubic-bezier(.2, .7, .1, 1)",
  revealDuration: "0.5s",
  stagger: {
    s1: "0s",
    s2: "0.06s",
    s3: "0.14s",
    s4: "0.22s",
    s5: "0.26s",
    s6: "0.32s",
  },
} as const;

export const breakpoints = {
  mobile: "37.5em", // 600px — the only breakpoint
} as const;

export const fonts = {
  display: "var(--font-display), sans-serif",
  mono: "var(--font-mono), ui-monospace, monospace",
} as const;
