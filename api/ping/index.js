function handler(req, res) {
  res.statusCode = 200;
  res.setHeader("Content-Type","application/json");
  res.setHeader("Cache-Control","no-store");
  res.end(JSON.stringify({ ok:true, path:"/api/ping", method:req.method }));
}
module.exports = handler;
export default handler;
//  valid runtime string:
module.exports.config = { runtime: "nodejs20.x" };
export const config = { runtime: "nodejs20.x" };