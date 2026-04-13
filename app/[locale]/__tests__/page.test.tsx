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

describe("Nav structure", () => {
  it("renders the top-nav with navigation links", async () => {
    await renderHome();
    const nav = document.getElementById("top-nav")!;
    expect(nav).toBeInTheDocument();
    const links = nav.querySelectorAll(".nav-link");
    expect(links.length).toBe(4);
  });

  it("renders the language toggle in the nav", async () => {
    await renderHome();
    const toggle = document.querySelector('[data-testid="lang-toggle"]');
    expect(toggle).toBeInTheDocument();
  });
});

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

