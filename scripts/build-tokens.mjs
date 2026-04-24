#!/usr/bin/env node
/**
 * Skyline DevHub — Token CSS generator
 * Drop at: scripts/build-tokens.mjs
 * Wire to package.json: "tokens:build": "node scripts/build-tokens.mjs"
 *
 * Reads lib/tokens/tokens.ts and writes lib/tokens/tokens.css.
 * The CSS is then imported at the top of app/globals.css.
 */

import { writeFileSync } from "node:fs";
import { colors, typography, space, motion } from "../lib/tokens/tokens.ts";

const css = `/* GENERATED — do not hand-edit. Run: npm run tokens:build */

:root {
  color-scheme: dark;

  /* color — dark (default) */
  --bg: ${colors.dark.bg};
  --fg: ${colors.dark.fg};
  --muted: ${colors.dark.muted};
  --accent: ${colors.dark.accent};
  --card-bg: ${colors.dark.cardBg};
  --card-border: ${colors.dark.cardBorder};
  --state-accent: ${colors.state.accent};

  /* type */
  --type-display-xl: ${typography.displayXl.size};
  --type-display-lg: ${typography.displayLg.size};
  --type-display-md: ${typography.displayMd.size};
  --type-tag: ${typography.tag.size};
  --type-ui: ${typography.ui.size};
  --type-body: ${typography.body.size};
  --type-micro: ${typography.micro.size};

  --tracking-display: 0.03em;
  --tracking-tag: 0.25em;
  --tracking-ui: 0.18em;
  --tracking-body: 0.04em;
  --tracking-wide: 0.15em;

  /* space */
  --hair: ${space.hair};
  --ui-inset: ${space.uiInset};
  --pane-pad-x: ${space.paneX};
  --pane-pad-y: ${space.paneY};

  /* motion */
  --ease-skyline: ${motion.easeSkyline};
  --reveal-duration: ${motion.revealDuration};
  --stagger-1: ${motion.stagger.s1};
  --stagger-2: ${motion.stagger.s2};
  --stagger-3: ${motion.stagger.s3};
  --stagger-4: ${motion.stagger.s4};
  --stagger-5: ${motion.stagger.s5};
  --stagger-6: ${motion.stagger.s6};
}

:root[data-theme="light"] {
  color-scheme: light;
  --bg: ${colors.light.bg};
  --fg: ${colors.light.fg};
  --muted: ${colors.light.muted};
  --accent: ${colors.light.accent};
  --card-bg: ${colors.light.cardBg};
  --card-border: ${colors.light.cardBorder};
}

@media (width <= 37.5em) {
  :root {
    --pane-pad-x: ${space.paneXMobile};
    --pane-pad-y: ${space.paneYMobile};
    --ui-inset: 1.25rem;
  }
}
`;

writeFileSync(new URL("../lib/tokens/tokens.css", import.meta.url), css);
console.log("✓ wrote lib/tokens/tokens.css");
