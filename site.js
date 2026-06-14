/* ============================================================
   MostAI — site behaviour  (v2: Lenis + GSAP + floating nav)
   ============================================================ */
(function () {
  "use strict";

  /* ---- 1. Accent / background ---- */
  var ACCENT_CSS = {
    azure:  { light: "#5FB0FF", deep: "#0A84FF" },
    indigo: { light: "#8FA2FF", deep: "#5B7BFF" },
    cyan:   { light: "#5FD8EE", deep: "#0EA5C4" },
    violet: { light: "#A9B6FF", deep: "#7C9BFF" },
  };
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem("mostai.site") || "{}"); } catch (e) {}
  var defaults = { look: "mesh", accent: "azure", intensity: 1, motion: 1 };
  var conf = Object.assign({}, defaults, saved);

  function applyAccent(accent) {
    var c = ACCENT_CSS[accent] || ACCENT_CSS.azure;
    document.documentElement.style.setProperty("--site-accent", c.light);
    document.documentElement.style.setProperty("--site-accent-d", c.deep);
  }
  applyAccent(conf.accent);

  var bg = null;
  if (window.MostaiBG) {
    bg = window.MostaiBG.mount(conf);
    window.__siteBg = bg;
  }

  window.__siteApply = function (next) {
    if (next.accent) applyAccent(next.accent);
    if (bg) bg.set(next);

  };

  /* ---- 2. Lenis smooth scroll ---- */
  var lenis = null;
  if (typeof Lenis !== "undefined") {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      (function rafLoop() { requestAnimationFrame(rafLoop); lenis.raf(performance.now()); })();
    }
  }

  /* ---- 3. GSAP ScrollTrigger animations ---- */
  if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);

    /* Hero entrance */
    gsap.from(".hero__mark", { y: 30, opacity: 0, duration: 1, ease: "power3.out", delay: 0.2 });
    gsap.from(".hero .eyebrow", { y: 20, opacity: 0, duration: 0.9, ease: "power3.out", delay: 0.35 });
    gsap.from(".hero h1", { y: 30, opacity: 0, duration: 1, ease: "power3.out", delay: 0.5 });
    gsap.from(".hero__sub", { y: 20, opacity: 0, duration: 0.9, ease: "power3.out", delay: 0.65 });
    gsap.from(".hero__cta", { y: 20, opacity: 0, duration: 0.9, ease: "power3.out", delay: 0.8 });
    gsap.from(".hero__meta", { y: 15, opacity: 0, duration: 0.8, ease: "power3.out", delay: 0.95 });

    /* Tools section */
    gsap.from(".tools__label", {
      scrollTrigger: { trigger: ".tools", start: "top 85%" },
      y: 20, opacity: 0, duration: 0.8, ease: "power2.out"
    });

    /* White sheet rises up dramatically */
    gsap.from(".sheet", {
      scrollTrigger: { trigger: ".sheet", start: "top 98%", end: "top 30%", scrub: 1 },
      y: 160, scale: 0.96, opacity: 0.5
    });

    /* Section heads */
    document.querySelectorAll(".shead").forEach(function (el) {
      gsap.from(el.children, {
        scrollTrigger: { trigger: el, start: "top 82%" },
        y: 30, opacity: 0, duration: 0.8, stagger: 0.1, ease: "power2.out"
      });
    });

    /* Service cards — clean staggered rise (selectors match the real markup: .svc-grid / .svc-card) */
    gsap.from(".svc-card", {
      scrollTrigger: { trigger: ".svc-grid", start: "top 82%" },
      y: 40, opacity: 0, duration: 0.8, stagger: 0.1, ease: "power3.out"
    });

    /* Process steps — staggered entrance */
    gsap.from(".pstep", {
      scrollTrigger: { trigger: ".process-steps", start: "top 80%" },
      y: 40, opacity: 0, duration: 0.7, stagger: 0.15, ease: "power3.out"
    });

    /* Mission — dramatic entrance */
    gsap.from(".mission__head", {
      scrollTrigger: { trigger: ".mission", start: "top 78%" },
      y: 30, opacity: 0, duration: 0.9, ease: "power3.out"
    });
    gsap.from(".mission__quote", {
      scrollTrigger: { trigger: ".mission__quote", start: "top 82%" },
      y: 50, opacity: 0, duration: 1.1, ease: "power3.out"
    });
    gsap.from(".pillar", {
      scrollTrigger: { trigger: ".pillars", start: "top 85%" },
      y: 50, opacity: 0, scale: 0.9, duration: 0.8, stagger: 0.15, ease: "power3.out"
    });

    /* CTA (ink glass card) */
    gsap.from(".ink__card", {
      scrollTrigger: { trigger: ".ink", start: "top 80%" },
      y: 40, scale: 0.97, opacity: 0, duration: 1, ease: "power3.out"
    });

    /* Footer */
    gsap.from(".footer__top", {
      scrollTrigger: { trigger: ".footer", start: "top 92%" },
      y: 20, opacity: 0, duration: 0.7, ease: "power2.out"
    });
  }



  /* ---- 5. Floating nav ---- */
  var navWrap = document.getElementById("floatingNav");
  var navExpanded = document.querySelector(".nav__expanded");
  var navOrb = document.getElementById("navOrb");
  var isCollapsed = false;
  var isNavOpen = false; // expanded from collapsed state
  var collapseTimer = null;

  function collapseNav() {
    if (isCollapsed) return;
    isCollapsed = true;
    isNavOpen = false;
    if (navWrap) navWrap.classList.add("nav--collapsed");
  }
  function expandNav() {
    isCollapsed = false;
    isNavOpen = true;
    if (navWrap) navWrap.classList.remove("nav--collapsed");
    clearTimeout(collapseTimer);
    collapseTimer = setTimeout(function () {
      if (scrollY > 200) collapseNav();
    }, 4000);
  }

  var scrollThreshold = 200;
  addEventListener("scroll", function () {
    if (!isNavOpen && scrollY > scrollThreshold) collapseNav();
    else if (scrollY <= 60) {
      isCollapsed = false;
      isNavOpen = false;
      if (navWrap) navWrap.classList.remove("nav--collapsed");
    }
  }, { passive: true });

  if (navOrb) {
    navOrb.addEventListener("click", function (e) {
      if (navOrb._didDrag) { navOrb._didDrag = false; return; }
      e.preventDefault();
      if (isCollapsed) expandNav();
      else collapseNav();
    });
  }

  /* Click outside or click brand logo to collapse when re-expanded */
  var navBrand = document.querySelector(".nav__pill .brand");
  if (navBrand) {
    navBrand.addEventListener("click", function (e) {
      if (isNavOpen) { e.preventDefault(); collapseNav(); }
    });
  }
  document.addEventListener("click", function (e) {
    if (isNavOpen && !e.target.closest(".nav__pill") && !e.target.closest(".nav__orb")) {
      collapseNav();
    }
  });

  /* Orb drag to corner */
  if (navOrb) {
    var orbSize = 48;
    var snapMargin = 20;
    var dragging = false, dragStartX, dragStartY, orbStartL, orbStartT, dragMoved;

    function getOrbRect() { return navOrb.getBoundingClientRect(); }

    function getSnapTargets() {
      return [
        { id: "tc", x: (innerWidth - orbSize) / 2, y: snapMargin },
        { id: "tl", x: snapMargin, y: snapMargin },
        { id: "tr", x: innerWidth - orbSize - snapMargin, y: snapMargin },
        { id: "bl", x: snapMargin, y: innerHeight - orbSize - snapMargin },
        { id: "br", x: innerWidth - orbSize - snapMargin, y: innerHeight - orbSize - snapMargin },
      ];
    }

    function snapOrbTo(target, animate) {
      navOrb.style.transition = animate ? "left .4s cubic-bezier(.4,0,.2,1), top .4s cubic-bezier(.4,0,.2,1)" : "none";
      navOrb.style.left = target.x + "px";
      navOrb.style.top = target.y + "px";
      navOrb.style.transform = "none";
      try { localStorage.setItem("mostai.navPos2", target.id); } catch (e) {}
    }

    /* Restore saved position (default top-right so the collapsed orb never sits on centered headings) */
    var savedPos = "tr";
    try { savedPos = localStorage.getItem("mostai.navPos2") || "tr"; } catch (e) {}
    var targets = getSnapTargets();
    var restoreTarget = targets.find(function (t) { return t.id === savedPos; }) || targets[0];
    snapOrbTo(restoreTarget, false);

    navOrb.addEventListener("pointerdown", function (e) {
      if (!isCollapsed) return;
      dragging = true;
      dragMoved = false;
      var r = getOrbRect();
      orbStartL = r.left;
      orbStartT = r.top;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      navOrb.setPointerCapture(e.pointerId);
      navOrb.style.transition = "none";
      navOrb.style.cursor = "grabbing";
      e.preventDefault();
    });

    addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var dx = e.clientX - dragStartX, dy = e.clientY - dragStartY;
      if (Math.abs(dx) + Math.abs(dy) > 5) dragMoved = true;
      navOrb.style.left = (orbStartL + dx) + "px";
      navOrb.style.top = (orbStartT + dy) + "px";
      navOrb.style.transform = "none";
    }, { passive: true });

    addEventListener("pointerup", function () {
      if (!dragging) return;
      dragging = false;
      navOrb.style.cursor = "";
      if (dragMoved) {
        navOrb._didDrag = true;
        setTimeout(function () { navOrb._didDrag = false; }, 100);
        var r = getOrbRect();
        var cx = r.left + orbSize / 2, cy = r.top + orbSize / 2;
        var snaps = getSnapTargets();
        var best = snaps[0], bestD = Infinity;
        snaps.forEach(function (s) {
          var d = Math.hypot(cx - (s.x + orbSize / 2), cy - (s.y + orbSize / 2));
          if (d < bestD) { bestD = d; best = s; }
        });
        snapOrbTo(best, true);
      }
    });

    addEventListener("resize", function () {
      if (!isCollapsed) return;
      var sp = "tr";
      try { sp = localStorage.getItem("mostai.navPos2") || "tr"; } catch (e) {}
      var t = getSnapTargets().find(function (s) { return s.id === sp; }) || getSnapTargets()[0];
      snapOrbTo(t, false);
    });
  }

  /* ---- 5b. Mobile menu — a compact glass dropdown built from the nav links ----
     Injected in JS so every page gets it without editing each HTML file.
     Pill keeps its look; a hamburger opens a small panel (not full-screen). */
  (function buildMobileMenu() {
    var pill = document.querySelector(".nav__pill");
    if (!pill || !navWrap) return;
    var linksSrc = pill.querySelector(".nav__links");

    var toggle = document.createElement("button");
    toggle.className = "nav__toggle";
    toggle.type = "button";
    toggle.setAttribute("aria-label", "Open menu");
    toggle.setAttribute("aria-expanded", "false");
    toggle.innerHTML = "<span></span><span></span><span></span>";
    pill.appendChild(toggle);

    var menu = document.createElement("div");
    menu.className = "nav__menu";
    var mlinks = document.createElement("nav");
    mlinks.className = "nav__menu-links";
    if (linksSrc) {
      linksSrc.querySelectorAll("a").forEach(function (a) {
        var na = document.createElement("a");
        na.href = a.getAttribute("href");
        na.textContent = a.textContent;
        if (a.classList.contains("is-active")) na.className = "is-active";
        mlinks.appendChild(na);
      });
    }
    menu.appendChild(mlinks);
    var cta = document.createElement("a");
    cta.className = "btn btn--primary nav__menu-cta";
    cta.href = "contact.html";
    cta.textContent = "Book a call";
    menu.appendChild(cta);
    navWrap.appendChild(menu);

    function closeMenu() { navWrap.classList.remove("nav--menu-open"); toggle.setAttribute("aria-expanded", "false"); }
    function openMenu() { navWrap.classList.add("nav--menu-open"); toggle.setAttribute("aria-expanded", "true"); }
    toggle.addEventListener("click", function (e) {
      e.preventDefault(); e.stopPropagation();
      if (navWrap.classList.contains("nav--menu-open")) closeMenu(); else openMenu();
    });
    mlinks.addEventListener("click", function (e) { if (e.target.closest("a")) closeMenu(); });
    cta.addEventListener("click", closeMenu);
    document.addEventListener("click", function (e) {
      if (navWrap.classList.contains("nav--menu-open") &&
          !e.target.closest(".nav__menu") && !e.target.closest(".nav__toggle")) closeMenu();
    });
    addEventListener("resize", function () {
      if (!matchMedia("(max-width: 920px)").matches) closeMenu();
    });
  })();

  /* ---- 6. Tools marquee ---- */
  var TOOLS = [
    { name: "Claude", color: "#D97757", slug: "anthropic", icon: '<path d="M12 2l2 8 8 2-8 2-2 8-2-8-8-2 8-2z" fill="currentColor" stroke="none"/>' },
    { name: "ChatGPT", color: "#10A37F", slug: "openai", icon: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/>' },
    { name: "Gemini", color: "#8E75B2", slug: "googlegemini", icon: '<path d="M12 3c5 4 5 14 0 18"/><path d="M12 3c-5 4-5 14 0 18"/>' },
    { name: "Perplexity", color: "#20B8CD", slug: "perplexity", icon: '<circle cx="11" cy="11" r="6"/><path d="M21 21l-4-4"/>' },
    { name: "Grok", color: "#FF6B35", slug: null, icon: '<path d="M18 6L6 18M6 6l12 12"/>' },
    { name: "Cursor", color: "#7B61FF", slug: "cursor", icon: '<path d="M5 3l14 9-6 1-3 6z" fill="currentColor" stroke="none"/>' },
    { name: "GitHub", color: "#E6EDF3", slug: "github", icon: '<circle cx="12" cy="12" r="9"/>' },
    { name: "Copilot", color: "#79C7FF", slug: "githubcopilot", icon: '<circle cx="9" cy="12" r="5"/><circle cx="15" cy="12" r="5"/>' },
    { name: "Midjourney", color: "#CBD5E1", slug: null, icon: '<path d="M4 19l8-15 8 15"/><path d="M8 13h8"/>' },
    { name: "DALL\u00b7E", color: "#10A37F", slug: null, icon: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/>' },
    { name: "Figma", color: "#A259FF", slug: "figma", icon: '<circle cx="12" cy="6" r="3"/><circle cx="9" cy="12" r="3"/>' },
    { name: "Notion", color: "#E3E2E0", slug: "notion", icon: '<rect x="5" y="3" width="14" height="18" rx="2"/>' },
    { name: "Vercel", color: "#EDEDED", slug: "vercel", icon: '<path d="M12 4l9 16H3z" fill="currentColor" stroke="none"/>' },
    { name: "Supabase", color: "#3ECF8E", slug: "supabase", icon: '<path d="M13 2l-1 10h7L11 22l1-10H5z" fill="currentColor" stroke="none"/>' },
    { name: "Stripe", color: "#635BFF", slug: "stripe", icon: '<path d="M12 4c-4 0-6 2-6 4 0 5 12 3 12 8 0 2-2 4-6 4"/>' },
    { name: "Slack", color: "#E01E5A", slug: null, icon: '<rect x="7" y="3" width="4" height="8" rx="2"/><rect x="13" y="13" width="4" height="8" rx="2"/><rect x="3" y="13" width="8" height="4" rx="2"/><rect x="13" y="3" width="8" height="4" rx="2"/>' },
    { name: "Linear", color: "#5E6AD2", slug: "linear", icon: '<circle cx="12" cy="12" r="9"/>' },
    { name: "Framer", color: "#0055FF", slug: "framer", icon: '<path d="M5 3h14v6H5z"/>' },
    { name: "Webflow", color: "#4353FF", slug: "webflow", icon: '<path d="M4 14c2-7 5-4 7-8s5 8 9-2" stroke-width="2.5"/>' },
    { name: "Replit", color: "#F26207", slug: "replit", icon: '<rect x="4" y="3" width="7" height="8" rx="2"/>' },
    { name: "v0", color: "#EDEDED", slug: null, icon: '<path d="M6 5l6 14 6-14" stroke-width="2.5"/>' },
    { name: "Bolt", color: "#F59E0B", slug: null, icon: '<path d="M13 2L4 14h7l-1 8 9-12h-7z" fill="currentColor" stroke="none"/>' },
    { name: "Lovable", color: "#E11D48", slug: null, icon: '<path d="M12 21C7 17 3 13 3 9a4.5 4.5 0 0 1 9-1 4.5 4.5 0 0 1 9 1c0 4-4 8-9 12z" fill="currentColor" stroke="none"/>' },
    { name: "Windsurf", color: "#06B6D4", slug: null, icon: '<path d="M2 10c3-3 6 0 9-3s6 0 9-3"/><path d="M2 16c3-3 6 0 9-3s6 0 9-3"/>' },
    { name: "Devin", color: "#6366F1", slug: null, icon: '<path d="M8 4l-4 8 4 8"/><path d="M16 4l4 8-4 8"/><path d="M10 19l4-14"/>' },
    /* ---- Languages & dev tools (real logos) ---- */
    { name: "Python", color: "#3776AB", slug: "python", icon: '<path d="M12 2v20"/>' },
    { name: "TypeScript", color: "#3178C6", slug: "typescript", icon: '<rect x="3" y="3" width="18" height="18" rx="2"/>' },
    { name: "JavaScript", color: "#F7DF1E", slug: "javascript", icon: '<rect x="3" y="3" width="18" height="18" rx="2"/>' },
    { name: "React", color: "#61DAFB", slug: "react", icon: '<circle cx="12" cy="12" r="2"/>' },
    { name: "Node.js", color: "#5FA04E", slug: "nodedotjs", icon: '<path d="M12 2l9 5v10l-9 5-9-5V7z"/>' },
    { name: "Next.js", color: "#FFFFFF", slug: "nextdotjs", icon: '<circle cx="12" cy="12" r="9"/>' },
    { name: "Tailwind CSS", color: "#06B6D4", slug: "tailwindcss", icon: '<path d="M4 12c2-5 5-5 8 0"/>' },
    { name: "Docker", color: "#2496ED", slug: "docker", icon: '<rect x="3" y="9" width="18" height="7"/>' },
    { name: "PostgreSQL", color: "#4169E1", slug: "postgresql", icon: '<ellipse cx="12" cy="6" rx="7" ry="3"/>' },
    { name: "AWS", color: "#FF9900", slug: "amazonwebservices", icon: '<path d="M4 14h16"/>' },
    { name: "Cloudflare", color: "#F38020", slug: "cloudflare", icon: '<path d="M4 16h13a3 3 0 0 0 0-6"/>' },
    /* ---- AI & ML (real logos) ---- */
    { name: "Hugging Face", color: "#FFD21E", slug: "huggingface", icon: '<circle cx="12" cy="12" r="9"/>' },
    { name: "TensorFlow", color: "#FF6F00", slug: "tensorflow", icon: '<path d="M12 2v20"/>' },
    { name: "PyTorch", color: "#EE4C2C", slug: "pytorch", icon: '<path d="M12 2v20"/>' },
    { name: "LangChain", color: "#1C3C3C", slug: "langchain", icon: '<path d="M9 12h6"/>' },
    { name: "Ollama", color: "#FFFFFF", slug: "ollama", icon: '<circle cx="12" cy="12" r="8"/>' },
    { name: "n8n", color: "#EA4B71", slug: "n8n", icon: '<circle cx="6" cy="12" r="2"/>' },
    { name: "Zapier", color: "#FF4F00", slug: "zapier", icon: '<path d="M12 2v20"/>' },
  ];

  function makeChip(tool) {
    var chip = document.createElement("span");
    chip.className = "tool-chip";
    chip.style.setProperty("--tc", tool.color);
    var hex = tool.color.replace("#", "");
    var iconHTML;
    if (tool.slug) {
      iconHTML = '<img class="tool-chip__img" src="https://cdn.simpleicons.org/' + tool.slug + '/' + hex + '" width="20" height="20" alt="" onerror="this.style.display=\'none\';this.nextElementSibling&&(this.nextElementSibling.style.display=\'block\')">' +
        '<svg class="tool-chip__svg" style="display:none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + tool.icon + '</svg>';
    } else {
      iconHTML = '<svg class="tool-chip__svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + tool.icon + '</svg>';
    }
    chip.innerHTML =
      '<span class="tool-chip__icon">' + iconHTML + '</span>' +
      '<span class="tool-chip__name">' + tool.name + '</span>';
    return chip;
  }

  function populateTools() {
    var row1 = document.getElementById("toolsRow1");
    if (!row1) return;
    /* Only tools with real SimpleIcons logos */
    var realTools = TOOLS.filter(function (t) { return t.slug; });
    for (var r = 0; r < 4; r++) {
      realTools.forEach(function (t) { row1.appendChild(makeChip(t)); });
    }
  }
  populateTools();

  /* Timeout fallback: if CDN imgs haven't loaded after 4s, swap to SVG */
  setTimeout(function () {
    document.querySelectorAll(".tool-chip__img").forEach(function (img) {
      if (!img.complete || img.naturalHeight === 0) {
        img.style.display = "none";
        var svg = img.nextElementSibling;
        if (svg) svg.style.display = "block";
      }
    });
  }, 4000);

  /* Event delegation: removed active-on-click — chips stay clean */

  /* GSAP-driven marquee (so child styles aren't blocked by CSS animation) */
  function startMarquee() {
    if (typeof gsap === "undefined") return;
    document.querySelectorAll(".tools__row").forEach(function (row, i) {
      var w = row.scrollWidth / 2; /* half because we duplicated chips */
      var dir = i === 0 ? -1 : 1;
      var startX = dir === 1 ? -w : 0;
      gsap.set(row, { x: startX });
      var tl = gsap.to(row, {
        x: dir === 1 ? 0 : -w,
        duration: i === 0 ? 300 : 280,
        ease: "none",
        repeat: -1,
      });
      row.addEventListener("mouseenter", function () { tl.pause(); });
      row.addEventListener("mouseleave", function () { tl.resume(); });
      row._marquee = tl;
    });
  }
  startMarquee();

  /* ---- 7. Anchor scroll ---- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (ev) {
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var t = document.querySelector(id);
      if (t) {
        ev.preventDefault();
        if (lenis) lenis.scrollTo(t, { offset: -80 });
        else window.scrollTo({ top: t.getBoundingClientRect().top + scrollY - 80, behavior: "smooth" });
      }
    });
  });

  /* ---- 8. Logo-burst animation (form success) ---- */
  function playBracketAnimation() {
    if (typeof gsap === "undefined") return;
    var left = document.querySelector(".mai-left");
    var right = document.querySelector(".mai-right");
    var spark = document.querySelector(".mai-spark");
    var title = document.querySelector(".logo-burst__title");
    var sub = document.querySelector(".logo-burst__sub");
    if (!left || !right) return;

    gsap.set(left, { x: -300, opacity: 0 });
    gsap.set(right, { x: 300, opacity: 0 });
    gsap.set(spark, { scale: 0, opacity: 0, transformOrigin: "627px 622px" });
    if (title) gsap.set(title, { opacity: 0, y: 12 });
    if (sub) gsap.set(sub, { opacity: 0, y: 12 });

    var tl = gsap.timeline({ delay: 0.2 });
    tl.to(left, { x: 0, opacity: 1, duration: 0.95, ease: "power3.out" })
      .to(right, { x: 0, opacity: 1, duration: 0.95, ease: "power3.out" }, "<")
      .to(spark, { scale: 1, opacity: 1, duration: 0.55, ease: "back.out(2.6)" }, "-=0.35")
      .to(title, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, "-=0.2")
      .to(sub, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, "-=0.3")
      .to(spark, { scale: 1.12, duration: 1.7, ease: "sine.inOut", repeat: -1, yoyo: true });
  }

  var form = document.querySelector(".form");
  if (form) {
    function showFormSuccess() {
      form.classList.add("is-sent");
      var y = form.getBoundingClientRect().top + scrollY - 120;
      if (lenis) lenis.scrollTo(y);
      else window.scrollTo({ top: y, behavior: "smooth" });
      if (document.querySelector(".logo-burst")) playBracketAnimation();
    }
    function showFormError(msg) {
      var note = form.querySelector(".form__note");
      if (note) { note.textContent = msg; note.style.color = "#E5484D"; }
    }
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var btn = form.querySelector(".form__submit");
      if (btn) btn.disabled = true;
      fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Accept": "application/json" },
        body: new FormData(form),
      })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (res && res.success) { showFormSuccess(); }
          else { showFormError("Couldn't send — please email elimelechmoster@gmail.com directly."); if (btn) btn.disabled = false; }
        })
        .catch(function () {
          showFormError("Network error — please email elimelechmoster@gmail.com directly."); if (btn) btn.disabled = false;
        });
    });
  }

  /* ---- 9. Service tabs scrollspy ---- */
  var serviceTabs = document.querySelectorAll(".service-tab");
  var serviceSections = document.querySelectorAll(".service-full");
  if (serviceTabs.length && serviceSections.length) {
    function setActiveTab(idx) {
      serviceTabs.forEach(function (t, i) {
        t.classList.toggle("is-active", i === idx);
      });
    }
    if (typeof ScrollTrigger !== "undefined") {
      serviceSections.forEach(function (sec, i) {
        ScrollTrigger.create({
          trigger: sec,
          start: "top center",
          end: "bottom center",
          onEnter: function () { setActiveTab(i); },
          onEnterBack: function () { setActiveTab(i); },
        });
      });
    }
    serviceTabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var target = document.getElementById(tab.dataset.target);
        if (target) {
          var top = target.getBoundingClientRect().top + scrollY - 70;
          if (lenis) lenis.scrollTo(top);
          else window.scrollTo({ top: top, behavior: "smooth" });
        }
      });
    });
  }

  /* ---- 10. Service section GSAP animations ---- */
  if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
    document.querySelectorAll(".service-full").forEach(function (sec) {
      var wm = sec.querySelector(".service-full__wm");
      if (wm) {
        gsap.from(wm, {
          scrollTrigger: { trigger: sec, start: "top 90%", end: "bottom 10%", scrub: 1.2 },
          y: 80, opacity: 0, scale: 0.95
        });
      }
      var srow = sec.querySelector(".srow");
      if (srow) {
        gsap.from(srow.children, {
          scrollTrigger: { trigger: sec, start: "top 72%" },
          y: 50, opacity: 0, duration: 0.9, stagger: 0.2, ease: "power3.out"
        });
      }
    });
  }

  /* ---- 11. Magnetic buttons: disabled — buttons stay in one place ----
     Was a cursor-follow translate; removed per feedback so buttons no
     longer drift toward the pointer. The gentle CSS hover-lift remains
     (and now snaps straight back on mouse-out). */

  /* ---- 12. Number counter animation ---- */
  if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
    document.querySelectorAll(".metric__v").forEach(function (el) {
      var text = el.textContent.trim();
      var match = text.match(/^([+\-]?)(\d+)(.*)/);
      if (!match) return;
      var prefix = match[1], end = parseInt(match[2], 10), suffix = match[3];
      el.textContent = prefix + "0" + suffix;
      ScrollTrigger.create({
        trigger: el,
        start: "top 88%",
        once: true,
        onEnter: function () {
          gsap.to({ val: 0 }, {
            val: end,
            duration: 1.8,
            ease: "power2.out",
            onUpdate: function () {
              el.textContent = prefix + Math.round(this.targets()[0].val) + suffix;
            }
          });
        }
      });
    });
  }

})();
