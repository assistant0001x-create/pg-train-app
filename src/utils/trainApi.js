// Rail Delivery Group — Live Departure Board API
// https://api1.raildata.org.uk/1010-live-departure-board-dep1_2/LDBWS/api/20220120/GetDepartureBoard
const API_KEY = import.meta.env.VITE_RDG_API_KEY
const BASE = 'https://api1.raildata.org.uk/1010-live-departure-board-dep1_2/LDBWS/api/20220120/GetDepartureBoard'

// TfL Unified API — StopPoint Arrivals
const TFL_KEY = import.meta.env.VITE_TFL_API_KEY
const TFL_BASE = 'https://api.tfl.gov.uk'

function transformService(svc) {
  // RDG already returns std/etd/isCancelled/platform/operator/serviceID directly
  return {
    std: svc.std || 'TBC',
    etd: svc.etd || 'On time',
    isCancelled: svc.isCancelled || false,
    platform: svc.platform || '—',
    operator: svc.operator || '',
    serviceID: svc.serviceID,
    serviceId: svc.serviceID,
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
  if (!API_KEY) throw new Error('RDG API key not configured.')

  if (!force) {
    const cached = readCache(fromCrs, toCrs)
    if (cached) return cached
  }

  const params = new URLSearchParams({
    numRows: '12',
    filterCrs: toCrs,
    filterType: 'to',
  })

  const res = await fetch(`${BASE}/${fromCrs}?${params}`, {
    headers: { 'x-apikey': API_KEY },
  })

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) throw new Error('RDG API key invalid or unauthorised.')
    if (res.status === 429) throw new Error('Rate limit reached. Please wait a moment.')
    throw new Error(`RDG API error: ${res.status}`)
  }

  const data = await res.json()
  const services = (data.trainServices || []).map(transformService)
  writeCache(fromCrs, toCrs, services)
  return services
}

function secondsToTimeString(secs) {
  const d = new Date(Date.now() + secs * 1000)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// Fetch westbound Piccadilly line arrivals (toward central London / King's Cross)
export async function fetchTubeArrivals(naptanId) {
  if (!TFL_KEY) throw new Error('TfL API key not configured.')

  const res = await fetch(`${TFL_BASE}/StopPoint/${naptanId}/Arrivals?app_key=${TFL_KEY}`)

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) throw new Error('TfL API key invalid or unauthorised.')
    throw new Error(`TfL API error: ${res.status}`)
  }

  const data = await res.json()
  return data
    .filter((a) => a.platformName && a.platformName.includes('West'))
    .sort((a, b) => a.timeToStation - b.timeToStation)
    .slice(0, 6)
    .map((a) => ({
      std: secondsToTimeString(a.timeToStation),
      etd: 'On time',
      isCancelled: false,
      platform: a.platformName || '—',
      operator: 'TfL',
      serviceID: a.vehicleId || String(a.timeToStation),
      serviceId: a.vehicleId || String(a.timeToStation),
    }))
}
