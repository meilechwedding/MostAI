/* ============================================================
   MostAI — live service previews engine
   Authored at 960x600; scaled to each [data-preview] container.
   ============================================================ */
(function () {
  "use strict";
  var DW = 960, DH = 600;

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  /* ---------- icons ---------- */
  var I = {
    bot: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="12" rx="3"/><path d="M12 8V4M8 14h.01M16 14h.01"/><path d="M2 13v3M22 13v3"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>',
    db: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>',
    url: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M21 20c0-2.6-1.6-4.8-4-5.6"/></svg>',
    cog: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.6-2-3.4-2.3 1a7 7 0 0 0-1.7-1l-.3-2.4h-4l-.3 2.4a7 7 0 0 0-1.7 1l-2.3-1-2 3.4 2 1.6a7 7 0 0 0 0 2l-2 1.6 2 3.4 2.3-1a7 7 0 0 0 1.7 1l.3 2.4h4l.3-2.4a7 7 0 0 0 1.7-1l2.3 1 2-3.4-2-1.6a7 7 0 0 0 .1-1z"/></svg>',
    flow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="6" height="6" rx="1.5"/><rect x="15" y="14" width="6" height="6" rx="1.5"/><path d="M9 7h4a3 3 0 0 1 3 3v4"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l2.2 6.3L20.5 10l-6.3 2.2L12 18l-2.2-5.8L3.5 10l6.3-1.7z"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg>'
  };

  /* ============================================================
     1. WEBSITES
     ============================================================ */
  function buildWebsites(stage, st) {
    var mb = el("div", "mb");
    mb.innerHTML =
      '<div class="mb__bar"><div class="mb__dots"><i></i><i></i><i></i></div>' +
      '<div class="mb__url">' + I.url + 'northwind-studio.com</div></div>' +
      '<div class="mb__viewport"><div class="mb__scroll"></div></div>';
    stage.appendChild(mb);
    var scroll = mb.querySelector(".mb__scroll");
    var fk = el("div", "fk");
    fk.innerHTML =
      '<div class="fk__nav"><div class="fk__logo"></div><div class="fk__brand">Northwind</div>' +
      '<div class="fk__navlinks"><span>Studio</span><span>Work</span><span>About</span></div>' +
      '<div class="fk__navbtn">Start a project</div></div>' +
      '<div class="fk__hero"><div class="fk__eyebrow">Design &amp; build studio</div>' +
      '<div class="fk__h1">We make brands <em>impossible to ignore</em>.</div>' +
      '<div class="fk__sub">Strategy, identity and websites for companies that refuse to blend in.</div>' +
      '<div class="fk__cta"><div class="fk__btn fk__btn--p">Book a call</div><div class="fk__btn fk__btn--g">See our work</div></div></div>' +
      '<div class="fk__shot"><div class="fk__shotbar"><i></i><i></i><i></i></div>' +
      '<div class="fk__shotgrid"><div class="fk__shotcard"></div><div class="fk__shotcard"></div><div class="fk__shotcard"></div></div></div>' +
      '<div class="fk__logos"><span>ACME</span><span>Lumen</span><span>Vertex</span><span>Orbit</span><span>Faro</span></div>' +
      '<div class="fk__feat">' +
      '<div class="fk__fcard"><div class="fk__fic"></div><h4>Brand identity</h4><p>A look and voice that fits exactly who you are.</p></div>' +
      '<div class="fk__fcard"><div class="fk__fic"></div><h4>Fast websites</h4><p>Built to load instantly and convert visitors.</p></div>' +
      '<div class="fk__fcard"><div class="fk__fic"></div><h4>Ongoing care</h4><p>We stay on after launch to keep it sharp.</p></div></div>' +
      '<div class="fk__foot"><span>© Northwind Studio</span><span>hello@northwind.com</span></div>';
    scroll.appendChild(fk);

    var vp = mb.querySelector(".mb__viewport");
    var dir = 1, pos = 0, paused = 0;
    function frame() {
      if (!st.alive) return;
      requestAnimationFrame(frame);
      if (!st.visible) return;
      var max = scroll.offsetHeight - vp.offsetHeight;
      if (max <= 0) return;
      if (paused > 0) { paused--; return; }
      pos += dir * 0.55;
      if (pos >= max) { pos = max; dir = -1; paused = 130; }
      else if (pos <= 0) { pos = 0; dir = 1; paused = 130; }
      scroll.style.transform = "translateY(" + (-pos) + "px)";
    }
    requestAnimationFrame(frame);
  }

  /* ============================================================
     2. AI AGENTS — looping business chat
     ============================================================ */
  var CHAT = [
    { r: "user", t: "Hi — do you handle commercial roof inspections? Need a quote for a 12,000 sqft warehouse." },
    { r: "bot",  t: "We do. For 12,000 sqft commercial roofing, inspections start at $450 and include a full drone survey and report." },
    { r: "user", t: "Great. How soon could someone come out?" },
    { r: "bot",  t: "Our next openings are Thursday AM or Friday PM this week. Which works better for you?" },
    { r: "user", t: "Thursday morning is perfect." },
    { r: "bot",  t: "Booked you for Thursday 9:00 AM. Can I grab the site address and a contact name?" },
    { r: "user", t: "Riverside Logistics, 480 Dock St. Ask for Dana." },
    { r: "bot",  t: "Got it — Dana at 480 Dock St. I've sent a confirmation and calendar invite to your email." },
    { r: "user", t: "Do you also do repairs if you find issues?" },
    { r: "bot",  t: "Yes. If the inspection flags anything, we'll send a fixed-price repair quote within 24 hours — no surprises." },
    { r: "user", t: "Perfect. That's everything, thanks!" },
    { r: "bot",  t: "Anytime, Dana. You're all set for Thursday — we'll text a reminder the morning of. 👋" }
  ];

  function buildChat(stage, st) {
    var ch = el("div", "ch");
    ch.innerHTML =
      '<div class="ch__top"><div class="ch__av">' + I.bot + '</div>' +
      '<div class="ch__id"><div class="ch__name">MostAI Assistant</div><div class="ch__status">Online · replies instantly</div></div>' +
      '<div class="ch__lock">' + I.lock + ' Secure</div></div>' +
      '<div class="ch__body"><div class="ch__fade"></div><div class="ch__scroll"></div></div>' +
      '<div class="ch__bar"><div class="ch__input">Type a message…</div><div class="ch__send">' + I.send + '</div></div>';
    stage.appendChild(ch);
    var body = ch.querySelector(".ch__body");
    var scroll = ch.querySelector(".ch__scroll");

    function scrollDown() {
      var over = scroll.offsetHeight - (body.clientHeight - 44);
      scroll.style.transition = "transform .5s cubic-bezier(.2,.8,.3,1)";
      scroll.style.transform = "translateY(" + (over > 0 ? -over : 0) + "px)";
    }
    function addTyping() {
      var t = el("div", "ch__typing", "<i></i><i></i><i></i>");
      scroll.appendChild(t);
      scrollDown();
      return t;
    }
    function addMsg(m) {
      var wrap = el("div", "ch__msg ch__msg--" + (m.r === "bot" ? "bot" : "user"));
      wrap.innerHTML = '<span class="ch__role">' + (m.r === "bot" ? "Assistant" : "Customer") + '</span>' +
        '<div class="ch__bubble">' + m.t + '</div>';
      scroll.appendChild(wrap);
      requestAnimationFrame(function () { wrap.classList.add("in"); });
      scrollDown();
    }

    var i = 0;
    function step() {
      if (!st.alive) return;
      if (i >= CHAT.length) {
        st.timer = setTimeout(function () {
          body.style.opacity = "0";
          st.timer = setTimeout(function () {
            scroll.innerHTML = "";
            scroll.style.transition = "none";
            scroll.style.transform = "translateY(0)";
            body.style.opacity = "1";
            i = 0; step();
          }, 700);
        }, 2600);
        return;
      }
      var m = CHAT[i];
      var thinking = m.r === "bot" ? 950 : 420;
      var typ = m.r === "bot" ? addTyping() : null;
      st.timer = setTimeout(function () {
        if (typ) typ.remove();
        addMsg(m);
        i++;
        var pause = Math.min(2400, 900 + m.t.length * 26);
        st.timer = setTimeout(step, pause);
      }, thinking);
    }
    st.start = step;
    step();
  }

  /* ============================================================
     3. AUTOMATION — pipeline flow
     ============================================================ */
  function buildAutomation(stage, st) {
    var au = el("div", "au");
    au.innerHTML =
      '<div class="au__head"><span class="au__chip">Lead intake automation</span>' +
      '<span class="au__live">Running</span></div>' +
      '<div class="au__canvas"><svg class="au__svg"></svg></div>' +
      '<div class="au__log"></div>';
    stage.appendChild(au);
    var canvas = au.querySelector(".au__canvas");
    var svg = au.querySelector(".au__svg");
    var log = au.querySelector(".au__log");

    var nodes = [
      { id: "trigger", fx: .10, fy: .5, t: "New enquiry", s: "Form / email / call", tag: "TRIGGER", ic: I.bolt, cls: "trigger" },
      { id: "enrich",  fx: .42, fy: .24, t: "Enrich + log", s: "Add to CRM, fetch details", tag: "STEP", ic: I.db },
      { id: "qualify", fx: .42, fy: .76, t: "Qualify lead", s: "Score & tag by intent", tag: "STEP", ic: I.check },
      { id: "notify",  fx: .82, fy: .5, t: "Route + notify", s: "Assign owner, ping Slack", tag: "ACTION", ic: I.bell }
    ];
    var links = [["trigger", "enrich"], ["trigger", "qualify"], ["enrich", "notify"], ["qualify", "notify"]];
    var pos = {};
    var nodeEls = {};

    function layout() {
      var W = canvas.offsetWidth, H = canvas.offsetHeight;
      svg.setAttribute("viewBox", "0 0 " + W + " " + H);
      nodes.forEach(function (n) {
        pos[n.id] = { x: n.fx * W, y: n.fy * H };
      });
      svg.innerHTML = "";
      links.forEach(function (lk) {
        var a = pos[lk[0]], b = pos[lk[1]];
        var mx = (a.x + b.x) / 2;
        var d = "M" + a.x + " " + a.y + " C " + mx + " " + a.y + " " + mx + " " + b.y + " " + b.x + " " + b.y;
        var base = document.createElementNS("http://www.w3.org/2000/svg", "path");
        base.setAttribute("class", "au__link"); base.setAttribute("d", d);
        svg.appendChild(base);
        var flow = document.createElementNS("http://www.w3.org/2000/svg", "path");
        flow.setAttribute("class", "au__flow"); flow.setAttribute("d", d);
        flow.style.opacity = "0";
        flow.dataset.from = lk[0]; flow.dataset.to = lk[1];
        svg.appendChild(flow);
        lk.flow = flow;
      });
      nodes.forEach(function (n) {
        if (!nodeEls[n.id]) {
          var nd = el("div", "au__node " + (n.cls || ""));
          nd.innerHTML = '<div class="au__node-top"><div class="au__node-ic">' + n.ic + '</div>' +
            '<div class="au__node-t">' + n.t + '</div></div>' +
            '<div class="au__node-s">' + n.s + '</div><span class="au__node-tag">' + n.tag + '</span>';
          canvas.appendChild(nd);
          nodeEls[n.id] = nd;
        }
        nodeEls[n.id].style.left = pos[n.id].x + "px";
        nodeEls[n.id].style.top = pos[n.id].y + "px";
      });
    }
    layout();
    var ro = new ResizeObserver(layout); ro.observe(canvas);

    function hot(id, on) { if (nodeEls[id]) nodeEls[id].classList.toggle("hot", on); }
    function travel(lk, cb) {
      var fl = lk.flow; if (!fl) { cb && cb(); return; }
      var len = fl.getTotalLength();
      fl.style.opacity = "1";
      fl.animate([{ strokeDashoffset: len + 60 }, { strokeDashoffset: -60 }],
        { duration: 700, easing: "cubic-bezier(.4,0,.2,1)" }).onfinish = function () {
        fl.style.opacity = "0"; cb && cb();
      };
    }
    function addLog(time, txt) {
      var line = el("div", "au__logline", '<span class="t">' + time + '</span>  ' + txt);
      log.appendChild(line);
      requestAnimationFrame(function () { line.classList.add("in"); });
      while (log.children.length > 3) log.removeChild(log.firstChild);
      log.scrollTop = log.scrollHeight;
    }

    var T = 0;
    function clock() { T += 1; var s = (T * 7) % 60; return "09:" + (10 + Math.floor(T / 9)) + ":" + (s < 10 ? "0" + s : s); }

    function run() {
      if (!st.alive) return;
      Object.keys(nodeEls).forEach(function (k) { hot(k, false); });
      hot("trigger", true);
      addLog(clock(), '<b>trigger</b> new enquiry received');
      st.timer = setTimeout(function () {
        travel(links[0]); travel(links[1], function () {});
        st.timer = setTimeout(function () {
          hot("enrich", true); hot("qualify", true);
          addLog(clock(), 'enrich → CRM updated, lead scored <b>87</b>');
          st.timer = setTimeout(function () {
            travel(links[2]); travel(links[3], function () {
              hot("notify", true);
              addLog(clock(), 'route → owner assigned · <b>Slack notified</b>');
              st.timer = setTimeout(run, 2200);
            });
          }, 950);
        }, 800);
      }, 700);
    }
    st.start = run;
    run();
  }

  /* ============================================================
     4. CUSTOM SOFTWARE — analytics dashboard
     ============================================================ */
  function buildDashboard(stage, st) {
    var db = el("div", "db");
    db.innerHTML =
      '<div class="db__side"><div class="db__logo"></div>' +
      '<div class="db__nav on">' + I.grid + '</div><div class="db__nav">' + I.chart + '</div>' +
      '<div class="db__nav">' + I.users + '</div><div class="db__nav">' + I.cog + '</div></div>' +
      '<div class="db__main">' +
      '<div class="db__top"><div><div class="db__title">Operations overview</div><div class="db__sub">Live · updated just now</div></div>' +
      '<div class="db__range"><span class="db__pill">7d</span><span class="db__pill on">30d</span><span class="db__pill">QTD</span></div></div>' +
      '<div class="db__kpis">' +
      kpi("Revenue", "$", 248500, "", "up", "+12.4%") +
      kpi("Active jobs", "", 1284, "", "up", "+8.1%") +
      kpi("Avg. cycle", "", 3.2, "d", "down", "-0.6d") +
      kpi("On-time rate", "", 96, "%", "up", "+2.3%") +
      '</div>' +
      '<div class="db__grid">' +
      '<div class="db__panel"><div class="db__panel-h"><div class="db__panel-t">Throughput</div>' +
      '<div class="db__legend"><span><i style="background:var(--site-accent-d)"></i>Completed</span></div></div>' +
      '<div class="db__chart"><svg viewBox="0 0 600 150" preserveAspectRatio="none">' +
      '<defs><linearGradient id="dbGrad" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="var(--site-accent-d)" stop-opacity=".26"/>' +
      '<stop offset="1" stop-color="var(--site-accent-d)" stop-opacity="0"/></linearGradient></defs>' +
      '<line class="db__gl" x1="0" y1="38" x2="600" y2="38"/><line class="db__gl" x1="0" y1="75" x2="600" y2="75"/><line class="db__gl" x1="0" y1="112" x2="600" y2="112"/>' +
      '<path class="db__area"></path><path class="db__line"></path><circle class="db__dot" r="5"></circle>' +
      '</svg></div></div>' +
      '<div class="db__panel"><div class="db__panel-h"><div class="db__panel-t">By channel</div></div>' +
      '<div class="db__bars"></div></div>' +
      '</div></div>';
    stage.appendChild(db);

    function kpi(label, pre, val, suf, dir, delta) {
      return '<div class="db__kpi" data-v="' + val + '" data-pre="' + pre + '" data-suf="' + suf + '">' +
        '<div class="db__kpi-l">' + label + '</div>' +
        '<div class="db__kpi-v">' + pre + '0' + suf + '</div>' +
        '<div class="db__kpi-d ' + dir + '">' + (dir === "up" ? "▲" : "▼") + ' ' + delta + '</div></div>';
    }

    var line = db.querySelector(".db__line");
    var area = db.querySelector(".db__area");
    var dot = db.querySelector(".db__dot");
    var barsWrap = db.querySelector(".db__bars");
    var barLabels = ["Web", "Phone", "Email", "Referral", "Ads"];

    function genPath() {
      var n = 12, pts = [];
      for (var x = 0; x < n; x++) {
        var base = 95 - Math.sin(x / 1.6) * 28 - x * 1.6;
        pts.push([x * (600 / (n - 1)), Math.max(14, Math.min(135, base + (Math.random() * 26 - 13)))]);
      }
      var d = "M" + pts[0][0] + " " + pts[0][1];
      for (var i = 1; i < pts.length; i++) {
        var p0 = pts[i - 1], p1 = pts[i], mx = (p0[0] + p1[0]) / 2;
        d += " C " + mx + " " + p0[1] + " " + mx + " " + p1[1] + " " + p1[0] + " " + p1[1];
      }
      return { d: d, last: pts[pts.length - 1] };
    }

    function countUp(node) {
      var target = parseFloat(node.dataset.v), pre = node.dataset.pre, suf = node.dataset.suf;
      var vEl = node.querySelector(".db__kpi-v"), t0 = performance.now(), dur = 1500;
      var isFloat = target % 1 !== 0;
      function tick(now) {
        var p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3), v = target * e;
        var disp = isFloat ? v.toFixed(1) : Math.round(v).toLocaleString();
        vEl.textContent = pre + disp + suf;
        if (p < 1 && st.alive) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }

    function drawBars() {
      barsWrap.innerHTML = "";
      barLabels.forEach(function (lab, i) {
        var h = 35 + Math.random() * 60;
        var b = el("div", "db__bar", '<i class="' + (i % 2 ? "alt" : "") + '"></i><span>' + lab + '</span>');
        barsWrap.appendChild(b);
        var bar = b.querySelector("i");
        setTimeout(function () { bar.style.height = h + "%"; }, 60 + i * 90);
      });
    }

    function render() {
      var g = genPath();
      line.setAttribute("d", g.d);
      area.setAttribute("d", g.d + " L600 150 L0 150 Z");
      line.classList.remove("draw"); void line.offsetWidth; line.classList.add("draw");
      area.style.opacity = "0";
      setTimeout(function () { area.style.opacity = "1"; }, 700);
      dot.setAttribute("cx", g.last[0]); dot.setAttribute("cy", g.last[1]);
      dot.style.opacity = "0";
      st.timer2 = setTimeout(function () { dot.style.opacity = "1"; }, 1400);
      drawBars();
    }

    function run() {
      if (!st.alive) return;
      db.querySelectorAll(".db__kpi").forEach(countUp);
      render();
      st.timer = setTimeout(function () {
        if (!st.alive) return;
        render();
        st.timer = setTimeout(run, 5200);
      }, 5200);
    }
    st.start = run;
    run();
  }

  /* ---------- mount + scale ---------- */
  var BUILDERS = { websites: buildWebsites, ai: buildChat, automation: buildAutomation, software: buildDashboard };

  function mount(host) {
    var kind = host.dataset.preview;
    var build = BUILDERS[kind];
    if (!build) return;
    var stage = el("div", "pv-stage");
    host.appendChild(stage);
    var st = { alive: true, visible: true, timer: null, start: null };

    function scale() {
      var w = host.clientWidth || DW;
      stage.style.transform = "scale(" + (w / DW) + ")";
      host.style.height = (w / DW * DH) + "px";
    }
    scale();
    new ResizeObserver(scale).observe(host);

    build(stage, st);

    var io = new IntersectionObserver(function (ents) {
      st.visible = ents[0].isIntersecting;
    }, { threshold: 0 });
    io.observe(host);
  }

  function init() { document.querySelectorAll("[data-preview]").forEach(mount); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
