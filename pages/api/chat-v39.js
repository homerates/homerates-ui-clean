const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

async function tavilySearch(q) {
  const key = process.env.TAVILY_API_KEY;
  if (!key) return null;
  const r = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({ query: q, search_depth: "basic", include_answer: true, max_results: 5 })
  });
  if (!r.ok) throw new Error(`Tavily ${r.status}`);
  return r.json();
}

async function openaiChat(prompt, context) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY missing");
  const messages = [
    { role: "system", content: "You are HomeRates.ai’s mortgage guide. Be concise." },
    { role: "user", content: prompt },
    ...(context?.tavily?.answer ? [{ role: "system", content: `Web summary: ${context.tavily.answer}` }] : [])
  ];
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: OPENAI_MODEL, temperature: 0.2, messages })
  });
  if (!r.ok) throw new Error(`OpenAI ${r.status}`);
  const j = await r.json();
  return j?.choices?.[0]?.message?.content?.trim() || "";
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  try {
    const { prompt } = req.body || {};
    if (!prompt) return res.status(400).json({ error: "Missing prompt" });
    const context = {};
    try { context.tavily = await tavilySearch(prompt); } catch {}
    const answer = await openaiChat(prompt, context);
    res.status(200).json({ answer, meta: { tavily: !!context.tavily } });
  } catch (e) {
    res.status(500).json({ error: e.message || "Server error" });
  }
}
