/** Newsletter sign-up, forwarded to NEWSLETTER_WEBHOOK_URL (e.g. Mailchimp/Brevo via Zapier, or a Google Sheet). */
export async function POST(request: Request) {
  let email = "";
  try {
    email = String((await request.json())?.email ?? "").trim();
  } catch {
    // fall through to validation
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return Response.json({ ok: false, message: "Enter a valid email address." }, { status: 400 });
  }
  const url = process.env.NEWSLETTER_WEBHOOK_URL;
  if (!url) {
    return Response.json({ ok: false, message: "Sign-ups aren't connected yet. Please try again soon." }, { status: 503 });
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, source: "thecaffix.in" }),
    });
    if (!res.ok) throw new Error(String(res.status));
  } catch (e) {
    console.error("[subscribe] webhook failed", e);
    return Response.json({ ok: false, message: "Couldn't subscribe right now. Please try again." }, { status: 502 });
  }
  return Response.json({ ok: true, message: "You're on the list. New drops are coming your way." });
}
