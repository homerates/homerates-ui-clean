export default function handler(req, res) {
  const show = n => (process.env[n] ? "set" : "missing");
  res.status(200).json({
    ok: true,
    version: "v39",
    env: {
      OPENAI_API_KEY: show("OPENAI_API_KEY"),
      TAVILY_API_KEY: show("TAVILY_API_KEY"),
      FRED_API_KEY: show("FRED_API_KEY")
    },
    vercel: {
      env: process.env.VERCEL_ENV || "unknown"
    }
  });
}
