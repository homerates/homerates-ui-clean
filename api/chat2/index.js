export const runtime = "edge";

// Adjust for your domains if you need stricter CORS:
const ALLOW_ORIGIN = "*"; // set to your domain when ready

function json(data, status = 200, moreHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store, max-age=0",
      "x-handler": "chat2@edge",
      "access-control-allow-origin": ALLOW_ORIGIN,
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type,authorization",
      ...moreHeaders
    }
  });
}

export default async function handler(req) {
  // CORS preflight
  if (req.method === "OPTIONS") return json({ ok: true });

  if (req.method === "GET") {
    // Lightweight probe for health checks
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

  if (req.method === "POST") {
    try {
      const body = await req.json().catch(() => ({}));
      const { messages = [], system = "", tools = {} } = body || {};

      //  Example guard: require OpenAI key before proceeding
      if (!process.env.OPENAI_API_KEY) {
        return json({ ok: false, error: "Missing OPENAI_API_KEY" }, 500);
      }

      // TODO: plug in your real chat logic here.
      // Keep it Edge-safe (no fs/tls/net). Use fetch() for OpenAI/Tavily.
      //
      // Example skeleton (disabled for now):
      // const r = await fetch("https://api.openai.com/v1/responses", {
      //   method: "POST",
      //   headers: {
      //     "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      //     "Content-Type": "application/json"
      //   },
      //   body: JSON.stringify({
      //     model: "gpt-4.1-mini",
      //     input: [{ role: "system", content: system }, ...messages]
      //   })
      // });
      // const data = await r.json();
      // return json({ ok: true, model: data.model, output: data.output });

      return json({
        ok: true,
        route: "chat2",
        runtime: "edge",
        method: "POST",
        echo: { count: messages.length, hasSystem: Boolean(system), tools: Object.keys(tools || {}).length }
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

  return json({ ok: false, error: "Method not allowed" }, 405);
}
