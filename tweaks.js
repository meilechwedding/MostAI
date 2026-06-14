/* ============================================================
   MostAI — Tweaks panel (vanilla, multi-page)
   ------------------------------------------------------------
   In-page controls the user can open from the Tweaks toolbar
   toggle. Persists across all pages via localStorage and (on the
   page that carries the EDITMODE block) to disk via the host.
   Tweaks:  glass strength · ink strength · ink flow · background
   ============================================================ */
(function () {
  "use strict";

  var LS_KEY = "mostai.tweaks";
  var DEFAULTS = {
    glass: 1,            // 0.4 – 1.5  card glass strength (alpha + blur)
    inkIntensity: 1.15,  // 0.4 – 2.0  ink brightness / presence
    inkTurbulence: 1.6,  // 0.3 – 2.6  swirl / flow energy
    inkTint: "navy",     // navy | midnight | slate | indigo
  };

  /* page may ship an EDITMODE defaults block for disk persistence */
  var pageDefaults = (window.__TWEAK_DEFAULTS && typeof window.__TWEAK_DEFAULTS === "object")
    ? window.__TWEAK_DEFAULTS : {};
  var hasEditBlock = !!window.__TWEAK_DEFAULTS;

  var stored = {};
  try { stored = JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch (e) {}
  var state = Object.assign({}, DEFAULTS, pageDefaults, stored);

  var TINTS = ["navy", "midnight", "slate", "indigo"];
  var TINT_LABELS = { navy: "Navy", midnight: "Deep", slate: "Slate", indigo: "Indigo" };

  /* ---- apply live ---- */
  function applyAll() {
    document.documentElement.style.setProperty("--glass", state.glass);
    if (window.MostaiInk && window.MostaiInk.set) {
      window.MostaiInk.set({
        intensity: state.inkIntensity,
        turbulence: state.inkTurbulence,
        tint: state.inkTint,
      });
    }
  }
  // apply once now, and again shortly after in case the ink engine mounts late
  applyAll();
  window.addEventListener("load", applyAll);

  function persist(patch) {
    Object.assign(state, patch);
    try { localStorage.setItem(LS_KEY, JSON.stringify(pick(state))); } catch (e) {}
    if (hasEditBlock) {
      try { window.parent.postMessage({ type: "__edit_mode_set_keys", edits: pick(state) }, "*"); } catch (e) {}
    }
    applyAll();
  }
  function pick(s) {
    return { glass: s.glass, inkIntensity: s.inkIntensity, inkTurbulence: s.inkTurbulence, inkTint: s.inkTint };
  }

  /* ---- panel UI (built lazily) ---- */
  var panel = null;

  function el(tag, css, txt) {
    var e = document.createElement(tag);
    if (css) e.style.cssText = css;
    if (txt != null) e.textContent = txt;
    return e;
  }

  function slider(label, key, min, max, step, fmt) {
    var wrap = el("div", "margin:0 0 18px");
    var top = el("div", "display:flex;justify-content:space-between;align-items:baseline;margin-bottom:9px");
    var name = el("span", "font:600 12px/1 var(--font-head,sans-serif);letter-spacing:.04em;color:#EAF0FB", label);
    var val = el("span", "font:600 12px/1 var(--font-mono,monospace);color:#84B6FF", fmt(state[key]));
    top.appendChild(name); top.appendChild(val);
    var input = document.createElement("input");
    input.type = "range"; input.min = min; input.max = max; input.step = step; input.value = state[key];
    input.style.cssText = "width:100%;accent-color:#5FB0FF;cursor:pointer;height:18px";
    input.addEventListener("input", function () {
      var v = parseFloat(input.value);
      val.textContent = fmt(v);
      var p = {}; p[key] = v; persist(p);
    });
    wrap.appendChild(top); wrap.appendChild(input);
    return wrap;
  }

  function segmented(label, key, options, labels) {
    var wrap = el("div", "margin:0 0 6px");
    var name = el("div", "font:600 12px/1 var(--font-head,sans-serif);letter-spacing:.04em;color:#EAF0FB;margin-bottom:9px", label);
    var row = el("div", "display:flex;gap:6px");
    wrap.appendChild(name); wrap.appendChild(row);
    var btns = [];
    options.forEach(function (opt) {
      var b = el("button", "flex:1;padding:9px 4px;border-radius:10px;cursor:pointer;font:600 11px/1 var(--font-head,sans-serif);letter-spacing:.03em;transition:background .2s,border-color .2s,color .2s", (labels && labels[opt]) || opt);
      function paint() {
        var on = state[key] === opt;
        b.style.background = on ? "rgba(95,176,255,.18)" : "rgba(255,255,255,.04)";
        b.style.border = "1px solid " + (on ? "rgba(95,176,255,.5)" : "rgba(255,255,255,.12)");
        b.style.color = on ? "#fff" : "rgba(234,240,251,.72)";
      }
      b.addEventListener("click", function () {
        var p = {}; p[key] = opt; persist(p);
        btns.forEach(function (x) { x.paint(); });
      });
      b.paint = paint; paint();
      row.appendChild(b); btns.push(b);
    });
    return wrap;
  }

  function build() {
    if (panel) return panel;
    panel = el("div",
      "position:fixed;top:16px;right:16px;z-index:9999;width:268px;max-width:calc(100vw - 32px);" +
      "padding:20px 20px 16px;border-radius:20px;" +
      "background:rgba(12,16,28,.72);backdrop-filter:blur(34px) saturate(160%);-webkit-backdrop-filter:blur(34px) saturate(160%);" +
      "border:1px solid rgba(255,255,255,.14);box-shadow:0 30px 70px -30px rgba(0,0,0,.8),inset 0 1px 0 rgba(255,255,255,.14);" +
      "font-family:var(--font-head,sans-serif);display:none");

    var head = el("div", "display:flex;align-items:center;justify-content:space-between;margin-bottom:18px");
    head.appendChild(el("span", "font:700 14px/1 var(--font-head,sans-serif);letter-spacing:-.01em;color:#fff", "Tweaks"));
    var close = el("button", "width:26px;height:26px;border-radius:8px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);color:#C5D0E6;cursor:pointer;font-size:15px;line-height:1;display:grid;place-items:center", "\u00d7");
    close.addEventListener("click", function () {
      hide();
      try { window.parent.postMessage({ type: "__edit_mode_dismissed" }, "*"); } catch (e) {}
    });
    head.appendChild(close);
    panel.appendChild(head);

    panel.appendChild(el("div", "font:500 11px/1.5 var(--font-head,sans-serif);color:rgba(148,161,184,.9);margin:-8px 0 18px", "The living ink runs behind every dark section. Move your cursor to paint it."));

    panel.appendChild(slider("Glass strength", "glass", 0.4, 1.5, 0.05, function (v) { return Math.round(v * 100) + "%"; }));
    panel.appendChild(slider("Ink strength", "inkIntensity", 0.4, 2.0, 0.05, function (v) { return v.toFixed(2) + "\u00d7"; }));
    panel.appendChild(slider("Ink flow", "inkTurbulence", 0.3, 2.6, 0.05, function (v) { return v.toFixed(2) + "\u00d7"; }));
    panel.appendChild(segmented("Background", "inkTint", TINTS, TINT_LABELS));

    document.body.appendChild(panel);
    return panel;
  }

  function show() { build().style.display = "block"; }
  function hide() { if (panel) panel.style.display = "none"; }

  /* ---- host protocol : listener BEFORE announcing availability ---- */
  window.addEventListener("message", function (e) {
    var t = e.data && e.data.type;
    if (t === "__activate_edit_mode") show();
    else if (t === "__deactivate_edit_mode") hide();
  });
  try { window.parent.postMessage({ type: "__edit_mode_available" }, "*"); } catch (e) {}
})();
