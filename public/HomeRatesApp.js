// public/HomeRatesApp.js  — zero-build React (no JSX)
// If esm.sh is blocked, flip the import URLs below to unpkg (see note at bottom).

import React, { useEffect, useMemo, useRef, useState } from "https://esm.sh/react@18";

export default function HomeRatesApp() {
  return React.createElement(
    "div",
    { className: "min-h-screen bg-white text-zinc-900" },
    React.createElement(Header, null),
    React.createElement("div", { className: "mx-auto max-w-6xl px-4 py-4 grid grid-cols-1 gap-4 md:grid-cols-[300px_1fr]" },
      React.createElement(Sidebar, null),
      React.createElement(Main, null)
    ),
    React.createElement(Footer, null)
  );
}

// ---------- small utilities ----------
const useQueryParam = (k) => useMemo(() => {
  if (typeof window === "undefined") return null;
  return new URL(window.location.href).searchParams.get(k);
}, [k]);

const shortSha = (s) => (s ? String(s).slice(0, 7) : "—");
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function typeIn(text, onChunk, d = 6) { let buf=""; for (const ch of text) { buf+=ch; onChunk(buf); await sleep(d); } }
const lastUser = (m=[]) => { for (let i=m.length-1;i>=0;i--) if (m[i].role==="user") return m[i]; return null; };

// ---------- header ----------
function Header() {
  const [status, setStatus] = useState({ ok:false, version:null, sha:null, ms:null, err:null });
  const showDebug = (useQueryParam("debug") ?? "") === "1";
  const [open, setOpen] = useState(showDebug);

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const t0 = performance.now();
        const r = await fetch("/api/chat2?ping=1", { cache: "no-store" });
        const t1 = performance.now();
        const ms = Math.round(t1 - t0);
        const j = await r.json().catch(() => ({}));
        if (dead) return;
        setStatus({ ok:true, version:j.version||null, sha:j.sha||null, ms, err:null });
      } catch (e) {
        if (!dead) setStatus(s => ({ ...s, ok:false, err:String(e) }));
      }
    })();
    return () => { dead = true; };
  }, []);

  const Pill = (k,v) => React.createElement("div", { className:"inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-zinc-50 px-3 py-1 text-xs" },
    React.createElement("span", { className:"text-zinc-500" }, k),
    React.createElement("span", { className:"font-mono" }, v ?? "—")
  );

  return React.createElement(
    "header",
    { className:"border-b border-zinc-200 bg-white/90 backdrop-blur" },
    React.createElement("div", { className:"mx-auto max-w-6xl px-4 py-3 flex flex-wrap items-center justify-between gap-3" },
      React.createElement("div", { className:"flex items-center gap-3" },
        React.createElement(LogoMark, { className:"h-8 w-8" }),
        React.createElement(LogoWordmark, { className:"h-4" }),
        React.createElement("span", { className:"text-xs text-zinc-500" }, "• HomeRates UI sandbox")
      ),
      React.createElement("div", { className:"flex items-center gap-2" },
        React.createElement(StatusDot, { ok: status.ok }),
        Pill("ver", status.version),
        Pill("sha", shortSha(status.sha)),
        Pill("ms", status.ms),
        React.createElement("button", { onClick: () => setOpen(o=>!o), className:"rounded-full border border-zinc-300 bg-zinc-50 px-3 py-1 text-xs hover:bg-zinc-100" }, open ? "Hide Debug" : "Show Debug")
      )
    ),
    open && React.createElement(DebugDrawer, { status })
  );
}

function StatusDot({ ok }) {
  return React.createElement("div", { className:"relative h-2.5 w-2.5" },
    React.createElement("span", { className:`absolute inset-0 rounded-full ${ok?"bg-emerald-500":"bg-red-500"}` }),
    React.createElement("span", { className:`absolute inset-0 animate-ping rounded-full ${ok?"bg-emerald-500/40":"bg-red-500/40"}` }),
  );
}

function DebugDrawer({ status }) {
  const [health, setHealth] = useState(null);
  const [chat, setChat]   = useState(null);
  const [busy, setBusy]   = useState(false);

  const probe = async () => {
    setBusy(true);
    try {
      const [h,c] = await Promise.all([
        fetch("/api/health", { cache:"no-store" }).then(r=>r.json()).catch(()=>null),
        fetch("/api/chat2?ping=1", { cache:"no-store" }).then(r=>r.json()).catch(()=>null),
      ]);
      setHealth(h); setChat(c);
    } finally { setBusy(false); }
  };

  return React.createElement("div", { className:"border-t border-zinc-200 bg-zinc-50" },
    React.createElement("div", { className:"mx-auto max-w-6xl px-4 py-3 grid gap-3 md:grid-cols-2" },
      React.createElement("div", null,
        React.createElement("div", { className:"mb-1 text-[11px] uppercase tracking-wide text-zinc-500" }, "/api/health"),
        React.createElement("pre", { className:"max-h-48 overflow-auto rounded border border-zinc-200 bg-white p-2 text-xs" }, health ? JSON.stringify(health, null, 2) : "(no data)")
      ),
      React.createElement("div", null,
        React.createElement("div", { className:"mb-1 text-[11px] uppercase tracking-wide text-zinc-500" }, "/api/chat2?ping=1"),
        React.createElement("pre", { className:"max-h-48 overflow-auto rounded border border-zinc-200 bg-white p-2 text-xs" }, chat ? JSON.stringify(chat, null, 2) : "(no data)")
      ),
      React.createElement("div", { className:"md:col-span-2" },
        React.createElement("button", { onClick: probe, disabled: busy, className:"rounded-md border border-zinc-300 bg-white px-3 py-1 text-xs hover:bg-zinc-50 disabled:opacity-60" }, busy ? "Probing…" : "Probe APIs")
      )
    )
  );
}

// ---------- logos (point to your git `public/assets`) ----------
function LogoMark({ className="h-6 w-6" } = {}) {
  const ref = useRef(null);
  const p1 = "/public/assets/homerates-mark.svg";      // exact path you said exists in Git
  const p2 = "/assets/HR-logo.svg";                    // safe fallback
  return React.createElement("img", { ref, src: p1, alt:"HomeRates", className,
    onError: () => { if (ref.current && ref.current.src !== p2) ref.current.src = p2; }});
}
function LogoWordmark({ className="h-4" } = {}) {
  const ref = useRef(null);
  const p1 = "/public/assets/homerates-wordmark.svg";
  const p2 = "/assets/HR-logo.svg";
  return React.createElement("img", { ref, src: p1, alt:"HomeRates", className,
    onError: () => { if (ref.current && ref.current.src !== p2) ref.current.src = p2; }});
}

// ---------- sidebar ----------
function Sidebar() {
  return React.createElement("aside", { className:"sticky top-4 h-fit rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm" },
    React.createElement("div", { className:"mb-3 text-sm text-zinc-600" }, "Top 5 borrower questions"),
    React.createElement(TopQuestions, null),
    React.createElement("div", { className:"mt-4 grid gap-3" }, React.createElement(QuickProbe, null), React.createElement(Shortcuts, null))
  );
}

function TopQuestions() {
  const qs = [
    { id:1, label:"What are today’s mortgage rates?", text:"Show me today’s mortgage rates for 30-year, 15-year, and ARM loans." },
    { id:2, label:"How much will I qualify for?", text:"Estimate how much home I can afford based on my income and credit score." },
    { id:3, label:"First-time homebuyer — where do I start?", text:"Give me a simple step-by-step guide for buying my first home." },
    { id:4, label:"What down payment assistance programs are available?", text:"List down payment assistance programs available in California." },
    { id:5, label:"Compare lenders and rates.", text:"Help me compare current lender rates and APRs side-by-side." }
  ];
  const inject = (t) => {
    const ta = window.__HR_CHAT_INPUT || null;
    if (!ta) return;
    ta.value = t; ta.dispatchEvent(new Event("input", { bubbles:true })); ta.focus();
  };
  return React.createElement("ul", { className:"space-y-2" },
    qs.map(q => React.createElement("li", { key:q.id },
      React.createElement("button", { onClick: () => inject(q.text),
        className:"w-full text-left rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm hover:bg-zinc-100" }, q.label)
    ))
  );
}

function QuickProbe() {
  const [loading, setLoading] = useState(false);
  const [health, setHealth]   = useState(null);
  const [chat, setChat]       = useState(null);
  const probe = async () => {
    setLoading(true);
    try {
      const [h,c] = await Promise.all([
        fetch("/api/health", { cache:"no-store" }).then(r=>r.json()).catch(()=>null),
        fetch("/api/chat2?ping=1", { cache:"no-store" }).then(r=>r.json()).catch(()=>null),
      ]);
      setHealth(h); setChat(c);
    } finally { setLoading(false); }
  };
  return React.createElement("div", { className:"grid gap-2 mt-3" },
    React.createElement("button", { onClick: probe, disabled: loading,
      className:"rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm hover:bg-zinc-100 disabled:opacity-60" }, loading ? "Probing…" : "Probe APIs"),
    React.createElement("pre", { className:"max-h-40 overflow-auto text-xs rounded border border-zinc-200 bg-white p-2" }, health ? JSON.stringify(health,null,2) : "(no data)"),
    React.createElement("pre", { className:"max-h-40 overflow-auto text-xs rounded border border-zinc-200 bg-white p-2" }, chat ? JSON.stringify(chat,null,2) : "(no data)")
  );
}

function Shortcuts() {
  const presets = [
    { id:"p1", label:"AccessZero overview", text:"Explain AccessZero down payment assistance and eligibility in CA." },
    { id:"p2", label:"Seller credit vs price cut", text:"Compare seller credits vs price reductions for a $900k purchase." },
    { id:"p3", label:"DSCR quick calc", text:"Compute DSCR given rent $5,500 and PITIA $5,000." },
  ];
  const inject = (t) => { const ta = window.__HR_CHAT_INPUT || null; if (!ta) return;
    ta.value = t; ta.dispatchEvent(new Event("input", { bubbles:true })); ta.focus(); };
  return React.createElement("div", { className:"rounded-2xl border border-zinc-200 p-2 mt-2" },
    React.createElement("div", { className:"mb-2 text-[11px] uppercase tracking-wide text-zinc-500" }, "Saved prompts"),
    React.createElement("div", { className:"flex flex-wrap gap-2" },
      presets.map(p => React.createElement("button", { key:p.id, onClick:() => inject(p.text),
        className:"rounded-full border border-zinc-300 bg-zinc-50 px-3 py-1 text-xs hover:bg-zinc-100" }, p.label))
    )
  );
}

// ---------- main (chat shell) ----------
function Main() {
  return React.createElement("main", null, React.createElement(ChatShell, null));
}

function ChatShell() {
  const [messages, setMessages] = useState([{ id:"m1", role:"assistant", text:"Welcome to HomeRates. Ask about rates, scenarios, or programs when you're ready.", ts: Date.now() }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef  = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { if (typeof window !== "undefined") window.__HR_CHAT_INPUT = inputRef.current; }, []);
  useEffect(() => { listRef.current?.lastElementChild?.scrollIntoView({ behavior:"smooth", block:"end" }); }, [messages.length]);

  const uid = () => (crypto?.randomUUID ? crypto.randomUUID() : `id_${Math.random().toString(36).slice(2)}`);

  const send = async (retryText) => {
    const userText = (retryText ?? input).trim();
    if (!userText) return;
    setInput("");

    const id = uid();
    const userMsg = { id:`u-${id}`, role:"user", text:userText, ts: Date.now() };
    const asstMsg = { id:`a-${id}`, role:"assistant", text:"", streaming:true, ts: Date.now() };
    setMessages(m => [...m, userMsg, asstMsg]);

    setBusy(true);
    try {
      const t0 = performance.now();
      const r  = await fetch("/api/chat2", { method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify({ prompt: userText, stream:false }) });
      const t1 = performance.now();
      const ms = Math.round(t1 - t0);
      const j  = await r.json().catch(() => ({ ok:false }));
      const reply = j && j.ok !== false ? (j.reply || JSON.stringify(j)) : "(request failed)";
      await typeIn(`(${ms}ms) ${reply}`, chunk => setMessages(m => m.map(msg => msg.id === asstMsg.id ? { ...msg, text: chunk } : msg)));
      setMessages(m => m.map(msg => msg.id === asstMsg.id ? { ...msg, streaming:false } : msg));
    } catch (e) {
      setMessages(m => m.map(msg => msg.id === asstMsg.id ? { ...msg, text:`Error: ${String(e)}`, streaming:false } : msg));
    } finally { setBusy(false); }
  };

  const retry   = () => { const u = lastUser(messages); if (u) send(u.text); };
  const copyTxt = async (t) => { try { await navigator.clipboard.writeText(t); } catch {} };
  const remove  = (id) => setMessages(m => m.filter(x => x.id !== id));

  return React.createElement("div", { className:"grid gap-3" },
    React.createElement("div", { ref:listRef, className:"min-h-[55vh] rounded-2xl border border-zinc-200 bg-white p-4" },
      React.createElement("ul", { className:"space-y-3" },
        messages.map(m => React.createElement("li", { key:m.id, className:"group" },
          React.createElement(Bubble, { role:m.role, ts:m.ts, streaming:m.streaming, onRetry:retry, onCopy:() => copyTxt(m.text), onDelete:() => remove(m.id) }, m.text)
        ))
      )
    ),
    React.createElement("div", { className:"flex items-end gap-2" },
      React.createElement("textarea", {
        ref: inputRef, rows: 2, placeholder: "Type a message… (Shift+Enter = newline)",
        className:"w-full resize-none rounded-xl border border-zinc-300 bg-white p-3 text-sm outline-none focus:ring-1 focus:ring-emerald-500",
        value: input, onChange: e => setInput(e.target.value),
        onKeyDown: e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }
      }),
      React.createElement("div", { className:"flex gap-2" },
        React.createElement("button", { onClick: retry, disabled: busy, className:"h-10 rounded-xl border border-zinc-300 bg-zinc-50 px-3 text-sm hover:bg-zinc-100 disabled:opacity-60" }, "Retry"),
        React.createElement("button", { onClick: () => send(), disabled: busy || !input.trim(), className:"h-10 rounded-xl border border-emerald-600/40 bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60" }, "Send")
      )
    )
  );
}

function Bubble({ role, children, streaming, ts, onRetry, onCopy, onDelete }) {
  const isUser = role === "user";
  const stamp = new Intl.DateTimeFormat(undefined, { hour:"2-digit", minute:"2-digit" }).format(ts || Date.now());
  return React.createElement("div", { className:`max-w-[90%] rounded-2xl p-3 text-sm shadow-sm ${isUser?"ml-auto bg-emerald-600 text-white":"mr-auto border border-zinc-200 bg-white text-zinc-900"}` },
    React.createElement("div", { className:"whitespace-pre-wrap leading-relaxed" }, children),
    React.createElement("div", { className:"mt-2 flex items-center gap-2 text-[11px] text-zinc-500" },
      React.createElement("span", null, stamp),
      !isUser && (streaming
        ? React.createElement("span", { className:"animate-pulse" }, "streaming…")
        : React.createElement(React.Fragment, null,
            React.createElement("button", { onClick:onRetry, className:"rounded px-1.5 py-0.5 hover:bg-zinc-100" }, "retry"),
            React.createElement("button", { onClick:onCopy, className:"rounded px-1.5 py-0.5 hover:bg-zinc-100" }, "copy"),
            React.createElement("button", { onClick:onDelete, className:"rounded px-1.5 py-0.5 hover:bg-zinc-100" }, "delete")
          )
      )
    )
  );
}

// ---------- footer ----------
function Footer() {
  const [ts, setTs] = useState("");
  useEffect(() => { setTs(new Intl.DateTimeFormat(undefined, { dateStyle:"medium", timeStyle:"medium" }).format(new Date())); }, []);
  return React.createElement("div", { className:"sticky bottom-0 mt-6 border-t border-zinc-200 bg-white/90 py-3 backdrop-blur" },
    React.createElement("div", { className:"mx-auto max-w-6xl px-4 text-[11px] text-zinc-500 flex items-center justify-between" },
      React.createElement("span", null, "HomeRates UI • sandbox build"),
      React.createElement("span", null, ts)
    )
  );
}

/* ------------------------------------------------------------------
   If esm.sh is blocked by your network, swap the React import to UMD:
   Replace the first line with:
   // import React from "https://unpkg.com/react@18/umd/react.production.min.js";
   // window.React is then available; adapt createRoot import in index.html accordingly.
------------------------------------------------------------------- */
