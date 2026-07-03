import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import translations from '../translations'
import { useAuth } from './AuthContext'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const { farmer } = useAuth()
  const [lang, setLang] = useState(() => localStorage.getItem('farmiti_lang') || 'en')

  // Sync with farmer preference if it changes (e.g. after login or profile update)
  useEffect(() => {
    if (farmer?.language_pref && farmer.language_pref !== lang) {
      setLang(farmer.language_pref)
      localStorage.setItem('farmiti_lang', farmer.language_pref)
    }
  }, [farmer?.language_pref])

  const t = useCallback((key) => {
    const langData = translations[lang] || translations.en
    return langData[key] || translations.en[key] || key
  }, [lang])

  const changeLang = useCallback((code) => {
    setLang(code)
    localStorage.setItem('farmiti_lang', code)
  }, [])

  const allLangs = Object.entries(translations)
    .filter(([code]) => translations[code].name) // only valid dictionaries
    .map(([code, data]) => ({
      code, name: data.name, flag: data.flag,
    }))

  return (
    <LanguageContext.Provider value={{ lang, t, changeLang, allLangs }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLang = () => {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLang must be inside LanguageProvider')
  return ctx
}
