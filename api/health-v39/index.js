export const config = { runtime: "nodejs" };
export default async function handler(req, res) {
  const hasFred = !!process.env.FRED_API_KEY;
  let fredPing = null;
  if (hasFred) {
    try {
      const u = new URL("https://api.stlouisfed.org/fred/series/observations");
      u.searchParams.set("series_id", "DGS10");
      u.searchParams.set("api_key", process.env.FRED_API_KEY);
      u.searchParams.set("file_type", "json");
      u.searchParams.set("limit", "1");
      const r = await fetch(u.toString(), { cache: "no-store" });
      fredPing = { ok: r.ok, status: r.status };
    } catch (e) { fredPing = { ok: false, error: String(e) }; }
  }
  const hasTavily = !!process.env.TAVILY_API_KEY;
  let tavilyPing = null;
  if (hasTavily) {
    try {
      const r = await fetch("https://api.tavily.com/search", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: process.env.TAVILY_API_KEY,
          query: "10-year treasury yield today",
          search_depth: "advanced", include_answer: true,
          include_raw_content: false, max_results: 3
        })
      });
      let payload = null; try { payload = await r.json(); } catch {}
      const answer = !!payload?.answer;
      const results = Array.isArray(payload?.results) ? payload.results.length : 0;
      tavilyPing = { ok: r.ok && (answer || results > 0), status: r.status, answer, results };
    } catch (e) { tavilyPing = { ok: false, error: String(e) }; }
  }
  res.status(200).json({
    ok: true, version: "v39-2",
    env: {
      FRED_API_KEY: hasFred ? "present" : "missing",
      TAVILY_API_KEY: hasTavily ? "present" : "missing"
    },
    fredPing, tavilyPing
  });
}