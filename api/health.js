module.exports = (req, res) => {
  try { res.statusCode = 200; res.setHeader('Content-Type','application/json'); } catch(_) {}
  res.end(JSON.stringify({ ok: true, hasOpenAI: Boolean(process.env.OPENAI_API_KEY) }));
};
