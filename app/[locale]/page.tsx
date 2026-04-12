import { getDictionary } from "@/i18n/getDictionary";
import { locales, type Locale } from "@/i18n/config";
import SkylineEngine from "@/components/SkylineEngine";
import LanguageToggle from "@/components/LanguageToggle";
import ChatBot from "@/components/ChatBot";
import CaseCarousel from "@/components/CaseCarousel";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);
  return {
    title: dict.meta.title,
    description: dict.meta.description,
  };
}

const ArrowIcon = () => (
  <svg
    viewBox="0 0 12 12"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M1 6h10M6 1l5 5-5 5" />
  </svg>
);

/* All dangerouslySetInnerHTML usage below is safe: content comes exclusively
   from our own static JSON dictionary files, never from user input. */

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);

  const titleHtml = (text: string) => text.replace(/\n/g, "<br>");

  return (
    <>
      <SkylineEngine sceneNames={dict.scenes} />

      <canvas id="webgl-canvas" />

      <nav id="top-nav">
        <div className="nav-wordmark">Skyline DevHub</div>
        <div className="nav-links">
          <a href="#p1" className="nav-link">
            {dict.nav.about}
          </a>
          <a href="#p2" className="nav-link">
            {dict.nav.approach}
          </a>
          <a href="#p3" className="nav-link">
            {dict.nav.work}
          </a>
          <a href="#p4" className="nav-link">
            {dict.nav.contact}
          </a>
        </div>
<LanguageToggle locale={locale} />
      </nav>

      <div id="hud">
        <div id="hud-pct">000%</div>
        <div className="progress-bar">
          <div className="progress-fill" id="prog-fill" />
        </div>
        <div className="scene-label" id="scene-name">
          {dict.scenes[0]}
        </div>
      </div>

      <button id="theme-toggle" aria-label={dict.themeToggle}>
        <svg
          className="icon-sun"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
        <svg
          className="icon-moon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
        </svg>
      </button>

      <div id="scene-strip">
        {dict.dots.map((label: string, i: number) => (
          <div
            key={i}
            className={`scene-dot${i === 0 ? " active" : ""}`}
            data-label={label}
          />
        ))}
      </div>

      <div id="scroll-spacer" />

      <div id="scroll-cards" className="hidden">
        {dict.scrollCards.map(
          (
            card: { tag: string; title: string; sub: string; cta: string },
            i: number
          ) => (
            <div
              key={i}
              className={`scroll-card${i === 0 ? " active" : ""}`}
              data-scene={i}
            >
              <div className="sc-tag">{card.tag}</div>
              {/* Safe: static dictionary content only */}
              <div
                className="sc-title"
                dangerouslySetInnerHTML={{ __html: titleHtml(card.title) }}
              />
              <div className="sc-sub">{card.sub}</div>
              <a className="sc-cta" href={`#p${i}`}>
                {card.cta}
                <ArrowIcon />
              </a>
            </div>
          )
        )}
      </div>

      <div id="pages">
        {/* Hero */}
        <div className="page active" data-page="0">
          <div className="text-card">
            <div className="tag">{dict.pages.hero.tag}</div>
            <h1
              dangerouslySetInnerHTML={{
                __html: titleHtml(dict.pages.hero.title),
              }}
            />
            <p className="body-text">{dict.pages.hero.body}</p>
            <p className="body-text hero-free">{dict.pages.hero.free}</p>
            <div className="cta-row">
              <button data-chatbot-build type="button" className="cta">
                {dict.chatbot.buildCta}
                <ArrowIcon />
              </button>
              <a className="cta" href="#p1">
                {dict.pages.hero.cta}
                <ArrowIcon />
              </a>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="page" data-page="1">
          <div className="text-card right">
            <div className="h-line" />
            <div className="tag">{dict.pages.about.tag}</div>
            <h2
              dangerouslySetInnerHTML={{
                __html: titleHtml(dict.pages.about.title),
              }}
            />
            <p className="body-text">{dict.pages.about.body1}</p>
            <p className="body-text">{dict.pages.about.body2}</p>
            <a className="cta" href="#p2">
              {dict.pages.about.cta}
              <ArrowIcon />
            </a>
          </div>
        </div>

        {/* Approach */}
        <div className="page" data-page="2">
          <div className="text-card">
            <div className="h-line" />
            <div className="tag">{dict.pages.approach.tag}</div>
            <h2
              dangerouslySetInnerHTML={{
                __html: titleHtml(dict.pages.approach.title),
              }}
            />
            <p className="body-text">{dict.pages.approach.body1}</p>
            <div className="project-list">
              {dict.pages.approach.projects.map(
                (proj: { name: string; type: string }, i: number) => (
                  <div key={i} className="project-item">
                    <span className="project-name">{proj.name}</span>
                    <span className="project-type">{proj.type}</span>
                  </div>
                )
              )}
            </div>
            <p className="body-text" style={{ marginBlockStart: "1.5rem" }}>
              {dict.pages.approach.body2}
            </p>
            <a className="cta" href="#p3">
              {dict.pages.approach.cta}
              <ArrowIcon />
            </a>
          </div>
        </div>

        {/* Work */}
        <div className="page" data-page="3">
          <div className="text-card right">
            <div className="h-line" />
            <div className="tag">{dict.pages.work.tag}</div>
            <h2
              dangerouslySetInnerHTML={{
                __html: titleHtml(dict.pages.work.title),
              }}
            />
            <p className="body-text">{dict.pages.work.body}</p>
            <CaseCarousel
              cases={dict.pages.work.cases}
              prevLabel={dict.pages.work.prev}
              nextLabel={dict.pages.work.next}
              counterTemplate={dict.pages.work.counter}
              ctaLabel={dict.pages.work.cta}
            />
          </div>
        </div>

        {/* Contact */}
        <div className="page" data-page="4">
          <div className="text-card">
            <div className="h-line" />
            <div className="tag">{dict.pages.contact.tag}</div>
            <h2
              dangerouslySetInnerHTML={{
                __html: titleHtml(dict.pages.contact.title),
              }}
            />
            <p className="body-text">{dict.pages.contact.body}</p>
            <div className="contact-grid">
              <div className="contact-block">
                <span className="contact-label">
                  {dict.pages.contact.labels[0]}
                </span>
                <span className="contact-value">
                  info@skylinedevelopmenthub.com
                </span>
              </div>
              <div className="contact-block">
                <span className="contact-label">
                  {dict.pages.contact.labels[1]}
                </span>
                <span className="contact-value">
                  support@skylinedevelopmenthub.com
                </span>
              </div>
              <div className="contact-block">
                <span className="contact-label">
                  {dict.pages.contact.labels[2]}
                </span>
                <span className="contact-value">
                  contact@skylinedevelopmenthub.com
                </span>
              </div>
            </div>
            <div className="stat-row">
              <div className="stat">
                <span className="stat-num">TIA</span>
                <span className="stat-label">
                  {dict.pages.contact.statLabel}
                </span>
              </div>
            </div>
            <div className="cta-row">
              <button data-chatbot-build type="button" className="cta">
                {dict.chatbot.buildCta}
                <ArrowIcon />
              </button>
              <button data-chatbot-inquiry type="button" className="cta">
                {dict.chatbot.inquiryCta}
                <ArrowIcon />
              </button>
            </div>
            <a className="cta" href="#p0">
              {dict.pages.contact.cta}
              <ArrowIcon />
            </a>
          </div>
        </div>
      </div>

      <div id="credit">
        {/* Safe: static dictionary content only */}
        <span dangerouslySetInnerHTML={{ __html: dict.credit }} />
      </div>

      <ChatBot dict={dict.chatbot} locale={locale} />

      <footer id="legal-footer">
        <a href={`/${locale}/legal/privacy-policy`}>{dict.footer.privacy}</a>
        <span className="legal-sep">&middot;</span>
        <a href={`/${locale}/legal/terms-of-service`}>{dict.footer.terms}</a>
        <span className="legal-sep">&middot;</span>
        <a href={`/${locale}/legal/gdpr-compliance`}>{dict.footer.gdpr}</a>
        <span className="legal-sep">&middot;</span>
        <a href={`/${locale}/legal/security`}>{dict.footer.security}</a>
      </footer>
    </>
  );
}
