const fs = require("fs");
const path = require("path");

const meta = {
  version: process.env.APP_VERSION || "1.0.0",
  commit: (process.env.VERCEL_GIT_COMMIT_SHA || "").slice(0, 8) || "localdev",
  env: process.env.VERCEL_ENV || "development",
  timestamp: new Date().toISOString()
};

const out = path.join(process.cwd(), "public", "build-meta.json");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(meta, null, 2), "utf8");
console.log("[build-meta] wrote", out, meta);
