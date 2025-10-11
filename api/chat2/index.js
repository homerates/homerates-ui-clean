// api/chat2/index.js
export default function handler(req, res) {
  // Never let this get cached anywhere
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  // Helpful metadata for quick sanity checks
  const sha = process.env.VERCEL_GIT_COMMIT_SHA || 'no-sha';
  const deployId = process.env.VERCEL_DEPLOYMENT_ID || 'no-deploy';

  res.status(200).json({
    ok: true,
    method: req.method,
    version: 'chat2-echo-2025-10-11-fixed', // <- obvious new tag
    sha,
    deployId,
    now: new Date().toISOString(),
  });
}
