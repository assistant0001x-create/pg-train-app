import { useState, useRef, useEffect, useCallback } from 'react'
import {
  PALMERS_GREEN,
  MOORGATE,
  HOME_COORDS,
  HOME_POSTCODE,
  HOME_ADDRESS,
  DEPARTURE_NOTIFY_MINUTES,
} from '../constants/stations'
import { walkingMinutes } from '../utils/distance'
import { fetchDepartures, fetchJourneys } from '../utils/trainApi'
import { getDummyJourneys } from '../utils/dummyData'

// Set VITE_DUMMY_MODE=false in .env to use the live API
const DUMMY_MODE = import.meta.env.VITE_DUMMY_MODE !== 'false'

// Default home destination shown across HOME mode routes
const HOME_DESTINATION = HOME_ADDRESS || '73 Hazelwood Lane, N13 5HE'

function getServiceStatus(service) {
  if (service.isCancelled) return 'cancelled'
  const scheduled = service.std || service.sta
  const expected = service.etd || service.eta
  if (expected && expected !== scheduled && expected !== 'On time') return 'delayed'
  return 'onTime'
}

function parseDepartureTime(timeString) {
  if (!timeString || timeString === 'On time' || timeString === 'Delayed') return null
  const parts = timeString.split(':').map(Number)
  if (parts.length !== 2 || parts.some(Number.isNaN)) return null
  const now = new Date()
  const dep = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parts[0], parts[1], 0, 0)
  if (dep.getTime() < now.getTime() - 6 * 60 * 60 * 1000) dep.setDate(dep.getDate() + 1)
  return dep
}

function getTrackedDepartureTime(service) {
  const status = getServiceStatus(service)
  if (status === 'delayed') {
    return parseDepartureTime(service.etd || service.eta) || parseDepartureTime(service.std || service.sta)
  }
  return parseDepartureTime(service.std || service.sta)
}

function sendNotification(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  new Notification(title, { body, icon: '🚂' })
}

async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      { headers: { 'Accept-Language': 'en-GB' } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const { house_number, road, postcode } = data.address || {}
    if (!road) return null
    const street = house_number ? `${house_number} ${road}` : road
    const district = postcode ? postcode.split(' ')[0] : null
    return district ? `${street}, ${district}` : street
  } catch {
    return null
  }
}

function parseMockLocation() {
  try {
    const raw = new URLSearchParams(window.location.search).get('mockLoc')
    if (!raw) return null
    const [lat, lon] = raw.split(',').map(Number)
    if (isNaN(lat) || isNaN(lon)) return null
    return { lat, lon }
  } catch {
    return null
  }
}

// ?mockUnavailable=station simulates the Palmers Green route being down in
// DUMMY_MODE, for offline verification of the unavailable-route UI (no live
// TfL key needed).
function parseMockUnavailable() {
  try {
    return new URLSearchParams(window.location.search).get('mockUnavailable') === 'station'
  } catch {
    return false
  }
}

// Builds one HOME-mode route entry. A null journey (no result, or the fetch
// threw) becomes an { unavailable: true, reason } entry instead of being
// silently dropped, so the UI can show it as unavailable with a reason.
function buildRouteResult(id, journey, reason) {
  return journey ? { ...journey, id, unavailable: false } : { id, unavailable: true, reason }
}

async function getUserLocation(mockOverride) {
  if (mockOverride) return mockOverride
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Geolocation not supported'))
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      reject,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60 * 1000 }
    )
  })
}

export function useTrainApp() {
  const mockLocationRef = useRef(parseMockLocation())
  const [mockLocation] = useState(mockLocationRef.current)

  // Rendering state
  const [currentMode, setCurrentModeState] = useState('out')
  const [trains, setTrains] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [walkingInfo, setWalkingInfo] = useState(null)
  const [homeRoutingInfo, setHomeRoutingInfo] = useState(null)
  const [routeOptions, setRouteOptions] = useState([])
  const [trackedServiceID, setTrackedServiceIDState] = useState(null)
  const [locationLabel, setLocationLabel] = useState(null)
  const [notificationsGranted, setNotificationsGranted] = useState(
    typeof Notification !== 'undefined' && Notification.permission === 'granted'
  )

  // Refs so fetchTrains (stable callback) always reads current values
  const currentModeRef = useRef('out')
  const trackedIDRef = useRef(null)
  const trackedStatusRef = useRef(null)
  const trackedExpectedRef = useRef(null)
  const trackedNotifiedRef = useRef(false)
  const requestSeq = useRef(0)
  const mountedRef = useRef(true)

  const setCurrentMode = useCallback((mode) => {
    currentModeRef.current = mode
    setCurrentModeState(mode)
  }, [])

  const setTrackedServiceID = useCallback((id) => {
    trackedIDRef.current = id
    setTrackedServiceIDState(id)
  }, [])

  const showStatus = useCallback((type, message) => setStatus({ type, message }), [])

  const fetchTrains = useCallback(async ({ force = false } = {}) => {
    const seq = ++requestSeq.current
    setIsLoading(true)
    setWalkingInfo(null)
    const mode = currentModeRef.current

    try {
      let fromStation, toCrs

      if (mode === 'out') {
        fromStation = PALMERS_GREEN.code
        toCrs = MOORGATE.code
        setHomeRoutingInfo(null)
        setRouteOptions([])
      } else if (DUMMY_MODE) {
        // Offline demo — no API calls
        const { toHome, toStation } = getDummyJourneys()
        const stationDown = parseMockUnavailable()
        setRouteOptions([
          buildRouteResult('to-home', toHome, 'No route home currently available.'),
          buildRouteResult('to-station', stationDown ? null : toStation, `${PALMERS_GREEN.name} station may be closed — no route currently available.`),
        ])
        setTrains([])
        setLastUpdate(new Date())
        showStatus('info', stationDown
          ? `Demo mode — simulating ${PALMERS_GREEN.name} unavailable. Set VITE_DUMMY_MODE=false for live data.`
          : 'Demo mode — showing dummy route data. Set VITE_DUMMY_MODE=false for live data.')
        return
      } else {
        // ── LIVE HOME mode ────────────────────────────────────────────────────
        // Two TfL Journey Planner routes, both from current GPS:
        //   1. Quickest multi-modal route all the way to N13 5HE (any TfL mode, no cab)
        //   2. Quickest route ending at Palmers Green station
        // ─────────────────────────────────────────────────────────────────────

        let location = null
        setLocationLabel(null)

        try {
          location = await getUserLocation(mockLocationRef.current)
          if (!mountedRef.current || requestSeq.current !== seq) return
          reverseGeocode(location.lat, location.lon).then((label) => {
            if (label && mountedRef.current) setLocationLabel(label)
          })
        } catch (locErr) {
          console.warn('Could not get user location:', locErr)
        }

        setHomeRoutingInfo({ location })

        if (!location) {
          setRouteOptions([])
          setTrains([])
          setLastUpdate(new Date())
          showStatus('error', 'Could not get your location. Enable location access and try again.')
          return
        }

        // Citymapper-like sanity rule: if you're already very close to home,
        // prefer walk-only and suppress route planning.
        const walkToHome = Math.round(walkingMinutes(location.lat, location.lon, HOME_COORDS.lat, HOME_COORDS.lon))
        if (walkToHome <= 2) {
          setRouteOptions([])
          setTrains([])
          setLastUpdate(new Date())
          showStatus('success', 'You are home.')
          return
        }
        if (walkToHome <= 12) {
          setRouteOptions([{
            id: 'to-home',
            durationMin: walkToHome,
            depClock: null,
            arrClock: null,
            legs: [{
              mode: 'walking', durMin: walkToHome, label: 'Walk home', lineName: null,
              to: HOME_DESTINATION, depClock: null, arrClock: null,
            }],
          }])
          setTrains([])
          setLastUpdate(new Date())
          showStatus('success', 'You are already near home — showing walk route.')
          return
        }

        // allSettled (not all+shared-catch) so each route keeps its OWN
        // failure reason instead of one clobbering the other's message.
        const [toHomeResult, toStationResult] = await Promise.allSettled([
          fetchJourneys(location.lat, location.lon, HOME_POSTCODE),
          fetchJourneys(location.lat, location.lon, PALMERS_GREEN.naptanId),
        ])

        if (!mountedRef.current || requestSeq.current !== seq) return

        const results = [
          buildRouteResult(
            'to-home',
            toHomeResult.status === 'fulfilled' ? toHomeResult.value : null,
            toHomeResult.status === 'rejected' ? toHomeResult.reason.message : 'No route home currently available.'
          ),
          buildRouteResult(
            'to-station',
            toStationResult.status === 'fulfilled' ? toStationResult.value : null,
            toStationResult.status === 'rejected' ? toStationResult.reason.message : `${PALMERS_GREEN.name} station may be closed — no route currently available.`
          ),
        ]

        setRouteOptions(results)
        setTrains([])
        setLastUpdate(new Date())
        const availableCount = results.filter((r) => !r.unavailable).length
        if (availableCount === 0) {
          showStatus('error', 'No routes available. Check TfL app.')
        } else if (availableCount < 2) {
          showStatus('warning', 'One route unavailable — showing what we have. Check TfL app.')
        } else {
          showStatus('success', 'Connected. Showing live routes.')
        }
        return
      }

      // ── OUT mode only below this point ────────────────────────────────────
      let services = await fetchDepartures(fromStation, toCrs, { force })
      if (!mountedRef.current || requestSeq.current !== seq) return

      // Tracking notifications (out mode only)
      const tracked = trackedIDRef.current
      if (mode === 'out' && tracked && services.length > 0) {
        const trackedSvc = services.find((s) => (s.serviceID || s.serviceId) === tracked)
        if (trackedSvc) {
          const newStatus = getServiceStatus(trackedSvc)
          const scheduled = trackedSvc.std || trackedSvc.sta
          const expected = trackedSvc.etd || trackedSvc.eta
          if (newStatus === 'delayed') {
            if (trackedStatusRef.current !== 'delayed') {
              sendNotification('Tracked Train Delayed', `Your tracked train at ${scheduled} is delayed (expected ${expected}).`)
            } else if (trackedExpectedRef.current && expected && trackedExpectedRef.current !== expected) {
              sendNotification('Tracked Train Delay Change', `Your tracked train delay has changed (expected ${expected}).`)
            }
            trackedExpectedRef.current = expected || trackedExpectedRef.current
          } else {
            trackedExpectedRef.current = null
          }
          if (!trackedNotifiedRef.current) {
            const depTime = getTrackedDepartureTime(trackedSvc)
            if (depTime) {
              const minsUntil = (depTime.getTime() - Date.now()) / 60000
              if (minsUntil > 0 && minsUntil <= DEPARTURE_NOTIFY_MINUTES) {
                sendNotification('Depart now for tracked train', `Your tracked train at ${scheduled} departs in ${Math.round(minsUntil)} minutes.`)
                trackedNotifiedRef.current = true
              }
            }
          }
          trackedStatusRef.current = newStatus
        } else if (trackedStatusRef.current) {
          sendNotification('Tracked train update', 'Your tracked train is no longer on the board. It may have departed.')
          setTrackedServiceID(null)
          trackedStatusRef.current = null
          trackedExpectedRef.current = null
          trackedNotifiedRef.current = false
        }
      }

      setTrains(services.slice(0, 12))
      setLastUpdate(new Date())
      showStatus('success', 'Connected. Showing real time trains from National Rail.')
    } catch (error) {
      if (!mountedRef.current || requestSeq.current !== seq) return
      console.error('Error:', error)
      showStatus('error', `Failed to fetch train times: ${error.message}`)
      setTrains([])
    } finally {
      if (mountedRef.current && requestSeq.current === seq) setIsLoading(false)
    }
  }, [setTrackedServiceID, showStatus])

  // Fetch whenever mode changes (and on mount); auto-refresh every 60s
  useEffect(() => {
    fetchTrains()
    const interval = setInterval(() => fetchTrains({ force: true }), 60 * 1000)
    return () => clearInterval(interval)
  }, [currentMode, fetchTrains])

  useEffect(() => () => { mountedRef.current = false }, [])

  const setMode = useCallback((mode) => setCurrentMode(mode), [setCurrentMode])

  const trackTrain = useCallback((serviceId) => {
    if (!serviceId) {
      showStatus('warning', 'Cannot track this service — it has no ID.')
      return
    }
    if (trackedIDRef.current === serviceId) {
      setTrackedServiceID(null)
      trackedStatusRef.current = null
      trackedExpectedRef.current = null
      trackedNotifiedRef.current = false
      showStatus('info', 'Stopped tracking this train.')
    } else {
      setTrackedServiceID(serviceId)
      trackedStatusRef.current = null
      trackedExpectedRef.current = null
      trackedNotifiedRef.current = false
      showStatus('success', 'Now tracking this train for delay alerts.')
    }
  }, [setTrackedServiceID, showStatus])

  const requestNotifications = useCallback(() => {
    if (!('Notification' in window) || Notification.permission !== 'default') return
    Notification.requestPermission().then((perm) => {
      if (perm === 'granted') {
        setNotificationsGranted(true)
        showStatus('success', 'Notifications enabled. You will be alerted about your tracked train.')
      }
    })
  }, [showStatus])

  const clearCacheAndReload = useCallback(() => {
    localStorage.removeItem('train-times-version')
    localStorage.removeItem('train-times-last-check')
    window.location.href = `${window.location.href.split('?')[0]}?v=${Date.now()}&_reload=1`
  }, [])

  return {
    currentMode,
    setMode,
    trains,
    routeOptions,
    isLoading,
    status,
    lastUpdate,
    walkingInfo,
    homeRoutingInfo,
    mockLocation,
    locationLabel,
    trackedServiceID,
    trackTrain,
    fetchTrains,
    notificationsGranted,
    requestNotifications,
    clearCacheAndReload,
  }
}
