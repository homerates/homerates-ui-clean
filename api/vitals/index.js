function send(res, code, obj, extraHeaders) {
  res.statusCode = code;
  res.setHeader("Content-Type","application/json");
  res.setHeader("Cache-Control","no-store");
  if (extraHeaders) for (const [k,v] of Object.entries(extraHeaders)) res.setHeader(k, v);
  res.end(JSON.stringify(obj));
}

module.exports = async (req, res) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
  };
  if (req.method === "OPTIONS") { res.statusCode = 204; for (const [k,v] of Object.entries(cors)) res.setHeader(k,v); return res.end(); }

  for (const [k,v] of Object.entries(cors)) res.setHeader(k,v);
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
};