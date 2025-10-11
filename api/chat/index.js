function send(res, code, obj, extraHeaders) {
  res.statusCode = code;
  res.setHeader("Content-Type","application/json");
  res.setHeader("Cache-Control","no-store");
  if (extraHeaders) for (const [k,v] of Object.entries(extraHeaders)) res.setHeader(k, v);
  res.end(JSON.stringify(obj));
}

async function readJson(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  try { return JSON.parse(Buffer.concat(chunks).toString() || "{}"); }
  catch { return {}; }
}

async function callOpenAI(prompt) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return { ok:false, reason:"no-key", provider:"openai", status:401 };
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method:"POST",
    headers:{ "Content-Type":"application/json", "Authorization":`Bearer ${key}` },
    body: JSON.stringify({ model:"gpt-4o-mini", messages:[{ role:"user", content: prompt || "Say hello." }], temperature:0.2 })
  });
  const text = await r.text();
  if (!r.ok) return { ok:false, reason:"openai-error", provider:"openai", status:r.status, body:text.slice(0,500) };
  const data = JSON.parse(text);
  return { ok:true, provider:"openai", reply:data?.choices?.[0]?.message?.content ?? "" };
}

module.exports = async (req, res) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
  };

  if (req.method === "OPTIONS") { res.statusCode = 204; for (const [k,v] of Object.entries(cors)) res.setHeader(k,v); return res.end(); }

  try {
    for (const [k,v] of Object.entries(cors)) res.setHeader(k,v);
    const url = new URL(req.url, `https://${req.headers.host}`);
    const mode = (url.searchParams.get("mode") || "echo").toLowerCase();

    if (req.method === "GET") {
      return send(res, 200, { ok:true, method:"GET", mode, diag:"/api/chat ready; POST with {messages:[...]}. ?mode=openai to call OpenAI." });
    }

    if (req.method !== "POST") {
      return send(res, 405, { ok:false, reason:"method-not-allowed", method:req.method });
    }

    const body = await readJson(req);
    const userMsg = body?.messages?.[0]?.content || body?.prompt || "";

    if (mode === "openai") {
      const out = await callOpenAI(userMsg);
      return send(res, 200, out);
    }

    return send(res, 200, { ok:true, mode:"echo", echo:userMsg || "no-msg" });
  } catch (e) {
    return send(res, 200, { ok:false, reason:"handler-exception", error:String(e?.message || e) });
  }
};