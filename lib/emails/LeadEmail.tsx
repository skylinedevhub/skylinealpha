/**
 * Skyline DevHub — Lead email template
 * Drop at: lib/emails/LeadEmail.tsx
 *
 * Used by app/api/lead/route.ts. Renders to HTML via @react-email/render.
 *
 * Install:
 *   npm i @react-email/components @react-email/render
 */

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Row,
  Column,
  Section,
  Text,
} from "@react-email/components";

interface LeadEmailProps {
  flow: "build" | "inquiry" | "contact-form";
  brief?: {
    name?: string;
    email?: string;
    business?: string;
    siteType?: string;
    features?: string[];
    timeline?: string;
    summary?: string;
  };
  formData?: Record<string, string>;
  transcript?: Array<{ role: "user" | "assistant"; content: string }>;
  receivedAt: string;
}

const HAIR = "1px solid rgba(255,255,255,0.15)";
const BG = "#0a0a0a";
const FG = "#e0e0e0";
const MUTED = "#666666";
const ACCENT = "#ffffff";

const FONT_DISPLAY = `'Bebas Neue', sans-serif`;
const FONT_MONO = `'DM Mono', ui-monospace, monospace`;

export function LeadEmail({ flow, brief, formData, transcript, receivedAt }: LeadEmailProps) {
  const title = flow === "build" ? "NEW PROJECT BRIEF" : flow === "inquiry" ? "NEW INQUIRY" : "CONTACT FORM";

  return (
    <Html>
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@300;400&display=swap"
          rel="stylesheet"
        />
      </Head>
      <Preview>{`${title} — Skyline DevHub`}</Preview>
      <Body style={{ background: BG, color: FG, fontFamily: FONT_MONO, margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 640, margin: "0 auto", padding: "40px 32px" }}>
          {/* Header — monogram + flow tag */}
          <Row>
            <Column>
              <Text
                style={{
                  fontFamily: FONT_DISPLAY,
                  fontSize: 32,
                  letterSpacing: "0.04em",
                  margin: 0,
                  color: FG,
                }}
              >
                S<span style={{ color: MUTED }}>/</span>
              </Text>
            </Column>
            <Column align="right">
              <Text
                style={{
                  fontSize: 10,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: MUTED,
                  margin: 0,
                }}
              >
                {receivedAt}
              </Text>
            </Column>
          </Row>

          <Hr style={{ border: "none", borderTop: HAIR, margin: "24px 0 32px" }} />

          <Text
            style={{
              fontSize: 10,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: ACCENT,
              margin: 0,
            }}
          >
            {flow.replace("-", " ")}
          </Text>
          <Heading
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 40,
              lineHeight: 0.95,
              letterSpacing: "0.03em",
              color: FG,
              margin: "8px 0 32px",
              fontWeight: 400,
            }}
          >
            {title}
          </Heading>

          {/* Brief fields */}
          {brief && (
            <Section>
              {Object.entries(brief).map(([k, v]) => {
                if (!v) return null;
                const val = Array.isArray(v) ? v.join(" · ") : v;
                return (
                  <Row key={k} style={{ borderBottom: HAIR }}>
                    <Column style={{ padding: "12px 0", width: "35%" }}>
                      <Text
                        style={{
                          fontSize: 10,
                          letterSpacing: "0.22em",
                          textTransform: "uppercase",
                          color: MUTED,
                          margin: 0,
                        }}
                      >
                        {k}
                      </Text>
                    </Column>
                    <Column style={{ padding: "12px 0" }}>
                      <Text style={{ fontSize: 13, color: FG, margin: 0, letterSpacing: "0.04em" }}>
                        {val}
                      </Text>
                    </Column>
                  </Row>
                );
              })}
            </Section>
          )}

          {/* Contact form fields */}
          {formData && (
            <Section>
              {Object.entries(formData).map(([k, v]) => (
                <Row key={k} style={{ borderBottom: HAIR }}>
                  <Column style={{ padding: "12px 0", width: "35%" }}>
                    <Text
                      style={{
                        fontSize: 10,
                        letterSpacing: "0.22em",
                        textTransform: "uppercase",
                        color: MUTED,
                        margin: 0,
                      }}
                    >
                      {k}
                    </Text>
                  </Column>
                  <Column style={{ padding: "12px 0" }}>
                    <Text style={{ fontSize: 13, color: FG, margin: 0, letterSpacing: "0.04em" }}>
                      {v}
                    </Text>
                  </Column>
                </Row>
              ))}
            </Section>
          )}

          {/* Transcript */}
          {transcript && transcript.length > 0 && (
            <>
              <Hr style={{ border: "none", borderTop: HAIR, margin: "40px 0 16px" }} />
              <Text
                style={{
                  fontSize: 10,
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  color: MUTED,
                  marginBottom: 16,
                }}
              >
                Transcript
              </Text>
              {transcript.map((m, i) => (
                <Text
                  key={i}
                  style={{
                    fontSize: 12,
                    lineHeight: 1.7,
                    color: m.role === "user" ? ACCENT : FG,
                    letterSpacing: "0.04em",
                    margin: "0 0 12px",
                  }}
                >
                  <strong
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: MUTED,
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    {m.role}
                  </strong>
                  {m.content}
                </Text>
              ))}
            </>
          )}

          <Hr style={{ border: "none", borderTop: HAIR, margin: "48px 0 16px" }} />
          <Text
            style={{
              fontSize: 9,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: MUTED,
              margin: 0,
            }}
          >
            Skyline DevHub &middot; Tirana, Albania &middot;{" "}
            <Link href="https://skylinedevelopmenthub.com" style={{ color: MUTED }}>
              skylinedevelopmenthub.com
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
