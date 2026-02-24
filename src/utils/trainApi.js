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

const BUS_ROUTES_HOME = ['329', '121', 'w6', '34', '184', '299', '298', '102']

// Find nearby bus stops and return live arrivals grouped by route
export async function fetchNearbyBusOptions(lat, lon) {
  if (!TFL_KEY) return []

  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    stopTypes: 'NaptanPublicBusCoachTram',
    radius: '400',
    useStopPointHierarchy: 'false',
    app_key: TFL_KEY,
  })
  const res = await fetch(`${TFL_BASE}/StopPoint?${params}`)
  if (!res.ok) return []

  const data = await res.json()
  const stops = data.stopPoints || []

  // Map route → nearest stop (TfL returns stops sorted by distance)
  const routeToStop = new Map()
  for (const stop of stops) {
    for (const line of stop.lines) {
      if (BUS_ROUTES_HOME.includes(line.id) && !routeToStop.has(line.id)) {
        routeToStop.set(line.id, { id: stop.id, name: stop.commonName, lat: stop.lat, lon: stop.lon })
      }
    }
  }
  if (routeToStop.size === 0) return []

  // Fetch arrivals per unique stop (one call can cover multiple routes at same stop)
  const uniqueStopIds = [...new Set([...routeToStop.values()].map((s) => s.id))]
  const arrivalsByStop = new Map()
  await Promise.all(
    uniqueStopIds.map(async (id) => {
      try {
        const r = await fetch(`${TFL_BASE}/StopPoint/${id}/Arrivals?app_key=${TFL_KEY}`)
        if (r.ok) arrivalsByStop.set(id, await r.json())
      } catch { /* ignore */ }
    })
  )

  // Build one result per route
  return [...routeToStop.entries()].flatMap(([routeId, stop]) => {
    const allArrivals = arrivalsByStop.get(stop.id) || []
    const departures = allArrivals
      .filter((a) => a.lineName && a.lineName.toLowerCase() === routeId.toLowerCase())
      .sort((a, b) => a.timeToStation - b.timeToStation)
      .slice(0, 6)
      .map((a) => ({
        std: secondsToTimeString(a.timeToStation),
        etd: 'On time',
        isCancelled: false,
        serviceID: a.vehicleId || String(a.timeToStation),
        serviceId: a.vehicleId || String(a.timeToStation),
      }))
    if (departures.length === 0) return []
    return [{ route: routeId.toUpperCase(), stop, departures }]
  })
}

// Generic TfL rail arrivals — optionally filter by platform name substring
export async function fetchRailArrivals(naptanId, { platformFilter } = {}) {
  if (!TFL_KEY) throw new Error('TfL API key not configured.')

  const res = await fetch(`${TFL_BASE}/StopPoint/${naptanId}/Arrivals?app_key=${TFL_KEY}`)

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) throw new Error('TfL API key invalid or unauthorised.')
    throw new Error(`TfL API error: ${res.status}`)
  }

  const data = await res.json()
  const filtered = platformFilter
    ? data.filter((a) => a.platformName && a.platformName.includes(platformFilter))
    : data

  return filtered
    .sort((a, b) => a.timeToStation - b.timeToStation)
    .slice(0, 6)
    .map((a) => ({
      std: secondsToTimeString(a.timeToStation),
      etd: 'On time',
      isCancelled: false,
      platform: a.platformName || '—',
      operator: a.operatorName || 'TfL',
      serviceID: a.vehicleId || String(a.timeToStation),
      serviceId: a.vehicleId || String(a.timeToStation),
    }))
}

// Fetch westbound Piccadilly line arrivals (toward central London / King's Cross)
export function fetchTubeArrivals(naptanId) {
  return fetchRailArrivals(naptanId, { platformFilter: 'West' })
}

// Fetch overground arrivals (all directions — no platform filter)
export function fetchOvergroundArrivals(naptanId) {
  return fetchRailArrivals(naptanId)
}
