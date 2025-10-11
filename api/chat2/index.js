export const runtime = "edge";

export default async function handler(req) {
  try {
    const now = new Date().toISOString();
    const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
    const hasTavily = Boolean(process.env.TAVILY_API_KEY);
    const hasFRED = Boolean(process.env.FRED_API_KEY);

    return new Response(
      JSON.stringify({
        ok: true,
        route: "chat2",
        runtime: "edge",
        now,
        env: { hasOpenAI, hasTavily, hasFRED }
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        ok: false,
        route: "chat2",
        runtime: "edge",
        error: (err && err.message) ? err.message : "unknown"
      }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
