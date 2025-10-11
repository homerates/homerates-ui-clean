export default async function handler(req, res) {
  const method = req.method || "GET";
  if (!process.env.OPENAI_API_KEY) {
    return res.status(200).json({ ok: false, reason: "no-key", status: 401, method });
  }
  if (method !== "POST") {
    return res.status(200).json({ ok: true, diag: "use POST with {messages:[...]}", method });
  }

  try {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const body = JSON.parse(Buffer.concat(chunks).toString() || "{}");
    const userMsg = body?.messages?.[0]?.content || "Ping test";

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: userMsg }],
        temperature: 0.2
      })
    });

    if (!r.ok) {
      const text = await r.text();
      return res.status(200).json({ ok: false, status: r.status, reason: "openai-error", body: text.slice(0, 400) });
    }

    const data = await r.json();
    const reply = data?.choices?.[0]?.message?.content ?? "";
    return res.status(200).json({ ok: true, reply });
  } catch (err) {
    return res.status(200).json({ ok: false, reason: "handler-exception", error: String(err?.message || err) });
  }
}