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

export async function fetchDepartures(fromCrs, toCrs) {
  if (!APP_ID || !APP_KEY) throw new Error('TransportAPI credentials not configured.')

  const params = new URLSearchParams({
    app_id: APP_ID,
    app_key: APP_KEY,
    train_status: 'passenger',
    calling_at: toCrs,
  })

  const res = await fetch(`${BASE}/station/${fromCrs}/live.json?${params}`)
  if (!res.ok) throw new Error(`TransportAPI error: ${res.status}`)

  const data = await res.json()
  return (data.departures?.all || []).map(transformService)
}
