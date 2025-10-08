export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const input = String(body.message || "").trim();
    const reply = makeReply(input);
    return res.status(200).json({ reply });
  } catch (err) {
    console.error("[api/chat] error:", err);
    return res.status(500).json({ error: "Internal error" });
  }
}

function makeReply(q) {
  if (!q) return "You didn’t type anything.";
  const lower = q.toLowerCase();
  if (/\brate\b|\bmortgage\b/.test(lower)) {
    return "Rates depend on credit, DTI, LTV, and program. Share loan amount, credit score, and occupancy to ballpark scenarios.";
  }
  if (/\bdown\b|\bdpa\b|\bfirst[-\s]?time\b/.test(lower)) {
    return "Down-payment assistance may be available. We can compare 3%–5% down vs. DPA and total cash-to-close.";
  }
  if (/\brefi\b|\brefinance\b/.test(lower)) {
    return "Refi check: current rate, balance, property value, and goal (cash-out vs. payment drop).";
  }
  if (/\bhello\b|\bhi\b|\bhey\b/.test(lower)) {
    return "Hi—welcome to HomeRates.ai. Ask about payments, seller credits, DPA, or DSCR.";
  }
  return `I heard: “${q}”. This endpoint is a stub—perfect for wiring the UI.`;
}
