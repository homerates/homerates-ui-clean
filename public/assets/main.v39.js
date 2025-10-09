const $log = document.getElementById('log');
const $status = document.getElementById('status');
const $form = document.getElementById('chat');
const $q = document.getElementById('q');

function add(role, text){
  const d=document.createElement('div');
  d.className='msg'+(role==='user'?' me':'');
  d.innerHTML=`<div class="muted">${role==='user'?'You':'Assistant'}</div><div>${text}</div>`;
  $log.appendChild(d); $log.scrollTop=$log.scrollHeight;
}

async function health(){
  try{
    const r=await fetch('/api/health-v39'); const j=await r.json();
    $status.textContent = j.ok ? `OK — OPENAI:${j.env.OPENAI_API_KEY} | Tavily:${j.env.TAVILY_API_KEY} | FRED:${j.env.FRED_API_KEY} (${j.vercel.env})` : 'Degraded';
  }catch{ $status.textContent='Health check failed'; }
}
health();

$form.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const prompt=$q.value.trim(); if(!prompt) return;
  add('user', prompt); $q.value='';
  try{
    const r=await fetch('/api/chat-v39',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({prompt})});
    const j=await r.json();
    add('assistant', j.answer || JSON.stringify(j));
  }catch(err){ add('assistant', 'Error: '+err.message); }
});
