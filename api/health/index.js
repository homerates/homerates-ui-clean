export default function handler(req, res) {
  res.status(200).json({ ok: true, version: "v39", env: process.env });
}
