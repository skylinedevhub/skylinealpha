"use client";

import { useState, type FormEvent } from "react";

export interface ContactFormDict {
  service: string;
  serviceOptions: string[];
  companySize: string;
  sizeOptions: string[];
  budget: string;
  budgetOptions: string[];
  email: string;
  message: string;
  send: string;
  sending: string;
  sent: string;
  error: string;
}

export default function ContactForm({ dict }: { dict: ContactFormDict }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [invalid, setInvalid] = useState<Record<string, string>>({});

  const clearFieldError = (name: string) => {
    if (!invalid[name]) return;
    setInvalid((prev) => {
      if (!prev[name]) return prev;
      const { [name]: _, ...rest } = prev;
      return rest;
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formEl = e.currentTarget;

    // Field-level validation via HTML5 constraint API. validationMessage is
    // locale-aware from the browser, which saves us adding per-field error
    // strings to the i18n dictionary.
    const errors: Record<string, string> = {};
    for (const el of Array.from(formEl.elements)) {
      if (
        (el instanceof HTMLInputElement ||
          el instanceof HTMLSelectElement ||
          el instanceof HTMLTextAreaElement) &&
        el.name &&
        !el.validity.valid
      ) {
        errors[el.name] = el.validationMessage;
      }
    }
    if (Object.keys(errors).length > 0) {
      setInvalid(errors);
      return;
    }
    setInvalid({});
    setStatus("sending");

    const form = new FormData(formEl);
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flow: "contact-form",
          messages: [
            {
              role: "user",
              content: [
                `Service: ${form.get("service")}`,
                `Company size: ${form.get("companySize")}`,
                `Budget: ${form.get("budget")}`,
                `Email: ${form.get("email")}`,
                `Message: ${form.get("message") || "N/A"}`,
              ].join("\n"),
            },
          ],
        }),
      });
      if (!res.ok) throw new Error();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  if (status === "sent") return <p className="form-success">{dict.sent}</p>;

  const fieldProps = (name: string) => ({
    "aria-invalid": invalid[name] ? ("true" as const) : undefined,
    onInput: () => clearFieldError(name),
    onChange: () => clearFieldError(name),
  });

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      <div className="form-field">
        <label htmlFor="cf-service">{dict.service}</label>
        <select id="cf-service" name="service" required {...fieldProps("service")}>
          <option value="">—</option>
          {dict.serviceOptions.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        {invalid.service && <span className="form-error">{invalid.service}</span>}
      </div>

      <div className="form-field">
        <label htmlFor="cf-size">{dict.companySize}</label>
        <select id="cf-size" name="companySize" required {...fieldProps("companySize")}>
          <option value="">—</option>
          {dict.sizeOptions.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        {invalid.companySize && <span className="form-error">{invalid.companySize}</span>}
      </div>

      <div className="form-field">
        <label htmlFor="cf-budget">{dict.budget}</label>
        <select id="cf-budget" name="budget" required {...fieldProps("budget")}>
          <option value="">—</option>
          {dict.budgetOptions.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        {invalid.budget && <span className="form-error">{invalid.budget}</span>}
      </div>

      <div className="form-field">
        <label htmlFor="cf-email">{dict.email}</label>
        <input
          id="cf-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          {...fieldProps("email")}
        />
        {invalid.email && <span className="form-error">{invalid.email}</span>}
      </div>

      <div className="form-field">
        <label htmlFor="cf-message">{dict.message}</label>
        <textarea id="cf-message" name="message" rows={3} {...fieldProps("message")} />
        {invalid.message && <span className="form-error">{invalid.message}</span>}
      </div>

      <button type="submit" className="cta" disabled={status === "sending"}>
        {status === "sending" ? dict.sending : dict.send}
      </button>
      {status === "error" && (
        <span className="form-error" role="alert">{dict.error}</span>
      )}
    </form>
  );
}
