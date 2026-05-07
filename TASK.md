# TASK.md — proces pracy

## Narzędzia

Z AI wykorzystałem Claude Code i stworzoną prze ze mnie platformę wokół Claude Code (profile workflow, zestawy agentów, skill's RAG, hooki quality-gate, kilka MCP serverów). Jest to zaawansowany system multi-agentowy do zarządzania przepływem pracy. Posiada zbudowanę prze ze nmie dużą bazę wiedzy (RAG) wykorzystywaną przez roje agentów nadzorowaną stosowne bramki jakości i bezpieczeństwa. 
W praktyce oznacza to, że mogłem prowadzić cały proces — od planowania, przez implementację, aż po code review — bez wychodzenia z edytora. Większość procesów była wspierana przez AI, ale ostateczne decyzje i testy pozostawały w moich rękach.
Tłumaczenia PL-owej terminologii baristycznej i dłuższych bloków markdown puszczałem przez Gemini 3.1 Pro / Flash (przez MCP `gemini-writer`), bo Claude w tłumaczeniach najlepszy nie jest i dryfować w mechaniczne kalki. Edytor IntelliJ IDEA, smoke-testy w Vite dev server + DevTools po każdym commicie.

## Workflow

Zacząłem od planowania. Po sklonowaniu repo i przeczytaniu README wydałem komendę w `workflow analiza` do Claude'a o wygenerowanie sześciu dokumentów planowych do `plans/` — overview plus jeden plan na zadanie. W każdym: kontekst, diagramy Mermaid (state machines, flow, edge case'y), 
pliki do utworzenia i zmiany, sekcja „Gaps" z tym co świadomie pomijam i dlaczego, na końcu propozycja commit message'a. Te plany nie tylko przyspieszyły kodowanie, ale przy okazji wyłapały kilka rzeczy zanim trafiły do edytora — np. że force-graph mutuje `link.source/target` 
ze stringów na referencje obiektowe (BFS by się rozsypał na pierwszym uruchomieniu), albo że `ctx.globalAlpha` trzeba resetować po każdym węźle bo inaczej dim wycieka.

Sesję prowadziłem przez kilka profili workflow w mojej platformie na Claude Code, każdy z innym zestawem agentów, skill's i hooków:

- `/workflow analiza` na start — skanowanie kodu, diagnoza 3 zadań, generacja planów `00-overview` … `05-live-search`. Sam ten workflow dzieli się na 6 trybów (bug, feature, technical, generic, business, market) które się uruchamiają reagując na semantykę lub/i kontekst komendy.
- `/workflow arch` przy realizowaniu planów —  pisanie kodu, testów składanie propozycji architektonicznych. Praca wpisywania całego kodu odbywa się też przez lokalne LLM - jeszcze w fazie testów.
- Pod koniec debug-loop czyli `/workflow review` & `/workflow arch` & `/workflow analiza`. Review znajdował konkretne bolączki (race condition w async watcherach, ResizeObserver w zagnieżdżonym `onUnmounted`, `<h1>Wiki Knowledge Graph</h1>` jako literalne złamanie Z1c, brak `aria-live` 
- na liczniku dopasowań, BFS z `queue.shift()` jako O(V²) zamiast O(V+E)), arch decydował co naprawiać a co udokumentować jako świadomy trade-off.

Każde plan-driven zadanie poszło w osobnym branchu z `--no-ff` mergem do main (Z1a, Z1b, Z1c, Z2, Z3 + iteracje 06/07 = vitest, JSDoc — każda z plan commitem przed implementacją).
Drobne poprawki zostały (P2 a11y/ux, full translation, TASK.md, path mode polish, post-review polish). Conventional Commits wszędzie.

Pojawiło się kilka nieoczywistych problemów:

Z1b — `TYPE_LABELS` w `types.js` jako mapa kluczy i18n (`process_stage → 'types.process_stage'`), nie hardkodowane stringi.
Po wdrożeniu Z1c właściwe etykiety żyją w `locales/{en,pl}.json` — `TYPE_LABELS` w types.js trzyma tylko ścieżki do kluczy.
Plus: literalna zgodność ze spec (obie mapy obok siebie w utils/types.js), single source of truth na poziomie kluczy (zmiana namespace'u i18n = edycja jednego pliku), refaktor-safety (zapomnienie dodać nowy typ daje błąd, nie cichy fallback do klucza-stringa).
`types.js` eksportuje `TYPE_COLORS`, `TYPE_LABELS`, `DEFAULT_COLOR`. `ChunkPanel.vue`: `t(TYPE_LABELS[chunk.type])` zamiast string-concat.

Dane z `mock.js` (tytuły węzłów, podsumowania, etykiety krawędzi, body markdown) nie były tłumaczone. Spec mówił „nie zmieniaj mock.js" więc nie ruszałem — ale jednocześnie chodzi o aplikację dwujęzyczną, więc treść też powinna być dwujęzyczna. 
Rozwiązanie: warstwa overlay w locale (`data.nodeTitles.${slug}`, `data.linkLabels.${label}` itd.) z `te()`-owym fallbackiem na oryginał. Mock.js nietknięty, treść przetłumaczona, README spełnione literalnie i w duchu.

Drugi: po wystygnięciu symulacji force-graph zatrzymuje pętlę renderu. Zmiana języka aktualizowała tooltipy (bo te są wywoływane on-hover), ale tekst rysowany w `nodeCanvasObject` zostawał zamrożony w starym locale aż do najbliższej interakcji z grafem.
Fix prosty — watcher na `locale` + `fg.graphData(fg.graphData())` — ale logika nieoczywista, łatwo było to przeoczyć w smoke-teście „klik klik, działa".

Trzeci, dokładnie tej samej rodziny: po pierwszym commicie BFS feature działał zgodnie ze spec'em, ale klikanie po grafie wyłapało pięć drobnych UX-ów których plan nie przewidział. 
Trzeci klik po wyznaczonej ścieżce nie tworzył nowej — stary stan zostawał (state machine nie miała przejścia ShowPath → WaitStart na klik nowego węzła). Panel detali z poprzedniego klika świecił się pierścieniem nawet po włączeniu trybu Path. Krawędzie dimowane od włączenia trybu, węzły dopiero od wyboru startu — niespójny próg. Search ring przebijał się przez tryb Path, mimo że `path > search` było ustalone w planie. Canvas zamrażał się na zmianach `pathStart`/`pathEnd` dokładnie tym samym mechanizmem co przy zmianie locale. Wszystko poszło jednym commitem `fix(graph): align path mode with spec` — to jest dokładnie ta sama klasa błędu co lokalowa: spec mówi *co* ma się stać, ale dopiero interakcja na żywo pokazuje *jak*.

Czwarty pojawił się dopiero w multi-agent review po wszystkich commitach. `watch(selectedSlug, async (slug) => { await setTimeout(80ms); chunk.value = getChunk(slug) })` 
ma race condition: szybki klik A → klik B w 50ms → A nadpisuje B kiedy ten pierwszy timeout się rozwiąże. Tu nieszkodliwe (mock data, 80ms symulacji), ale wzorzec niepoprawny. 
Fix: token `requestId` inkrementowany na początku watchera, sprawdzany po `await` — race conditions w async watcherach.

Piąty wyłapałem klikając po grafie z włączonym trybem Path. Niektóre wyznaczone ścieżki wizualnie płynęły wbrew strzałkom na krawędziach — pierwszy odruch był taki, że BFS się rozjeżdża.
Po sprawdzeniu okazało się że algorytm jest poprawny, robi dokładnie to co spec mówi (`README.md:90`: „BFS przeszukuje graf jako **nieskierowany**"), `buildAdjacency` świadomie dodaje obie strony krawędzi.
Konflikt jest między danymi (krawędź skierowana, semantyka relacji „feeds", „produces") a force-graph, który przypina cząsteczki do oryginalnego `source → target`. 
Trzy warianty na stole: zostawić, przejść na BFS skierowany (łamałby spec, niektóre pary tracą połączenie), albo zostawić nieskierowany i odwrócić cząsteczki na linkach ścieżki tak, żeby leciały start → end. 
Wybrałem trzecie — `getLinkParticleSpeed(link)`, gdy `link.target` jest wcześniej na ścieżce niż `link.source`, force-graph honoruje znak. Algorytm zostaje O(V+E), wizualizacja staje się spójna z trasą. Commit `ccb779c`.

Szósty był z tej samej kategorii „działa zgodnie ze spec'em ale UX kuleje". W trybie Path nie było wyjścia awaryjnego — 
Esc owszem wyłączał tryb, ale klik w tło nic nie robił, mimo że to jest konwencja używana przez 90% narzędzi rynkowych. Zanim cokolwiek pisałem, puściłem przez Perplexity research po Neo4j Bloom, 
Linkurious, Cytoscape, Gephi, Obsidian, yFiles, Kumu — wszystkie traktują klik w tło canvas jako „emergency exit" zgodnie z Nielsen #3 (User Control and Freedom). 
Wybrałem hybrydowy wariant zarówno dla Esc jak i bg-click: jeśli coś jest wybrane → czyść, jeśli czysto → wyjdź z trybu. Analogicznie do dwustopniowego Esc w polu wyszukiwania (1× czyści query, 2× zdejmuje fokus). Jeden model mentalny dla obu wejść. Commit `66ecc31`.

Siódmy: `<html lang>` był hardcoded „en" w `index.html:2`, mimo że default locale to PL — screen reader fonologią angielską czytał polski tekst.
Sync w `setLocale()` (`document.documentElement.lang = next`) + `syncDocumentLang()` wywołany w `main.js` przed mount, żeby SSR-style initial render też trafił we właściwy locale.

Ósmy wyszedł z `npm audit` na czystym repo. Dwa moderate-severity advisory: GHSA-67mh-4wv8-2f99 (esbuild ≤ 0.24.2, CORS bypass w dev serverze) i GHSA-4w7w-66w2-5vf9 / CVE-2026-39365
(vite ≤ 6.4.1, path traversal w optimized-deps `.map` handler). Oba przez devDependencies, ale recenzent będzie odpalał `npm run dev` jako pierwszy krok, więc nie chciałem mu zostawiać tego do roboty.
Bump do `vite ^7` (najmniejszy major, który zamyka oba — fix gated > 6.4.1) i `@vitejs/plugin-vue ^6` (peer compat). `vitest 4.1.5` zostało, już deklaruje `peer: vite ^6 || ^7 || ^8`.
Po zmianie: `npm audit` → 0 vulnerabilities, `vite build` → 1.63 s, 27 testów zielono.

Dziewiąty wyszedł w prostym runtime checku — nagłówek pokazywał literal „app.title" zamiast nazwy aplikacji.
Odsyłka istnieje w `App.vue:4` (i18n landing), ale klucz nigdy nie został dodany do `pl.json` ani `en.json`.
Vue-i18n v9 default missing-handler zwraca samą ścieżkę klucza jako string. AI tego w pełnym holistycznym review nie wyłapała — nie odpaliła aplikacji.
Smoke test w przeglądarce zostaje obowiązkiem człowieka. Naprawione wartościami z `index.html:6` („Wiki Knowledge Graph" / „Graf wiedzy") — oneliner, ale przypomnienie że review oparty wyłącznie na czytaniu kodu nie zastąpi runtime'u.

## Nowe zależności

| Pakiet | Powód |
|---|---|
| `vue-i18n@^9.14.5` | Wprost wymagana przez Z1c. Composition API (`legacy: false`), customowe `pluralRules` per locale dla polskich form (1 / 2-4 / 5+). Brak realnych alternatyw. |
| `vitest@^4` (devDependencies) | Test runner dla BFS suite, search filter i state machine trybu Path. Reużywa istniejący `vite.config.js`, ESM-native (projekt jest `type: module`), zerowa konfiguracja. Alternatywą był jest (większy bundle, ESM wymaga babel) lub `node:test`. |

Plus version bumps wymuszone przez `npm audit`:

| Pakiet | Z | Na | Powód |
|---|---|---|---|
| `vite` | `^5.4.0` | `^7` | Patch GHSA-4w7w-66w2-5vf9 / CVE-2026-39365 (path traversal w optimized-deps `.map`). Najmniejszy major, który zamyka CVE w `<= 6.4.1`. |
| `@vitejs/plugin-vue` | `^5.1.0` | `^6` | Wymóg peer dla vite 7. |
| `esbuild` (transitive) | `≤ 0.24.2` | `≥ 0.25` | GHSA-67mh-4wv8-2f99 — pociągnięty przez vite 7. |

## Co świadomie zostało pominięte

TypeScript — projekt zaczął w JS i migracja by była scope creepem. JSDoc na utils zamiast TS daje IntelliSense bez `jsconfig.json`. 
Debounce na search — graf ma 16 węzłów, szybkie filtrowanie. Fuse.js — `String.includes` wystarcza. Lazy-load locale — 3 KB per locale, korzyść marginalna.

Przykłady kilku promtów których użyłem:

> „Zrób analizę projektu — stack, stan startowy, diagnoza 3 zadań z ryzykami, edge case'ami, kolejnością commitów. Każde zadanie z osobnym planem realizacji w `plans/`. Plany mają zawierać Mermaid diagrams dla logiki i edge case'ów. Wszystko co świadomie pomijam — wypisane jako Gaps z uzasadnieniem."

Tłumaczenia do Gemini Pro (skrót, full prompt miał glosariusz):

> „Przetłumacz na polski. Zachowaj DOKŁADNIE strukturę JSON, klucze, \\n, markdown (## ### **bold** | tabele | listy | > blockquoty), liczby, jednostki (°C, bar, %, s, ms, ppm, mL, g). Polska terminologia baristyczna: extraction→ekstrakcja, brewing→parzenie, puck→tabletka kawy, filter basket→sitko filtra, portafilter→kolba, group head→grupa parzenia. Inline odnośniki w **bold** kierują do innych węzłów grafu — przetłumacz spójnie z tytułami. Zwróć WYŁĄCZNIE czysty JSON, bez markdown fences."

Locale redraw fix — dosłownie tyle:

> „Przy zmianie języka trzeba rerenderować graf"

Wystarczyło. Claude rozpoznał problem, zaproponował watch jako bezruchowy redraw, i przy okazji wykrył że jeden z istniejących watcherów ma callback parameter `d` shadowujący helper `d` z `useDataI18n()` w setup scope.

