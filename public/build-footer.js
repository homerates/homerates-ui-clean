(async function () {
  try {
    const res = await fetch("/build-meta.json?ts=" + Date.now(), { cache: "no-store" });
    const meta = await res.json();

    const bar = document.createElement("div");
    Object.assign(bar.style, {
      position: "fixed",
      left: "0", right: "0", bottom: "0",
      padding: "6px 10px",
      font: "12px system-ui, -apple-system, Segoe UI, Roboto, Arial",
      background: "rgba(0,0,0,0.75)",
      color: "#fff",
      zIndex: "2147483647",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "8px"
    });

    const left = document.createElement("span");
    left.textContent = `Build: ${meta.version}+${meta.commit} | Env: ${meta.env}`;

    const right = document.createElement("span");
    const tick = () => { right.textContent = "Now: " + new Date().toLocaleString(); };
    tick(); setInterval(tick, 1000);

    bar.append(left, right);
    document.body.appendChild(bar);
  } catch {}
})();
