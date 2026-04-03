import { streamText, convertToModelMessages } from "ai";
import { google } from "@ai-sdk/google";
import { NextResponse } from "next/server";

const SYSTEM_BUILD = `You are a friendly project intake assistant for Skyline DevHub, a development company in Tirana, Albania that builds AI-native digital solutions. A visitor wants a website built.

Your goal: have a natural, concise conversation to understand what they need. You're gathering info for a project brief that our team will review.

Things worth learning (but don't demand them — if they want to submit early, that's fine):
- Their name and business
- What kind of site (business, e-commerce, web app, portfolio, etc.)
- Key features or functionality they need
- Their timeline and urgency
- Contact email

Guidelines:
- Be warm but professional. Keep messages short (2-3 sentences max).
- Ask one question at a time, don't list multiple questions.
- If they give vague answers, ask a gentle follow-up.
- Don't repeat what they've already told you.
- They can submit the conversation at any time — don't try to stop them or insist on more info.
- Respond in the same language the user writes in.`;

const SYSTEM_INQUIRY = `You are a friendly assistant for Skyline DevHub, a development company in Tirana, Albania. We offer AI-native digital solutions: custom development, product suite, automation & workflow integration, and digital transformation advisory.

A visitor has a question about our services. Help them understand what we offer and how we might help their business.

Things worth learning naturally through conversation:
- What they're looking for or curious about
- Their business context
- Contact info for follow-up

Guidelines:
- Be warm but professional. Keep messages short (2-3 sentences max).
- You know about Skyline DevHub's services but don't make up specifics about pricing, timelines, or past projects beyond what's public.
- If they ask something you can't answer, suggest they'll get a detailed response from our team after submitting.
- They can submit the conversation at any time.
- Respond in the same language the user writes in.`;

export async function POST(req: Request) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return NextResponse.json(
      { error: "GOOGLE_GENERATIVE_AI_API_KEY is not configured" },
      { status: 500 }
    );
  }

  try {
    const { messages: rawMessages, flow } = await req.json();
    const system = flow === "inquiry" ? SYSTEM_INQUIRY : SYSTEM_BUILD;

    // Drop the client-side greeting (first assistant message) —
    // Gemini requires conversations to start with a user message.
    const messages = (rawMessages as Array<Record<string, unknown>>).filter(
      (m, i) => !(i === 0 && m.role === "assistant")
    ) as Parameters<typeof convertToModelMessages>[0];

    const result = streamText({
      model: google("gemini-2.0-flash"),
      system,
      messages: await convertToModelMessages(messages),
      onError: ({ error }) => {
        console.error("Gemini stream error:", error);
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
