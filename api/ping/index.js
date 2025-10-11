function handler(req, res) {
  res.statusCode = 200;
  res.setHeader("Content-Type","application/json");
  res.setHeader("Cache-Control","no-store");
  res.end(JSON.stringify({ ok:true, path:"/api/ping", method:req.method }));
}
// Dual exports (ESM/CJS) for safety
module.exports = handler;
module.exports.config = { runtime: "nodejs" };
export default handler;
export const config = { runtime: "nodejs" };