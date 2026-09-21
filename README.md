# Auditní trenažér IIA / IIA Audit Drill

Responzivní mikrosite pro přípravu na zkoušky interního auditu podle
**Globálních standardů interního auditu IIA 2024** (5 domén / 15 principů / 52 standardů).
Otevře se na mobilu, funguje offline, pokrok zůstává v telefonu.

**Česky i anglicky.** Zkouška se skládá v angličtině, proto má aplikace plnou anglickou
verzi — otázky, vysvětlení i rozhraní. Anglická banka není překlad češtiny: používá
originální terminologii standardů (*mandate, charter, conformance, due professional care,
engagement, condition / criteria / cause / effect / significance*). Přepínač **CS / EN**
je vpravo nahoře; jazyk se pozná i automaticky podle nastavení prohlížeče.
Obě verze sdílejí id otázek, takže **přepnutím jazyka o pokrok nepřijdeš**.

## Co umí

- **170 otázek v každém jazyce** — 127 testových (jedna správná z možností, s vysvětlením
  a číslem standardu) a 43 otevřených kartiček se vzorovou odpovědí a sebehodnocením ❌ / ⚠️ / ✅.
- **Opakování chyb** — každá otázka má krabičku 0–5 (Leitnerův systém, intervaly 0 / 1 / 3 / 7 / 16 / 35 dní).
  ✅ posune výš, ⚠️ nechá na místě, ❌ vrátí na začátek. Režim *Opakovat chyby* tahá nejdřív to, co jsi nevěděl.
- **Gamifikace** — XP podle obtížnosti, kombo za sérii správných, 8 úrovní od Kandidáta po Mistra standardů,
  denní cíl, denní série a 14 odznaků.
- **Pokrok** — zvládnutí po principech i doménách, nejslabší místa, aktivita za 14 dní.
- **Nastavení** — samostatná záložka: jazyk, vzhled (systém / světlý / tmavý),
  denní cíl (5 / 10 / 15 / 20 otázek), připomínka a správa dat.
- **Připomínka** — v záložce *Nastavení* si nastavíš interval (1 / 2 / 3 dny / týden) a čas a jedním tlačítkem
  založíš opakující se událost v Google Kalendáři, nebo stáhneš `.ics` pro Apple Kalendář.
  Pozor: kalendář nepozná, jestli jsi cvičil — zvoní podle plánu, ne podle nečinnosti.
- **Data** — jen `localStorage`, plus záloha a obnova do JSON. Žádný účet, žádný server.

## Jak to spustit

**Na telefonu (doporučeno).** Po nasazení na GitHub Pages otevři URL a dej *Sdílet → Přidat na plochu*.
Aplikace pak běží na celou obrazovku i bez signálu.

Jednorázové zapnutí Pages: **Settings → Pages → Source: GitHub Actions**.
Workflow `.github/workflows/pages.yml` publikuje repozitář při každém pushi.

**Bez Pages.** Stáhni repozitář a otevři `index.html` v prohlížeči — funguje i z `file://`
(banka otázek je `.js`, ne `fetch` na JSON).

## Struktura

```
index.html              obrazovky aplikace
assets/style.css        design tokeny, světlý i tmavý motiv
assets/i18n.js          texty rozhraní (IIA_UI: cs, en)
assets/questions.cs.js  česká banka otázek (IIA_DATA_CS)
assets/questions.en.js  anglická banka otázek (IIA_DATA_EN)
assets/app.js           stav, opakování, gamifikace
manifest.webmanifest    PWA
sw.js                   offline cache — při změně obsahu zvyš verzi v proměnné CACHE
docs/PLAN.md            plán, rozsah v1 a nápady na v2
```

Žádný build step, žádné závislosti.

## Přidání vlastních otázek

Do pole `questions` v `assets/questions.cs.js` **i** `assets/questions.en.js` — stejné `id`,
stejné pořadí možností a stejný index správné odpovědi:

```js
{ id:"p14-19", a:"P14", t:"mcq", d:2, r:"St. 14.3",
  q:"Otázka?", o:["a","b","c","d"], c:0, e:"Proč je správně a." }

{ id:"p14-20", a:"P14", t:"open", d:3, r:"St. 14.6",
  q:"Otázka k vysvětlení?", m:"• Vzorová odpověď v odrážkách" }
```

`a` = kód oblasti (P0, PU, P1–P15, PX), `d` = obtížnost 1–3, `r` = odkaz na standard.
Po přidání zvyš `CACHE` v `sw.js`, ať se offline kopie obnoví.

## Poznámka k obsahu

Otázky jsou vlastní studijní parafráze podle struktury Globálních standardů interního auditu
(vydány 9. 1. 2024, účinné od 9. 1. 2025). Nejde o oficiální text IIA ani o oficiální zkouškové
otázky. Čísla standardů a zejména Tematické požadavky, které IIA vydává průběžně,
si před zkouškou ověř proti aktuálnímu oficiálnímu vydání.
