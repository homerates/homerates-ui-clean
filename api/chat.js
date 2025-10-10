function sendJSON(res, code, obj) {
  try { res.statusCode = code; res.setHeader('Content-Type', 'application/json'); } catch (_) {}
  res.end(JSON.stringify(obj));
}
async function readJSON(req) {
  if (req.body) return req.body;
  return new Promise((resolve) => {
    let d = ''; req.on('data', c => d += c);
    req.on('end', () => { try { resolve(JSON.parse(d || '{}')); } catch { resolve({}) } });
  });
}
module.exports = async (req, res) => {
  if (req.method !== 'POST') return sendJSON(res, 405, { error: 'Method not allowed' });
  const body = await readJSON(req);
  const message = String((body && body.message) || '');
  return sendJSON(res, 200, { reply: echo:  });
};