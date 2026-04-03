"use client";

import Link from "next/link";

export default function LanguageToggle({ locale }: { locale: string }) {
  return (
    <div className="lang-toggle">
      <Link
        href="/sq"
        className={`lang-btn${locale === "sq" ? " active" : ""}`}
      >
        SQ
      </Link>
      <span className="lang-sep">/</span>
      <Link
        href="/en"
        className={`lang-btn${locale === "en" ? " active" : ""}`}
      >
        EN
      </Link>
    </div>
  );
}
