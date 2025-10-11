export const config = { runtime: "edge" }; // explicitly Edge to avoid Node/Buffer issues

function json(data, { status = 200, headers = {} } = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers }
  });
}

async function callOpenAI(prompt) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return json({ ok:false, reason:"no-key", provider:"openai", status:401 });
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method:"POST",
    headers:{ "content-type":"application/json", "authorization":`Bearer ${key}` },
    body: JSON.stringify({ model:"gpt-4o-mini", messages:[{ role:"user", content: prompt || "Say hello." }], temperature:0.2 })
  });
  const text = await r.text();
  if (!r.ok) return json({ ok:false, reason:"openai-error", provider:"openai", status:r.status, body:text.slice(0,500) });
  const data = JSON.parse(text);
  return json({ ok:true, provider:"openai", reply:data?.choices?.[0]?.message?.content ?? "" });
}

export default async function handler(request) {
  // CORS
  const cors = {
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "content-type, authorization",
    "access-control-allow-methods": "GET,POST,OPTIONS"
  };
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

  const url = new URL(request.url);
  const mode = (url.searchParams.get("mode") || "echo").toLowerCase();

  if (request.method === "GET") {
    return json({ ok:true, method:"GET", mode, diag:"/api/chat-edge ready; POST with {messages:[...]}. ?mode=openai to call OpenAI." }, { headers: cors });
  }
  if (request.method !== "POST") {
    return json({ ok:false, reason:"method-not-allowed", method: request.method }, { status: 405, headers: cors });
  }

  let body = {};
  try { body = await request.json(); } catch {}
  const userMsg = body?.messages?.[0]?.content || body?.prompt || "";

  if (mode === "openai") {
    const r = await callOpenAI(userMsg);
    // inject CORS on the way out
    const h = new Headers(r.headers); for (const [k,v] of Object.entries(cors)) h.set(k, v);
    return new Response(await r.text(), { status: r.status, headers: h });
  }

  return json({ ok:true, mode:"echo", echo: userMsg || "no-msg" }, { headers: cors });
}