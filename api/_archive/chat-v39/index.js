// Read JSON body (works in Vercel/Node)
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

// Fetch newest valid observation from FRED for a series, with error details
async function getFredLatest(seriesId, apiKey) {
  const url = new URL("https://api.stlouisfed.org/fred/series/observations");
  url.searchParams.set("series_id", seriesId);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("file_type", "json");
  url.searchParams.set("sort_order", "desc"); // newest first
  url.searchParams.set("limit", "8");         // small buffer to skip blanks

  const r = await fetch(url.toString(), { cache: "no-store" });
  let body = null;
  try { body = await r.json(); } catch {}

  if (!r.ok) {
    return {
      ok: false,
      status: r.status,
      url: url.toString(),
      detail: body?.error_message || body?.error || JSON.stringify(body || {}),
    };
  }

  const obs = (body?.observations || []).find(o => o?.value && o.value !== ".");
  if (!obs) {
    return {
      ok: false,
      status: 204,
      url: url.toString(),
      detail: "No usable observations (all values '.' or empty)",
    };
  }

  return { ok: true, seriesId, date: obs.date, value: obs.value };
}

function pct(v) {
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

    // --- Simple intents ---
    const wants10y = /(10[-\s]?year|10yr|dgs10|\b10y\b)/i.test(q);
    const wants2y  = /(2[-\s]?year|2yr|dgs2|\b2y\b)/i.test(q);
    const wants30m = /(30[-\s]?year.*fixed|30yr.*fixed|mortgage\s*30|mortgage30us)/i.test(q);

    // Try FRED first when intent matches & key exists
    if ((wants10y || wants2y || wants30m) && process.env.FRED_API_KEY) {
      const series = wants10y ? "DGS10" : wants2y ? "DGS2" : "MORTGAGE30US";
      const label  = wants10y ? "10-year Treasury" : wants2y ? "2-year Treasury" : "30-year fixed mortgage";

      const latest = await getFredLatest(series, process.env.FRED_API_KEY);
      if (latest.ok) {
        return res.status(200).json({
          ok: true,
          provider: "FRED",
          series,
          label,
          date: latest.date,
          value: latest.value,
          pretty: pct(latest.value),
          env: { FRED: true, Tavily: !!process.env.TAVILY_API_KEY }, // small diag echo
        });
      } else {
        // Bubble up the exact reason FRED failed
        return res.status(200).json({
          ok: false,
          provider: "FRED",
          series,
          error: "FRED fetch failed",
          status: latest.status,
          detail: latest.detail,
          env: { FRED: !!process.env.FRED_API_KEY, Tavily: !!process.env.TAVILY_API_KEY },
        });
      }
    }

    // ---- Tavily fallback (general Q&A / newsy stuff)
    if (process.env.TAVILY_API_KEY) {
      const tr = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Tavily requires Authorization now
          "Authorization": `Bearer ${process.env.TAVILY_API_KEY}`,
        },
        body: JSON.stringify({
          query: text,
          include_answer: true,
          search_depth: "basic",
          max_results: 3,
        }),
      });

      let tj = {};
      try { tj = await tr.json(); } catch {}

      if (!tr.ok) {
        return res.status(200).json({
          ok: false,
          provider: "Tavily",
          status: tr.status,
          error: tj?.detail || tj?.error || "Tavily request failed",
          env: { FRED: !!process.env.FRED_API_KEY, Tavily: true },
        });
      }

      return res.status(200).json({
        ok: true,
        provider: "Tavily",
        answer: tj?.answer ?? null,
        results: Array.isArray(tj?.results) ? tj.results.slice(0, 3) : [],
        status: tr.status,
        env: { FRED: !!process.env.FRED_API_KEY, Tavily: true },
      });
    }

    // Nothing available
    return res.status(200).json({
      ok: true,
      provider: "stub",
      note: "no provider matched",
      env: { FRED: !!process.env.FRED_API_KEY, Tavily: !!process.env.TAVILY_API_KEY },
    });
  } catch (e) {
    console.error("chat-v39 error:", e);
    return res.status(200).json({
      ok: false,
      provider: "error",
      error: String(e?.message || e),
      env: { FRED: !!process.env.FRED_API_KEY, Tavily: !!process.env.TAVILY_API_KEY },
    });
  }
};
