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

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Use POST" });
    }

    const { text = "" } = await readBody(req);
    const q = String(text || "").toLowerCase().trim();

    // ---- FRED: 10-year Treasury (DGS10) - return the NEWEST real value
    if (q.includes("10-year") || q.includes("10 year") || q.includes("dgs10") || q.includes("10yr")) {
      if (!process.env.FRED_API_KEY) {
        return res.status(200).json({ ok: false, provider: "FRED", error: "FRED_API_KEY missing" });
      }

      const url = new URL("https://api.stlouisfed.org/fred/series/observations");
      url.searchParams.set("series_id", "DGS10");
      url.searchParams.set("api_key", process.env.FRED_API_KEY);
      url.searchParams.set("file_type", "json");
      // ✅ newest first, small buffer, we pick the first valid (non ".") value
      url.searchParams.set("sort_order", "desc");
      url.searchParams.set("limit", "5");

      const r = await fetch(url.toString(), { cache: "no-store" });
      if (!r.ok) {
        return res.status(200).json({ ok: false, provider: "FRED", status: r.status });
      }
      const j = await r.json();
      const obs = (j?.observations || []).find(o => o?.value && o.value !== ".") || null;

      return res.status(200).json({
        ok: true,
        provider: "FRED",
        series: "DGS10",
        date: obs?.date ?? null,
        value: obs?.value ?? null,
        rawCount: j?.observations?.length ?? 0,
      });
    }

    // ---- Tavily fallback for other queries
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

    // ---- No providers available
    return res.status(200).json({ ok: true, provider: "stub", note: "no provider matched" });
  } catch (e) {
    console.error("chat-v39 error:", e);
    return res.status(200).json({ ok: false, provider: "error", error: String(e?.message || e) });
  }
};
