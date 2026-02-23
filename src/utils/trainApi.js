export async function fetchJsonWithFallback(url) {
  const candidates = [
    (u) => u,
    (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    (u) => `https://thingproxy.freeboard.io/fetch/${u}`,
    (u) => `https://r.jina.ai/http://${u.replace(/^https?:\/\//, '')}`,
  ]

  let lastError = null

  for (const buildUrl of candidates) {
    try {
      const res = await fetch(buildUrl(url), { cache: 'no-store' })
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const ct = res.headers.get('content-type') || ''
      if (ct.includes('application/json')) return await res.json()
      const text = await res.text()
      return JSON.parse(text)
    } catch (err) {
      lastError = err
    }
  }

  throw lastError || new Error('All data sources failed.')
}
