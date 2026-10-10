/* ==========================================================================
   Jayakumar Bearings – site behaviour (no dependencies)
   ========================================================================== */
(() => {
  "use strict";
  const d = document, root = d.documentElement;
  const $ = (s, c = d) => c.querySelector(s);
  const $$ = (s, c = d) => [...c.querySelectorAll(s)];
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const raf = (fn) => { let q = false; return (...a) => { if (q) return; q = true; requestAnimationFrame(() => { q = false; fn(...a); }); }; };

  root.classList.add("js");

  /* ---------- header, progress bar, back-to-top ---------- */
  const header = $(".site-header"), bar = $("#progress"), top = $("#toTop");
  const onScroll = raf(() => {
    const y = scrollY, max = root.scrollHeight - innerHeight;
    header && header.classList.toggle("scrolled", y > 12);
    bar && bar.style.setProperty("--p", max > 0 ? (y / max).toFixed(4) : 0);
    top && top.classList.toggle("show", y > 700);
  });
  addEventListener("scroll", onScroll, { passive: true }); onScroll();
  top && top.addEventListener("click", () => scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }));

  /* ---------- mobile drawer ---------- */
  const btn = $("#menuBtn"), drawer = $("#drawer"), scrim = $("#scrim");
  if (btn && drawer) {
    const set = (open) => {
      drawer.classList.toggle("open", open); scrim.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", open); drawer.toggleAttribute("inert", !open);
      d.body.style.overflow = open ? "hidden" : "";
      if (open) $("a, button", drawer).focus(); else btn.focus({ preventScroll: true });
    };
    drawer.setAttribute("inert", "");
    btn.addEventListener("click", () => set(!drawer.classList.contains("open")));
    scrim.addEventListener("click", () => set(false));
    $$("[data-close]", drawer).forEach((el) => el.addEventListener("click", () => set(false)));
    d.addEventListener("keydown", (e) => { if (e.key === "Escape" && drawer.classList.contains("open")) set(false); });
  }

  /* ---------- reveal on scroll ---------- */
  const rv = $$(".reveal");
  if (rv.length) {
    if (reduce || !("IntersectionObserver" in window)) rv.forEach((e) => e.classList.add("in"));
    else {
      const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px", threshold: .08 });
      rv.forEach((e) => io.observe(e));
    }
  }

  /* ---------- counters ---------- */
  const counters = $$("[data-count]");
  if (counters.length) {
    const run = (el) => {
      const end = +el.dataset.count, suf = el.dataset.suffix || "", dur = 1700, t0 = performance.now();
      if (reduce) { el.textContent = end + suf; return; }
      const step = (t) => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4); el.textContent = Math.round(end * e) + suf; if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    };
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } }), { threshold: .6 });
    counters.forEach((c) => io.observe(c));
  }

  /* ---------- gold ring glitter ---------- */
  $$(".gold").forEach((el) => {
    if (reduce) return;
    const n = el.dataset.stars ? +el.dataset.stars : 5;
    for (let i = 0; i < n; i++) {
      const s = d.createElement("i"); s.className = "gs"; s.setAttribute("aria-hidden", "true");
      const t = Math.random() * 4, p = Math.random() * 100;           // random spot on one of 4 edges
      const [l, tp] = t < 1 ? [p, 0] : t < 2 ? [100, p] : t < 3 ? [p, 100] : [0, p];
      s.style.left = l + "%"; s.style.top = tp + "%"; s.style.setProperty("--gd", (Math.random() * 3).toFixed(2) + "s");
      el.appendChild(s);
    }
  });

  /* ---------- 3D tilt (mouse + touch) ---------- */
  if (!reduce) {
    $$("[data-tilt]").forEach((el) => {
      const max = +el.dataset.tilt || 8, sc = el.dataset.scale || 1.02;
      if (!$(".glare", el)) { const g = d.createElement("span"); g.className = "glare"; g.setAttribute("aria-hidden", "true"); el.appendChild(g); }
      const aim = raf((e) => {
        const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        el.style.setProperty("--ry", ((px - .5) * 2 * max).toFixed(2) + "deg");
        el.style.setProperty("--rx", ((.5 - py) * 2 * max).toFixed(2) + "deg");
        el.style.setProperty("--mx", (px * 100).toFixed(1) + "%"); el.style.setProperty("--my", (py * 100).toFixed(1) + "%");
        el.style.setProperty("--sc", sc);
      });
      const rest = () => { el.classList.remove("is-tilting"); ["--rx", "--ry", "--sc"].forEach((v) => el.style.removeProperty(v)); };
      el.addEventListener("pointerenter", (e) => { if (e.pointerType !== "touch") el.classList.add("is-tilting"); });
      el.addEventListener("pointermove", (e) => { if (e.pointerType !== "touch") aim(e); });
      el.addEventListener("pointerleave", rest);
      // touch: tilt toward the finger on press, spring back on release
      el.addEventListener("pointerdown", (e) => { if (e.pointerType === "touch") { el.classList.add("is-tilting"); aim(e); } });
      ["pointerup", "pointercancel"].forEach((t) => el.addEventListener(t, () => setTimeout(rest, 140)));
    });
  }

  /* ---------- zoom origin follows cursor ---------- */
  if (fine && !reduce) {
    $$(".zoom").forEach((el) => {
      const mv = raf((e) => { const r = el.getBoundingClientRect(); el.style.setProperty("--zx", ((e.clientX - r.left) / r.width * 100).toFixed(1) + "%"); el.style.setProperty("--zy", ((e.clientY - r.top) / r.height * 100).toFixed(1) + "%"); });
      el.addEventListener("pointermove", mv);
    });
  }

  /* ---------- magnetic buttons ---------- */
  if (fine && !reduce) {
    $$("[data-magnetic]").forEach((el) => {
      el.addEventListener("pointermove", (e) => { const r = el.getBoundingClientRect(); el.style.translate = `${((e.clientX - r.left - r.width / 2) * .22).toFixed(1)}px ${((e.clientY - r.top - r.height / 2) * .3).toFixed(1)}px`; });
      el.addEventListener("pointerleave", () => { el.style.translate = ""; });
    });
  }

  /* ---------- hero mouse-parallax scope ---------- */
  if (fine && !reduce) {
    $$("[data-parallax]").forEach((sc) => {
      const mv = raf((e) => { const r = sc.getBoundingClientRect(); sc.style.setProperty("--px", (((e.clientX - r.left) / r.width - .5) * 2).toFixed(3)); sc.style.setProperty("--py", (((e.clientY - r.top) / r.height - .5) * 2).toFixed(3)); });
      sc.addEventListener("pointermove", mv);
      sc.addEventListener("pointerleave", () => { sc.style.setProperty("--px", 0); sc.style.setProperty("--py", 0); });
    });
  }

  /* ---------- cursor follower ---------- */
  if (fine && !reduce) {
    const ring = d.createElement("div"), dot = d.createElement("div");
    ring.className = "cur-ring"; dot.className = "cur-dot"; ring.setAttribute("aria-hidden", "true"); dot.setAttribute("aria-hidden", "true");
    d.body.append(ring, dot);
    let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y;
    addEventListener("pointermove", (e) => { x = e.clientX; y = e.clientY; root.classList.add("cursor-on"); dot.style.transform = `translate(${x}px,${y}px)`; }, { passive: true });
    d.addEventListener("pointerleave", () => root.classList.remove("cursor-on"));
    d.addEventListener("pointerover", (e) => root.classList.toggle("cursor-hover", !!e.target.closest("a, button, [data-tilt], input, select, textarea, summary, label")));
    (function loop() { rx += (x - rx) * .16; ry += (y - ry) * .16; ring.style.transform = `translate(${rx.toFixed(1)}px,${ry.toFixed(1)}px)`; requestAnimationFrame(loop); })();
  }

  /* ---------- golden dust canvas ---------- */
  $$("canvas[data-dust]").forEach((cv) => {
    if (reduce) return;
    const ctx = cv.getContext("2d"); let w, h, dpr, parts = [], run = true;
    const size = () => { dpr = Math.min(2, devicePixelRatio || 1); w = cv.clientWidth; h = cv.clientHeight; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    const make = () => ({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.7 + .4, v: Math.random() * .25 + .06, a: Math.random() * Math.PI * 2, s: Math.random() * .02 + .005 });
    size(); parts = Array.from({ length: Math.round(Math.min(70, w / 20)) }, make);
    new ResizeObserver(() => { size(); }).observe(cv);
    new IntersectionObserver((e) => { run = e[0].isIntersecting; if (run) tick(); }).observe(cv);
    function tick() {
      if (!run) return;
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.y -= p.v; p.x += Math.sin(p.a) * .18; p.a += p.s; if (p.y < -6) { p.y = h + 6; p.x = Math.random() * w; }
        const tw = .35 + .65 * Math.abs(Math.sin(p.a * 3));
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
        g.addColorStop(0, `rgba(255,226,150,${.85 * tw})`); g.addColorStop(.35, `rgba(245,185,66,${.35 * tw})`); g.addColorStop(1, "rgba(245,185,66,0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 5, 0, 6.283); ctx.fill();
      }
      requestAnimationFrame(tick);
    }
    tick();
  });

  /* ---------- product spec dialog ---------- */
  const dlg = $("#specDialog");
  if (dlg && typeof dlg.showModal === "function") {
    const body = $("#specBody", dlg);
    $$("[data-spec]").forEach((b) => b.addEventListener("click", () => {
      const t = d.getElementById("spec-" + b.dataset.spec); if (!t) return;
      body.replaceChildren(t.content.cloneNode(true)); dlg.showModal(); dlg.scrollTop = 0;
    }));
    dlg.addEventListener("click", (e) => { if (e.target === dlg || e.target.closest("[data-dlg-close]")) dlg.close(); });
    const want = new URLSearchParams(location.search).get("spec");
    if (want) { const b = $(`[data-spec="${CSS.escape(want)}"]`); b && setTimeout(() => b.click(), 450); }
  }

  /* ---------- product filter + search ---------- */
  const grid = $("#productGrid");
  if (grid) {
    const cards = $$("[data-cat]", grid), chips = $$("[data-filter]"), q = $("#productSearch"), count = $("#productCount"), none = $("#noResults");
    let cat = "all";
    const apply = () => {
      const term = (q ? q.value : "").trim().toLowerCase(); let n = 0;
      cards.forEach((c) => { const ok = (cat === "all" || c.dataset.cat === cat) && (!term || c.textContent.toLowerCase().includes(term) || (c.dataset.keys || "").includes(term)); c.hidden = !ok; if (ok) n++; });
      if (count) count.textContent = n + (n === 1 ? " category" : " categories");
      none && none.classList.toggle("hidden", n > 0);
    };
    chips.forEach((c) => c.addEventListener("click", () => { cat = c.dataset.filter; chips.forEach((x) => x.setAttribute("aria-pressed", x === c)); apply(); }));
    q && q.addEventListener("input", apply);
    if (location.hash) { const m = chips.find((c) => "#" + c.dataset.filter === location.hash); m && m.click(); }
  }

  /* ---------- contact form -> WhatsApp / email ---------- */
  const form = $("#quoteForm");
  if (form) {
    const text = () => {
      const f = new FormData(form), v = (k) => (f.get(k) || "").toString().trim();
      return ["Hello Jayakumar Bearings, I would like a quote.", "", `Name: ${v("name")}`, v("company") && `Company: ${v("company")}`, `Phone: ${v("phone")}`,
        v("bearing") && `Bearing / part no.: ${v("bearing")}`, v("brand") && `Preferred brand: ${v("brand")}`, v("qty") && `Quantity: ${v("qty")}`, v("message") && `Details: ${v("message")}`].filter((x) => x !== false && x !== "").join("\n");
    };
    form.addEventListener("submit", (e) => {
      e.preventDefault(); if (!form.reportValidity()) return;
      const how = e.submitter && e.submitter.dataset.via;
      if (how === "email") location.href = `mailto:jkbearingrjpm@gmail.com?subject=${encodeURIComponent("Quote request – " + (form.bearing.value || "bearings"))}&body=${encodeURIComponent(text())}`;
      else open(`https://wa.me/919659764000?text=${encodeURIComponent(text())}`, "_blank", "noopener");
      const ok = $("#formOk"); ok && ok.classList.remove("hidden");
    });
  }

  /* ---------- "open now" status (India time) ---------- */
  $$("[data-open-status]").forEach((el) => {
    const ist = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const day = ist.getDay(), mins = ist.getHours() * 60 + ist.getMinutes();
    const [o, c] = day === 0 ? [600, 810] : [540, 1170];          // Sun 10:00-13:30, Mon-Sat 09:00-19:30
    const open = mins >= o && mins < c, dot = $(".dot", el), label = $(".label", el);
    const f = (m) => { const h = Math.floor(m / 60), mm = String(m % 60).padStart(2, "0"); return `${h % 12 || 12}:${mm} ${h < 12 ? "AM" : "PM"}`; };
    const nextOpen = (day + 1) % 7 === 0 ? 600 : 540;
    if (label) label.textContent = open ? `Open now · closes ${f(c)}` : mins < o ? `Closed now · opens today ${f(o)}` : `Closed now · opens tomorrow ${f(nextOpen)}`;
    if (dot) dot.style.background = open ? "#22c55e" : "#f59e0b";
  });

  try { const n = (JSON.parse(localStorage.getItem("jkb_cart")) || []).length; $$("[data-cart-count]").forEach((e) => { e.textContent = n; e.hidden = !n; }); } catch (e) {}
  $$("[data-year]").forEach((e) => (e.textContent = new Date().getFullYear()));
})();
