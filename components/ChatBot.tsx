"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useState, useRef, useEffect, useMemo } from "react";

type Flow = "build" | "inquiry";

function textOf(msg: UIMessage): string {
  return msg.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

export interface ChatBotDict {
  buildCta: string;
  inquiryCta: string;
  titleBuild: string;
  titleInquiry: string;
  close: string;
  submit: string;
  submitting: string;
  placeholder: string;
  buildGreeting: string;
  inquiryGreeting: string;
  success: string;
  error: string;
}

function ChatPanel({
  flow,
  dict,
  locale,
  onClose,
}: {
  flow: Flow;
  dict: ChatBotDict;
  locale: string;
  onClose: () => void;
}) {
  const greeting =
    flow === "build" ? dict.buildGreeting : dict.inquiryGreeting;
  const title = flow === "build" ? dict.titleBuild : dict.titleInquiry;

  const [input, setInput] = useState("");
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "sending" | "done" | "error"
  >("idle");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat", body: { flow, locale } }),
    [flow, locale]
  );

  const initialMessages: UIMessage[] = [
    {
      id: "greeting",
      role: "assistant",
      parts: [{ type: "text", text: greeting }],
    },
  ];

  const { messages, sendMessage, status, error, clearError } = useChat({
    transport,
    messages: initialMessages,
  });

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, status]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [status]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || (status !== "ready" && status !== "error")) return;
    if (status === "error") clearError();
    setInput("");
    sendMessage({ text });
  };

  const handleSubmit = async () => {
    setSubmitStatus("sending");
    try {
      const transcript = messages.map((m) => ({
        role: m.role,
        content: textOf(m),
      }));
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flow, messages: transcript }),
      });
      if (!res.ok) throw new Error();
      setSubmitStatus("done");
    } catch {
      setSubmitStatus("error");
    }
  };

  const busy = status === "submitted" || status === "streaming";
  const chatError = status === "error";
  const done = submitStatus === "done" || submitStatus === "error";

  return (
    <div className="chatbot-panel open">
      <div className="chatbot-header">
        <span className="chatbot-title">{title}</span>
        <button className="chatbot-close" onClick={onClose} type="button">
          {dict.close}
        </button>
      </div>

      <div className="chatbot-messages" ref={scrollRef}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chatbot-msg ${msg.role === "user" ? "user" : "bot"}`}
          >
            {textOf(msg)}
          </div>
        ))}
        {busy && messages[messages.length - 1]?.role === "user" && (
          <div className="chatbot-msg bot">
            <span className="chatbot-dots">
              <span />
              <span />
              <span />
            </span>
          </div>
        )}
        {status === "error" && (
          <div className="chatbot-msg bot" role="alert">
            <span className="form-error">{dict.error}</span>
          </div>
        )}
        {submitStatus === "done" && (
          <div className="chatbot-msg bot" role="status">
            <span className="form-success">{dict.success}</span>
          </div>
        )}
        {submitStatus === "error" && (
          <div className="chatbot-msg bot" role="alert">
            <span className="form-error">{dict.error}</span>
          </div>
        )}
      </div>

      {!done && (
        <div className="chatbot-footer">
          <form
            className="chatbot-input-area"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input
              ref={inputRef}
              className="chatbot-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={dict.placeholder}
              autoComplete="off"
              disabled={busy && !chatError}
            />
            <button
              type="submit"
              className="chatbot-send"
              disabled={busy && !chatError}
              aria-label="Send"
            >
              <svg
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M1 6h10M6 1l5 5-5 5" />
              </svg>
            </button>
          </form>
          <button
            className="chatbot-submit"
            type="button"
            onClick={handleSubmit}
            disabled={submitStatus === "sending" || messages.length < 2}
          >
            {submitStatus === "sending" ? dict.submitting : dict.submit}
          </button>
        </div>
      )}
    </div>
  );
}

export default function ChatBot({
  dict,
  locale,
}: {
  dict: ChatBotDict;
  locale: string;
}) {
  const [open, setOpen] = useState(false);
  const [flow, setFlow] = useState<Flow>("build");
  const [sessionKey, setSessionKey] = useState(0);

  const startFlow = (f: Flow) => {
    setFlow(f);
    setOpen(true);
    setSessionKey((k) => k + 1);
  };

  useEffect(() => {
    const openBuild = () => startFlow("build");
    const openInquiry = () => startFlow("inquiry");
    const buildEls = document.querySelectorAll("[data-chatbot-build]");
    const inquiryEls = document.querySelectorAll("[data-chatbot-inquiry]");
    buildEls.forEach((el) => el.addEventListener("click", openBuild));
    inquiryEls.forEach((el) => el.addEventListener("click", openInquiry));
    return () => {
      buildEls.forEach((el) => el.removeEventListener("click", openBuild));
      inquiryEls.forEach((el) =>
        el.removeEventListener("click", openInquiry)
      );
    };
  }, []);

  return (
    <>
      <button
        className={`chatbot-trigger${open ? " hidden" : ""}`}
        onClick={() => startFlow("build")}
        type="button"
        aria-label={dict.buildCta}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        {dict.buildCta}
      </button>

      {open && (
        <ChatPanel
          key={sessionKey}
          flow={flow}
          dict={dict}
          locale={locale}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
