(function(){
  const $ = (s)=>document.querySelector(s);
  const chat = $("#chat"), pill = $("#status-pill"), composer = $("#composer"), input = $("#q");
  const chips = document.querySelectorAll(".chip");
  let busy = false;

  function addMsg(role, text){
    const el = document.createElement("div");
    el.className = "msg " + (role === "user" ? "u" : "a");
    el.innerHTML = `<div class="avatar">${role === "user" ? "You" : "AI"}</div><div class="bubble"></div>`;
    el.querySelector(".bubble").textContent = text;
    chat.appendChild(el); chat.scrollTop = chat.scrollHeight; return el;
  }
  function updatePill(text, good=true){
    pill.textContent = text; pill.style.color = good ? "#bcd2ff" : "#ffb3b3";
    pill.style.borderColor = good ? "var(--chip-bd)" : "#5d1a1a";
  }
  async function ask(text){
    const r = await fetch("/api/chat-v39", {
      method:"POST", headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ text })
    });
    if (!(r.headers.get("content-type")||"").includes("application/json")) throw new Error("Non-JSON response");
    return r.json();
  }
  function prettyAnswer(j){
    if (j?.provider === "FRED" && j?.pretty){
      const d = j.date?.slice(0,10) || ""; const label = j.label || j.series;
      return `${label}: ${j.pretty}${d ? ` (as of ${d})` : ""}`;
    }
    if (j?.provider === "Tavily" && (j?.answer || (j?.results||[]).length)){
      const a = j.answer ? j.answer + "\n" : "";
      const links = (j.results||[]).slice(0,3).map(r => ` ${r.title}  ${r.url}`).join("\n");
      return `${a}${links}`.trim() || "No results.";
    }
    if (j?.note) return j.note;
    return JSON.stringify(j, null, 2);
  }
  async function handleSubmit(text){
    if (!text || busy) return; busy = true; updatePill("Thinking", true);
    addMsg("user", text); const ai = addMsg("assistant", "");
    try{ const j = await ask(text); ai.querySelector(".bubble").textContent = prettyAnswer(j); updatePill("Ready", true); }
    catch(e){ ai.querySelector(".bubble").textContent = "Sorryran into an error."; updatePill("Error", false); console.error(e); }
    finally{ busy = false; }
  }
  composer.addEventListener("submit", (e)=>{ e.preventDefault(); const t=(input.value||"").trim(); input.value=""; handleSubmit(t); });
  input.addEventListener("keydown",(e)=>{ if (e.key==="Enter" && !e.shiftKey){ e.preventDefault(); composer.dispatchEvent(new Event("submit")); }});
  chips.forEach(c => c.addEventListener("click", ()=> handleSubmit(c.dataset.q)));
})();
