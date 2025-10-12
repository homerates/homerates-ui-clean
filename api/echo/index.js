module.exports = (req, res) => {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA || "local";
  res.statusCode = 200;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify({ ok: true, sha, path: req.url, ts: Date.now() }));
};
