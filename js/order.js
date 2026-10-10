/* Jayakumar Bearings – Quick Order & Cart (no dependencies). Cart lives in localStorage; checkout = WhatsApp message. */
(() => {
  "use strict";
  const CFG = window.JKB_ORDER || { wa: "919659764000", disc: 35 };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const norm = (s) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const inr = (n) => "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const nett = (rsp) => Math.round(rsp * (100 - CFG.disc)) / 100;
  const KEY = "jkb_cart", INFO = "jkb_cart_info";
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  let CAT = null, ROWS = [], KEYS = [], BR = [], TY = [], byKey = new Map();
  let cart = store.get(KEY, []).filter((x) => Array.isArray(x) && x.length === 2); // [[key, qty], …]
  const ik = (r) => BR[r[1]] + "|" + r[0];

  /* ---------- catalogue ---------- */
  async function load() {
    const bin = Uint8Array.from(atob(window.JKB_CAT), (c) => c.charCodeAt(0));
    const txt = await new Response(new Blob([bin]).stream().pipeThrough(new DecompressionStream("gzip"))).text();
    CAT = JSON.parse(txt);
    ROWS = CAT.r; BR = CAT.b; TY = CAT.t;
    KEYS = ROWS.map((r) => norm(r[0]));
    ROWS.forEach((r) => byKey.set(ik(r), r));
    TY.forEach((t, i) => { const o = document.createElement("option"); o.value = i; o.textContent = t; $("#typ").appendChild(o); });
  }
  const waitCat = () => new Promise((ok) => { const t = setInterval(() => { if (window.JKB_CAT) { clearInterval(t); ok(); } }, 30); });

  /* ---------- search ---------- */
  function search(q, brand, type, limit = 1e9) {
    const k = norm(q), out = [];
    if (!k && brand === "" && type === "") return out;
    const bi = brand ? BR.indexOf(brand) : -1;
    const ti = type === "" ? -1 : +type;
    const rank = (i) => (KEYS[i] === k ? 0 : KEYS[i].startsWith(k) ? 1 : 2);
    for (let i = 0; i < ROWS.length; i++) {
      const r = ROWS[i];
      if (bi >= 0 && r[1] !== bi) continue;
      if (ti >= 0 && r[2] !== ti) continue;
      if (k && !KEYS[i].includes(k)) continue;
      out.push(i);
    }
    if (k) out.sort((a, b) => rank(a) - rank(b) || KEYS[a].length - KEYS[b].length || a - b);
    return out.slice(0, limit);
  }
  const size = (r) => (r[3] != null ? `${r[3]} × ${r[4]}${r[5] != null ? " × " + r[5]  : ""} mm` : "");
  const priced = (r) => r[7] === 0 && r[6] != null;

  /* ---------- cart ---------- */
  const save = () => { store.set(KEY, cart); render(); };
  function add(key, qty) {
    qty = Math.max(1, Math.min(99999, Math.floor(+qty) || 1));
    const l = cart.find((x) => x[0] === key);
    if (l) l[1] = Math.min(99999, l[1] + qty); else cart.push([key, qty]);
    save();
  }
  let toastT;
  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.classList.add("on"); clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove("on"), 1800);
  }
  function totals() {
    let rsp = 0, net = 0, por = 0;
    cart.forEach(([k, q]) => { const r = byKey.get(k); if (!r) return; if (priced(r)) { rsp += r[6] * q; net += nett(r[6]) * q; } else por++; });
    return { rsp, net, save: rsp - net, por };
  }
  function render() {
    const valid = cart.filter(([k]) => byKey.has(k));
    if (CAT && valid.length !== cart.length) { cart = valid; store.set(KEY, cart); }
    $("#cartN").textContent = cart.length;
    $("#empty").hidden = cart.length > 0; $("#foot").hidden = !cart.length; $("#clear").hidden = !cart.length;
    $("#lines").innerHTML = cart.map(([k, q]) => {
      const r = byKey.get(k); if (!r) return "";
      const p = priced(r), n = p ? nett(r[6]) : 0;
      return `<li class="py-4" data-k="${esc(k)}"><div class="flex justify-between gap-3"><div class="min-w-0"><p class="text-xs font-bold uppercase tracking-wide text-brand-ink">${esc(BR[r[1]])}</p><p class="break-words font-bold">${esc(r[0])}</p><p class="text-xs text-neutral-500">${esc(TY[r[2]])}</p></div>
        <button type="button" data-rm aria-label="Remove ${esc(r[0])}" class="h-8 w-8 shrink-0 rounded-lg text-neutral-400 hover:bg-red-50 hover:text-red-600"><svg class="mx-auto h-4 w-4"><use href="#i-trash-2"/></svg></button></div>
        <div class="mt-2 flex items-center justify-between gap-3"><div class="stepper"><button type="button" data-m aria-label="Decrease"><svg class="h-4 w-4"><use href="#i-minus"/></svg></button><input data-q type="number" min="1" max="99999" value="${q}" aria-label="Quantity"><button type="button" data-p aria-label="Increase"><svg class="h-4 w-4"><use href="#i-plus"/></svg></button></div>
        <div class="text-right">${p ? `<p class="text-xs text-neutral-400">${inr(n)} each</p><p class="font-extrabold">${inr(n * q)}</p>` : `<p class="text-sm font-semibold text-neutral-500">Price on request</p>`}</div></div></li>`;
    }).join("");
    const t = totals();
    $("#tRsp").textContent = inr(t.rsp); $("#tSave").textContent = "− " + inr(t.save); $("#tNet").textContent = inr(t.net);
    $("#porNote").textContent = t.por ? `${t.por} item(s) are price on request – we will quote by phone.` : "";
    $$("[data-disc]").forEach((e) => (e.textContent = CFG.disc));
    const bar = $("#cartBar"); bar.hidden = !cart.length; $("#barN").textContent = cart.length + (cart.length === 1 ? " item" : " items"); $("#barT").textContent = inr(t.net);
    $$("[data-cart-count]").forEach((e) => { e.textContent = cart.length; e.hidden = !cart.length; });
    $$("#results [data-add]").forEach(syncBtn);
  }
  function syncBtn(b) {
    const inCart = cart.some((x) => x[0] === b.dataset.add);
    b.dataset.in = inCart ? "1" : "";
    b.querySelector("span").textContent = inCart ? "Added – add more" : (b.dataset.por ? "Add to enquiry" : "Add to cart");
  }

  $("#lines").addEventListener("click", (e) => {
    const li = e.target.closest("li[data-k]"); if (!li) return;
    const l = cart.find((x) => x[0] === li.dataset.k); if (!l) return;
    if (e.target.closest("[data-rm]")) cart = cart.filter((x) => x !== l);
    else if (e.target.closest("[data-p]")) l[1] = Math.min(99999, l[1] + 1);
    else if (e.target.closest("[data-m]")) l[1] = Math.max(1, l[1] - 1);
    else return;
    save();
  });
  $("#lines").addEventListener("change", (e) => {
    const li = e.target.closest("li[data-k]"); if (!li || !e.target.matches("[data-q]")) return;
    const l = cart.find((x) => x[0] === li.dataset.k); l[1] = Math.max(1, Math.min(99999, Math.floor(+e.target.value) || 1)); save();
  });
  $("#clear").addEventListener("click", () => { if (confirm("Remove all items from the cart?")) { cart = []; save(); } });

  /* ---------- results ---------- */
  let found = [], shown = 0; const PAGE = 30;
  function card(i) {
    const r = ROWS[i], k = ik(r), p = priced(r), sz = size(r);
    return `<article class="pcard rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5"><div class="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
      <div class="min-w-0 flex-1 basis-56"><span class="rounded-md bg-brand-soft px-2 py-0.5 text-xs font-extrabold tracking-wide text-brand-ink">${esc(BR[r[1]])}</span>
        <h3 class="mt-1.5 break-words text-lg font-extrabold leading-tight">${esc(r[0])}</h3><p class="mt-0.5 text-sm text-neutral-500">${esc(TY[r[2]])}${sz ? " · " + sz : ""}</p></div>
      <div class="text-right">${p ? `<p class="text-sm text-neutral-400"><span class="sr-only">RSP </span><s>${inr(r[6])}</s></p><p class="text-2xl font-extrabold leading-tight text-brand-ink">${inr(nett(r[6]))}</p><p class="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Nett price excl. GST</p>` : `<p class="text-base font-bold text-neutral-600">Price on request</p><p class="text-xs text-neutral-500">We will quote by phone</p>`}</div></div>
      <div class="mt-4 flex flex-wrap items-center gap-3"><div class="stepper" data-st><button type="button" data-m aria-label="Decrease quantity"><svg class="h-4 w-4"><use href="#i-minus"/></svg></button><input data-q type="number" min="1" max="99999" value="1" aria-label="Quantity"><button type="button" data-p aria-label="Increase quantity"><svg class="h-4 w-4"><use href="#i-plus"/></svg></button></div>
      <button type="button" data-add="${esc(k)}"${p ? "" : " data-por=1"} class="btn-shine inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-5 py-2.5 font-semibold text-white shadow-lg shadow-orange-500/25 hover:bg-brand-dark data-[in=1]:bg-ink sm:flex-none"><svg class="h-5 w-5"><use href="#i-shopping-cart"/></svg><span>Add to cart</span></button></div></article>`;
  }
  function runSearch() {
    const q = $("#q").value.trim(), brand = $("#chips .is-on").dataset.brand, type = $("#typ").value;
    const st = $("#status");
    if (!q && !brand && type === "") { found = []; $("#results").innerHTML = ""; $("#more").hidden = true; st.textContent = "Type a bearing number above to see prices."; return; }
    found = search(q, brand, type); shown = 0; $("#results").innerHTML = "";
    st.textContent = found.length ? `${found.length.toLocaleString("en-IN")} bearing${found.length === 1 ? "" : "s"} found` : `No bearing found for “${q}”. Try fewer characters, or call us on WhatsApp.`;
    more();
  }
  function more() {
    const slice = found.slice(shown, shown + PAGE); shown += slice.length;
    $("#results").insertAdjacentHTML("beforeend", slice.map(card).join(""));
    $$("#results [data-add]").forEach(syncBtn);
    $("#more").hidden = shown >= found.length; $("#more").textContent = `Show more results (${(found.length - shown).toLocaleString("en-IN")} left)`;
  }
  $("#more").addEventListener("click", more);
  $("#results").addEventListener("click", (e) => {
    const st = e.target.closest("[data-st]");
    if (st) { const inp = $("[data-q]", st); const v = +inp.value || 1;
      if (e.target.closest("[data-p]")) inp.value = Math.min(99999, v + 1); else if (e.target.closest("[data-m]")) inp.value = Math.max(1, v - 1); return; }
    const b = e.target.closest("[data-add]"); if (!b) return;
    const q = $("[data-q]", b.closest("article")).value;
    add(b.dataset.add, q); toast("Added to cart"); $$("[data-cart-count]").forEach((x) => { x.classList.remove("pop"); void x.offsetWidth; x.classList.add("pop"); });
  });
  let dT; $("#q").addEventListener("input", () => { clearTimeout(dT); dT = setTimeout(runSearch, 180); });
  $("#typ").addEventListener("change", runSearch);
  $("#chips").addEventListener("click", (e) => { const c = e.target.closest(".chip"); if (!c) return; $$("#chips .chip").forEach((x) => x.classList.toggle("is-on", x === c)); runSearch(); });

  /* ---------- tabs ---------- */
  function tab(which) {
    const quick = which === "quick";
    $("#tabSearch").setAttribute("aria-selected", !quick); $("#tabQuick").setAttribute("aria-selected", quick);
    $("#paneSearch").hidden = quick; $("#paneQuick").hidden = !quick;
    if (quick && !$$("#qrows .qrow").length) for (let i = 0; i < 5; i++) addRow();
  }
  $("#tabSearch").onclick = () => tab("search"); $("#tabQuick").onclick = () => tab("quick");

  /* ---------- quick order rows ---------- */
  function addRow(text = "", qty = 1) {
    const d = document.createElement("div"); d.className = "qrow grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,14rem)]";
    d.innerHTML = `<div class="relative min-w-0"><input data-part autocomplete="off" spellcheck="false" placeholder="Part number" aria-label="Part number" class="oi w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 outline-none focus:border-brand focus:ring-4 focus:ring-orange-100"><div class="sugg" hidden></div></div>
      <div class="stepper"><button type="button" data-m aria-label="Decrease"><svg class="h-4 w-4"><use href="#i-minus"/></svg></button><input data-q type="number" min="1" max="99999" value="${qty}" aria-label="Quantity"><button type="button" data-p aria-label="Increase"><svg class="h-4 w-4"><use href="#i-plus"/></svg></button></div>
      <p data-info class="col-span-2 min-w-0 text-xs text-neutral-500 sm:col-span-1 sm:self-center">&nbsp;</p>`;
    $("#qrows").appendChild(d);
    if (text) { $("[data-part]", d).value = text; resolve(d); }
    return d;
  }
  function resolve(row, pick) {
    const inp = $("[data-part]", row), info = $("[data-info]", row);
    if (pick != null) { row._i = pick; inp.value = ROWS[pick][0]; }
    else {
      const k = norm(inp.value); row._i = null;
      if (k) { const ex = []; for (let i = 0; i < KEYS.length && ex.length < 3; i++) if (KEYS[i] === k) ex.push(i); if (ex.length === 1) row._i = ex[0]; row._amb = ex.length > 1; }
    }
    if (row._i != null) { const r = ROWS[row._i]; info.innerHTML = `<span class="font-semibold text-green-700">✓ ${esc(BR[r[1]])}</span> · ${esc(TY[r[2]])} · ${priced(r) ? `<b class="text-neutral-800">${inr(nett(r[6]))}</b> excl. GST` : "price on request"}`; }
    else if (!inp.value.trim()) info.innerHTML = "&nbsp;";
    else info.innerHTML = row._amb ? `<span class="font-semibold text-amber-700">Several brands have this number – pick one from the list.</span>` : `<span class="font-semibold text-red-600">Not found – choose from suggestions.</span>`;
    sum();
  }
  function sum() {
    const ok = $$("#qrows .qrow").filter((r) => r._i != null).length;
    $("#qSum").textContent = ok ? `${ok} item${ok === 1 ? "" : "s"} ready to add` : "Enter part numbers above";
    $("#qAddAll").disabled = !ok;
  }
  function suggest(row) {
    const inp = $("[data-part]", row), box = $(".sugg", row), v = inp.value.trim();
    if (norm(v).length < 2) { box.hidden = true; return; }
    const res = search(v, "", "", 8);
    box.innerHTML = res.map((i) => `<button type="button" data-i="${i}"><b>${esc(ROWS[i][0])}</b><span class="text-neutral-500">${esc(BR[ROWS[i][1]])}${priced(ROWS[i]) ? " · " + inr(nett(ROWS[i][6])) : ""}</span></button>`).join("");
    box.hidden = !res.length;
  }
  const qrows = $("#qrows");
  qrows.addEventListener("input", (e) => { const row = e.target.closest(".qrow"); if (e.target.matches("[data-part]")) { row._i = null; $("[data-info]", row).innerHTML = "&nbsp;"; suggest(row); sum(); } });
  qrows.addEventListener("focusout", (e) => { const row = e.target.closest(".qrow"); if (!row || !e.target.matches("[data-part]")) return; setTimeout(() => { if (row.contains(document.activeElement)) return; $(".sugg", row).hidden = true; if (row._i == null) resolve(row); }, 160); });
  qrows.addEventListener("click", (e) => {
    const row = e.target.closest(".qrow"); if (!row) return;
    const s = e.target.closest("[data-i]"); if (s) { resolve(row, +s.dataset.i); $(".sugg", row).hidden = true; return; }
    const inp = $("[data-q]", row), v = +inp.value || 1;
    if (e.target.closest("[data-p]")) inp.value = Math.min(99999, v + 1); else if (e.target.closest("[data-m]")) inp.value = Math.max(1, v - 1);
  });
  qrows.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.matches("[data-part]")) { e.preventDefault(); const row = e.target.closest(".qrow"); const f = $(".sugg button", row); if (f && !$(".sugg", row).hidden) f.click(); else { resolve(row); const n = row.nextElementSibling || addRow(); $("[data-part]", n).focus(); } } });
  $("#qAddRow").onclick = () => addRow().querySelector("[data-part]").focus();
  $("#qPasteBtn").onclick = () => { $("#qPaste").hidden = !$("#qPaste").hidden; };
  $("#qPasteGo").onclick = () => {
    const lines = $("#qPasteTa").value.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    qrows.innerHTML = "";
    lines.slice(0, 200).forEach((l) => { const m = l.match(/^(.*?)[\s,;:\t]*(?:[x×*]\s*)?(\d{1,5})\s*(?:nos?|pcs?)?$/i); const part = m && m[1].trim() ? m[1].trim() : l; addRow(part, m && m[1].trim() ? +m[2] : 1); });
    if (!lines.length) for (let i = 0; i < 5; i++) addRow();
    $("#qPaste").hidden = true;
  };
  $("#qAddAll").onclick = () => {
    let n = 0;
    $$("#qrows .qrow").forEach((r) => { if (r._i != null) { add(ik(ROWS[r._i]), $("[data-q]", r).value); n++; r.remove(); } });
    if (!$$("#qrows .qrow").length) for (let i = 0; i < 3; i++) addRow();
    sum(); toast(`${n} item${n === 1 ? "" : "s"} added to cart`);
    if (matchMedia("(max-width:1023px)").matches) $("#cart").scrollIntoView({ behavior: "smooth" });
  };

  /* ---------- checkout ---------- */
  function message() {
    const t = totals(), name = $("#cName").value.trim(), note = $("#cNote").value.trim();
    const L = ["*New order request – Jayakumar Bearings website*", ""];
    if (name) L.push("Name: " + name);
    if (note) L.push("Note: " + note);
    if (name || note) L.push("");
    cart.forEach(([k, q], n) => {
      const r = byKey.get(k); if (!r) return;
      L.push(`${n + 1}. ${BR[r[1]]} ${r[0]} (${TY[r[2]]})`);
      L.push(priced(r) ? `    Qty ${q} × ${inr(nett(r[6]))} = ${inr(nett(r[6]) * q)}` : `    Qty ${q} – price on request`);
    });
    L.push("", `*Total (Excl. GST): ${inr(t.net)}*`, "_GST 18% extra. Prices as shown on website; please confirm stock & final price._");
    return L.join("\n");
  }
  const info = store.get(INFO, {}); $("#cName").value = info.n || ""; $("#cNote").value = info.t || "";
  ["#cName", "#cNote"].forEach((s) => $(s).addEventListener("input", () => store.set(INFO, { n: $("#cName").value, t: $("#cNote").value })));
  $("#send").onclick = async () => {
    if (!cart.length) return;
    const msg = message(), url = `https://wa.me/${CFG.wa}?text=${encodeURIComponent(msg)}`;
    if (url.length > 7000) { try { await navigator.clipboard.writeText(msg); } catch (e) {} toast("Large order copied – paste it in WhatsApp"); window.open(`https://wa.me/${CFG.wa}`, "_blank", "noopener"); }
    else window.open(url, "_blank", "noopener");
  };
  $("#copy").onclick = async () => { try { await navigator.clipboard.writeText(message()); toast("Order text copied"); } catch (e) { prompt("Copy your order:", message()); } };

  /* ---------- boot ---------- */
  render();
  (async () => {
    try { await waitCat(); await load(); } catch (e) { $("#status").textContent = "Could not load the price list. Please call us to order."; return; }
    render(); runSearch();
    const p = new URLSearchParams(location.search).get("q"); if (p) { $("#q").value = p; runSearch(); }
  })();
})();
