import { NextResponse } from "next/server";

interface LeadPayload {
  flow: "build" | "inquiry";
  messages: Array<{ role: string; content: string }>;
}

export async function POST(req: Request) {
  let data: LeadPayload;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!data.messages?.length || !data.flow) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const flowLabel =
    data.flow === "build" ? "Site Build Request" : "General Inquiry";

  const transcript = data.messages
    .map((m) => {
      const label = m.role === "user" ? "Visitor" : "Assistant";
      return `${label}: ${m.content}`;
    })
    .join("\n\n");

  const body = `Flow: ${flowLabel}\n\n=== Conversation ===\n\n${transcript}`;

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_EMAIL ?? "info@skylinedevelopmenthub.com";

  if (apiKey) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: `Skyline DevHub <${process.env.RESEND_FROM ?? "onboarding@resend.dev"}>`,
        to,
        subject: `[${flowLabel}] New chatbot lead`,
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
