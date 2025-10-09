export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  // --- FRED check ---
  const hasFred = !!process.env.FRED_API_KEY;
  let fredPing = null;
  if (hasFred) {
    try {
      const url = new URL("https://api.stlouisfed.org/fred/series/observations");
      url.searchParams.set("series_id", "DGS10");
      url.searchParams.set("api_key", process.env.FRED_API_KEY);
      url.searchParams.set("file_type", "json");
      url.searchParams.set("limit", "1");
      const r = await fetch(url.toString(), { cache: "no-store" });
      fredPing = { ok: r.ok, status: r.status };
    } catch (e) {
      fredPing = { ok: false, error: String(e) };
    }
  }

  // --- Tavily check ---
  const hasTavily = !!process.env.TAVILY_API_KEY;
  let tavilyPing = null;
  if (hasTavily) {
    try {
      const r = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: process.env.TAVILY_API_KEY,
          query: "10-year treasury yield today",
          search_depth: "advanced",
          include_answer: true,
          include_raw_content: false,
          max_results: 3
        })
      });
      let payload = null;
      try { payload = await r.json(); } catch {}
      const answer = !!payload?.answer;
      const results = Array.isArray(payload?.results) ? payload.results.length : 0;
      tavilyPing = { ok: r.ok && (answer || results > 0), status: r.status, answer, results };
    } catch (e) {
      tavilyPing = { ok: false, error: String(e) };
    }
  }

  res.status(200).json({
    ok: true,
    version: "v39-2",
    env: {
      FRED_API_KEY: hasFred ? "present" : "missing",
      TAVILY_API_KEY: hasTavily ? "present" : "missing"
    },
    fredPing,
    tavilyPing
  });
}