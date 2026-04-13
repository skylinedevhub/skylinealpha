import type { MetadataRoute } from "next";

const BASE = "https://skylinedevelopmenthub.com";
const locales = ["sq", "en"] as const;

const legalSlugs = ["privacy-policy", "terms-of-service", "gdpr-compliance", "security"];
const solutionSlugs = ["ocr-api", "compliance-api", "ai-infrastructure"];

function entry(path: string, now: Date): MetadataRoute.Sitemap[number] {
  return {
    url: `${BASE}${path}`,
    lastModified: now,
    alternates: {
      languages: Object.fromEntries(
        locales.map((l) => [l, `${BASE}/${l}${path.replace(/^\/(sq|en)/, "")}`])
      ),
    },
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  const now = new Date();

  for (const locale of locales) {
    entries.push(entry(`/${locale}`, now));
    for (const slug of legalSlugs) {
      entries.push(entry(`/${locale}/legal/${slug}`, now));
    }
    for (const slug of solutionSlugs) {
      entries.push(entry(`/${locale}/solutions/${slug}`, now));
    }
  }

  return entries;
}
