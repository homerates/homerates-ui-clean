// public/HomeRatesApp.js — UMD React (uses window.React / window.ReactDOM)
(function () {
  const h = React.createElement;

  // ---------- utils ----------
  const useQueryParam = (k) => React.useMemo(() => {
    try { return new URL(location.href).searchParams.get(k); } catch { return null; }
  }, [k]);
  const shortSha = (s) => (s ? String(s).slice(0, 7) : "—");
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  async function typeIn(text, onChunk, d = 6) { let b=""; for (const ch of text) { b+=ch; onChunk(b); await sleep(d); } }
  const lastUser = (m=[]) => { for (let i=m.length-1;i>=0;i--) if (m[i].role==="user") return m[i]; return null; };

  // ---------- logos (direct path to files that live under public/assets) ----------
  function LogoMark({ className="h-7 w-7" } = {}) {
    const ref = React.useRef(null);
    const p1  = "/public/assets/homerates-mark.svg";
    const fb  = "/assets/HR-logo.svg"; // safe fallback already in deploy
    return h("img", { ref, src: p1, alt:"HomeRates", className,
      onError: () => { if (ref.current && ref.current.src !== fb) ref.current.src = fb; }});
  }
  function LogoWordmark({ className="h-4" } = {}) {
    const ref = React.useRef(null);
    const p1  = "/public/assets/homerates-wordmark.svg";
    const fb  = "/assets/HR-logo.svg";
    return h("img", { ref, src: p1, alt:"HomeRates", className,
      onError: () => { if (ref.current && ref.current.src !== fb) ref.current.src = fb; }});
  }

  // ---------- header ----------
  function Header() {
    const [s, setS] = React.useState({ ok:false, ver:null, sha:null, ms:null, err:null });
    const show = (useQueryParam("debug") ?? "") === "1";
    const [open, setOpen] = React.useState(show);

    React.useEffect(() => {
      let dead = false;
      (async () => {
        try {
          const t0 = performance.now();
          const r  = await fetch("/api/chat2?ping=1", { cache:"no-store" });
          const t1 = performance.now();
          const ms = Math.round(t1 - t0);
          const j  = await r.json().catch(() => ({}));
          if (!dead) setOpen(show), setS({ ok:true, ver:j.version||null, sha:j.sha||null, ms, err:null });
        } catch (e) {
          if (!dead) setS(x => ({ ...x, ok:false, err:String(e) }));
        }
      })();
      return () => { dead = true; };
    }, []);

    const Pill = (k,v) => h("div", { className:"inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-zinc-50 px-3 py-1 text-xs" },
      h("span", { className:"text-zinc-500" }, k),
      h("span", { className:"font-mono" }, v ?? "—")
    );
    const Dot = ({ok}) => h("span", { className:`h-2.5 w-2.5 rounded-full ${ok?"bg-emerald-500":"bg-red-500"}`});

    return h("header", { className:"border-b border-zinc-200 bg-white/90 backdrop-blur" },
      h("div", { className:"mx-auto max-w-6xl px-4 py-3 flex flex-wrap items-center justify-between gap-3" },
        h("div", { className:"flex items-center gap-3" },
          h(LogoMark), h(LogoWordmark),
          h("span", { className:"text-xs text-zinc-500" }, "• build status")
        ),
        h("div", { className:"flex items-center gap-2" },
          h(Dot, { ok:s.ok }), Pill("ver", s.ver), Pill("sha", shortSha(s.sha)), Pill("ms", s.ms),
          h("button", { onClick: () => setOpen(o=>!o),
            className:"rounded-full border border-zinc-300 bg-zinc-50 px-3 py-1 text-xs hover:bg-zinc-100" },
            open ? "Hide Debug" : "Show Debug"
          )
        )
      ),
      open && h(DebugDrawer, { status:s })
    );
  }

  function DebugDrawer({ status }) {
    const [health, setHealth] = React.useState(null);
    const [chat, setChat]     = React.useState(null);
    const [busy, setBusy]     = React.useState(false);
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
    const Panel = (t, data) => h("div", { className:"rounded-lg border border-zinc-200 bg-white p-2" },
      h("div", { className:"mb-1 text-[11px] uppercase tracking-wide text-zinc-500" }, t),
      h("pre", { className:"max-h-48 overflow-auto rounded bg-white p-2 text-xs" }, data ? JSON.stringify(data,null,2) : "(no data)")
    );

    return h("div", { className:"border-t border-zinc-200 bg-zinc-50" },
      h("div", { className:"mx-auto max-w-6xl px-4 py-3 grid gap-3 md:grid-cols-2" },
        Panel("/api/health", health),
        Panel("/api/chat2?ping=1", chat),
        h("div", { className:"md:col-span-2" },
          h("button", { onClick: probe, disabled: busy,
            className:"rounded-md border border-zinc-300 bg-white px-3 py-1 text-xs hover:bg-zinc-50 disabled:opacity-60" },
            busy ? "Probing…" : "Probe APIs")
        )
      )
    );
  }

  // ---------- sidebar ----------
  function Sidebar() {
    return h("aside", { className:"sticky top-4 h-fit rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm" },
      h("div", { className:"mb-3 text-sm text-zinc-600" }, "Top 5 borrower questions"),
      h(TopQuestions), h("div", { className:"mt-4 grid gap-3" }, h(QuickProbe), h(Shortcuts))
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
    const inject = (t) => { const ta = window.__HR_CHAT_INPUT || null; if (!ta) return;
      ta.value = t; ta.dispatchEvent(new Event("input", { bubbles:true })); ta.focus(); };
    return h("ul", { className:"space-y-2" },
      qs.map(q => h("li", { key:q.id },
        h("button", { onClick: () => inject(q.text),
          className:"w-full text-left rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm hover:bg-zinc-100" }, q.label)
      ))
    );
  }
  function QuickProbe() {
    const [loading, setLoading] = React.useState(false);
    const [health, setHealth]   = React.useState(null);
    const [chat, setChat]       = React.useState(null);
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
    return h("div", { className:"grid gap-2 mt-3" },
      h("button", { onClick: probe, disabled: loading,
        className:"rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm hover:bg-zinc-100 disabled:opacity-60" },
        loading ? "Probing…" : "Probe APIs"),
      h("pre", { className:"max-h-40 overflow-auto text-xs rounded border border-zinc-200 bg-white p-2" }, health ? JSON.stringify(health,null,2) : "(no data)"),
      h("pre", { className:"max-h-40 overflow-auto text-xs rounded border border-zinc-200 bg-white p-2" }, chat ? JSON.stringify(chat,null,2) : "(no data)")
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
    return h("div", { className:"rounded-2xl border border-zinc-200 p-2 mt-2" },
      h("div", { className:"mb-2 text-[11px] uppercase tracking-wide text-zinc-500" }, "Saved prompts"),
      h("div", { className:"flex flex-wrap gap-2" },
        presets.map(p => h("button", { key:p.id, onClick:() => inject(p.text),
          className:"rounded-full border border-zinc-300 bg-zinc-50 px-3 py-1 text-xs hover:bg-zinc-100" }, p.label))
      )
    );
  }

  // ---------- main/chat ----------
  function Main() { return h("main", null, h(ChatShell)); }
  function ChatShell() {
    const [messages, setMessages] = React.useState([{ id:"m1", role:"assistant", text:"Welcome to HomeRates. Ask about rates, scenarios, or programs when you're ready.", ts: Date.now() }]);
    const [input, setInput] = React.useState("");
    const [busy, setBusy]   = React.useState(false);
    const listRef  = React.useRef(null);
    const inputRef = React.useRef(null);

    React.useEffect(() => { window.__HR_CHAT_INPUT = inputRef.current; }, []);
    React.useEffect(() => { listRef.current?.lastElementChild?.scrollIntoView({ behavior:"smooth", block:"end" }); }, [messages.length]);

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
        await typeIn(`(${ms}ms) ${reply}`, chunk => setMessages(m => m.map(msg => msg.id===asstMsg.id ? { ...msg, text: chunk } : msg)));
        setMessages(m => m.map(msg => msg.id===asstMsg.id ? { ...msg, streaming:false } : msg));
      } catch (e) {
        setMessages(m => m.map(msg => msg.id===asstMsg.id ? { ...msg, text:`Error: ${String(e)}`, streaming:false } : msg));
      } finally { setBusy(false); }
    };

    const retry = () => { const u = lastUser(messages); if (u) send(u.text); };
    const copyT = async (t) => { try { await navigator.clipboard.writeText(t); } catch {} };
    const rm    = (id) => setMessages(m => m.filter(x => x.id !== id));

    return h("div", { className:"grid gap-3" },
      h("div", { ref:listRef, className:"min-h-[55vh] rounded-2xl border border-zinc-200 bg-white p-4" },
        h("ul", { className:"space-y-3" },
          messages.map(m => h("li", { key:m.id, className:"group" },
            h(Bubble, { role:m.role, ts:m.ts, streaming:m.streaming, onRetry:retry, onCopy:() => copyT(m.text), onDelete:() => rm(m.id) }, m.text)
          ))
        )
      ),
      h("div", { className:"flex items-end gap-2" },
        h("textarea", {
          ref: inputRef, rows: 2, placeholder: "Type a message… (Shift+Enter = newline)",
          className:"w-full resize-none rounded-xl border border-zinc-300 bg-white p-3 text-sm outline-none focus:ring-1 focus:ring-emerald-500",
          value: input, onChange: e => setInput(e.target.value),
          onKeyDown: e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }
        }),
        h("div", { className:"flex gap-2" },
          h("button", { onClick: retry, disabled: busy, className:"h-10 rounded-xl border border-zinc-300 bg-zinc-50 px-3 text-sm hover:bg-zinc-100 disabled:opacity-60" }, "Retry"),
          h("button", { onClick: () => send(), disabled: busy || !input.trim(), className:"h-10 rounded-xl border border-emerald-600/40 bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60" }, "Send")
        )
      )
    );
  }
  function Bubble({ role, children, streaming, ts, onRetry, onCopy, onDelete }) {
    const isUser = role === "user";
    const stamp = new Intl.DateTimeFormat(undefined, { hour:"2-digit", minute:"2-digit" }).format(ts || Date.now());
    return h("div", { className:`max-w-[90%] rounded-2xl p-3 text-sm shadow-sm ${isUser?"ml-auto bg-emerald-600 text-white":"mr-auto border border-zinc-200 bg-white text-zinc-900"}` },
      h("div", { className:"whitespace-pre-wrap leading-relaxed" }, children),
      h("div", { className:"mt-2 flex items-center gap-2 text-[11px] text-zinc-500" },
        h("span", null, stamp),
        !isUser && (streaming
          ? h("span", { className:"animate-pulse" }, "streaming…")
          : h(React.Fragment, null,
              h("button", { onClick:onRetry, className:"rounded px-1.5 py-0.5 hover:bg-zinc-100" }, "retry"),
              h("button", { onClick:onCopy, className:"rounded px-1.5 py-0.5 hover:bg-zinc-100" }, "copy"),
              h("button", { onClick:onDelete, className:"rounded px-1.5 py-0.5 hover:bg-zinc-100" }, "delete")
            )
        )
      )
    );
  }

  function Footer() {
    const [ts, setTs] = React.useState("");
    React.useEffect(() => { setTs(new Intl.DateTimeFormat(undefined, { dateStyle:"medium", timeStyle:"medium" }).format(new Date())); }, []);
    return h("div", { className:"sticky bottom-0 mt-6 border-t border-zinc-200 bg-white/90 py-3 backdrop-blur" },
      h("div", { className:"mx-auto max-w-6xl px-4 text-[11px] text-zinc-500 flex items-center justify-between" },
        h("span", null, "HomeRates UI • sandbox build"),
        h("span", null, ts)
      )
    );
  }

  // ---------- mount ----------
  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(h(React.Fragment, null,
    h(Header),
    h("div", { className:"mx-auto max-w-6xl px-4 py-4 grid grid-cols-1 gap-4 md:grid-cols-[300px_1fr]" },
      h(Sidebar),
      h(Main)
    ),
    h(Footer)
  ));
})();
