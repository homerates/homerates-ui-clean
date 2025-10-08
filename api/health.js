export default async function handler(req, res) {
  const hasKey = !!process.env.FRED_API_KEY;

  let fredPing = null;
  if (hasKey) {
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

  res.status(200).json({
    ok: true,
    version: "v39",
    env: { FRED_API_KEY: hasKey ? "present" : "missing" },
    fredPing,
  });
}
