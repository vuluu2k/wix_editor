import { createI18n, type I18nOptions } from 'vue-i18n'
import en from './locales/en.json'
import vi from './locales/vi.json'

// Define messages type
type MessageSchema = typeof en

const i18n = createI18n<[MessageSchema], 'en' | 'vi'>({
  legacy: false, // Use Composition API
  locale: 'en', // Set locale
  fallbackLocale: 'en', // Set fallback locale
  messages: {
    en,
    vi
  }
})

export default i18n
