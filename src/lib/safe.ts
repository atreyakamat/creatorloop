// Small, dependency-free safety helpers. Unit-tested in tests/unit/safe.test.ts.

// Only allow same-site relative redirects. Browsers treat "\" like "/" and strip
// tabs/newlines, so "/\evil.com" or "/\t/evil.com" would otherwise leave the site.
export function safeRedirectPath(value: unknown, fallback = "/dashboard"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return fallback;
  return value;
}

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

// User text that goes inside XML-style tags in an AI prompt: drop angle brackets
// so it can't close our tags or open new ones, and collapse runaway whitespace.
export function promptText(value: string | null | undefined, fallback = "not given"): string {
  const cleaned = (value ?? "").replace(/[<>]/g, "").replace(/\s{3,}/g, "  ").trim();
  return cleaned || fallback;
}

// Accept only http(s) links (blocks javascript:, data: and friends).
export function safeHttpUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function cleanInstagram(value: string | null | undefined): string | null {
  const handle = (value ?? "")
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/[/?#].*$/, "");
  return /^[A-Za-z0-9._]{1,30}$/.test(handle) ? handle : null;
}
