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
