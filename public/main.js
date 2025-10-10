const sendBtn = document.getElementById('send');
const input = document.getElementById('user-input');
const messages = document.getElementById('messages');

async function ask(text) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: text })
  });
  return res.json();
}

sendBtn.addEventListener('click', async () => {
  const text = input.value.trim();
  if (!text) return;

  const you = document.createElement('p');
  you.textContent = 'You: ' + text;
  messages.appendChild(you);

  try {
    const data = await ask(text);
    const ai = document.createElement('p');
    ai.textContent = data.ok ? ('AI: ' + (data.reply || '')) : ('AI error: ' + data.error);
    messages.appendChild(ai);
  } catch (e) {
    const ai = document.createElement('p');
    ai.textContent = 'AI error: ' + e.message;
    messages.appendChild(ai);
  } finally {
    input.value = '';
  }
});
