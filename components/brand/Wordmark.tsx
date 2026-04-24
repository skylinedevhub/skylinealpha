/**
 * Skyline DevHub — Wordmark + Monogram
 * Drop at: components/brand/Wordmark.tsx
 *
 * Typeset in Bebas Neue via next/font. The SVG locks letter-spacing so it
 * renders identically regardless of font loading state.
 */

interface WordmarkProps {
  /** Size in rem. Default 1.4 matches current nav-wordmark. */
  size?: number;
  /** aria-label override. Default: "Skyline DevHub". */
  label?: string;
}

export function Wordmark({ size = 1.4, label = "Skyline DevHub" }: WordmarkProps) {
  return (
    <span
      role="img"
      aria-label={label}
      style={{
        fontFamily: "var(--font-display), sans-serif",
        fontSize: `${size}rem`,
        letterSpacing: "0.06em",
        lineHeight: 1,
        color: "var(--fg)",
        display: "inline-flex",
        alignItems: "baseline",
        gap: "0.25em",
        whiteSpace: "nowrap",
      }}
    >
      <span>SKYLINE</span>
      <span style={{ color: "var(--muted)" }}>/</span>
      <span>DEVHUB</span>
    </span>
  );
}

/** The "S/" mark — favicons, email templates, product-footer credits. */
export function Monogram({ size = 1.4 }: { size?: number }) {
  return (
    <span
      role="img"
      aria-label="Skyline DevHub"
      style={{
        fontFamily: "var(--font-display), sans-serif",
        fontSize: `${size}rem`,
        letterSpacing: "0.04em",
        lineHeight: 1,
        color: "var(--fg)",
        display: "inline-flex",
        alignItems: "baseline",
      }}
    >
      <span>S</span>
      <span style={{ color: "var(--muted)" }}>/</span>
    </span>
  );
}
