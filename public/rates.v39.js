console.log("[rates] script loaded");

function renderRates(html){
  const el = document.getElementById("rates");
  if (!el) { console.warn("[rates] #rates not found"); return; }
  el.innerHTML = html;
}

document.addEventListener("DOMContentLoaded", async () => {
  console.log("[rates] DOMContentLoaded");
  const host = location.origin;

  const box = document.getElementById("rates");
  if (!box) { console.warn("[rates] #rates not found on DOMReady"); return; }

  renderRates('<em>Loading live mortgage rates</em>');

  async function ask(text){
    const r = await fetch(`${host}/api/chat-v39`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    const ct = r.headers.get("content-type") || "";
    if (!ct.includes("application/json")) throw new Error("Non-JSON response");
    return r.json();
  }

  try {
    console.log("[rates] fetching 10Y + 30Y");
    const [t10, m30] = await Promise.all([
      ask("10-year treasury"),
      ask("30-year fixed rate"),
    ]);

    const p10  = t10?.pretty || (t10?.value ? `${t10.value}%` : "");
    const d10  = t10?.date?.slice(0,10) || "";
    const pm30 = m30?.pretty || (m30?.value ? `${m30.value}%` : "");
    const dm30 = m30?.date?.slice(0,10) || "";

    renderRates(`
      <strong>Live Mortgage Rates:</strong>
      10Y Treasury: ${p10} <span style="opacity:.6">(as of ${d10})</span> 
      30Y Fixed: ${pm30} <span style="opacity:.6">(as of ${dm30})</span>
    `);
    console.log("[rates] render complete");
  } catch (e) {
    console.error("[rates] widget error:", e);
    renderRates("Live Mortgage Rates unavailable");
  }
});
