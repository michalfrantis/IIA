/* Auditní trenažér IIA — stav, opakování, gamifikace, jazyk.
   Bez závislostí, vše v localStorage. Pokrok je společný pro obě jazykové verze
   (otázky mají stejná id), takže přepnutí jazyka o nic nepřijde. */
(function () {
  "use strict";

  var KEY = "iia-trenink-v1";
  var DAY = 864e5;
  var BOX_DAYS = [0, 1, 3, 7, 16, 35];   // Leitner
  var MAX_BOX = 5;
  var BADGE_IDS = ["start", "ok50", "ok200", "ok500", "str3", "str7", "str30", "clean",
                   "allarea", "domain", "fixed25", "open25", "night", "full"];
  var BADGE_ICON = { start:"▶", ok50:"✓", ok200:"✓✓", ok500:"★", str3:"3", str7:"7", str30:"30",
                     clean:"◎", allarea:"◇", domain:"▣", fixed25:"↺", open25:"✎", night:"☾", full:"∞" };
  var XP_LEVELS = [0, 150, 400, 800, 1400, 2200, 3200, 4600];
  var APP_URL = "https://michalfrantis.github.io/IIA/";

  /* ---------- jazyk ---------- */
  var LANG, U, D, QS, byId = {}, areaById = {}, domById = {};
  function detectLang() {
    try { return /^cs|^sk/i.test(navigator.language || "") ? "cs" : "en"; } catch (e) { return "cs"; }
  }
  function setLang(lang) {
    LANG = (lang === "en") ? "en" : "cs";
    U = IIA_UI[LANG];
    D = (LANG === "en") ? IIA_DATA_EN : IIA_DATA_CS;
    QS = D.questions;
    byId = {}; QS.forEach(function (q) { byId[q.id] = q; });
    areaById = {}; D.areas.forEach(function (a) { areaById[a.id] = a; });
    domById = {}; D.domains.forEach(function (x) { domById[x.id] = x; });
    try { document.documentElement.lang = LANG; } catch (e) {}
  }
  function T(k) {
    var s = U[k];
    if (typeof s !== "string") return k;
    for (var i = 1; i < arguments.length; i++) s = s.replace("{" + (i - 1) + "}", arguments[i]);
    return s;
  }

  /* ---------- stav ---------- */
  var S;
  function blank() {
    return { xp: 0, goal: 10, streak: 0, lastDay: "", daily: { d: "", n: 0 },
             tot: { ok: 0, part: 0, bad: 0 }, openDone: 0, q: {}, badges: [], hist: {}, theme: "",
             remind: { freq: 3, time: "19:00" }, lang: "" };
  }
  function load() {
    try { var raw = localStorage.getItem(KEY); S = raw ? JSON.parse(raw) : blank(); }
    catch (e) { S = blank(); }
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
    for (var j = 0; j < XP_LEVELS.length; j++) if (S.xp >= XP_LEVELS[j]) i = j;
    return { idx: i, name: U.lvl[i], from: XP_LEVELS[i], to: XP_LEVELS[i + 1] === undefined ? null : XP_LEVELS[i + 1] };
  }
  function mastery(ids) {
    if (!ids.length) return 0;
    var sum = 0;
    ids.forEach(function (id) { var r = S.q[id]; if (r) sum += Math.min(r.box, MAX_BOX); });
    return Math.round(sum / (ids.length * MAX_BOX) * 100);
  }
  function areaQs(aid) { return QS.filter(function (q) { return q.a === aid; }).map(function (q) { return q.id; }); }
  function domQs(did) { return QS.filter(function (q) { return areaById[q.a].d === did; }).map(function (q) { return q.id; }); }
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
    pool = QS.map(function (q) { return q.id; });
    return pick(pool, n);
  }

  /* ---------- session ---------- */
  var Q = null;
  function startQuiz(mode, arg, label) {
    var queue = buildQueue(mode, arg);
    if (!queue.length) { alert(T("a_nothing")); return; }
    Q = { queue: queue, i: 0, mode: mode, arg: arg, label: label || "Test",
          ok: 0, part: 0, bad: 0, xp: 0, combo: 0, best: 0, newBadges: [] };
    show("quiz");
    renderQuestion();
  }
  function renderQuestion() {
    var q = byId[Q.queue[Q.i]];
    el("qFill").style.width = (Q.i / Q.queue.length * 100) + "%";
    el("qCount").textContent = (Q.i + 1) + "/" + Q.queue.length;
    var cb = el("qCombo");
    if (Q.combo >= 3) { cb.hidden = false; cb.textContent = T("combo", Q.combo); } else cb.hidden = true;

    var area = areaById[q.a], dom = domById[area.d];
    var h = '<div class="qcard fadein">' +
      '<div class="qtags"><span class="tag">' +
      esc(dom.num === "★" ? T("cross") : T("dom_prefix", dom.num, "").replace(/\s*—\s*$/, "")) + '</span>' +
      '<span class="tag">' + esc(area.name) + '</span><span class="tag ref">' + esc(q.r) + '</span></div>' +
      '<p class="qtext">' + esc(q.q) + '</p>';

    if (q.t === "mcq") {
      var order = shuffle(q.o.map(function (_, i) { return i; }));
      h += '<div class="opts" id="opts">';
      order.forEach(function (oi, pos) {
        h += '<button class="opt" data-oi="' + oi + '"><span class="k">' + "ABCD".charAt(pos) + '</span><span>' + esc(q.o[oi]) + '</span></button>';
      });
      h += '</div>';
    } else {
      h += '<button class="btn ghost" id="reveal">' + esc(T("q_reveal")) + '</button>';
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
      '<button class="sg b" data-g="bad"><b>❌</b>' + esc(T("sg_bad")) + '</button>' +
      '<button class="sg w" data-g="part"><b>⚠️</b>' + esc(T("sg_part")) + '</button>' +
      '<button class="sg g" data-g="ok"><b>✅</b>' + esc(T("sg_ok")) + '</button>';
    card.appendChild(sg);
    [].forEach.call(sg.querySelectorAll(".sg"), function (b) {
      b.addEventListener("click", function () { sg.remove(); grade(q, b.dataset.g); });
    });
  }
  function grade(q, g) {
    var r = rec(q.id);
    r.seen++; r[g]++; S.tot[g]++;
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
    v.innerHTML = esc(g === "ok" ? T("v_ok") : g === "part" ? T("v_part") : T("v_bad")) +
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
    next.textContent = Q.i + 1 < Q.queue.length ? T("q_next") : T("q_finish");
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
      '<h2>' + esc(T("r_done", Q.label)) + '</h2>' +
      '<p>' + esc(T("r_stats", Q.ok, Q.part, Q.bad, Q.xp)) +
      (Q.best >= 3 ? esc(T("r_combo", Q.best)) : "") + '</p>';
    var missed = Q.queue.filter(function (id) { var r = S.q[id]; return r && r.box === 0; });
    if (missed.length) {
      h += '<div class="weak" style="text-align:left">';
      missed.slice(0, 5).forEach(function (id) {
        h += '<div class="weak-row"><span class="n">' + esc(byId[id].q.slice(0, 80)) + '…</span>' +
             '<span class="v">' + esc(byId[id].r) + '</span></div>';
      });
      h += '</div><p class="note">' + T("r_missed") + '</p>';
    }
    Q.newBadges.forEach(function (id) {
      var b = U.badge[id];
      h += '<div class="newbadge"><span class="bi" style="font-size:22px">' + BADGE_ICON[id] + '</span>' +
           '<span><b>' + esc(T("r_badge", b[0])) + '</b><span>' + esc(b[1]) + '</span></span></div>';
    });
    h += '<button class="btn" id="again">' + esc(T("r_again")) + '</button>' +
         '<button class="btn ghost" id="home">' + esc(T("r_home")) + '</button></div>';
    el("quizBody").innerHTML = h;
    el("qFill").style.width = "100%";
    var mode = Q.mode, arg = Q.arg, label = Q.label;
    el("again").addEventListener("click", function () { startQuiz(mode, arg, label); });
    el("home").addEventListener("click", function () { show("home"); });
    save(); paintAll();
  }

  /* ---------- odznaky ---------- */
  function checkBadges() {
    var add = function (id) {
      if (S.badges.indexOf(id) >= 0) return;
      S.badges.push(id);
      if (Q) Q.newBadges.push(id);
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
    if (D.domains.some(function (d) { var ids = domQs(d.id); return ids.length && mastery(ids) >= 80; })) add("domain");
    var fixed = 0;
    Object.keys(S.q).forEach(function (id) { var r = S.q[id]; if (r.bad > 0 && r.box >= 3) fixed++; });
    if (fixed >= 25) add("fixed25");
  }

  /* ---------- pomocné ---------- */
  function el(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; }); }
  function buzz(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }
  function meterCls(p) { return p >= 70 ? "g" : p >= 40 ? "" : p > 0 ? "w" : "b"; }

  /* ---------- připomínka do kalendáře ---------- */
  function nextRun() {
    var t = (S.remind.time || "19:00").split(":");
    var d = new Date();
    d.setHours(+t[0] || 19, +t[1] || 0, 0, 0);
    if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
    return d;
  }
  function stamp(d, utc) {
    var f = utc
      ? [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes()]
      : [d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes()];
    return f[0] + pad(f[1]) + pad(f[2]) + "T" + pad(f[3]) + pad(f[4]) + "00" + (utc ? "Z" : "");
  }
  function icsEscape(s) { return String(s).replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n"); }
  function fold(line) {
    if (line.length <= 74) return line;
    var out = line.slice(0, 74), rest = line.slice(74);
    while (rest.length > 73) { out += "\r\n " + rest.slice(0, 73); rest = rest.slice(73); }
    return out + "\r\n " + rest;
  }
  function evTitle() { return T("ev_title"); }
  function evDesc() { return T("ev_desc", APP_URL); }
  function buildIcs() {
    var start = nextRun(), end = new Date(start.getTime() + 20 * 6e4);
    var lines = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Auditni trenazer IIA//CS", "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH", "BEGIN:VEVENT",
      "UID:" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2) + "@iia-trenazer",
      "DTSTAMP:" + stamp(new Date(), true),
      "DTSTART:" + stamp(start, false),          // plovoucí čas = místní zóna zařízení
      "DTEND:" + stamp(end, false),
      "RRULE:FREQ=DAILY;INTERVAL=" + (S.remind.freq || 3),
      "SUMMARY:" + icsEscape(evTitle()),
      "DESCRIPTION:" + icsEscape(evDesc()),
      "URL:" + APP_URL,
      "TRANSP:TRANSPARENT",
      "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + icsEscape(evTitle()), "TRIGGER:PT0S", "END:VALARM",
      "END:VEVENT", "END:VCALENDAR"
    ];
    return lines.map(fold).join("\r\n") + "\r\n";
  }
  function gcalUrl() {
    var start = nextRun(), end = new Date(start.getTime() + 20 * 6e4), tz = "";
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) {}
    var p = ["action=TEMPLATE",
      "text=" + encodeURIComponent(evTitle()),
      "dates=" + stamp(start, false) + "/" + stamp(end, false),
      "details=" + encodeURIComponent(evDesc()),
      "recur=" + encodeURIComponent("RRULE:FREQ=DAILY;INTERVAL=" + (S.remind.freq || 3)),
      "crm=AVAILABLE"];
    if (tz) p.push("ctz=" + encodeURIComponent(tz));
    return "https://calendar.google.com/calendar/render?" + p.join("&");
  }

  /* ---------- vykreslení ---------- */
  function paintStatic() {
    [].forEach.call(document.querySelectorAll("[data-t]"), function (n) {
      n.textContent = T(n.dataset.t);
    });
    [].forEach.call(document.querySelectorAll("[data-t-aria]"), function (n) {
      n.setAttribute("aria-label", T(n.dataset.tAria));
    });
    el("btnLang").textContent = U.lang_other;
    el("btnLang").setAttribute("aria-label", U.lang_switch);
  }
  function paintHeader() {
    var L = level();
    el("lvlName").textContent = L.name;
    el("lvlXp").textContent = S.xp + " XP";
    el("xpFill").style.width = (L.to ? Math.min(100, (S.xp - L.from) / (L.to - L.from) * 100) : 100) + "%";
    el("streak").textContent = U.days(S.streak);
  }
  function paintHome() {
    var d = today();
    if (S.daily.d !== d) S.daily = { d: d, n: 0 };
    var done = Math.min(S.daily.n, S.goal);
    el("ringNum").textContent = S.daily.n;
    el("ringDen").textContent = "/" + S.goal;
    el("ringFill").setAttribute("stroke-dashoffset", String(226 - 226 * (done / S.goal)));
    el("ringFill").setAttribute("stroke", S.daily.n >= S.goal ? "var(--ok)" : "var(--accent)");
    el("todayTitle").textContent = S.daily.n >= S.goal ? T("today_done") : T("today_title");
    el("todayText").textContent = S.daily.n >= S.goal ? T("today_text_done") : T("today_text", S.goal - S.daily.n);

    el("cDaily").textContent = T("c_due", dueCount(QS.map(function (q) { return q.id; })));
    el("cMist").textContent = T("c_pcs", mistakeIds().length);
    el("cOpen").textContent = T("c_pcs", QS.filter(function (q) { return q.t === "open"; }).length);

    el("tOk").textContent = S.tot.ok;
    el("tPart").textContent = S.tot.part;
    el("tBad").textContent = S.tot.bad;
    el("totSeen").textContent = T("seen_of", Object.keys(S.q).length, QS.length);

    var weak = D.areas.map(function (a) {
      var ids = areaQs(a.id);
      return { a: a, m: mastery(ids), seen: ids.filter(function (i) { return S.q[i]; }).length };
    }).filter(function (x) { return x.seen > 0 && x.m < 70; })
      .sort(function (x, y) { return x.m - y.m; }).slice(0, 4);
    el("weakSec").hidden = weak.length === 0;
    el("weakList").innerHTML = weak.map(function (x) {
      return '<button class="weak-row" data-area="' + x.a.id + '"><span class="n">' + esc(x.a.name) + '</span>' +
             '<span class="v">' + x.m + ' %</span></button>';
    }).join("");
    bindAreas(el("weakList"));
  }
  function bindAreas(root) {
    [].forEach.call(root.querySelectorAll("[data-area]"), function (b) {
      b.addEventListener("click", function () {
        var a = areaById[b.dataset.area];
        startQuiz("area", a.id, a.name);
      });
    });
  }
  function paintTrain() {
    el("cAll").textContent = T("c_q", QS.length);
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
    bindAreas(el("areaList"));
  }
  function paintProg() {
    el("domProg").innerHTML = D.domains.map(function (dom) {
      var ids = domQs(dom.id); if (!ids.length) return "";
      var m = mastery(ids), seen = ids.filter(function (i) { return S.q[i]; }).length;
      var name = dom.num === "★" ? dom.name : T("dom_prefix", dom.num, dom.name);
      return '<div class="area" style="cursor:default">' +
        '<span class="area-n">' + esc(name) + '</span>' +
        '<span class="area-p">' + m + ' %</span>' +
        '<span class="meter ' + meterCls(m) + '"><i style="width:' + m + '%"></i></span>' +
        '<span class="area-p" style="grid-column:1/-1; text-align:left; margin-top:4px">' +
        esc(T("seen_domain", seen, ids.length)) + '</span></div>';
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
    el("actList").innerHTML = rows || '<div class="empty">' + esc(T("no_activity")) + '</div>';
  }
  function paintSettings() {
    segSet("segLang", "lang", LANG);
    segSet("segTheme", "theme", S.theme || "");
    segSet("segGoal", "goal", String(S.goal || 10));
    el("aboutNote").innerHTML = T("about", esc(D.meta.standard), QS.length);
  }
  function segSet(id, attr, val) {
    [].forEach.call(el(id).children, function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-" + attr) === val));
    });
  }
  function fmtDate(d) {
    try { return d.toLocaleDateString(LANG === "en" ? "en-GB" : "cs-CZ", { day: "numeric", month: "short" }); }
    catch (e) { return pad(d.getDate()) + ". " + pad(d.getMonth() + 1) + "."; }
  }
  function paintRemind() {
    var f = String(S.remind.freq || 3);
    el("remFreq").value = f;
    el("remTime").value = S.remind.time || "19:00";
    [].forEach.call(el("remFreq").options, function (o) { o.textContent = T("r_f" + o.value); });
    var d = nextRun();
    el("remNote").textContent = T("r_note", fmtDate(d),
      pad(d.getHours()) + ":" + pad(d.getMinutes()),
      T("r_every" + f));
  }
  function paintBadges() {
    el("badgeCount").textContent = S.badges.length + " / " + BADGE_IDS.length;
    el("badgeList").innerHTML = BADGE_IDS.map(function (id) {
      var b = U.badge[id], on = S.badges.indexOf(id) >= 0;
      return '<div class="badge' + (on ? " on" : "") + '"><div class="bi">' + BADGE_ICON[id] + '</div><b>' +
        esc(b[0]) + '</b><span>' + esc(b[1]) + '</span></div>';
    }).join("");
  }
  function paintAll() {
    paintStatic(); paintHeader(); paintHome(); paintTrain(); paintProg(); paintRemind(); paintBadges(); paintSettings();
  }

  /* ---------- navigace ---------- */
  var SCREENS = { home: "s-home", train: "s-train", prog: "s-prog", badges: "s-badges", set: "s-set", quiz: "s-quiz" };
  function show(name) {
    for (var k in SCREENS) el(SCREENS[k]).hidden = (k !== name);
    [].forEach.call(document.querySelectorAll(".tab"), function (t) {
      t.setAttribute("aria-current", String(t.dataset.tab === name));
    });
    if (name !== "quiz") { Q = null; paintAll(); }
    document.querySelector("main").scrollTop = 0;
  }

  /* ---------- start ---------- */
  load();
  setLang(S.lang || detectLang());
  if (S.theme) document.documentElement.setAttribute("data-theme", S.theme);
  paintAll();
  show("home");

  el("btnLang").addEventListener("click", function () {
    if (Q && !el("s-quiz").hidden && !confirm(T("a_leave"))) return;
    S.lang = (LANG === "cs") ? "en" : "cs";
    setLang(S.lang); save();
    show("home");
  });
  [].forEach.call(document.querySelectorAll(".tab"), function (t) {
    t.addEventListener("click", function () {
      if (Q && !el("s-quiz").hidden && !confirm(T("a_leave"))) return;
      show(t.dataset.tab);
    });
  });
  [].forEach.call(document.querySelectorAll("[data-go]"), function (b) {
    b.addEventListener("click", function () {
      var g = b.dataset.go;
      var key = { daily: "m_daily", mistakes: "m_mist", open: "m_open", all: "m_all" }[g];
      startQuiz(g === "all" ? "daily" : g, null, T(key));
    });
  });
  el("quizExit").addEventListener("click", function () {
    if (Q && Q.i < Q.queue.length && !confirm(T("a_exit"))) return;
    show("home");
  });
  function applyTheme(t) {
    if (t) document.documentElement.setAttribute("data-theme", t);
    else document.documentElement.removeAttribute("data-theme");
  }
  [].forEach.call(el("segTheme").children, function (b) {
    b.addEventListener("click", function () {
      S.theme = b.getAttribute("data-theme");
      applyTheme(S.theme); save(); segSet("segTheme", "theme", S.theme);
    });
  });
  [].forEach.call(el("segGoal").children, function (b) {
    b.addEventListener("click", function () {
      S.goal = +b.getAttribute("data-goal");
      save(); segSet("segGoal", "goal", String(S.goal)); paintHome();
    });
  });
  [].forEach.call(el("segLang").children, function (b) {
    b.addEventListener("click", function () {
      var l = b.getAttribute("data-lang");
      if (l === LANG) return;
      S.lang = l; setLang(l); save(); paintAll();
    });
  });
  el("btnReset").addEventListener("click", function () {
    if (!confirm(T("a_reset"))) return;
    var lang = S.lang, theme = S.theme;
    S = blank(); S.lang = lang; S.theme = theme;
    save(); paintAll(); show("home");
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
        setLang(S.lang || LANG); save(); paintAll(); alert(T("a_restored"));
      } catch (err) { alert(T("a_badfile")); }
    };
    r.readAsText(f);
    e.target.value = "";
  });
  el("remFreq").addEventListener("change", function () { S.remind.freq = +this.value; save(); paintRemind(); });
  el("remTime").addEventListener("change", function () { S.remind.time = this.value || "19:00"; save(); paintRemind(); });
  el("btnGCal").addEventListener("click", function () { window.open(gcalUrl(), "_blank", "noopener"); });
  el("btnIcs").addEventListener("click", function () {
    var blob = new Blob([buildIcs()], { type: "text/calendar;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = "pripominka-iia.ics"; a.rel = "noopener";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  });
})();
