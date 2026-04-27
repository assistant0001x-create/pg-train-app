import { useState, useCallback } from 'react'

const STORAGE_KEY = 'pg-train-tweaks'

const DEFAULTS = {
  headerStyle: 'compact',  // compact | card
  cardStyle: 'rich',       // rich | minimal
  routeStyle: 'ribbon',    // ribbon | bars | timeline
  accent: 'amber',         // amber | lime | coral | ice
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS }
  } catch {
    return { ...DEFAULTS }
  }
}

function save(tweaks) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tweaks)) } catch { /* ignore */ }
}

export function useTweaks() {
  const [tweaks, setTweaks] = useState(load)

  const setTweak = useCallback((key, value) => {
    setTweaks((prev) => {
      const next = { ...prev, [key]: value }
      save(next)
      return next
    })
  }, [])

  return [tweaks, setTweak]
}

export const ACCENT_VARS = {
  amber: 'oklch(82% 0.16 80)',
  lime:  'oklch(82% 0.18 130)',
  coral: 'oklch(75% 0.16 30)',
  ice:   'oklch(78% 0.14 220)',
}

export const ACCENT_SWATCHES = [
  { key: 'amber', color: 'oklch(82% 0.16 80)' },
  { key: 'lime',  color: 'oklch(82% 0.18 130)' },
  { key: 'coral', color: 'oklch(75% 0.16 30)' },
  { key: 'ice',   color: 'oklch(78% 0.14 220)' },
]
