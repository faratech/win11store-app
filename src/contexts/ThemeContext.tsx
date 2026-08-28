import React, { createContext, useContext, useEffect, useState } from 'react'

/**
 * XenForo owns the theme; the store only mirrors it. Detection order matches
 * /web/windowsbuilds_app/src/contexts/ThemeContext.tsx (the proven implementation):
 * data-color-scheme → data-variation → xf style_variation cookie → html classes →
 * prefers-color-scheme. The resolved mode is written back to <html> as a `.dark`
 * class so Tailwind's dark variant (and the portaled modal) follow along.
 */

type Mode = 'light' | 'dark'

const ThemeContext = createContext<Mode>('light')

const readXfStyleVariationCookie = (): Mode | null => {
  const html = document.documentElement
  const cookiePrefix = html.getAttribute('data-cookie-prefix') || 'xf_'
  for (const cookieName of [`${cookiePrefix}style_variation`, 'style_variation']) {
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${cookieName}=([^;]*)`))
    if (!match) continue
    const variation = decodeURIComponent(match[1])
    if (variation === 'alternate') return 'dark'
    if (variation === 'default') return 'light'
  }
  return null
}

const resolveActualMode = (): Mode => {
  const html = document.documentElement

  const colorScheme = html.getAttribute('data-color-scheme')?.toLowerCase()
  if (colorScheme === 'light' || colorScheme === 'dark') return colorScheme

  const variation = html.getAttribute('data-variation')?.toLowerCase()
  if (variation === 'alternate') return 'dark'
  if (variation === 'default') return 'light'

  const cookie = readXfStyleVariationCookie()
  if (cookie) return cookie

  if (html.classList.contains('litemode')) return 'light'
  if (html.classList.contains('light')) return 'light'
  if (html.classList.contains('dark')) return 'dark'

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<Mode>(() => resolveActualMode())

  useEffect(() => {
    const update = () => setMode(resolveActualMode())

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', update)

    // Our own `.dark` write re-fires this observer once; it resolves to the
    // same mode and the same-value setState settles, so there is no loop.
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-variation', 'data-color-scheme', 'class'],
    })

    return () => {
      mediaQuery.removeEventListener('change', update)
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', mode === 'dark')
  }, [mode])

  return <ThemeContext.Provider value={mode}>{children}</ThemeContext.Provider>
}

export const useThemeMode = (): Mode => useContext(ThemeContext)
