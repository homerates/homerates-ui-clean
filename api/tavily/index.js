/**
 * /api/tavily   stub to PROVE plumbing only.
 * GET  ?ping=1  -> { ok:true }
 * GET  ?q=...   -> echoes the query
 * POST {query}  -> echoes the query
 * Always 200. No external fetch. No throws.
 */
const readPostBody = (req) => new Promise((resolve) => {
  if (req.method !== "POST") return resolve(null);
  const chunks = []; req.on("data", c => chunks.push(c));
  req.on("end", () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")||"null")); } catch { resolve(null); }});
  req.on("error", () => resolve(null));
});

module.exports = async (req, res) => {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA || "local";
  const key = process.env.TAVILY_API_KEY || "";
  let q = "";

  // health
  try {
    const u = new URL(req.url, "http://x");
    if ((u.searchParams.get("ping") || "") === "1") {
      res.statusCode = 200; res.setHeader("content-type","application/json");
      return res.end(JSON.stringify({ ok:true, service:"tavily", sha }));
    }
    if (req.method === "GET") q = u.searchParams.get("q") || "";
  } catch {}

  if (req.method === "POST") {
    const body = await readPostBody(req);
    if (body && typeof body.query === "string") q = body.query;
  }

  q = String(q || "").trim().slice(0,400);

  res.statusCode = 200;
  res.setHeader("content-type","application/json");
  res.end(JSON.stringify({
    ok: true,
    plumbing: true,
    hasKey: Boolean(key),
    q,
    sha
  }));
};
