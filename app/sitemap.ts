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
