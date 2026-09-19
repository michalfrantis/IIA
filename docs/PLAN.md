# Plán: mikrosite pro přípravu na zkoušky interního auditu (GIAS 2024)

## 1. Cíl

Jedna stránka, kterou otevřu na mobilu, dám na plochu a za 5 minut denně se
zkouším z Globálních standardů interního auditu IIA 2024 (5 domén / 15 principů).
Žádný účet, žádný server, žádná instalace — progres zůstává v telefonu.

## 2. Rozsah v1 (to, co je hotové)

| Oblast | Řešení |
|---|---|
| Zkoušení | Testové otázky (1 správná ze 3–4) + otevřené kartičky se vzorovou odpovědí a sebehodnocením ❌ / ⚠️ / ✅ |
| Obsah | ~130 položek pokrývajících IPPF, Účel IA, principy P1–P15 a průřezová témata, každá s odkazem na konkrétní standard (St. X.Y) |
| Gamifikace | XP, úrovně s auditorskými tituly, denní série (streak), kombo za sérii správných, denní cíl, odznaky |
| Sledování pokroku | Zvládnutí (mastery) po principech i doménách, počty ✅/⚠️/❌, nejslabší oblasti |
| „Zkus co jsem nevěděl" | Opakování podle chybovosti — každá otázka má krabičku 0–5 a datum splatnosti (Leitnerův systém), režim **Opakovat chyby** tahá nejdřív to, co jsem zkazil |
| Běh na mobilu | Statická stránka, PWA (manifest + service worker) → přidat na plochu, funguje offline |
| Data | `localStorage`, export/import JSON, reset |

## 3. Architektura

```
index.html        shell aplikace (obrazovky, žádný build step)
assets/style.css  design tokeny, light/dark, mobile-first
assets/questions.js  banka otázek (globální IIA_DATA) — načteno <script>, funguje i z file://
assets/app.js     stav, router, testovací engine, gamifikace, opakování
manifest.webmanifest + sw.js + icons/   PWA vrstva
```

Žádný framework ani závislosti. Vše se otevře i dvojklikem na `index.html`
(proto banka otázek jako `.js`, ne `fetch` na `.json` — ten by z `file://` selhal).

## 4. Algoritmus opakování (Leitner, 6 krabiček)

| Krabička | Další opakování za |
|---|---|
| 0 | ihned (ještě dnes) |
| 1 | 1 den |
| 2 | 3 dny |
| 3 | 7 dní |
| 4 | 16 dní |
| 5 | 35 dní |

✅ posouvá o krabičku výš, ⚠️ nechá na místě, ❌ vrací na 0.
Zvládnutí principu = průměr krabiček jeho otázek vůči maximu.
Otázka se 3+ chybami je „problémová" a má v režimu chyb přednost.

## 5. Gamifikace

- **XP:** ✅ 10 + bonus za obtížnost, ⚠️ 5, ❌ 2 (za pokus). Kombo od 3 správných v řadě přidává +50 %.
- **Úrovně:** Junior auditor → Auditor → Senior auditor → Vedoucí zakázky → Manažer auditu → VIA (CAE) → Zkušební komise.
- **Denní série:** počítá se každý den, kdy splním denní cíl (výchozí 10 otázek).
- **Odznaky:** první test, 50/200/500 správných, série 3/7/30 dní, čistý test 10/10, zvládnutá doména, projití všech 15 principů.

## 6. Nasazení

1. `git push` na branch → GitHub Actions publikuje na GitHub Pages
   (jednorázově: Settings → Pages → Source: **GitHub Actions**).
2. Na mobilu otevřít URL → Sdílet → **Přidat na plochu**.
3. Alternativa bez Pages: stáhnout repo a otevřít `index.html` v prohlížeči.

## 7. Co v v1 záměrně není

- Hodnocení otevřených odpovědí strojem (bez serveru to nejde poctivě → sebehodnocení).
- Synchronizace mezi zařízeními (stačí export/import JSON).
- Plný text standardů (autorsky chráněný — appka odkazuje čísly standardů).

## 8. Kam dál (v2 nápady)

- Režim „zkouška": 40 otázek na čas, hodnocení v %, certifikát na obrazovku.
- Tematické požadavky (TR) jako samostatná doména, jak IIA vydává další.
- Vlastní otázky přidané z appky (uložené do localStorage).
- Graf denní aktivity za 8 týdnů.

## 9. Upozornění k obsahu

Otázky jsou vlastní studijní parafráze podle struktury Globálních standardů
interního auditu IIA (vydány 9. 1. 2024, účinné od 9. 1. 2025). Nejde o oficiální
text IIA ani o oficiální zkouškové otázky — před zkouškou si klíčová čísla
standardů ověř proti aktuálnímu oficiálnímu vydání (zejména Tematické požadavky,
které IIA vydává průběžně).
