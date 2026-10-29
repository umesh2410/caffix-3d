"use client";

import { useState } from "react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<{ kind: "idle" | "busy" | "ok" | "error"; message?: string }>({ kind: "idle" });

  return (
    <form
      className="newsletter"
      onSubmit={async (e) => {
        e.preventDefault();
        setState({ kind: "busy" });
        try {
          const res = await fetch("/api/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });
          const data = await res.json();
          setState({ kind: res.ok ? "ok" : "error", message: data.message });
          if (res.ok) setEmail("");
        } catch {
          setState({ kind: "error", message: "Couldn't subscribe right now. Please try again." });
        }
      }}
    >
      <p className="footer__heading">Be the first to know</p>
      <p className="footer__muted">Subscribe for New Drops &amp; Newsletter!</p>
      <div className="newsletter__row">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit" className="btn btn--primary" disabled={state.kind === "busy"}>
          {state.kind === "busy" ? "…" : "Subscribe"}
        </button>
      </div>
      {state.message && (
        <p className={`newsletter__msg${state.kind === "error" ? " is-error" : ""}`} role="status">
          {state.message}
        </p>
      )}
    </form>
  );
}
