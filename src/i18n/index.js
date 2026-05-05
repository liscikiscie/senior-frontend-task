import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import pl from './locales/pl.json'

const STORAGE_KEY = 'locale'
export const SUPPORTED_LOCALES = ['pl', 'en']
export const DEFAULT_LOCALE = 'pl'

function loadInitialLocale() {
  if (typeof localStorage === 'undefined') return DEFAULT_LOCALE
  const stored = localStorage.getItem(STORAGE_KEY)
  return SUPPORTED_LOCALES.includes(stored) ? stored : DEFAULT_LOCALE
}

/**
 * Plural rules use four forms — "zero | one | few | many" — so the locale
 * files can render natural counters like "0 wyników / 1 wynik / 2 wyniki /
 * 5 wyników". vue-i18n picks the form by index returned here.
 *
 * Polish:
 *   0                          → 0 (zero)
 *   1                          → 1 (singular)
 *   2-4 (except 12-14)         → 2 (few)
 *   12-14, 5+                  → 3 (many)
 *
 * English:
 *   0                          → 0 (zero)
 *   1                          → 1 (singular)
 *   anything else              → 2 (other) — third form is reused for "many"
 */
function polishPlural(choice) {
  if (choice === 0) return 0
  if (choice === 1) return 1
  const teen = choice >= 12 && choice <= 14
  const lastDigit = choice % 10
  if (!teen && lastDigit >= 2 && lastDigit <= 4) return 2
  return 3
}

function englishPlural(choice) {
  if (choice === 0) return 0
  if (choice === 1) return 1
  return 2
}

export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: loadInitialLocale(),
  fallbackLocale: 'en',
  messages: { en, pl },
  pluralRules: {
    pl: polishPlural,
    en: englishPlural,
  },
})

export function setLocale(next) {
  if (!SUPPORTED_LOCALES.includes(next)) return
  i18n.global.locale.value = next
  if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, next)
}
