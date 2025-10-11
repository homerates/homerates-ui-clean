// ---------- logos ----------
function LogoMark({ className = "h-6 w-6" } = {}) {
  const ref = useRef(null);
  const primary = "/assets/homerates-mark.svg";      // primary: your mark
  const fallback1 = "assets/homerates-mark.svg";     // relative fallback
  const fallback2 = "/assets/HR-logo.svg";           // last-resort (existing)
  return React.createElement("img", {
    ref,
    src: primary,
    alt: "HomeRates",
    className,
    onError: () => {
      if (!ref.current) return;
      // try relative first, then the HR-logo
      const next = ref.current.src.endsWith("homerates-mark.svg") ? fallback1 : fallback2;
      if (ref.current.src !== next) ref.current.src = next;
    }
  });
}

function LogoWordmark({ className = "h-4" } = {}) {
  const ref = useRef(null);
  const primary = "/assets/homerates-wordmark.svg";  // primary: your wordmark
  const fallback1 = "assets/homerates-wordmark.svg"; // relative fallback
  const fallback2 = "/assets/HR-logo.svg";           // last-resort (existing)
  return React.createElement("img", {
    ref,
    src: primary,
    alt: "HomeRates",
    className,
    onError: () => {
      if (!ref.current) return;
      const next = ref.current.src.endsWith("homerates-wordmark.svg") ? fallback1 : fallback2;
      if (ref.current.src !== next) ref.current.src = next;
    }
  });
}
