'use client'

import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

export function useTheme() {
  const mounted = typeof window !== 'undefined'
  const [theme, setTheme] = useState<Theme>(() => {
    if (!mounted) return 'light'
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement
    if (newTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }

  useEffect(() => {
    if (!mounted) return
    applyTheme(theme)
  }, [mounted, theme])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    if (mounted) {
      applyTheme(newTheme)
      localStorage.setItem('theme', newTheme)
    }
  }

  return { theme, toggleTheme, mounted }
}
