// Minimal helper to read JSON body in Vercel/Node
async function readBody(req) {
  if (req.body) return req.body;
  return await new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => {
      try { resolve(JSON.parse(data || "{}")); } catch { resolve({}); }
    });
    req.on("error", reject);
  });
}

// Fetch newest valid observation from FRED for a series
async function getFredLatest(seriesId, apiKey) {
  const url = new URL("https://api.stlouisfed.org/fred/series/observations");
  url.searchParams.set("series_id", seriesId);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("file_type", "json");
  url.searchParams.set("sort_order", "desc"); // newest first
  url.searchParams.set("limit", "8");         // small buffer to skip blanks

  const r = await fetch(url.toString(), { cache: "no-store" });
  if (!r.ok) return { ok: false, status: r.status };

  const j = await r.json();
  const obs = (j?.observations || []).find(o => o?.value && o.value !== ".");
  if (!obs) return { ok: false, status: 204 }; // no content we can use

  return { ok: true, date: obs.date, value: obs.value };
}

function pct(v) {
  // FRED yields come as percent (e.g., 4.13) — present as "4.13%"
  const n = Number(v);
  if (!isFinite(n)) return null;
  return `${n.toFixed(2)}%`;
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Use POST" });
    }

    const { text = "" } = await readBody(req);
    const q = String(text || "").toLowerCase();

    // --- INTENTS ---
    const wants10y = /(10[-\s]?year|10yr|dgs10|\b10y\b)/i.test(q);
    const wants2y  = /(2[-\s]?year|2yr|dgs2|\b2y\b)/i.test(q);
    const wants30m = /(30[-\s]?year.*fixed|30yr.*fixed|mortgage\s*30|mortgage30us)/i.test(q);

    // Prefer FRED when we can
    if ((wants10y || wants2y || wants30m) && process.env.FRED_API_KEY) {
      const series = wants10y ? "DGS10" : wants2y ? "DGS2" : "MORTGAGE30US";
      const tag    = wants10y ? "10-year Treasury" : wants2y ? "2-year Treasury" : "30-year fixed mortgage";

      const latest = await getFredLatest(series, process.env.FRED_API_KEY);
      if (latest.ok) {
        return res.status(200).json({
          ok: true,
          provider: "FRED",
          series,
          label: tag,
          date: latest.date,
          value: latest.value,
          pretty: pct(latest.value),
        });
      }
      // fall through to Tavily if FRED failed
    }

    // Tavily fallback (general Q&A / newsy stuff)
    if (process.env.TAVILY_API_KEY) {
      const tr = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: process.env.TAVILY_API_KEY,
          query: text,
          include_answer: true,
          search_depth: "basic",
          max_results: 3,
        }),
      });

      const tj = await tr.json().catch(() => ({}));
      return res.status(200).json({
        ok: true,
        provider: "Tavily",
        answer: tj?.answer ?? null,
        results: Array.isArray(tj?.results) ? tj.results.slice(0, 3) : [],
        status: tr.status,
      });
    }

    // Nothing available
    return res.status(200).json({ ok: true, provider: "stub", note: "no provider matched" });
  } catch (e) {
    console.error("chat-v39 error:", e);
    return res.status(200).json({ ok: false, provider: "error", error: String(e?.message || e) });
  }
};
