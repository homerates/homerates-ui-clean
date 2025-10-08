// main.v38.js — UX preview (no backend). Safe boot + local demo state.

// ===== DOM Ready
function onReady(fn){ document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', fn) : fn(); }

// ===== Utilities
const $ = (sel, root=document) => root.querySelector(sel);
const el = (tag, cls) => { const e=document.createElement(tag); if(cls) e.className=cls; return e; };
const setText = (id, t) => { const n=document.getElementById(id); if(n) n.textContent=t; };

// ===== Fake data
const SAMPLE_WELCOME = `Hey—this is a live UX preview.
No server calls yet. Try typing, saving, new chat, or opening Login.`;

const SAMPLE_REPLY = (q) => `You asked:\n“${q}”\n\nIn the real app, this is where responses land.
For now, this is a stub so you can test flow and layout.`;

// ===== Message rendering
function appendMessage(role, content){
  const thread = $('#thread'); if(!thread) return;
  const card = el('div', `msg ${role==='user'?'user':'assistant'}`);
  card.textContent = content;
  thread.appendChild(card);
  thread.scrollTop = thread.scrollHeight;
}

function clearThread(){
  const t = $('#thread'); if (t) t.innerHTML = '';
}

// ===== Sidebar sections
function populateShortcuts(){
  setText('left-title', 'Shortcuts');
  const projects = $('#projectsList');
  if (projects){
    projects.innerHTML = '';
    ['Access Zero DPA','Seller Credit vs Price Cut','DSCR Calculator'].forEach(name=>{
      const b = el('button','side-btn'); b.textContent = name;
      b.onclick = () => appendMessage('assistant', `Opening: ${name} (mock)`);
      projects.appendChild(b);
    });
  }
  const saved = $('#savedThreads');
  if (saved){
    saved.innerHTML = '';
    ['Refi Scenarios','First-Time Buyer Q&A','Jumbo Options'].forEach(name=>{
      const b = el('button','side-btn'); b.textContent = name + ' (saved)';
      b.onclick = () => appendMessage('assistant', `Loaded saved thread: ${name} (mock)`);
      saved.appendChild(b);
    });
  }
}

// ===== Composer wiring
function wireComposer(){
  const form = $('#composer'), query = $('#query'), send = $('#send');
  if(!form || !query || !send) return;

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const text = (query.value || '').trim(); if(!text) return;
    appendMessage('user', text);
    query.value = '';
    setText('loading', '…');

    // fake latency
    await new Promise(r => setTimeout(r, 250));
    appendMessage('assistant', SAMPLE_REPLY(text));

    setText('loading', '');
  });
}

// ===== Nav buttons
function wireNav(){
  const newChat = $('#newChatBtn'), newChatTop = $('#newChatTop');
  [newChat, newChatTop].forEach(btn=>{
    if(btn) btn.onclick = () => { clearThread(); appendMessage('assistant', SAMPLE_WELCOME); };
  });

  const save = $('#saveChatBtn');
  if (save) save.onclick = () => appendMessage('assistant','Saved (mock)');

  const proj = $('#newProjectBtn');
  if (proj) proj.onclick = () => appendMessage('assistant','New project (mock)');
}

// ===== Login modal (front-end only)
function wireLogin(){
  const modal = $('#loginModal'), open = $('#loginBtn'), close = $('#closeLogin'), go = $('#doLogin');
  if(!modal) return;

  const show = () => { modal.style.display='flex'; };
  const hide = () => { modal.style.display='none'; };

  if(open) open.onclick = show;
  if(close) close.onclick = hide;
  if(go) go.onclick = () => {
    hide();
    appendMessage('assistant','Logged in (mock). In production, this would call your auth endpoint.');
  };

  // Close on backdrop click
  modal.addEventListener('click', (e)=>{ if(e.target === modal) hide(); });
}

// ===== Boot
function boot(){
  populateShortcuts();
  wireComposer();
  wireNav();
  wireLogin();

  setText('build','UX preview • main.v38');
  appendMessage('assistant', SAMPLE_WELCOME);
}

onReady(boot);
