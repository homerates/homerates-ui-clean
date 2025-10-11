const form=document.getElementById("chat-form");
const input=document.getElementById("user-input");
const messages=document.getElementById("messages");
const typing=document.getElementById("typing");
document.getElementById("year").textContent=new Date().getFullYear();

// Sidebar quick prompts
document.querySelectorAll(".nav-btn[data-prompt]").forEach(btn=>{
  btn.addEventListener("click",()=>{
    input.value=btn.getAttribute("data-prompt");
    input.focus();
  });
});
document.getElementById("btn-clear")?.addEventListener("click",()=>{ messages.innerHTML=""; });
document.getElementById("btn-copy-last")?.addEventListener("click", async ()=>{
  const last=[...messages.querySelectorAll(".message.bot")].pop();
  if(!last) return;
  await navigator.clipboard.writeText(last.textContent||"");
  toast("Answer copied");
});

function toast(t){
  const el=document.createElement("div");
  el.textContent=t;
  el.style.cssText="position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#111827;color:#fff;padding:8px 12px;border-radius:10px;opacity:.96;z-index:50";
  document.body.appendChild(el); setTimeout(()=>el.remove(),1400);
}

function appendMessage(role, text){
  const el=document.createElement("div");
  el.className=\`message \${role}\`;
  el.textContent=text;
  messages.appendChild(el);
  messages.scrollTop=messages.scrollHeight;
  return el;
}

form.addEventListener("submit", async (e)=>{
  e.preventDefault();
  const text=input.value.trim();
  if(!text) return;
  input.value="";
  appendMessage("user", text);
  typing.hidden=false;

  try{
    const res=await fetch("/api/chat",{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ message:text })
    });
    const data=await res.json();
    typing.hidden=true;

    // Support both echo and structured answers
    if(data && data.ok && (data.answer || data.results)){
      const reply = data.answer || JSON.stringify(data,null,2);
      appendMessage("bot", reply);
    } else if(data && data.ok){
      appendMessage("bot", data.reply || data.answer || "Done.");
    } else {
      appendMessage("bot", "Error: " + (data?.error || "Unknown issue"));
    }
  }catch(err){
    typing.hidden=true;
    appendMessage("bot","Network error.");
  }
});

