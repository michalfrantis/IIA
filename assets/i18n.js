/* Texty rozhraní / UI strings. {0} = doplněná hodnota. */
const IIA_UI = {
  cs: {
    lang_other: "EN", lang_switch: "Přepnout na angličtinu",
    tab_home: "Domů", tab_train: "Trénink", tab_prog: "Pokrok", tab_badges: "Odznaky", tab_set: "Nastavení",
    eyebrow_set: "Nastavení", h_set: "Aplikace a data",
    h_lang: "Jazyk", h_look: "Vzhled", th_sys: "Systém", th_light: "Světlý", th_dark: "Tmavý",
    h_goal: "Denní cíl", goal_note: "Kolik otázek denně drží sérii. Míň než deset zvládneš cestou do práce.",

    today_title: "Dnešní dávka", today_done: "Denní cíl splněn",
    today_text: "{0} otázek do splnění denního cíle.",
    today_text_done: "Série drží. Můžeš pokračovat, XP se počítá dál.",
    m_daily: "Denní dávka", m_daily_sub: "Mix podle toho, co je na řadě",
    m_mist: "Opakovat chyby", m_mist_sub: "Jen to, co jsi nevěděl",
    m_open: "Otevřené kartičky", m_open_sub: "Vysvětli vlastními slovy, pak se oznámkuj",
    m_all: "Napříč vším", m_all_sub: "Náhodný mix ze všech oblastí",
    c_due: "{0} na řadě", c_pcs: "{0} ks", c_q: "{0} otázek",

    h_weak: "Nejslabší místa", h_mastery: "zvládnutí", h_total: "Celkem",
    t_ok: "✅ správně", t_part: "⚠️ částečně", t_bad: "❌ doplnit",
    seen_of: "{0} / {1} otázek viděno",

    eyebrow_train: "Vyber oblast", h_areas: "15 principů, 5 domén",
    eyebrow_prog: "Pokrok", h_domains: "Zvládnutí domén", h_byrep: "podle opakování",
    h_activity: "Aktivita", h_14days: "posledních 14 dní",
    dom_prefix: "Doména {0} — {1}", seen_domain: "{0} z {1} otázek viděno",
    no_activity: "Zatím žádná aktivita.",

    h_remind: "Připomínka", r_freq: "Jak často", r_time: "V kolik",
    r_f1: "Každý den", r_f2: "Každé 2 dny", r_f3: "Každé 3 dny", r_f7: "Jednou týdně",
    r_gcal: "Přidat do Google Kalendáře", r_ics: "Stáhnout .ics (Apple Kalendář)",
    r_note: "První zvonění {0} v {1}, pak {2}. Kalendář nepozná, jestli jsi cvičil — zvoní podle plánu, ne podle nečinnosti.",
    r_every1: "každý den", r_every2: "každé 2 dny", r_every3: "každé 3 dny", r_every7: "jednou týdně",
    ev_title: "Trenažér IIA — 10 otázek",
    ev_desc: "Denní dávka z Globálních standardů IIA 2024: {0}\nKdyž nemáš čas, dej aspoň režim Opakovat chyby — je kratší a míří na to, co ti nesedí.",

    h_data: "Data", b_export: "Zálohovat", b_import: "Obnovit ze zálohy",
    b_theme: "Přepnout motiv", b_reset: "Vymazat pokrok",
    about: "{0} · {1} otázek · data jen v tomto zařízení.<br>Studijní parafráze standardů, ne oficiální text IIA — čísla standardů si před zkouškou ověř v oficiálním vydání.",

    eyebrow_badges: "Sbírka", h_badges: "Odznaky",

    q_exit: "Ukončit test", q_reveal: "Ukázat vzorovou odpověď",
    sg_bad: "Nevěděl", sg_part: "Částečně", sg_ok: "Věděl",
    v_ok: "✅ Správně", v_part: "⚠️ Částečně", v_bad: "❌ Doplnit",
    q_next: "Další otázka", q_finish: "Vyhodnotit",
    r_done: "{0} hotov", r_stats: "{0}× ✅ · {1}× ⚠️ · {2}× ❌  |  +{3} XP",
    r_combo: " · nejdelší série {0}", r_again: "Ještě jednou", r_home: "Domů",
    r_missed: "Tyhle se vrátí v režimu <strong>Opakovat chyby</strong>.",
    r_badge: "Nový odznak: {0}",
    cross: "Průřezové", combo: "série ×{0}",

    a_nothing: "Tady teď není co opakovat. Zkus jiný režim.",
    a_exit: "Ukončit test? Odpovědi zůstanou započítané.",
    a_leave: "Ukončit rozdělaný test?",
    a_reset: "Opravdu vymazat veškerý pokrok, XP i odznaky?",
    a_restored: "Záloha obnovena.",
    a_badfile: "Soubor nejde načíst — není to záloha z této aplikace.",
    days: function (n) { return n === 1 ? "1 den" : (n >= 2 && n <= 4 ? n + " dny" : n + " dní"); },

    lvl: ["Kandidát", "Junior auditor", "Auditor", "Senior auditor", "Vedoucí zakázky",
          "Manažer auditu", "Vedoucí interního auditu", "Mistr standardů"],
    badge: {
      start:  ["První zakázka", "Dokončený první test"],
      ok50:   ["Padesátka", "50 správných odpovědí"],
      ok200:  ["Dvě stě", "200 správných odpovědí"],
      ok500:  ["Pět set", "500 správných odpovědí"],
      str3:   ["Rozjezd", "Série 3 dny v řadě"],
      str7:   ["Týden v kuse", "Série 7 dní v řadě"],
      str30:  ["Měsíc disciplíny", "Série 30 dní v řadě"],
      clean:  ["Bez poskvrny", "Test 10 z 10"],
      allarea:["Celý rejstřík", "Otázka z každé oblasti"],
      domain: ["Doména zvládnuta", "Doména na 80 %"],
      fixed25:["Práce na chybách", "25 dříve chybných otázek zvládnuto"],
      open25: ["Vlastními slovy", "25 otevřených kartiček"],
      night:  ["Noční směna", "Trénink mezi 23:00 a 4:00"],
      full:   ["Kompletista", "Každá otázka alespoň jednou"]
    }
  },

  en: {
    lang_other: "CS", lang_switch: "Switch to Czech",
    tab_home: "Home", tab_train: "Practice", tab_prog: "Progress", tab_badges: "Badges", tab_set: "Settings",
    eyebrow_set: "Settings", h_set: "App and data",
    h_lang: "Language", h_look: "Appearance", th_sys: "System", th_light: "Light", th_dark: "Dark",
    h_goal: "Daily goal", goal_note: "How many questions a day keep the streak alive. Under ten fits into a commute.",

    today_title: "Today's set", today_done: "Daily goal met",
    today_text: "{0} questions to hit today's goal.",
    today_text_done: "Streak intact. Keep going — XP still counts.",
    m_daily: "Today's set", m_daily_sub: "A mix of whatever is due",
    m_mist: "Redo mistakes", m_mist_sub: "Only what you got wrong",
    m_open: "Open cards", m_open_sub: "Explain it in your own words, then grade yourself",
    m_all: "Everything", m_all_sub: "Random mix from all areas",
    c_due: "{0} due", c_pcs: "{0} cards", c_q: "{0} questions",

    h_weak: "Weakest areas", h_mastery: "mastery", h_total: "Overall",
    t_ok: "✅ correct", t_part: "⚠️ partial", t_bad: "❌ missed",
    seen_of: "{0} / {1} questions seen",

    eyebrow_train: "Pick an area", h_areas: "15 principles, 5 domains",
    eyebrow_prog: "Progress", h_domains: "Mastery by domain", h_byrep: "from repetition",
    h_activity: "Activity", h_14days: "last 14 days",
    dom_prefix: "Domain {0} — {1}", seen_domain: "{0} of {1} questions seen",
    no_activity: "No activity yet.",

    h_remind: "Reminder", r_freq: "How often", r_time: "At",
    r_f1: "Every day", r_f2: "Every 2 days", r_f3: "Every 3 days", r_f7: "Once a week",
    r_gcal: "Add to Google Calendar", r_ics: "Download .ics (Apple Calendar)",
    r_note: "First reminder {0} at {1}, then {2}. The calendar cannot tell whether you practised — it rings on schedule, not on inactivity.",
    r_every1: "every day", r_every2: "every 2 days", r_every3: "every 3 days", r_every7: "once a week",
    ev_title: "IIA drill — 10 questions",
    ev_desc: "Daily set from the Global Internal Audit Standards 2024: {0}\nShort on time? Run Redo mistakes — it is shorter and targets what you keep missing.",

    h_data: "Data", b_export: "Back up", b_import: "Restore backup",
    b_theme: "Switch theme", b_reset: "Erase progress",
    about: "{0} · {1} questions · data stays on this device only.<br>Study paraphrases of the Standards, not the official IIA text — verify standard numbers against the official release before the exam.",

    eyebrow_badges: "Collection", h_badges: "Badges",

    q_exit: "End test", q_reveal: "Show model answer",
    sg_bad: "Missed", sg_part: "Partial", sg_ok: "Knew it",
    v_ok: "✅ Correct", v_part: "⚠️ Partial", v_bad: "❌ Review",
    q_next: "Next question", q_finish: "See results",
    r_done: "{0} complete", r_stats: "{0}× ✅ · {1}× ⚠️ · {2}× ❌  |  +{3} XP",
    r_combo: " · longest streak {0}", r_again: "Again", r_home: "Home",
    r_missed: "These come back in <strong>Redo mistakes</strong>.",
    r_badge: "New badge: {0}",
    cross: "Cross-cutting", combo: "streak ×{0}",

    a_nothing: "Nothing to repeat here right now. Try another mode.",
    a_exit: "End the test? Your answers still count.",
    a_leave: "Leave the test in progress?",
    a_reset: "Really erase all progress, XP and badges?",
    a_restored: "Backup restored.",
    a_badfile: "Cannot read that file — it is not a backup from this app.",
    days: function (n) { return n === 1 ? "1 day" : n + " days"; },

    lvl: ["Candidate", "Junior auditor", "Auditor", "Senior auditor", "Engagement lead",
          "Audit manager", "Chief audit executive", "Standards master"],
    badge: {
      start:  ["First engagement", "Completed your first test"],
      ok50:   ["Fifty", "50 correct answers"],
      ok200:  ["Two hundred", "200 correct answers"],
      ok500:  ["Five hundred", "500 correct answers"],
      str3:   ["Warm-up", "3-day streak"],
      str7:   ["Full week", "7-day streak"],
      str30:  ["A month of discipline", "30-day streak"],
      clean:  ["Spotless", "10 out of 10 on a test"],
      allarea:["Full register", "A question from every area"],
      domain: ["Domain mastered", "A domain at 80 %"],
      fixed25:["Working the misses", "25 previously missed questions mastered"],
      open25: ["In your own words", "25 open cards"],
      night:  ["Night shift", "Practised between 23:00 and 04:00"],
      full:   ["Completionist", "Every question at least once"]
    }
  }
};
if (typeof module !== "undefined") { module.exports = IIA_UI; }
