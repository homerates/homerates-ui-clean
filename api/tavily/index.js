/**
 * api/tavily/index.js   v1.0 (frozen)
 * Contract:
 *  - GET /api/tavily?ping=1 -> { ok:true, service:"tavily", sha }
 *  - GET /api/tavily?q=...  -> { ok, answer?, items? } (200 always)
 *  - POST /api/tavily { "query": "..." } -> same as GET (manual body parse)
 *  - Always 200 responses; errors reported as { ok:false, error, q, sha }
 */
export default async function handler(req, res) {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA || "local";
  const key = process.env.TAVILY_API_KEY || "";
  const ping = req.query.ping === "1";

  // 1) Health
  if (ping) return res.status(200).json({ ok: true, service: "tavily", sha });

  // 2) Safe POST body parsing (Framework=Other has no auto body)
  const readBody = async () => {
    if (req.method !== "POST") return null;
    const chunks = [];
    for await (const c of req) chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c));
    try { return JSON.parse(Buffer.concat(chunks).toString("utf8") || "null"); }
    catch { return null; }
  };
  const body = await readBody();

  // 3) Input
  const qRaw = req.query.q ?? (body && body.query) ?? "";
  const q = String(qRaw).trim().slice(0, 400);

  // 4) Friendly 200s
  if (!key) return res.status(200).json({ ok: false, error: "missing TAVILY_API_KEY", q, sha });
  if (!q)   return res.status(200).json({ ok: false, error: "missing query", q, sha });

  // 5) Cache
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");

  // 6) Minimal stable payload
  const payload = {
    query: q,
    max_results: 6,
    search_depth: "advanced",
    topic: "news",
    days: 7,
    include_answer: true
  };

  try {
    const r = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "content-type": "application/json", "authorization": `Bearer ${key}` },
      body: JSON.stringify(payload)
    });

    const data = await r.json().catch(() => ({}));
    const items = Array.isArray(data.results) ? data.results.slice(0, 5).map(x => {
      const url = String(x.url || "");
      let host = ""; try { host = new URL(url).hostname.replace(/^www\./, ""); } catch {}
      const title = (x.title || "").trim() || host || "Untitled";
      const published = x.published_date || x.date || null;
      const snippet = String(x.content || x.raw_content || "").trim().slice(0, 400);
      return { title, url, host, published, snippet };
    }) : [];

    const answerText = data.answer ? String(data.answer).trim().slice(0, 1200) : null;

    return res.status(200).json({
      ok: r.ok,
      status: r.status,
      q,
      answer: answerText ? { text: answerText } : null,
      items,
      sha
    });
  } catch (err) {
    return res.status(200).json({ ok: false, error: "tavily_fetch_failed", detail: String(err), q, sha });
  }
}
