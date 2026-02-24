import { useState, useRef, useEffect, useCallback } from 'react'
import {
  GREAT_NORTHERN_STATIONS,
  PALMERS_GREEN,
  MOORGATE,
  TUBE_STATIONS,
  HOME_ADDRESS,
  MAX_WALK_MINUTES,
  DEPARTURE_NOTIFY_MINUTES,
  TUBE_STATION_BUS_ROUTES,
} from '../constants/stations'
import { getNearestLocation, walkingMinutes } from '../utils/distance'
import { buildMapsUrl } from '../utils/maps'
import { fetchDepartures, fetchTubeArrivals, fetchNearbyBusOptions } from '../utils/trainApi'
import { getDummyRouteOptions } from '../utils/dummyData'

// Set VITE_DUMMY_MODE=false in .env to use the live API
const DUMMY_MODE = import.meta.env.VITE_DUMMY_MODE !== 'false'

// Approximate train journey times (minutes) from each GN station to Palmers Green
const JOURNEY_MINS_TO_PAL = {
  MOG: 30, OLD: 27, EXR: 24, HBY: 21, DRN: 18,
  FPK: 15, HRY: 12, HPY: 9,  ALX: 6,  BVP: 4,
  WGC: 4,  GAN: 6,  ENF: 9,  GNT: 12, CWN: 15, CHN: 18,
}

// Approximate Piccadilly tube journey times (minutes) to King's Cross St. Pancras
const JOURNEY_MINS_TO_KGX = {
  'Arnos Grove': 22,
  'Bounds Green': 20,
  'Southgate': 25,
}

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

async function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Geolocation not supported'))
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      reject,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    )
  })
}

export function useTrainApp() {
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
  const [notificationsGranted, setNotificationsGranted] = useState(
    typeof Notification !== 'undefined' && Notification.permission === 'granted'
  )

  // Refs so fetchTrains (stable callback) always reads current values
  const currentModeRef = useRef('out')
  const trackedIDRef = useRef(null)
  const trackedStatusRef = useRef(null)
  const trackedExpectedRef = useRef(null)
  const trackedNotifiedRef = useRef(false)

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
        setRouteOptions(getDummyRouteOptions())
        setTrains([])
        setLastUpdate(new Date())
        showStatus('info', 'Demo mode — showing dummy route data. Set VITE_DUMMY_MODE=false for live data.')
        return
      } else {
        // LIVE HOME mode — self-contained: fetches, builds routeOptions, returns early
        let station = GREAT_NORTHERN_STATIONS.find((s) => s.code === 'FPK') || GREAT_NORTHERN_STATIONS[0]
        let location = null
        let trainWalkMins = null
        let trainMapsUrl = null
        let tubeStationsWithWalk = []

        try {
          location = await getUserLocation()
          const nearest = getNearestLocation(location, GREAT_NORTHERN_STATIONS)
          if (nearest) station = nearest
          trainWalkMins = walkingMinutes(location.lat, location.lon, station.lat, station.lon)
          const travelMode = trainWalkMins <= MAX_WALK_MINUTES ? 'walking' : 'transit'
          trainMapsUrl = buildMapsUrl(location, `${station.lat},${station.lon}`, travelMode)
          setWalkingInfo({ trainWalkMins, station, mapsUrl: trainMapsUrl, travelMode, locationError: false })
          tubeStationsWithWalk = TUBE_STATIONS.map((s) => ({
            ...s,
            walkMins: walkingMinutes(location.lat, location.lon, s.lat, s.lon),
            mapsUrl: buildMapsUrl(location, `${s.lat},${s.lon}`, 'walking'),
          })).sort((a, b) => a.walkMins - b.walkMins)
        } catch (locErr) {
          trainMapsUrl = buildMapsUrl(null, `${station.lat},${station.lon}`, 'walking')
          setWalkingInfo({ trainWalkMins: null, station, mapsUrl: trainMapsUrl, travelMode: 'walking', locationError: true })
          console.warn('Could not get user location:', locErr)
        }

        setHomeRoutingInfo({
          location,
          nearestTrain: station,
          nearestTube: tubeStationsWithWalk[0] || null,
          trainWalkMins,
          tubeWalkMins: tubeStationsWithWalk[0]?.walkMins || null,
          tubeStations: tubeStationsWithWalk,
        })

        // Fetch live GN departures (one API call)
        const services = await fetchDepartures(station.code, PALMERS_GREEN.code, { force })

        // Build GN train route option
        const trainOption = {
          id: `train-${station.code}`,
          type: 'train',
          station: { code: station.code, name: station.name },
          walkMins: trainWalkMins,
          journeyMins: JOURNEY_MINS_TO_PAL[station.code] || null,
          destination: PALMERS_GREEN.name,
          line: 'Great Northern',
          operator: 'Great Northern',
          mapsUrl: trainMapsUrl,
          departures: services,
        }

        // Build Piccadilly tube options with live TfL arrivals
        const nearbyTubeStations = tubeStationsWithWalk.filter((ts) => ts.walkMins != null && ts.walkMins <= 25)
        const tubeOptions = await Promise.all(
          nearbyTubeStations.map(async (ts) => {
            let departures = []
            let serviceNote
            if (ts.naptanId) {
              try {
                departures = await fetchTubeArrivals(ts.naptanId)
              } catch {
                serviceNote = 'Check TfL app for live times'
              }
            } else {
              serviceNote = 'Check TfL app for live times'
            }
            return {
              id: `tube-${ts.name.replace(/\s+/g, '-').toLowerCase()}`,
              type: 'tube',
              station: { name: ts.name, line: ts.line },
              walkMins: ts.walkMins,
              journeyMins: JOURNEY_MINS_TO_KGX[ts.name] || null,
              destination: "King's Cross St. Pancras",
              line: ts.line,
              operator: 'TfL',
              mapsUrl: ts.mapsUrl || null,
              departures,
              serviceNote,
            }
          })
        )

        // Fetch live bus options near user's GPS location
        let busOptions = []
        if (location) {
          try {
            const busData = await fetchNearbyBusOptions(location.lat, location.lon)
            busOptions = busData.map(({ route, stop, departures }) => {
              const stopWalkMins = walkingMinutes(location.lat, location.lon, stop.lat, stop.lon)
              const stopMapsUrl = buildMapsUrl(location, `${stop.lat},${stop.lon}`, 'walking')
              // If this route serves a tube station >15 min walk, label it as "bus to station"
              const farTubeStation = tubeStationsWithWalk.find(
                (ts) =>
                  ts.naptanId &&
                  (ts.walkMins ?? 0) > 15 &&
                  (TUBE_STATION_BUS_ROUTES[ts.naptanId] || []).includes(route.toLowerCase())
              )
              return {
                id: `bus-${route.toLowerCase()}-${stop.id}`,
                type: 'bus',
                station: { name: stop.name, line: route },
                walkMins: stopWalkMins,
                journeyMins: null,
                destination: farTubeStation ? farTubeStation.name : 'Palmers Green',
                line: route,
                operator: 'TfL',
                mapsUrl: stopMapsUrl,
                departures,
              }
            })
          } catch (e) {
            console.warn('Bus options failed:', e)
          }
        }

        setRouteOptions([trainOption, ...tubeOptions, ...busOptions])
        setTrains(services.slice(0, 12))
        setLastUpdate(new Date())
        showStatus('success', 'Connected. Showing live departures.')
        return
      }

      // ── OUT mode only below this point ───────────────────────────────────
      // calling_at filter is handled by the API — no client-side filtering needed
      let services = await fetchDepartures(fromStation, toCrs, { force })

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
      console.error('Error:', error)
      showStatus('error', `Failed to fetch train times: ${error.message}`)
      setTrains([])
    } finally {
      setIsLoading(false)
    }
  }, [setTrackedServiceID, showStatus])

  // Fetch whenever mode changes (and on mount)
  useEffect(() => {
    fetchTrains()
  }, [currentMode, fetchTrains])

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
    trackedServiceID,
    trackTrain,
    fetchTrains,
    notificationsGranted,
    requestNotifications,
    clearCacheAndReload,
  }
}
