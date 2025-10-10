export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      return res.status(200).json({
        ok: true,
        endpoint: "/api/chat",
        hint: "POST { message: 'hi' } to receive a reply"
      });
    }
    if (req.method === "POST") {
      const { message } = req.body || {};
      if (!message || typeof message !== "string") {
        return res.status(400).json({ ok: false, error: "Missing 'message' (string)" });
      }
      const reply = You said: ""  chat API is live.;
      return res.status(200).json({ ok: true, reply });
    }
    return res.status(405).json({ ok: false, error: "Method not allowed. Use GET or POST." });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err?.message || "Server error" });
  }
}
