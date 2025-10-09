const $log = document.getElementById('log');
const $status = document.getElementById('status');
const $form = document.getElementById('chat');
const $q = document.getElementById('q');
const $send = document.getElementById('send');

const healthUrl = "/api/health-v39";
const chatUrl = "/api/chat-v39";

function add(role, text) {
  const wrap = document.createElement('div');
  wrap.className = 'msg ' + (role === 'user' ? 'me' : '');
  const meta = document.createElement('div'); meta.className = 'meta';
  meta.textContent = role === 'user' ? 'You' : 'Assistant';
  const body = document.createElement('div'); body.textContent = text;
  wrap.appendChild(meta); wrap.appendChild(body);
  $log.appendChild(wrap);
  $log.scrollTop = $log.scrollHeight;
}

async function checkHealth() {
  try {
    const r = await fetch(healthUrl);
    const j = await r.json();
    $status.textContent = j.ok
      ? `OK — ${j.version || 'v39'} | Tavily: ${j.env?.TAVILY_API_KEY?'set':'missing'} | FRED: ${j.env?.FRED_API_KEY?'set':'missing'}`
      : 'Degraded';
  } catch {
    $status.textContent = 'Health check failed';
  }
}
checkHealth();

$form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const prompt = $q.value.trim();
  if (!prompt) return;
  add('user', prompt);
  $q.value = '';
  $send.disabled = true;

  try {
    const r = await fetch(chatUrl, {
      method: 'POST',
      headers: {'content-type':'application/json'},
      body: JSON.stringify({ prompt })
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();
    add('assistant', data.answer || '(no answer)');
  } catch (err) {
    add('assistant', `Error: ${err.message}`);
  } finally {
    $send.disabled = false;
  }
});
