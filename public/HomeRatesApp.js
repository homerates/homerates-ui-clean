console.log("[HR] HomeRatesApp.js loaded");
const probeEl = document.getElementById("hr-index-probe");
if (probeEl) {
  const span = document.createElement("div");
  span.className = "mx-auto max-w-6xl px-4 py-2 text-xs text-emerald-700";
  span.textContent = "HomeRatesApp.js loaded ";
  probeEl.after(span);
}

(function () {
  const h = React.createElement;

  function App() {
    return h(
      "div",
      { className: "min-h-screen bg-white text-zinc-900" },
      h(
        "div",
        { className: "mx-auto max-w-6xl px-4 py-6" },
        h("h1", { className: "text-xl font-semibold" }, "HomeRates UI"),
        h(
          "p",
          { className: "mt-1 text-sm text-zinc-600" },
          "If you can read this, React mounted correctly."
        )
      )
    );
  }

  const rootEl = document.getElementById("root");
  if (!rootEl) {
    console.error("[HR] #root missing");
    return;
  }

  try {
    const root = ReactDOM.createRoot(rootEl);
    root.render(h(App));
  } catch (e) {
    console.error("[HR] React mount failed:", e);
    const err = document.createElement("div");
    err.className = "mx-auto max-w-6xl px-4 py-2 text-xs text-red-700 border border-red-200 bg-red-50";
    err.textContent = "React mount failed: " + String(e);
    rootEl.appendChild(err);
  }
})();
