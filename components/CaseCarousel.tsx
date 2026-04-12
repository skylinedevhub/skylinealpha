"use client";

import { useState } from "react";

type CaseResult = { metric: string; label: string };

type CaseStudy = {
  client: string;
  tag: string;
  desc: string;
  challenge: string;
  solution: string;
  results: CaseResult[];
  link?: string;
};

type CaseCarouselProps = {
  cases: CaseStudy[];
  prevLabel: string;
  nextLabel: string;
  counterTemplate: string;
  ctaLabel: string;
};

const ArrowLeft = () => (
  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M11 6H1M6 1L1 6l5 5" />
  </svg>
);

const ArrowRight = () => (
  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M1 6h10M6 1l5 5-5 5" />
  </svg>
);

export default function CaseCarousel({
  cases,
  prevLabel,
  nextLabel,
  counterTemplate,
  ctaLabel,
}: CaseCarouselProps) {
  const [index, setIndex] = useState(0);
  const c = cases[index];
  const counter = counterTemplate
    .replace("{current}", String(index + 1))
    .replace("{total}", String(cases.length));

  return (
    <div className="case-carousel">
      <div className="case-nav">
        <button
          className="case-arrow"
          onClick={() => setIndex((i) => (i - 1 + cases.length) % cases.length)}
          aria-label={prevLabel}
        >
          <ArrowLeft />
        </button>
        <span className="case-counter">{counter}</span>
        <button
          className="case-arrow"
          onClick={() => setIndex((i) => (i + 1) % cases.length)}
          aria-label={nextLabel}
        >
          <ArrowRight />
        </button>
      </div>

      <div className="case-slide" key={index}>
        <div className="case-slide-header">
          <span className="case-client">{c.client}</span>
          <span className="case-tag">{c.tag}</span>
        </div>

        <p className="case-desc">{c.desc}</p>

        <div className="case-detail">
          <div className="case-detail-label">Challenge</div>
          <p className="case-detail-text">{c.challenge}</p>
        </div>

        <div className="case-detail">
          <div className="case-detail-label">Solution</div>
          <p className="case-detail-text">{c.solution}</p>
        </div>

        <div className="case-results">
          {c.results.map((r, i) => (
            <div key={i} className="case-result">
              <span className="case-result-metric">{r.metric}</span>
              <span className="case-result-label">{r.label}</span>
            </div>
          ))}
        </div>

        {c.link && (
          <a
            className="cta"
            href={c.link}
            target="_blank"
            rel="noopener noreferrer"
          >
            {ctaLabel}
            <ArrowRight />
          </a>
        )}
      </div>
    </div>
  );
}
