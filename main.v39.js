document.addEventListener("DOMContentLoaded", () => {
  const thread = byId("thread");
  const form = byId("composer");
  const query = byId("query");
  const loadingEl = byId("loading");
  const buildEl = byId("build");

  const newChatBtn = byId("newChatBtn");
  const saveChatBtn = byId("saveChatBtn");
  const newProjectBtn = byId("newProjectBtn");

  buildEl.textContent = "build: v39";
  loadingEl.textContent = "";

  let chatHistory = [];

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = (query.value || "").trim();
    if (!text) return;
    appendMessage("user", text);
    query.value = "";
    setLoading(true);

    try {
      const reply = await callChatAPI(text);
      appendMessage("assistant", reply);
      chatHistory.push({ user: text, ai: reply });
    } catch (err) {
      console.error(err);
      appendMessage("assistant", "Network hiccup. Try again.");
    } finally {
      setLoading(false);
    }
  });

  newChatBtn.addEventListener("click", () => {
    thread.innerHTML = "";
    chatHistory = [];
    appendMessage("assistant", "New chat started. Ask me anything about mortgages or programs.");
  });

  saveChatBtn.addEventListener("click", () => {
    if (!chatHistory.length) {
      alert("No chat history to save.");
      return;
    }
    const blob = new Blob([JSON.stringify(chatHistory, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "chat-history.json";
    a.click();
  });

  newProjectBtn.addEventListener("click", () => {
    alert("Project creation placeholder — coming soon.");
  });

  // Welcome
  appendMessage("assistant", "Welcome to HomeRates.ai — your mortgage assistant.");

  // Helpers
  function appendMessage(role, text) {
    const msg = document.createElement("div");
    msg.className = "msg " + role;
    msg.textContent = text;
    thread.appendChild(msg);
    thread.scrollTop = thread.scrollHeight;
  }
  function setLoading(on) { loadingEl.textContent = on ? "…" : ""; }
  function byId(id) { return document.getElementById(id); }

  async function callChatAPI(message) {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.reply || "No reply.";
  }
});
