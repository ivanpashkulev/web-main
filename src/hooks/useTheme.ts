import { useState, useEffect } from 'react'
import type { Theme } from '@/types'

const STORAGE_KEY = 'theme'
const DEFAULT_THEME: Theme = 'dark'

const applyTheme = (theme: Theme) => {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem(STORAGE_KEY, theme)
}

const getInitialTheme = (): Theme => {
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
  return stored ?? DEFAULT_THEME
}

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => { applyTheme(theme) }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  return { theme, toggleTheme }
}
