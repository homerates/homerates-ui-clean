export default async function handler(req, res) {
  try {
    const q = (req.query.q || "mortgage rates news").slice(0, 200);
    const key = process.env.TAVILY_API_KEY;
    if (!key) return res.status(500).json({ ok:false, error:"Missing TAVILY_API_KEY" });

    res.setHeader("Cache-Control","s-maxage=300, stale-while-revalidate=60");

    const r = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type":"application/json", "Authorization":`Bearer ${key}` },
      body: JSON.stringify({ query:q, include_answer:false, max_results:5 })
    });
    if (!r.ok) throw new Error(`Tavily ${r.status}`);
    const json = await r.json();
    const items = (json.results||[]).map(x => ({
      title:x.title, url:x.url, snippet: x.content?.slice(0,240) || "", published: x.published_date || null
    }));
    res.status(200).json({ ok:true, q, items });
  } catch (e) {
    res.status(500).json({ ok:false, error:String(e) });
  }
}