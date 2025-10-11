export const runtime = "edge";

// simple JSON helper
function json(data, status = 200, moreHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store, max-age=0",
      "x-handler": "chat2@edge",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type,authorization",
      ...moreHeaders
    }
  });
}

export default async function handler(req) {
  // --- CORS preflight ---
  if (req.method === "OPTIONS") return json({ ok: true });

  // --- GET probe (for health + env check) ---
  if (req.method === "GET") {
    return json({
      ok: true,
      route: "chat2",
      runtime: "edge",
      method: "GET",
      version: "v1.0.0",
      now: new Date().toISOString(),
      env: {
        hasOpenAI: Boolean(process.env.OPENAI_API_KEY),
        hasTavily: Boolean(process.env.TAVILY_API_KEY),
        hasFRED: Boolean(process.env.FRED_API_KEY)
      }
    });
  }

  // --- POST readiness echo ---
  if (req.method === "POST") {
    try {
      const body = await req.json().catch(() => ({}));
      const { messages = [], system = "", tools = {} } = body || {};

      return json({
        ok: true,
        route: "chat2",
        runtime: "edge",
        method: "POST",
        echo: {
          count: messages.length,
          firstRole: messages[0]?.role || null,
          hasSystem: Boolean(system),
          toolCount: Object.keys(tools || {}).length
        }
      });
    } catch (err) {
      return json({
        ok: false,
        route: "chat2",
        runtime: "edge",
        error: err?.message || "unknown"
      }, 500);
    }
  }

  // --- fallback for unsupported methods ---
  return json({ ok: false, error: "Method not allowed" }, 405);
}
