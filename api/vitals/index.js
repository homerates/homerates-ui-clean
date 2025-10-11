function send(res, code, obj) {
  res.statusCode = code;
  res.setHeader("Content-Type","application/json");
  res.setHeader("Cache-Control","no-store");
  res.end(JSON.stringify(obj));
}
async function handler(req, res) {
  if (req.method === "OPTIONS") { res.statusCode = 204; return res.end(); }
  if (req.method !== "GET") return send(res, 405, { ok:false, reason:"method-not-allowed", method:req.method });
  try {
    const env = process.env || {};
    return send(res, 200, {
      ok: true,
      hasOpenAI: !!env.OPENAI_API_KEY,
      hasTavily: !!env.TAVILY_API_KEY,
      hasFRED:   !!env.FRED_API_KEY,
      node: process.version,
      region: env.VERCEL_REGION || null
    });
  } catch (e) {
    return send(res, 200, { ok:false, reason:"vitals-error", error:String(e?.message || e) });
  }
}
module.exports = handler;
export default handler;
//  valid runtime string:
