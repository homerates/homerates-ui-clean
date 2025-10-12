export default async function handler(req, res) {
  try {
    const q = (req.query.q || "mortgage rates today").slice(0, 240);
    const key = process.env.TAVILY_API_KEY;
    if (!key) return res.status(500).json({ ok:false, error:"Missing TAVILY_API_KEY" });

    // Cache a few minutes at the edge
    res.setHeader("Cache-Control","s-maxage=300, stale-while-revalidate=60");

    // Ask specifically for recent news; keep results small & crisp
    const payload = {
      query: q,
      max_results: 6,
      include_answer: false,
      // Many providers accept hints like these; harmless if ignored:
      search_depth: "advanced",
      topic: "news",
      time_range: "7d"
    };

    const r = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type":"application/json", "Authorization":`Bearer ${key}` },
      body: JSON.stringify(payload)
    });

    if (!r.ok) throw new Error(`Tavily ${r.status}`);
    const json = await r.json();

    const items = (json.results||[]).map(x => {
      const url = String(x.url||"");
      const host = (()=>{ try { return new URL(url).hostname.replace(/^www\./,""); } catch { return ""; }})();
      const title = (x.title||"").trim() || host || "Untitled";
      const published = x.published_date || x.date || null;
      const snippet = (x.content||"").trim().slice(0, 260);
      return { title, url, host, published, snippet };
    });

    // Light ranking: prefer items with dates & recognizable hosts
    const scored = items.map(it => ({
      ...it,
      _score: (it.published?2:0) + (it.host?1:0) + (/\bmortgage|rate|treasury|mbs/i.test((it.title+" "+it.snippet))?2:0)
    }))
    .sort((a,b)=> b._score - a._score)
    .slice(0,5)
    .map(({_score, ...rest}) => rest);

    return res.status(200).json({ ok:true, q, count: scored.length, items: scored });
  } catch (e) {
    return res.status(500).json({ ok:false, error:String(e) });
  }
}