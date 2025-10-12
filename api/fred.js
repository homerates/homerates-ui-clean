export default async function handler(req, res) {
  try {
    const series = (req.query.series || "DGS10").toUpperCase();
    const limit = Math.max(1, Math.min(365, parseInt(req.query.limit || "60", 10)));
    const key = process.env.FRED_API_KEY;
    if (!key) return res.status(500).json({ ok:false, error:"Missing FRED_API_KEY" });

    res.setHeader("Cache-Control","s-maxage=600, stale-while-revalidate=60");

    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${encodeURIComponent(series)}&api_key=${key}&file_type=json&sort_order=desc&limit=${limit}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`FRED ${r.status}`);
    const json = await r.json();
    const points = (json.observations||[])
      .filter(o => o.value !== ".")
      .map(o => ({ date:o.date, value:+o.value }));

    res.status(200).json({ ok:true, series, count:points.length, points });
  } catch (e) {
    res.status(500).json({ ok:false, error:String(e) });
  }
}