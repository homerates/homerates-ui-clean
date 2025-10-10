function sendJSON(res, code, obj) {
  try {
    res.statusCode = code;
    res.setHeader('Content-Type', 'application/json');
  } catch (_) {}
  res.end(JSON.stringify(obj));
}
async function readJSON(req) {
  if (req.body) return req.body; // sometimes populated
  return new Promise((resolve) => {
    let d = '';
    req.on('data', c => d += c);
    req.on('end', () => { try { resolve(JSON.parse(d || '{}')); } catch { resolve({}) } });
  });
}
module.exports = (req, res) => {
  sendJSON(res, 200, { ok: true, hasOpenAI: Boolean(process.env.OPENAI_API_KEY) });
};