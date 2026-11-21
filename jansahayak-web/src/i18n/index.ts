import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { en } from './en'
import { kn } from './kn'
import { hi } from './hi'

export const LANGUAGES = [
  { code: 'en', native: 'English', ready: true },
  { code: 'kn', native: 'ಕನ್ನಡ', ready: true },
  { code: 'hi', native: 'हिन्दी', ready: true },
  { code: 'ta', native: 'தமிழ்', ready: false },
  { code: 'te', native: 'తెలుగు', ready: false },
  { code: 'ml', native: 'മലയാളം', ready: false },
]

const STORAGE_KEY = 'jansahayak_lang'
const READY = LANGUAGES.filter((l) => l.ready).map((l) => l.code)

export function getSavedLanguage(): string | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v && READY.includes(v) ? v : null
  } catch {
    return null
  }
}

export function setLanguage(code: string) {
  if (!READY.includes(code)) return
  void i18n.changeLanguage(code)
  document.documentElement.lang = code
  try {
    localStorage.setItem(STORAGE_KEY, code)
  } catch {
    // storage unavailable: the choice just won't be remembered
  }
}

const initial = getSavedLanguage() ?? 'en'
document.documentElement.lang = initial

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    kn: { translation: kn },
    hi: { translation: hi },
  },
  lng: initial,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n