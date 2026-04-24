import { NextResponse } from "next/server";
import { createElement } from "react";
import { generateText, Output } from "ai";
import { google } from "@ai-sdk/google";
import { render } from "@react-email/render";
import { z } from "zod";
import { LeadEmail } from "@/lib/emails/LeadEmail";

interface LeadPayload {
  flow: "build" | "inquiry" | "contact-form";
  messages: Array<{ role: string; content: string }>;
}

const briefSchema = z.object({
  client: z.object({
    name: z.string().nullable().describe("Person's name"),
    business_name: z.string().nullable().describe("Business or company name"),
    industry: z.string().nullable().describe("Industry or sector"),
    location: z.string().nullable().describe("City, country, or region"),
    email: z.string().nullable().describe("Email address"),
    phone: z.string().nullable().describe("Phone number"),
  }),
  project: z.object({
    site_type: z
      .string()
      .nullable()
      .describe(
        "Type of site: business, e-commerce, portfolio, web-app, landing-page, blog, etc."
      ),
    features: z
      .array(z.string())
      .describe("Requested features or functionality"),
    design_preferences: z
      .string()
      .nullable()
      .describe("Style, branding, or design direction mentioned"),
    content_requirements: z
      .string()
      .nullable()
      .describe("Content needs: copy, images, video, multilingual, etc."),
    timeline: z
      .string()
      .nullable()
      .describe("Deadline or urgency expressed"),
    budget: z.string().nullable().describe("Budget range or constraints"),
    additional_notes: z
      .string()
      .nullable()
      .describe("Anything else relevant that doesn't fit above"),
  }),
  summary: z
    .string()
    .describe(
      "2-3 sentence plain-English summary of what the client wants, suitable as a brief for a development team or autonomous agent"
    ),
});

async function extractBrief(
  flow: string,
  transcript: string
): Promise<z.infer<typeof briefSchema> | null> {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) return null;

  try {
    const { output } = await generateText({
      model: google("gemini-2.5-flash"),
      output: Output.object({ schema: briefSchema }),
      prompt: `Extract structured information from this ${flow === "build" ? "website project intake" : "general inquiry"} conversation.\n\nReturn null for any field not mentioned or not clearly inferrable. Do not invent information.\n\n${transcript}`,
    });
    return output;
  } catch (err) {
    console.error("Brief extraction failed:", err);
    return null;
  }
}

function toYaml(obj: Record<string, unknown>, indent = 0): string {
  const pad = "  ".repeat(indent);
  const lines: string[] = [];

  for (const [key, val] of Object.entries(obj)) {
    if (val === null || val === undefined) {
      lines.push(`${pad}${key}: null`);
    } else if (Array.isArray(val)) {
      if (val.length === 0) {
        lines.push(`${pad}${key}: []`);
      } else {
        lines.push(`${pad}${key}:`);
        for (const item of val) {
          lines.push(`${pad}  - ${String(item)}`);
        }
      }
    } else if (typeof val === "object") {
      lines.push(`${pad}${key}:`);
      lines.push(toYaml(val as Record<string, unknown>, indent + 1));
    } else {
      const s = String(val);
      const needsQuote = s.includes(":") || s.includes("#") || s.includes("\n");
      lines.push(`${pad}${key}: ${needsQuote ? JSON.stringify(s) : s}`);
    }
  }

  return lines.join("\n");
}

function formatEmail(
  flow: string,
  flowLabel: string,
  brief: z.infer<typeof briefSchema> | null,
  transcript: string
): string {
  const now = new Date().toISOString();
  const sections: string[] = [];

  if (brief) {
    const structured = { type: flowLabel, submitted: now, ...brief };

    // YAML block
    sections.push("---BEGIN YAML---");
    sections.push(toYaml(structured));
    sections.push("---END YAML---");

    // JSON block
    sections.push("");
    sections.push("---BEGIN JSON---");
    sections.push(JSON.stringify(structured, null, 2));
    sections.push("---END JSON---");
  } else {
    sections.push(`Type: ${flowLabel}`);
    sections.push(`Submitted: ${now}`);
    sections.push("(Structured extraction unavailable)");
  }

  // Raw transcript
  sections.push("");
  sections.push("---BEGIN TRANSCRIPT---");
  sections.push(transcript);
  sections.push("---END TRANSCRIPT---");

  return sections.join("\n");
}

export async function POST(req: Request) {
  let data: LeadPayload;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const validFlows: LeadPayload["flow"][] = ["build", "inquiry", "contact-form"];
  if (!data.messages?.length || !data.flow || !validFlows.includes(data.flow)) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const flowLabel =
    data.flow === "build"
      ? "Site Build Request"
      : data.flow === "contact-form"
      ? "Contact Form Inquiry"
      : "General Inquiry";

  const transcript = data.messages
    .map((m) => {
      const label = m.role === "user" ? "Visitor" : "Assistant";
      return `[${label}] ${m.content}`;
    })
    .join("\n\n");

  // Contact form data is already structured — skip Gemini extraction
  const brief =
    data.flow === "contact-form"
      ? null
      : await extractBrief(data.flow, transcript);
  const body = formatEmail(data.flow, flowLabel, brief, transcript);

  // Flatten the nested Zod-extracted brief into the shape LeadEmail expects
  const flatBrief = brief
    ? {
        name: brief.client.name ?? undefined,
        email: brief.client.email ?? undefined,
        business: brief.client.business_name ?? undefined,
        siteType: brief.project.site_type ?? undefined,
        features: brief.project.features,
        timeline: brief.project.timeline ?? undefined,
        summary: brief.summary,
      }
    : undefined;

  const transcriptForEmail = data.messages
    .filter((m): m is { role: "user" | "assistant"; content: string } =>
      m.role === "user" || m.role === "assistant"
    )
    .map((m) => ({ role: m.role, content: m.content }));

  const html = await render(
    createElement(LeadEmail, {
      flow: data.flow,
      brief: flatBrief,
      transcript: transcriptForEmail,
      receivedAt: new Date().toUTCString(),
    })
  );

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_EMAIL || "info@skylinedevelopmenthub.com";

  if (apiKey) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: `Skyline DevHub <${process.env.RESEND_FROM || "onboarding@resend.dev"}>`,
        to,
        subject: `[${flowLabel}] New chatbot lead`,
        html,
        text: body,
      }),
    });

    if (!res.ok) {
      console.error("Resend error:", await res.text());
      return NextResponse.json(
        { error: "Email delivery failed" },
        { status: 502 }
      );
    }
  } else {
    console.log(`── New lead: ${flowLabel} (RESEND_API_KEY not set) ──`);
    console.log(body);
    console.log("──────────────────────────────────────────────────────");
  }

  return NextResponse.json({ ok: true });
}
