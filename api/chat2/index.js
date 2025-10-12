export default async function handler(req, res) {
  // GET ping for your debug drawer
  if (req.method === "GET" && "ping" in (req.query || {})) {
    return res.status(200).json({ ok: true, method: "GET", version: "chat2-tools-v3" });
  }

  try {
    const body = await readJson(req);
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const user = (messages[messages.length - 1]?.content || "").slice(0, 2000);
    const wantTrace = !!(body?.trace || req.query?.trace);

    // Broader trigger: almost any rates/news/market query gets tools by default
    const vague = user.trim().length < 12 || /\b(rate|rates|mortgage|market|today|news|mbs|treasury|10y)\b/i.test(user);
    const wantsFRED = vague || /(\b10y\b|treasury|yield|trend)/i.test(user);
    const wantsNews = vague || /(news|headline|this week|today)/i.test(user);

    const base = origin(req);
    const trace = { user, wantsFRED, wantsNews, calls: [] };

    const tools = {};
    if (wantsFRED) {
      const t0 = Date.now();
      tools.fred = await safeJson(`${base}/api/fred?series=DGS10&limit=60`, trace, "fred", t0);
    }
    if (wantsNews) {
      const t0 = Date.now();
      const q = encodeURIComponent(user || "mortgage rates news");
      tools.news = await safeJson(`${base}/api/tavily?q=${q}`, trace, "tavily", t0);
    }

    const reply = composeReply(user, tools);
    const payload = { ok: true, version: "chat2-tools-v3", reply, toolsUsed: Object.keys(tools).filter(k => tools[k]?.ok === true) };
    if (wantTrace) payload.trace = trace;

    // avoid caching chat responses while we debug
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(payload);
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
}

function origin(req) {
  const proto = (req.headers["x-forwarded-proto"] || "https");
  const host  = (req.headers["x-forwarded-host"]  || req.headers.host);
  return `${proto}://${host}`;
}

async function readJson(req) {
  if (req.method !== "POST") return {};
  const chunks = []; for await (const c of req) chunks.push(c);
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { return {}; }
}

async function safeJson(url, trace, name, t0) {
  try {
    const r = await fetch(url, { headers: { "Cache-Control": "no-cache" } });
    const ms = Date.now() - t0;
    const cache = r.headers.get("x-vercel-cache") || "?";
    const status = r.status;
    let data = null;
    try { data = await r.json(); } catch { data = { ok:false, error:"bad json" }; }

    trace.calls.push({ name, url, status, ms, cache, ok: !!data?.ok, error: data?.error || null });
    return data;
  } catch (err) {
    trace.calls.push({ name, url, status: 0, ms: Date.now() - t0, cache: "?", ok: false, error: String(err) });
    return null;
  }
}

function composeReply(user, tools) {
  const out = [];
  if (tools?.fred?.ok && Array.isArray(tools.fred.points) && tools.fred.points.length) {
    const pts = tools.fred.points.slice(0, 60);
    const last = pts[0];
    const prior = pts[pts.length - 1];
    const delta = (last.value - prior.value).toFixed(2);
    out.push(`10-year Treasury: **${last.value}%** (${delta} vs ~${pts.length} points ago).`);
  }
  if (tools?.news?.ok && Array.isArray(tools.news.items) && tools.news.items.length) {
    const lines = tools.news.items.slice(0, 3).map(i => ` ${i.title}`);
    out.push(`Recent headlines:\n${lines.join("\n")}`);
  }
  if (!out.length) {
    out.push("What do you want to check: payment, qualification, seller credits, or todays rate vibe?");
  }
  out.push("_Data is educational, not a rate quote._");
  return out.join("\n\n");
}