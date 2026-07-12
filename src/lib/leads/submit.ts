/** Client-side helper to submit a lead to POST /api/v1/leads. */

export type LeadSubmitResult =
  | { ok: true; leadId: string }
  | { ok: false; error: string };

function deviceType(): "mobile" | "tablet" | "desktop" {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (/iPad|Tablet/i.test(ua)) return "tablet";
  if (/Mobi|Android|iPhone/i.test(ua)) return "mobile";
  return "desktop";
}

function readUtm(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const p = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
    const v = p.get(k);
    if (v) utm[k] = v;
  }
  return utm;
}

/** Submits a lead, attaching attribution metadata automatically. */
export async function submitLead(
  body: Record<string, unknown>,
): Promise<LeadSubmitResult> {
  const meta = {
    sourceUrl: typeof window !== "undefined" ? window.location.pathname + window.location.search : undefined,
    referrer: typeof document !== "undefined" ? document.referrer || undefined : undefined,
    device: deviceType(),
    utm: readUtm(),
  };

  try {
    const res = await fetch("/api/v1/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, meta }),
    });
    const json = await res.json();
    if (res.ok && json?.data?.leadId) return { ok: true, leadId: json.data.leadId };
    return { ok: false, error: json?.error?.message || "Something went wrong. Please call us." };
  } catch {
    return { ok: false, error: "Network error. Please try again or call us." };
  }
}
