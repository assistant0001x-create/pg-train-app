const APP_ID = import.meta.env.VITE_TRANSPORTAPI_APP_ID
const APP_KEY = import.meta.env.VITE_TRANSPORTAPI_APP_KEY
const BASE = 'https://transportapi.com/v3/uk/train'

function transformService(svc) {
  const isCancelled = svc.status === 'CANCELLED'
  const aimed = svc.aimed_departure_time       // "HH:MM"
  const expected = svc.expected_departure_time // "HH:MM" or null

  // Show expected time only when it differs from scheduled (late or early)
  let etd = 'On time'
  if (!isCancelled && expected && expected !== aimed) {
    etd = expected
  }

  return {
    std: aimed || 'TBC',
    etd,
    isCancelled,
    platform: svc.platform,
    operator: svc.operator_name || svc.operator,
    serviceID: svc.train_uid,
    serviceId: svc.train_uid,
  }
}

const CACHE_TTL_MS = 2 * 60 * 1000 // 2 minutes

function cacheKey(fromCrs, toCrs) {
  return `departures:${fromCrs}:${toCrs}`
}

function readCache(fromCrs, toCrs) {
  try {
    const raw = localStorage.getItem(cacheKey(fromCrs, toCrs))
    if (!raw) return null
    const { ts, data } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL_MS) return null
    return data
  } catch {
    return null
  }
}

function writeCache(fromCrs, toCrs, data) {
  try {
    localStorage.setItem(cacheKey(fromCrs, toCrs), JSON.stringify({ ts: Date.now(), data }))
  } catch {
    // storage full or unavailable — ignore
  }
}

export async function fetchDepartures(fromCrs, toCrs, { force = false } = {}) {
  if (!APP_ID || !APP_KEY) throw new Error('TransportAPI credentials not configured.')

  if (!force) {
    const cached = readCache(fromCrs, toCrs)
    if (cached) return cached
  }

  const params = new URLSearchParams({
    app_id: APP_ID,
    app_key: APP_KEY,
    train_status: 'passenger',
    calling_at: toCrs,
  })

  const res = await fetch(`${BASE}/station/${fromCrs}/live.json?${params}`)
  if (!res.ok) {
    if (res.status === 403) {
      throw new Error('Daily API limit reached. Try again in a few hours.')
    }
    throw new Error(`TransportAPI error: ${res.status}`)
  }

  const data = await res.json()
  const services = (data.departures?.all || []).map(transformService)
  writeCache(fromCrs, toCrs, services)
  return services
}
