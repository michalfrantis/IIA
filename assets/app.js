/* Auditní trenažér IIA — stav, opakování, gamifikace.
   Bez závislostí, vše v localStorage. */
(function () {
  "use strict";

  var KEY = "iia-trenink-v1";
  var D = IIA_DATA;
  var QS = D.questions;
  var byId = {}; QS.forEach(function (q) { byId[q.id] = q; });
  var areaById = {}; D.areas.forEach(function (a) { areaById[a.id] = a; });
  var domById = {}; D.domains.forEach(function (x) { domById[x.id] = x; });

  var DAY = 864e5;
  var BOX_DAYS = [0, 1, 3, 7, 16, 35];   // Leitner
  var MAX_BOX = 5;
  var LEVELS = [
    [0, "Kandidát"], [150, "Junior auditor"], [400, "Auditor"], [800, "Senior auditor"],
    [1400, "Vedoucí zakázky"], [2200, "Manažer auditu"], [3200, "Vedoucí interního auditu"],
    [4600, "Mistr standardů"]
  ];
  var BADGES = [
    { id: "start",   i: "▶",  n: "První zakázka",   d: "Dokončený první test" },
    { id: "ok50",    i: "✓",  n: "Padesátka",       d: "50 správných odpovědí" },
    { id: "ok200",   i: "✓✓", n: "Dvě stě",         d: "200 správných odpovědí" },
    { id: "ok500",   i: "★",  n: "Pět set",         d: "500 správných odpovědí" },
    { id: "str3",    i: "3",  n: "Rozjezd",         d: "Série 3 dny v řadě" },
    { id: "str7",    i: "7",  n: "Týden v kuse",    d: "Série 7 dní v řadě" },
    { id: "str30",   i: "30", n: "Měsíc disciplíny", d: "Série 30 dní v řadě" },
    { id: "clean",   i: "◎",  n: "Bez poskvrny",    d: "Test 10 z 10" },
    { id: "allarea", i: "◇",  n: "Celý rejstřík",   d: "Otázka z každé oblasti" },
    { id: "domain",  i: "▣",  n: "Doména zvládnuta", d: "Doména na 80 %" },
    { id: "fixed25", i: "↺",  n: "Práce na chybách", d: "25 dříve chybných otázek zvládnuto" },
    { id: "open25",  i: "✎",  n: "Vlastními slovy", d: "25 otevřených kartiček" },
    { id: "night",   i: "☾",  n: "Noční směna",     d: "Trénink mezi 23:00 a 4:00" },
    { id: "full",    i: "∞",  n: "Kompletista",     d: "Každá otázka alespoň jednou" }
  ];

  /* ---------- stav ---------- */
  var S;
  function blank() {
    return { xp: 0, goal: 10, streak: 0, lastDay: "", daily: { d: "", n: 0 },
             tot: { ok: 0, part: 0, bad: 0 }, openDone: 0, q: {}, badges: [], hist: {}, theme: "" };
  }
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      S = raw ? JSON.parse(raw) : blank();
    } catch (e) { S = blank(); }
    var b = blank();
    for (var k in b) if (!(k in S)) S[k] = b[k];
    return S;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function today() { var d = new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function rec(id) {
    if (!S.q[id]) S.q[id] = { box: 0, due: 0, ok: 0, part: 0, bad: 0, seen: 0 };
    return S.q[id];
  }

  /* ---------- výpočty ---------- */
  function level() {
    var i = 0;
    for (var j = 0; j < LEVELS.length; j++) if (S.xp >= LEVELS[j][0]) i = j;
    var next = LEVELS[i + 1];
    return { idx: i, name: LEVELS[i][1], from: LEVELS[i][0], to: next ? next[0] : null };
  }
  function mastery(ids) {
    if (!ids.length) return 0;
    var sum = 0;
    ids.forEach(function (id) { var r = S.q[id]; if (r) sum += Math.min(r.box, MAX_BOX); });
    return Math.round(sum / (ids.length * MAX_BOX) * 100);
  }
  function areaQs(aid) { return QS.filter(function (q) { return q.a === aid; }).map(function (q) { return q.id; }); }
  function domQs(did) {
    return QS.filter(function (q) { return areaById[q.a].d === did; }).map(function (q) { return q.id; });
  }
  function isDue(id) { var r = S.q[id]; return !r || r.seen === 0 || r.due <= Date.now(); }
  function dueCount(list) { return list.filter(isDue).length; }
  function mistakeIds() {
    return QS.filter(function (q) {
      var r = S.q[q.id];
      return r && (r.bad > 0 || r.part > 0) && r.box <= 2;
    }).map(function (q) { return q.id; });
  }

  /* ---------- výběr otázek ---------- */
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function pick(pool, n) {
    // priorita: splatné (nejdéle čekající) → neviděné → zbytek
    var due = [], fresh = [], rest = [];
    pool.forEach(function (id) {
      var r = S.q[id];
      if (!r || r.seen === 0) fresh.push(id);
      else if (r.due <= Date.now()) due.push(id);
      else rest.push(id);
    });
    due.sort(function (a, b) { return S.q[a].due - S.q[b].due; });
    shuffle(fresh); shuffle(rest);
    return due.concat(fresh, rest).slice(0, n);
  }
  function buildQueue(mode, arg) {
    var n = S.goal || 10, pool;
    if (mode === "mistakes") {
      pool = mistakeIds();
      pool.sort(function (a, b) { return (S.q[b].bad * 2 + S.q[b].part) - (S.q[a].bad * 2 + S.q[a].part); });
      return pool.slice(0, 12);
    }
    if (mode === "open") { pool = QS.filter(function (q) { return q.t === "open"; }).map(function (q) { return q.id; }); return pick(pool, 8); }
    if (mode === "area") { pool = areaQs(arg); return pick(pool, Math.min(12, pool.length)); }
    pool = QS.map(function (q) { return q.id; });           // daily / all
    return pick(pool, n);
  }

  /* ---------- session ---------- */
  var Q = null;
  function startQuiz(mode, arg, label) {
    var queue = buildQueue(mode, arg);
    if (!queue.length) { alert("Tady teď není co opakovat. Zkus jiný režim."); return; }
    Q = { queue: queue, i: 0, mode: mode, label: label || "Test", ok: 0, part: 0, bad: 0, xp: 0, combo: 0, best: 0, newBadges: [] };
    show("quiz");
    renderQuestion();
  }
  function renderQuestion() {
    var q = byId[Q.queue[Q.i]];
    el("qFill").style.width = (Q.i / Q.queue.length * 100) + "%";
    el("qCount").textContent = (Q.i + 1) + "/" + Q.queue.length;
    var cb = el("qCombo");
    if (Q.combo >= 3) { cb.hidden = false; cb.textContent = "série ×" + Q.combo; } else cb.hidden = true;

    var area = areaById[q.a], dom = domById[area.d];
    var h = '<div class="qcard fadein">' +
      '<div class="qtags"><span class="tag">' + esc(dom.num === "★" ? "Průřezové" : "Doména " + dom.num) + '</span>' +
      '<span class="tag">' + esc(area.name) + '</span><span class="tag ref">' + esc(q.r) + '</span></div>' +
      '<p class="qtext">' + esc(q.q) + '</p>';

    if (q.t === "mcq") {
      var order = shuffle(q.o.map(function (_, i) { return i; }));
      Q.order = order;
      h += '<div class="opts" id="opts">';
      order.forEach(function (oi, pos) {
        h += '<button class="opt" data-oi="' + oi + '"><span class="k">' + "ABCD".charAt(pos) + '</span><span>' + esc(q.o[oi]) + '</span></button>';
      });
      h += '</div>';
    } else {
      h += '<button class="btn ghost" id="reveal">Ukázat vzorovou odpověď</button>';
    }
    h += '</div>';
    el("quizBody").innerHTML = h;

    if (q.t === "mcq") {
      [].forEach.call(document.querySelectorAll(".opt"), function (b) {
        b.addEventListener("click", function () { answerMcq(q, +b.dataset.oi, b); });
      });
    } else {
      el("reveal").addEventListener("click", function () { revealOpen(q); });
    }
    el("quizBody").scrollTop = 0;
    document.querySelector("main").scrollTop = 0;
  }
  function answerMcq(q, chosen, btn) {
    var right = chosen === q.c;
    [].forEach.call(document.querySelectorAll(".opt"), function (b) {
      b.disabled = true;
      var oi = +b.dataset.oi;
      if (oi === q.c) b.classList.add("right");
      else if (b === btn) b.classList.add("wrong");
      else b.classList.add("dim");
    });
    grade(q, right ? "ok" : "bad");
  }
  function revealOpen(q) {
    var card = document.querySelector(".qcard");
    el("reveal").remove();
    var box = document.createElement("div");
    box.className = "model fadein";
    box.textContent = q.m;
    card.appendChild(box);
    var sg = document.createElement("div");
    sg.className = "selfgrade";
    sg.innerHTML =
      '<button class="sg b" data-g="bad"><b>❌</b>Nevěděl</button>' +
      '<button class="sg w" data-g="part"><b>⚠️</b>Částečně</button>' +
      '<button class="sg g" data-g="ok"><b>✅</b>Věděl</button>';
    card.appendChild(sg);
    [].forEach.call(sg.querySelectorAll(".sg"), function (b) {
      b.addEventListener("click", function () { sg.remove(); grade(q, b.dataset.g); });
    });
  }
  function grade(q, g) {
    var r = rec(q.id);
    r.seen++;
    r[g]++;
    S.tot[g]++;
    if (q.t === "open") S.openDone++;

    if (g === "ok") { r.box = Math.min(r.box + 1, MAX_BOX); Q.ok++; Q.combo++; }
    else if (g === "part") { r.box = Math.max(0, Math.min(r.box, MAX_BOX)); Q.part++; Q.combo = 0; }
    else { r.box = 0; Q.bad++; Q.combo = 0; }
    if (Q.combo > Q.best) Q.best = Q.combo;
    r.due = Date.now() + BOX_DAYS[r.box] * DAY + (r.box === 0 ? 6e5 : 0);

    var gain = g === "ok" ? 10 + q.d * 2 : g === "part" ? 5 : 2;
    if (Q.combo >= 3) gain = Math.round(gain * 1.5);
    S.xp += gain; Q.xp += gain;

    var d = today();
    if (S.daily.d !== d) S.daily = { d: d, n: 0 };
    S.daily.n++;
    S.hist[d] = (S.hist[d] || 0) + 1;
    if (S.daily.n === S.goal) bumpStreak(d);

    buzz(g === "ok" ? 18 : 40);
    showVerdict(q, g, gain);
    save();
  }
  function bumpStreak(d) {
    if (S.lastDay === d) return;
    var y = new Date(Date.now() - DAY);
    var yest = y.getFullYear() + "-" + pad(y.getMonth() + 1) + "-" + pad(y.getDate());
    S.streak = (S.lastDay === yest) ? S.streak + 1 : 1;
    S.lastDay = d;
  }
  function showVerdict(q, g, gain) {
    var card = document.querySelector(".qcard");
    var v = document.createElement("div");
    v.className = "verdict fadein " + (g === "ok" ? "ok" : g === "part" ? "warn" : "bad");
    v.innerHTML = (g === "ok" ? "✅ Správně" : g === "part" ? "⚠️ Částečně" : "❌ Doplnit") +
      '<span class="xpchip">+' + gain + " XP</span>";
    card.appendChild(v);
    if (q.t === "mcq") {
      var e = document.createElement("div");
      e.className = "expl";
      e.textContent = q.e;
      card.appendChild(e);
    }
    var next = document.createElement("button");
    next.className = "btn";
    next.textContent = Q.i + 1 < Q.queue.length ? "Další otázka" : "Vyhodnotit";
    next.addEventListener("click", function () {
      Q.i++;
      if (Q.i < Q.queue.length) renderQuestion(); else finish();
    });
    card.appendChild(next);
    next.scrollIntoView({ block: "nearest", behavior: "smooth" });
    paintHeader();
  }
  function finish() {
    checkBadges();
    var n = Q.queue.length, acc = Math.round(Q.ok / n * 100);
    var h = '<div class="result fadein"><div class="big">' + acc + '%</div>' +
      '<h2>' + esc(Q.label) + ' hotov</h2>' +
      '<p>' + Q.ok + '× ✅ · ' + Q.part + '× ⚠️ · ' + Q.bad + '× ❌ &nbsp;|&nbsp; +' + Q.xp + ' XP' +
      (Q.best >= 3 ? ' · nejdelší série ' + Q.best : '') + '</p>';
    var missed = Q.queue.filter(function (id) { var r = S.q[id]; return r && r.box === 0; });
    if (missed.length) {
      h += '<div class="weak" style="text-align:left">';
      missed.slice(0, 5).forEach(function (id) {
        h += '<div class="weak-row"><span class="n">' + esc(byId[id].q.slice(0, 80)) + '…</span>' +
             '<span class="v">' + esc(byId[id].r) + '</span></div>';
      });
      h += '</div><p class="note">Tyhle se vrátí v režimu <strong>Opakovat chyby</strong>.</p>';
    }
    Q.newBadges.forEach(function (b) {
      h += '<div class="newbadge"><span class="bi" style="font-size:22px">' + b.i + '</span>' +
           '<span><b>Nový odznak: ' + esc(b.n) + '</b><span>' + esc(b.d) + '</span></span></div>';
    });
    h += '<button class="btn" id="again">Ještě jednou</button>' +
         '<button class="btn ghost" id="home">Domů</button></div>';
    el("quizBody").innerHTML = h;
    el("qFill").style.width = "100%";
    el("again").addEventListener("click", function () { startQuiz(Q.mode, Q.arg, Q.label); });
    el("home").addEventListener("click", function () { show("home"); });
    save(); paintAll();
  }

  /* ---------- odznaky ---------- */
  function checkBadges() {
    var got = function (id) { return S.badges.indexOf(id) >= 0; };
    var add = function (id) {
      if (got(id)) return;
      S.badges.push(id);
      var b = BADGES.filter(function (x) { return x.id === id; })[0];
      if (b && Q) Q.newBadges.push(b);
    };
    add("start");
    if (S.tot.ok >= 50) add("ok50");
    if (S.tot.ok >= 200) add("ok200");
    if (S.tot.ok >= 500) add("ok500");
    if (S.streak >= 3) add("str3");
    if (S.streak >= 7) add("str7");
    if (S.streak >= 30) add("str30");
    if (Q && Q.queue.length >= 10 && Q.ok === Q.queue.length) add("clean");
    if (S.openDone >= 25) add("open25");
    var hr = new Date().getHours();
    if (hr >= 23 || hr < 4) add("night");
    var touched = {}; Object.keys(S.q).forEach(function (id) { if (byId[id]) touched[byId[id].a] = 1; });
    if (Object.keys(touched).length >= D.areas.length) add("allarea");
    if (Object.keys(S.q).length >= QS.length) add("full");
    var domOk = D.domains.some(function (d) { var ids = domQs(d.id); return ids.length && mastery(ids) >= 80; });
    if (domOk) add("domain");
    var fixed = 0;
    Object.keys(S.q).forEach(function (id) { var r = S.q[id]; if (r.bad > 0 && r.box >= 3) fixed++; });
    if (fixed >= 25) add("fixed25");
  }

  /* ---------- vykreslení ---------- */
  function el(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; }); }
  function buzz(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }
  function meterCls(p) { return p >= 70 ? "g" : p >= 40 ? "" : p > 0 ? "w" : "b"; }

  function paintHeader() {
    var L = level();
    el("lvlName").textContent = L.name;
    el("lvlXp").textContent = S.xp + " XP";
    var pct = L.to ? Math.min(100, (S.xp - L.from) / (L.to - L.from) * 100) : 100;
    el("xpFill").style.width = pct + "%";
    el("streak").textContent = S.streak + (S.streak === 1 ? " den" : S.streak >= 5 || S.streak === 0 ? " dní" : " dny");
  }
  function paintHome() {
    var d = today();
    if (S.daily.d !== d) S.daily = { d: d, n: 0 };
    var done = Math.min(S.daily.n, S.goal);
    el("ringNum").textContent = S.daily.n;
    el("ringDen").textContent = "/" + S.goal;
    el("ringFill").setAttribute("stroke-dashoffset", String(226 - 226 * (done / S.goal)));
    el("ringFill").setAttribute("stroke", S.daily.n >= S.goal ? "var(--ok)" : "var(--accent)");
    el("todayTitle").textContent = S.daily.n >= S.goal ? "Denní cíl splněn" : "Dnešní dávka";
    el("todayText").textContent = S.daily.n >= S.goal
      ? "Série drží. Můžeš pokračovat, XP se počítá dál."
      : (S.goal - S.daily.n) + " otázek do splnění denního cíle.";

    var all = QS.map(function (q) { return q.id; });
    el("cDaily").textContent = dueCount(all) + " na řadě";
    el("cMist").textContent = mistakeIds().length + " ks";
    var opens = QS.filter(function (q) { return q.t === "open"; }).map(function (q) { return q.id; });
    el("cOpen").textContent = opens.length + " ks";

    el("tOk").textContent = S.tot.ok;
    el("tPart").textContent = S.tot.part;
    el("tBad").textContent = S.tot.bad;
    el("totSeen").textContent = Object.keys(S.q).length + " / " + QS.length + " otázek viděno";

    var weak = D.areas.map(function (a) { return { a: a, m: mastery(areaQs(a.id)), seen: areaQs(a.id).filter(function (i) { return S.q[i]; }).length }; })
      .filter(function (x) { return x.seen > 0 && x.m < 70; })
      .sort(function (x, y) { return x.m - y.m; }).slice(0, 4);
    el("weakSec").hidden = weak.length === 0;
    el("weakList").innerHTML = weak.map(function (x) {
      return '<button class="weak-row" data-area="' + x.a.id + '"><span class="n">' + esc(x.a.name) + '</span>' +
             '<span class="v">' + x.m + ' %</span></button>';
    }).join("");
    [].forEach.call(el("weakList").querySelectorAll("[data-area]"), function (b) {
      b.addEventListener("click", function () { var a = areaById[b.dataset.area]; startQuiz("area", a.id, a.name); });
    });
  }
  function paintTrain() {
    el("cAll").textContent = QS.length + " otázek";
    var h = "";
    D.domains.forEach(function (dom) {
      var areas = D.areas.filter(function (a) { return a.d === dom.id; });
      if (!areas.length) return;
      h += '<div class="dom"><div class="dom-h"><span class="dom-num">' + esc(dom.num) + '</span><h3>' + esc(dom.name) + '</h3></div><div class="areas">';
      areas.forEach(function (a) {
        var ids = areaQs(a.id), m = mastery(ids);
        h += '<button class="area" data-area="' + a.id + '">' +
             '<span class="area-n">' + esc(a.name) + '</span>' +
             '<span class="area-p">' + m + ' % · ' + ids.length + '</span>' +
             '<span class="meter ' + meterCls(m) + '"><i style="width:' + m + '%"></i></span></button>';
      });
      h += '</div></div>';
    });
    el("areaList").innerHTML = h;
    [].forEach.call(el("areaList").querySelectorAll("[data-area]"), function (b) {
      b.addEventListener("click", function () { var a = areaById[b.dataset.area]; startQuiz("area", a.id, a.name); });
    });
  }
  function paintProg() {
    el("domProg").innerHTML = D.domains.map(function (dom) {
      var ids = domQs(dom.id); if (!ids.length) return "";
      var m = mastery(ids), seen = ids.filter(function (i) { return S.q[i]; }).length;
      return '<div class="area" style="cursor:default">' +
        '<span class="area-n">' + esc(dom.num === "★" ? dom.name : "Doména " + dom.num + " — " + dom.name) + '</span>' +
        '<span class="area-p">' + m + ' %</span>' +
        '<span class="meter ' + meterCls(m) + '"><i style="width:' + m + '%"></i></span>' +
        '<span class="area-p" style="grid-column:1/-1; text-align:left; margin-top:4px">' + seen + ' z ' + ids.length + ' otázek viděno</span></div>';
    }).join("");

    var rows = "";
    for (var i = 13; i >= 0; i--) {
      var dt = new Date(Date.now() - i * DAY);
      var k = dt.getFullYear() + "-" + pad(dt.getMonth() + 1) + "-" + pad(dt.getDate());
      var n = S.hist[k] || 0;
      if (i > 6 && n === 0) continue;
      var bar = n ? Math.min(100, n / Math.max(S.goal, 10) * 100) : 0;
      rows += '<div class="weak-row"><span class="n" style="font-family:var(--f-mono); font-size:12.5px">' + k.slice(5) + '</span>' +
        '<span class="meter ' + (n >= S.goal ? "g" : "w") + '" style="flex:2; margin:0"><i style="width:' + bar + '%"></i></span>' +
        '<span class="v" style="color:var(--muted)">' + n + '</span></div>';
    }
    el("actList").innerHTML = rows || '<div class="empty">Zatím žádná aktivita.</div>';
    el("aboutNote").innerHTML = esc(D.meta.standard) + " · " + QS.length + " otázek · data jen v tomto zařízení.<br>" +
      "Studijní parafráze standardů, ne oficiální text IIA — čísla standardů si před zkouškou ověř v oficiálním vydání.";
  }
  function paintBadges() {
    el("badgeCount").textContent = S.badges.length + " / " + BADGES.length;
    el("badgeList").innerHTML = BADGES.map(function (b) {
      var on = S.badges.indexOf(b.id) >= 0;
      return '<div class="badge' + (on ? " on" : "") + '"><div class="bi">' + b.i + '</div><b>' + esc(b.n) + '</b><span>' + esc(b.d) + '</span></div>';
    }).join("");
  }
  function paintAll() { paintHeader(); paintHome(); paintTrain(); paintProg(); paintBadges(); }

  /* ---------- navigace ---------- */
  var SCREENS = { home: "s-home", train: "s-train", prog: "s-prog", badges: "s-badges", quiz: "s-quiz" };
  function show(name) {
    for (var k in SCREENS) el(SCREENS[k]).hidden = (k !== name);
    [].forEach.call(document.querySelectorAll(".tab"), function (t) {
      t.setAttribute("aria-current", String(t.dataset.tab === name));
    });
    if (name !== "quiz") paintAll();
    document.querySelector("main").scrollTop = 0;
  }

  /* ---------- start ---------- */
  load();
  if (S.theme) document.documentElement.setAttribute("data-theme", S.theme);
  paintAll();
  show("home");

  [].forEach.call(document.querySelectorAll(".tab"), function (t) {
    t.addEventListener("click", function () {
      if (Q && !el("s-quiz").hidden && !confirm("Ukončit rozdělaný test?")) return;
      show(t.dataset.tab);
    });
  });
  [].forEach.call(document.querySelectorAll("[data-go]"), function (b) {
    b.addEventListener("click", function () {
      var g = b.dataset.go;
      var labels = { daily: "Denní dávka", mistakes: "Opakování chyb", open: "Otevřené kartičky", all: "Test napříč vším" };
      startQuiz(g === "all" ? "daily" : g, null, labels[g]);
    });
  });
  el("quizExit").addEventListener("click", function () {
    if (Q && Q.i < Q.queue.length && !confirm("Ukončit test? Odpovědi zůstanou započítané.")) return;
    show("home");
  });
  el("btnTheme").addEventListener("click", function () {
    var cur = document.documentElement.getAttribute("data-theme");
    var next = cur === "dark" ? "light" : cur === "light" ? "" : "dark";
    if (next) document.documentElement.setAttribute("data-theme", next);
    else document.documentElement.removeAttribute("data-theme");
    S.theme = next; save();
  });
  el("btnReset").addEventListener("click", function () {
    if (!confirm("Opravdu vymazat veškerý pokrok, XP i odznaky?")) return;
    S = blank(); save(); paintAll(); show("home");
  });
  el("btnExport").addEventListener("click", function () {
    var blob = new Blob([JSON.stringify(S)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "iia-trenink-" + today() + ".json";
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  });
  el("btnImport").addEventListener("click", function () { el("fileIn").click(); });
  el("fileIn").addEventListener("change", function (e) {
    var f = e.target.files[0]; if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      try {
        var data = JSON.parse(r.result);
        if (!data || typeof data !== "object" || !("xp" in data)) throw 0;
        S = data; var b = blank(); for (var k in b) if (!(k in S)) S[k] = b[k];
        save(); paintAll(); alert("Záloha obnovena.");
      } catch (err) { alert("Soubor nejde načíst — není to záloha z této aplikace."); }
    };
    r.readAsText(f);
    e.target.value = "";
  });
})();
