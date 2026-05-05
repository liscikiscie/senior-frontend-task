# Zadanie rekrutacyjne — Senior Frontend Engineer

Pracujesz nad **Wiki Knowledge Graph** — przeglądarką wiedzy opartą na grafie, napisaną w Vue 3 + Vite. Aplikacja wizualizuje sieć pojęć (węzły) i powiązań między nimi (krawędzie) z zakresu obsługi ekspresu do kawy. Dane są mock'owane lokalnie w `src/data/mock.js`, więc do uruchomienia projektu nie jest potrzebne żadne zewnętrzne API.

Twoim zadaniem jest zrealizowanie **trzech zadań** opisanych poniżej. Każde z nich jest niezależne — możesz je realizować w dowolnej kolejności.

---

## Uruchomienie projektu

```bash
npm install
npm run dev
```

Aplikacja startuje pod adresem `http://localhost:5173`.

---

## Struktura projektu

```
src/
├── style.css          # globalny arkusz stylów (ciemny motyw)
├── App.vue            # główny komponent — header, zakładki, panel detali
├── main.js            # punkt wejścia aplikacji
├── data/
│   └── mock.js        # dane: 16 węzłów, 20 krawędzi, 3 źródła, transkrypty
├── components/
│   ├── Graph.vue       # wizualizacja grafu (force-graph)
│   ├── ChunkPanel.vue  # panel szczegółów węzła
│   ├── SourcesView.vue # lista źródeł z częściami
│   └── PartPanel.vue   # panel szczegółów części źródła
├── locales/            # (do utworzenia w Zadaniu 1c)
│   ├── en.json
│   └── pl.json
└── utils/              # (do utworzenia w Zadaniu 1a/1b)
    ├── format.js
    └── types.js
```

---

## Zadania

### Zadanie 1 — Refaktoryzacja

**Kontekst:** W kodzie występują dwa rodzaje duplikacji, które utrudniają utrzymanie projektu. Dodatkowo nowy klient wymaga polskojęzycznego interfejsu.

**1a. Wyodrębnij `fmtTime()` do `src/utils/format.js`**

Funkcja `fmtTime(secs)` zamieniająca sekundy na format `M:SS` jest skopiowana dosłownie w trzech komponentach: `ChunkPanel.vue`, `PartPanel.vue` i `SourcesView.vue`. Wyodrębnij ją do osobnego modułu i zastąp importem we wszystkich miejscach.

**1b. Ujednolicić konfigurację typów węzłów w `src/utils/types.js`**

`ChunkPanel.vue` definiuje `TYPE_LABELS` (mapowanie klucza typu na etykietę), a `Graph.vue` definiuje `TYPE_COLORS` (mapowanie klucza typu na kolor) — obie struktury operują na tym samym zbiorze pięciu kluczy (`process_stage`, `machine_element`, `machine_part`, `procedure`, `concept`). Utwórz jeden plik `src/utils/types.js`, który eksportuje obie mapy, i zaktualizuj oba komponenty.

**1c. Dodaj obsługę i18n i przetłumacz interfejs na język polski**

Zainstaluj `vue-i18n` (v9, Composition API) i zintegruj go z aplikacją. Wyodrębnij wszystkie hardkodowane frazy tekstowe z szablonów do dwóch plików:

- `src/locales/en.json` — angielskie oryginały
- `src/locales/pl.json` — polskie tłumaczenia

Domyślnym językiem aplikacji powinien być **polski**. Dodaj przełącznik `EN | PL` w nagłówku aplikacji, który zmienia język w locie bez przeładowania strony.

Frazy do wyodrębnienia obejmują m.in.:

| Komponent         | Przykładowe frazy                                                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `App.vue`         | zakładki „Graph" / „Source Files", „Loading…", „Select a node to explore", licznik `N chunks · M links`                                     |
| `ChunkPanel.vue`  | „Related Chunks", „Links to", „Referenced by", „Sources", etykiety typów węzłów z `TYPE_LABELS`                                             |
| `PartPanel.vue`   | „Source Part", „Close"                                                                                                                      |
| `SourcesView.vue` | „source file(s)" (z pluralizacją), nagłówki kolumn: `#`, `Title`, `Start`, `End`, `Duration`, `Lang`, etykiety metadanych `Path`, `SHA-256` |

Zadbaj o poprawną pluralizację tam, gdzie liczba obiektów jest zmienna (`vue-i18n` obsługuje to przez `$tc` / opcję `plural`).

**Oczekiwany efekt:** Aplikacja domyślnie wyświetla się po polsku; przełącznik `EN | PL` w nagłówku zmienia język w locie. Kod komponentów nie zawiera hardkodowanych napisów — każda fraza istnieje dokładnie w jednym miejscu (plik JSON lub moduł utils).

---

### Zadanie 2 — Najkrótsza ścieżka (BFS)

**Kontekst:** Użytkownicy chcą wiedzieć, jak dwa dowolne węzły grafu są ze sobą powiązane.

Zaimplementuj tryb „Path" bezpośrednio w komponencie `Graph.vue`. Szczegółowa specyfikacja znajduje się w bloku komentarza `// TODO Task 2` na końcu pliku — poniżej podsumowanie wymagań:

- Przycisk „Path" włącza/wyłącza tryb ścieżki (toggle).
- W trybie aktywnym dwa kolejne kliknięcia w węzły wyznaczają punkt startowy i końcowy.
- Algorytm BFS przeszukuje graf jako **nieskierowany** i rekonstruuje ścieżkę.
- Węzły na ścieżce renderowane są z pełną jasnością i wyróżniającym pierścieniem; pozostałe są przyciemnione do ok. 20% krycia.
- Krawędzie ścieżki są podświetlone; pozostałe przyciemnione.
- Jeśli ścieżka nie istnieje — wyświetl nakładkę „No path found".
- Wyłączenie trybu resetuje cały stan.

---

### Zadanie 3 — Wyszukiwanie w grafie na żywo

**Kontekst:** Przy większej liczbie węzłów znalezienie konkretnego pojęcia wymaga przewijania listy lub zgadywania pozycji w grafie.

Dodaj pole wyszukiwania do nagłówka aplikacji.

- Input wyszukiwania pojawia się w headerze obok licznika węzłów/krawędzi (widoczny tylko w zakładce „Graph").
- Przy pustym zapytaniu graf wygląda normalnie.
- Zaznacz węzły które zostały odnalezione
- Obok inputa wyświetlana jest liczba dopasowań

---

## Kryteria oceny

Oceniamy przede wszystkim jakość kodu, nie szybkość jego dostarczenia.

| Obszar             | Na co patrzymy                                                                       |
| ------------------ | ------------------------------------------------------------------------------------ |
| **Poprawność**     | Czy funkcjonalność działa zgodnie ze specyfikacją, włącznie z przypadkami brzegowymi |
| **Czytelność**     | Czy kod jest zrozumiały bez zbędnych komentarzy i nadmiarowych abstrakcji            |
| **Spójność**       | Czy nowy kod pasuje stylem i konwencjami do istniejącego                             |
| **Refaktoryzacja** | Czy Zadanie 1 eliminuje duplikację bez wprowadzania nowych problemów                 |
| **Algorytm**       | Czy BFS w Zadaniu 2 jest poprawny i wydajny (O(V + E))                               |
| **UX**             | Czy interakcje w Zadaniach 2 i 3 są intuicyjne i responsywne                         |

---

## Zasady

- Opisz swój proces pracy w TASK.md, jakich narzędzi AI użyłeś, co ci sie podobało w rezultacie który otrzymałeś z AI. Jaki feedback mu dałeś. Możesz dołączyć prompty których użyłeś.
- Nie zmieniaj `src/data/mock.js`.
- Uzasadnij biblioteki które doinstalowałeś w TASK.md.
- Każde zadanie powinno być commitowane osobno z opisowym komunikatem.

## Oddanie zadania

Wyślij link do publicznego repozytorium (GitHub / GitLab)
lub archiwum `.zip` z historią commitów na mój adres: jan.dabrowski@packguru.ai
podany w wiadomości rekrutacyjnej.

Powodzenia!
Jan
