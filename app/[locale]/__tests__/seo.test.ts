import { describe, it, expect } from "vitest";

describe("robots.txt", () => {
  it("exports a robots config that allows crawling and blocks /api/", async () => {
    const mod = await import("@/app/robots");
    const robots = mod.default();
    expect(robots.rules).toEqual({ userAgent: "*", allow: "/", disallow: "/api/" });
    expect(robots.sitemap).toBe("https://skylinedevelopmenthub.com/sitemap.xml");
  });
});

describe("sitemap.xml", () => {
  it("generates URLs for both locales and all legal pages", async () => {
    const mod = await import("@/app/sitemap");
    const sitemap = mod.default();
    const urls = sitemap.map((e: { url: string }) => e.url);

    expect(urls).toContain("https://skylinedevelopmenthub.com/sq");
    expect(urls).toContain("https://skylinedevelopmenthub.com/en");

    expect(urls).toContain("https://skylinedevelopmenthub.com/sq/legal/privacy-policy");
    expect(urls).toContain("https://skylinedevelopmenthub.com/en/legal/privacy-policy");
    expect(urls).toContain("https://skylinedevelopmenthub.com/sq/legal/terms-of-service");
    expect(urls).toContain("https://skylinedevelopmenthub.com/en/legal/terms-of-service");
    expect(urls).toContain("https://skylinedevelopmenthub.com/sq/legal/gdpr-compliance");
    expect(urls).toContain("https://skylinedevelopmenthub.com/en/legal/gdpr-compliance");
    expect(urls).toContain("https://skylinedevelopmenthub.com/sq/legal/security");
    expect(urls).toContain("https://skylinedevelopmenthub.com/en/legal/security");

    expect(urls).toContain("https://skylinedevelopmenthub.com/sq/solutions/ocr-api");
    expect(urls).toContain("https://skylinedevelopmenthub.com/en/solutions/ocr-api");

    const sqRoot = sitemap.find((e: { url: string }) => e.url === "https://skylinedevelopmenthub.com/sq");
    expect(sqRoot.alternates.languages.en).toBe("https://skylinedevelopmenthub.com/en");
  });
});
