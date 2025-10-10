console.log("[rates] script loaded");
function render(html){ const el = document.getElementById("rates"); if (!el) return; el.innerHTML = html; }
document.addEventListener("DOMContentLoaded", async () => {
  render('<em>Loading live mortgage rates…</em>');
  try{
    const r = await fetch("/api/rates-v39", { cache:"no-store" }); const j = await r.json();
    if (!j?.ok) throw new Error(j?.error || "Rates unavailable");
    const ten  = j.tenYear?.pretty || (j.tenYear?.value ? `${j.tenYear.value}%` : "");
    const tenD = j.tenYear?.date?.slice(0,10) || "";
    const m30  = j.mortgage30?.pretty || (j.mortgage30?.value ? `${j.mortgage30.value}%` : "");
    const m30D = j.mortgage30?.date?.slice(0,10) || "";
    const two  = j.twoYear?.pretty || (j.twoYear?.value ? `${j.twoYear.value}%` : null);
    const twoD = j.twoYear?.date?.slice(0,10) || null;
    render(`<strong>Live Mortgage Rates:</strong> 10Y Treasury: ${ten} <span style="opacity:.6">(as of ${tenD})</span>  30Y Fixed: ${m30} <span style="opacity:.6">(as of ${m30D})</span>${two ? `  2Y: ${two} <span style="opacity:.6">(as of ${twoD})</span>` : ""}`);
    console.log("[rates] render complete");
  }catch(e){ console.error("[rates] widget error:", e); render("Live Mortgage Rates unavailable"); }
});
