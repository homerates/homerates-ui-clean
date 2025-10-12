export default async function handler(req, res) {
  // Lightweight GET ping for your debug drawer
  if (req.method === "GET" && "ping" in (req.query || {})) {
    return res.status(200).json({ ok: true, method: "GET", version: "chat2-tools-v1" });
  }
  try {
    const body = await readJson(req);
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const user = (messages[messages.length-1]?.content || "").slice(0, 2000);

    const wantsFRED = /(\b10y\b|treasury|yield|trend|market|rate\s*(trend|today))/i.test(user);
    const wantsNews = /(news|headline|what(\s|)is happening|today|this week)/i.test(user);

    const base = origin(req);
    const tools = {};
    if (wantsFRED) tools.fred = await safeJson(`${base}/api/fred?series=DGS10&limit=60`);
    if (wantsNews) tools.news = await safeJson(`${base}/api/tavily?q=${encodeURIComponent(user || "mortgage rates news")}`);

    const reply = composeReply(user, tools);
    return res.status(200).json({ ok: true, version: "chat2-tools-v1", reply, toolsUsed: Object.keys(tools).filter(k => tools[k]) });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
}

function origin(req) {
  const proto = (req.headers["x-forwarded-proto"] || "https");
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${proto}://${host}`;
}
async function readJson(req){
  if (req.method !== "POST") return {};
  const chunks=[]; for await (const c of req) chunks.push(c);
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { return {}; }
}
async function safeJson(url){
  try { const r=await fetch(url,{headers:{ "Cache-Control":"no-cache"}}); return await r.json(); }
  catch { return null; }
}
function composeReply(user, tools){
  const parts=[];
  if (tools.fred?.ok && Array.isArray(tools.fred.points) && tools.fred.points.length){
    const pts = tools.fred.points.slice(0,60);
    const last = pts[0]; const prior = pts[pts.length-1];
    const delta = (last.value - prior.value).toFixed(2);
    parts.push(`10-year Treasury: **${last.value}%** (${delta} vs ~${pts.length} points ago).`);
  }
  if (tools.news?.ok && Array.isArray(tools.news.items) && tools.news.items.length){
    const lines = tools.news.items.slice(0,3).map(i=>` ${i.title}`);
    parts.push(`Recent headlines:\n${lines.join("\n")}`);
  }
  if (!parts.length) parts.push("What do you want to check: payment, qualification, seller credits, or todays rate vibe?");
  parts.push("_Data is educational, not a rate quote._");
  return parts.join("\n\n");
}