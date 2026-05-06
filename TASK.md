# TASK.md — proces pracy

## Tło

Trzy zadania z `README.md` (refactor + i18n, BFS najkrótszej ścieżki, wyszukiwanie na żywo) zrealizowałem na `main`, każde osobnym commitem. Po zamknięciu zakresu specyfikacji zrobiłem przegląd jakości — prześledziłem aplikację pod kątem standardów rynkowych narzędzi grafowych, dostępności, bezpieczeństwa zależności, zgodności wizualizacji z algorytmem. Każdy znaleziony obszar wylądował na osobnym branchu, żeby recenzent mógł czytać je niezależnie.

Wokół Claude Code mam własną nakładkę: profile workflow (`analiza`, `arch`, `review`, `ux`, `deploy`, `compliance`, `tests`, `refactor`, `docs`, `security`, `perf`), hooki quality-gate odpalane po każdym commicie i toolchain MCP (Gemini, Perplexity, semantic skills search). Każdy profil ładuje skoncentrowany zestaw skill'i (np. `/workflow review` wciąga `/security` + `/performance` + `/vue` + `/nuxt`) i wymusza explicit decyzje przed każdym commitem. Stąd w repo struktury `plans/` i style commit message'y — to wynik tej automatyzacji, nie ręcznego rytuału. Wzmianka tylko po to, by łatwiej było zrozumieć, czemu commit messages są tak rozbudowane, a każda zmiana cytuje dokładny standard.

## Narzędzia

Claude Code (Opus 4.7, 1M kontekst) jako wsparcie — pisanie boilerplate'u, generowanie testów, code review pod dyktowaną listą reguł, weryfikacja własnych twierdzeń przez `git diff` / `grep` / `wc` na moją prośbę. Decyzje projektowe (algorytm, UX, scope, kolejność commitów) i akceptacja każdego diffa po mojej stronie — to ja podpisuję się pod ostatecznym wynikiem.

Perplexity (Sonar Pro) wywoływane przez Claude Code do weryfikacji standardów rynkowych narzędzi grafowych (Neo4j Bloom, Linkurious, Cytoscape, Gephi, Obsidian, yFiles, Kumu) i Nielsen / WCAG / WAI-ARIA APG. Każdy odsył do "standardu rynkowego" w treści commitu poparty cytatem z tej weryfikacji.

`npm audit` na każdym branchu, `vitest run` przed każdym commitem, `vite build` jako smoke test po większych zmianach. IntelliJ IDEA do inspekcji kodu, DevTools do runtime checku UI.

## Workflow

Po zamknięciu trzech zadań na `main` puściłem `/workflow analiza` — pełny skan kodu pod kątem rzeczy, których spec nie wymagał ale recenzent mógłby zauważyć: dostępność, kontrast, klawiatura, semantyka, zachowanie pod nietypowymi inputami. Z tego wyszedł raport P0/P1/P2 i kolejność prac. Każdy obszar trafił na osobny branch z `main` zgodnie z `README.md:131` ("Każde zadanie powinno być commitowane osobno"). Branchy nie merguję — chcę, żeby recenzent czytał je niezależnie.

| Branch | Commitów | Zakres |
|---|---:|---|
| `feat/path-mode-ux` | 1 | Klik w tło canvas i Esc czyszczą wybór w trybie Path (hybrydowo: czyść jeśli coś wybrane, w przeciwnym razie wyjdź — analogicznie do dwustopniowego Esc w polu wyszukiwania). |
| `feat/a11y-p0` | 15 | WCAG 2.2 P0 + większość P1: kontrast `#666`/`#555` → AA, sync `<html lang>` z locale, klawiaturowa aktywacja wierszy w `SourcesView`, `aria-label` na close-btn, ARIA disclosure na kartach źródeł, `aria-current` + focus-visible na zakładkach, target size ≥ 28 px, skip-link + landmarki `<main>`/`<aside>`, `prefers-reduced-motion`, responsywność (panel collapse <1280 px, overlay <768 px), empty-state dla pustego search'a, dismissable no-path toast, hint `/` shortcut, sr-only announce'r ścieżki BFS. |
| `feat/a11y-graph-alternative` | 1 | Lista węzłów nawigowalna klawiaturą + `role="application"` na canvas, alternatywa dla osób korzystających ze screen readera. Domyka WCAG 1.1.1 / 2.1.1 / 4.1.2 dla głównego widoku. |
| `feat/path-particle-direction` | 1 | Cząsteczki na linkach ścieżki płyną zgodnie z BFS (start → end), nawet gdy oryginalna krawędź była zadeklarowana odwrotnie. |
| `chore/security-and-bench` | 2 | (a) `vite ^5.4.0 → ^7.3.2` i `@vitejs/plugin-vue ^5.1.0 → ^6.0.6` — patch GHSA-4w7w-66w2-5vf9 i GHSA-67mh-4wv8-2f99. (b) `bench/bfs.bench.js` — empiryczna weryfikacja O(V+E). |
| `fix/i18n-app-title-key` | 1 | Pre-existing bug: `App.vue:4` woła `t('app.title')`, klucz nie istniał w żadnym locale → header renderował literal "app.title". |
| `docs/task-md` | 1 | Niniejszy plik. |

## Konkretne znaleziska i decyzje

### Algorytm BFS — ścieżka idzie pod prąd strzałek

Klikając po grafie zauważyłem, że niektóre wyznaczone ścieżki płyną wizualnie wbrew strzałkom na krawędziach. Pierwszy odruch: bug. Po sprawdzeniu — algorytm jest poprawny, jest to konsekwencja `README.md:90` ("BFS przeszukuje graf jako **nieskierowany**"). `buildAdjacency` w `src/utils/graph.js:5-17` świadomie dodaje obie strony krawędzi. Konflikt jest między danymi (krawędź skierowana — semantyka relacji "feeds", "produces") a wizualizacją (force-graph przypina cząsteczki do oryginalnego `source → target`).

Trzy opcje: A — zostawić, zgodne ze spec; B — BFS skierowany, łamie spec; C — zostawić nieskierowany, ale odwrócić cząsteczki na linkach ścieżki. Wybrałem **C**. Implementacja: `getLinkParticleSpeed(link)` w `Graph.vue` zwraca ujemną prędkość, gdy `link.target` jest wcześniej na ścieżce niż `link.source`; force-graph honoruje znak i odwraca strumień. Algorytm dalej O(V+E), tylko renderer dostaje spójną wizualizację.

### Zachowanie w trybie Path — co ma robić Esc i klik w tło

Po implementacji BFS dotarło do mnie, że nie ma wyjścia awaryjnego — w trybie Path Esc jest jedynym sposobem ucieczki, a klik w tło canvas nic nie robi. Zacząłem od trzech wariantów Esc (A: wyjdź, B: czyść wybór, C: hybrydowo). Po analizie i weryfikacji u Perplexity konwencji w Neo4j Bloom, Linkurious, Cytoscape, Gephi, Obsidian, yFiles i Kumu — ~90% narzędzi traktuje klik w tło jako "emergency exit" zgodnie z Nielsen #3 (User Control and Freedom). Jedyne kontrofszanse to przypadki kosztownych obliczeń (sekundowe pathfindingi po stronie serwera) — u nas BFS w mikrosekundach (potwierdzone benchmarkiem), więc obie interakcje (Esc i bg-click) są bezpieczne.

Wybrałem hybrydowy wariant C dla obu — analogiczny do dwustopniowego Esc w polu wyszukiwania (1× czyści, 2× zdejmuje fokus). To samo zachowanie dla obu wejść daje jeden model mentalny: "klik w tło = czyść", "Esc = czyść lub wyjdź".

### WCAG 2.2 — pełny przegląd

Jako frontend developer z doświadczeniem mam nawyk patrzenia na każdy nowy ekran przez pryzmat dostępności. Po zamknięciu specyfikacji puściłem audit całego UI pod Nielsen 10 + WCAG 2.2 AA + konwencje narzędzi grafowych. Lista znalezisk uporządkowana P0/P1/P2 (P0 = niezgodne z WCAG AA, P1 = łamie konwencje rynkowe, P2 = polish):

P0 zaadresowane na `feat/a11y-p0`:
- `<html lang>` był hardcoded "en" w `index.html:2`, mimo że default locale to PL. Screen reader fonologią angielską czytał polski tekst. Sync w `setLocale()` + `main.js`.
- Kontrast `#666` na `#16213e` ≈ 2.8:1, `#555` na `#1a1a2e` ≈ 2.4:1 — fail AA dla tekstu normalnego (4.5:1). Zmiana na `#9aa4b3` ≈ 6.3:1.
- Wiersze tabeli części w `SourcesView` miały `cursor: pointer` ale nie były focusable. `tabindex="0"` + `role="button"` + `aria-pressed` + Enter/Space handler.
- Canvas force-graph nie miał `role` ani `aria-label` — screen reader pomijał cały widok grafu. Dodałem `role="application"` + `aria-label` z licznikiem węzłów/krawędzi i wskazaniem na alternatywną listę.
- Brak alternatywy klawiaturowej dla nawigacji po grafie. Stworzyłem `GraphNodeList.vue` — `<nav><ul><button>` mirrorujący canvas, filtrowany tym samym `matchedSlugs()` co graf, otwierany przyciskiem `☰` w toolbarze.

P1 (większość zaadresowana):
- Brak skip-link i landmarków → dodane `<main>`, `<aside>`, skip-link.
- Brak respektowania `prefers-reduced-motion` → composable `useReducedMotion` + globalne wyłączenie tranzycji + wyłączenie cząsteczek force-graph.
- Brak responsywności (panel locked 800 px, na mobile zjadał graf) → media queries w `style.css`, panel staje się overlay <768 px.
- No-path overlay był blokujący, niedismissable, w centrum canvasu → przeniesiony jako toast pod toolbarem z przyciskiem zamknięcia i konstruktywną wskazówką "spróbuj innych węzłów".
- Empty search bez czytelnego komunikatu → centered overlay "Brak dopasowań dla 'X'" z przyciskiem Clear.
- Skrót `/` nieujawniony → `<kbd>/</kbd>` jako badge w polu wyszukiwania, znika gdy user wpisze cokolwiek.
- Touch targets <24 px (tabs, lang-btn, search-clear) → `min-height: 28px`.
- ARIA disclosure pattern na kartach źródłowych (`aria-expanded` + `aria-controls`).

### Empiryczna weryfikacja O(V+E)

Komentarz w `src/utils/graph.js:25-44` deklaruje O(V+E) — bo BFS używa indexu jako pointera dequeue zamiast `Array.shift()` (który by zdegradował to do O(V²)). Zaufanie ograniczone, więc napisałem benchmark `bench/bfs.bench.js`. Generuje rzadkie grafy (E ≈ 2V) na rozmiarach 16 → 20 000, warm-up JIT, 2 000 wywołań na rozmiar.

```
     V        E      V+E   per_run(µs)   per_(V+E)(ns)
    16       31       47          4.07            86.53
    50       99      149          6.55            43.94
   200      399      599         31.91            53.28
  1000     1999     2999        183.32            61.13
  5000     9999    14999       1308.98            87.27
 20000    39999    59999       8880.03           148.00
```

Per-(V+E) drgnęło 1.7× przy 1 250× wzroście V — sygnatura O(V+E) z minoryzowanymi efektami cache'u L2/L3 na dużych grafach. Kod O(V²) dałby drift ~1 250× w ostatniej kolumnie. Twierdzenie potwierdzone empirycznie. Praktyczny upshot: BFS na obecnych 16 węzłach kończy się w ~4 µs; nawet stress test 20 000 węzłów schodzi pod 9 ms, dobrze poniżej budżetu klatki.

### Vulnerability w toolchainie

Po pierwszym przeglądzie security uruchomiłem `npm audit` na czystym repo. Dwa moderate-severity advisory:
- GHSA-67mh-4wv8-2f99 — `esbuild ≤ 0.24.2` (CORS bypass w dev serverze)
- GHSA-4w7w-66w2-5vf9 / CVE-2026-39365 — `vite ≤ 6.4.1` (path traversal w optimized-deps `.map` handler)

Oba leciały tylko przez devDependencies (dev server, nie production bundle), ale i tak wykonują się przy `npm run dev` — co recenzent zrobi w pierwszym kroku. Bump do `vite ^7.3.2` (najmniejszy major który zamyka oba CVE) i `@vitejs/plugin-vue ^6.0.6` (peer compat). `vitest 4.1.5` zostało — już deklarował `peer: vite ^6 || ^7 || ^8`. Po zmianie: `npm audit` → 0 vulnerabilities, `vite build` → 1.32 s, `vitest run` → 27 / 27 zielono.

### Bug `app.title` — pre-existing, runtime-only

Podczas runtime check w przeglądarce zauważyłem, że nagłówek pokazuje literal "app.title" zamiast nazwy aplikacji. Odsyłka istnieje w `App.vue:4` od commitu `d64b4c1` (i18n landing), ale klucz nigdy nie został dodany do plików locale. Vue-i18n v9 default missing-handler zwraca samą ścieżkę klucza jako string, więc renderowało się literalnie "app.title". Poprawka jednolinijkowa, ale przypomnienie: code review oparty wyłącznie na czytaniu kodu nie wyłapie błędów runtime. Naprawione na `fix/i18n-app-title-key` z wartościami z `index.html:6` ("Wiki Knowledge Graph" / "Graf wiedzy").

### Podział kodu na mniejsze chunki

`Graph.vue` po implementacji BFS i path mode urósł do ~200 LOC z trzema składowymi: bindowanie force-graph, tryb Path, pop-up. Wyodrębniłem composables — `usePathMode` (state machine + BFS), `useGraphCamera` (fly-to + fit-to-screen), `useForceGraph` (mount + resize observer), `useReducedMotion`. Każdy <50 LOC, testowalny niezależnie. To pozwoliło dodawać kolejne feature'y (path particle direction, node list, screen reader announce) bez puchnięcia komponentu nadrzędnego — wszystko nowe szło do composable i wąskiego API.

## Co świadomie pominięte

TypeScript — projekt zaczął w JS i migracja byłaby scope creepem. JSDoc na utils zamiast TS daje IntelliSense bez `jsconfig.json` i bez wciągania reszty projektu w pół-typowanie.

Pełny ARIA tablist pattern dla 2 zakładek — overkill, `aria-current="page"` + zwykłe button semantics wystarczają. Przy 5+ zakładkach zmieniłbym decyzję.

Lazy-load locale plików — 3 KB per locale, zysk marginalny przy SPA.

Camera fly-to nie respektuje `prefers-reduced-motion` — to nie jest free-running animacja, tylko reakcja na klik (krótki tween). Stripping dawałoby nagłe skoki kamery; auditor mógłby flagować, ale UX w drugą stronę gorszy. Zostaje na liście P2 follow-up.

Tu nie chodzi o to, że tych rzeczy nie znam albo bym ich nie zrobił w produkcji. W zadaniu rekrutacyjnym dodawanie ich tylko zwiększa diff bez zwiększenia wartości tego, co recenzent ma ocenić.

## Współpraca z AI — co realnie zadziałało

Tempo. Boilerplate (composable signatures, ARIA atrybuty per pattern, conventional commit messages, tłumaczenia kluczy locale) wyleciał w ułamku czasu, w jakim sam bym to napisał — i mogłem skupić się na decyzjach projektowych.

Co nie zadziałało bez mojej interwencji:
- Pełny code review oparty na pamięci, nie na `git diff` — dopiero "*sprawdź jeszcze raz*" wymusiło twardą weryfikację. Dotąd wyszły niedbałe liczby ("22 plików w `src/`" → faktycznie 30, "1149 LOC w UI" zacytowane z innego brancha).
- Skupienie wyłącznie na source code w przeglądzie security — `npm audit` się nie pojawił, dopóki nie wskazałem palcem. Lekcja: AI patrzy w to, co prosisz, nie domyśli się że trzeba też skanować dependencies.
- Bug `app.title` — ten wyłapałem ja w runtime, AI go w pełnym review nie wyłapała, bo nie odpaliła aplikacji. Smoke test w przeglądarce zostaje obowiązkiem człowieka.
- Tendencja do robienia więcej niż prosiłem — przy "B czy C?" zaczynała implementować od razu. Trzeba było wprost hamować "tylko C, na osobnym branchu".

## Wybrane prompty

Przegląd algorytmu po obserwacji wizualnej:

> "moim zdaniem algorytm błędnie wyszukuje ścieżki bo widzę że po wyznaczeniu trasy trasa nie płynie zgodnie ze strzałkami — zrób analizę"

Weryfikacja standardów rynkowych:

> "kliknięcie poza wyznaczoną path powinno wyłączać wyznaczoną path — sprawdź czy nie jest to zabronione i jakie są standardy UI na świecie/rynku"

Code review:

> "wszystkie branche, cały kod aplikacji" (przy `/workflow review`)

Empiryczna weryfikacja:

> "uruchom benchmark — performance claims (BFS O(V+E)) — opieram się na inspekcji kodu, nie odpaliłem benchmarka"

Twarda weryfikacja:

> "jesteś pewien że to wszystko to prawda, sprawdź jeszcze raz"

Rozliczenie z otwartych wątków:

> "coś nie zadziałało i jest niedokończone?!"

## Zmiany wersji bibliotek

Nie dodałem żadnej nowej zależności runtime. Lista zmian w `devDependencies`:

| Pakiet | Z | Na | Powód |
|---|---|---|---|
| `vite` | `^5.4.0` | `^7.3.2` | Patch GHSA-4w7w-66w2-5vf9 / CVE-2026-39365. Najmniejszy major, który zamyka CVE w `<= 6.4.1`. |
| `@vitejs/plugin-vue` | `^5.1.0` | `^6.0.6` | Wymóg peer dla vite 7. |
| `esbuild` (transitive) | `≤ 0.24.2` | `≥ 0.25` | GHSA-67mh-4wv8-2f99 — pociągnięty przez vite 7. |

`vue 3.4.0`, `vue-i18n 9.14.5`, `force-graph 1.43.5`, `marked 13.0.0`, `vitest 4.1.5` — bez zmian. Wersje runtime utrzymane z oryginalnego `package.json`, żeby nie wprowadzać niepotrzebnych breaking changes.

## Reprodukcja wyników

```bash
# Środowisko: Node 22.22.2 (vite 7 wymaga ≥ 20)
npm install
npm test                  # 27 / 29 testów (zależnie od brancha)
npm run build             # vite 7.3.2, ~1.3 s
node bench/bfs.bench.js   # benchmark BFS, ~3 s
npm audit                 # 0 vulnerabilities (po `chore/security-and-bench`)
```
