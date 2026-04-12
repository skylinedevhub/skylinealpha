import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import enDict from "@/i18n/dictionaries/en.json";

vi.mock("@/i18n/getDictionary", () => ({
  getDictionary: vi.fn().mockResolvedValue(enDict),
}));

vi.mock("@/components/SkylineEngine", () => ({
  default: () => null,
}));
vi.mock("@/components/LanguageToggle", () => ({
  default: ({ locale }: { locale: string }) => (
    <div data-testid="lang-toggle">{locale}</div>
  ),
}));
vi.mock("@/components/ChatBot", () => ({
  default: () => null,
}));

import Home from "../page";

async function renderHome(locale = "en") {
  const jsx = await Home({ params: Promise.resolve({ locale }) });
  return render(jsx);
}

describe("Issue #1 — Hero CTA + free messaging", () => {
  it("renders a build CTA with data-chatbot-build in the hero", async () => {
    await renderHome();
    const hero = document.querySelector('[data-page="0"]')!;
    const buildBtn = hero.querySelector("[data-chatbot-build]");
    expect(buildBtn).toBeInTheDocument();
    expect(buildBtn).toHaveTextContent(/build my site/i);
  });

  it("renders a prominent 'free' message in the hero", async () => {
    await renderHome();
    const hero = document.querySelector('[data-page="0"]')!;
    expect(hero.textContent).toMatch(/free/i);
  });
});

describe("Issue #2 — Nav discoverability", () => {
  it("renders a CTA with data-chatbot-build in the nav", async () => {
    await renderHome();
    const nav = document.getElementById("top-nav")!;
    const navBuildBtn = nav.querySelector("[data-chatbot-build]");
    expect(navBuildBtn).toBeInTheDocument();
  });

  it("nav CTA contains build-related text", async () => {
    await renderHome();
    const nav = document.getElementById("top-nav")!;
    const navBuildBtn = nav.querySelector("[data-chatbot-build]");
    expect(navBuildBtn).toHaveTextContent(/build/i);
  });
});
