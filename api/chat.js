const FRED_BASE = "https://api.stlouisfed.org/fred/series/observations";
const SERIES = { TEN_YEAR: "DGS10", MORTGAGE_30Y: "MORTGAGE30US" };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const q = String(body.message || "").trim();

  if (!process.env.FRED_API_KEY) {
    return res.status(200).json({
      reply: `Live rates unavailable (no FRED_API_KEY in this deployment). Your message: “${q}”.`
    });
  }

  try {
    if (isTenYearQuery(q)) {
      const { date, value } = await fredLatest(SERIES.TEN_YEAR);
      return res.status(200).json({ reply: `10-Year Treasury: ${pct(value)} as of ${date}.` });
    }

    if (isMortgage30Query(q)) {
      const { date, value } = await fredLatest(SERIES.MORTGAGE_30Y);
      return res.status(200).json({ reply: `30-Year Fixed Mortgage Avg (PMMS): ${pct(value)} (week of ${date}).` });
    }

    if (/\b(hello|hi|hey)\b/i.test(q)) {
      return res.status(200).json({ reply: "Hi—welcome to HomeRates.ai. Ask about 10-year treasury or 30-year fixed." });
    }

    return res.status(200).json({
      reply: `I heard: “${q}”. Try “10-year treasury” or “30-year fixed rate” for live numbers.`
    });

  } catch (err) {
    console.error("[/api/chat] error:", err);
    return res.status(200).json({
      reply: `Couldn’t fetch live data right now. (${String(err)})`
    });
  }
}

function isTenYearQuery(s){ return /\b(10\s*year|10yr|ten\s*year|treasury|t[-\s]?note|note)\b/i.test(s); }
function isMortgage30Query(s){ return /\b(30\s*year|30yr).*(fixed|fxd)?\b/i.test(s) || /\bmortgage\b.*\brate\b/i.test(s); }
function pct(x){ return (x==null||Number.isNaN(x)) ? "N/A" : `${Number(x).toFixed(2)}%`; }

async function fredLatest(seriesId){
  const url = new URL(FRED_BASE);
  url.searchParams.set("series_id", seriesId);
  url.searchParams.set("api_key", process.env.FRED_API_KEY);
  url.searchParams.set("file_type", "json");
  url.searchParams.set("sort_order", "desc");
  url.searchParams.set("limit", "5");

  const r = await fetch(url.toString(), { cache: "no-store" });
  if (!r.ok) throw new Error(`FRED HTTP ${r.status}`);

  const data = await r.json();
  const obs = (data?.observations || []).find(o => o?.value && o.value !== ".");
  if (!obs) throw new Error("No observations found");
  return { date: obs.date, value: parseFloat(obs.value) };
}
