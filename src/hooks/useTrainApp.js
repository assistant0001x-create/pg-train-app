import { useState, useRef, useEffect, useCallback } from 'react'
import {
  GREAT_NORTHERN_STATIONS,
  PALMERS_GREEN,
  MOORGATE,
  TUBE_STATIONS,
  TUBE_TRAIN_INTERCHANGE,
  HOME_ADDRESS,
  MAX_WALK_MINUTES,
  DEPARTURE_NOTIFY_MINUTES,
  TUBE_STATION_BUS_ROUTES,
  OVERGROUND_STATIONS,
} from '../constants/stations'
import { getNearestLocation, walkingMinutes } from '../utils/distance'
import { buildMapsUrl } from '../utils/maps'
import { fetchDepartures, fetchTubeArrivals, fetchOvergroundArrivals, fetchNearbyBusOptions } from '../utils/trainApi'
import { getDummyRouteOptions } from '../utils/dummyData'

// Set VITE_DUMMY_MODE=false in .env to use the live API
const DUMMY_MODE = import.meta.env.VITE_DUMMY_MODE !== 'false'

// Default home destination shown across HOME mode routes
const HOME_DESTINATION = HOME_ADDRESS || '73 Hazelwood Lane, N13 5HE'

// Approximate GN journey times (minutes) from each station to Palmers Green
const JOURNEY_MINS_TO_PAL = {
  MOG: 30, OLD: 27, EXR: 24, HBY: 21, DRN: 18,
  FPK: 15, HRY: 12, HPY: 9,  ALX: 6,  BVP: 4,
  WGC: 4,  GAN: 6,  ENF: 9,  GNT: 12, CWN: 15, CHN: 18,
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

function getOptionSortMinutes(option) {
  const baseJourney = option.journeyMins ?? 0
  const walk = option.walkMins ?? 0
  if (!option.departures || option.departures.length === 0) return Number.POSITIVE_INFINITY

  const nextMins = option.departures
    .filter((d) => !d.isCancelled)
    .map((d) => {
      const t = d.etd && d.etd !== 'On time' ? d.etd : d.std
      const dep = parseDepartureTime(t)
      if (!dep) return null
      const mins = Math.round((dep.getTime() - Date.now()) / 60000)
      if (mins < 0 || mins > 300) return null
      return mins
    })
    .filter((m) => m !== null)

  if (nextMins.length === 0) return Number.POSITIVE_INFINITY

  const catchable = nextMins.find((m) => m >= walk)
  if (catchable == null) return Number.POSITIVE_INFINITY

  return catchable + baseJourney
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
        // ── LIVE HOME mode ────────────────────────────────────────────────────
        // All options route the traveller TO Palmers Green / 73 Hazelwood Lane.
        //
        // Option categories:
        //   1. Train only       — nearest GN station → GN train → Palmers Green
        //   2. Tube + Train     — Piccadilly → Finsbury Park → GN → Palmers Green
        //   3. Tube only        — Piccadilly → Arnos Grove / Bounds Green / Wood Green
        //                          (eastbound arrivals shown at near-home station)
        //   4. Overground       — Silver Street (for users coming from east London)
        //   5. Bus              — when walking leg > 15 min in any option
        // ─────────────────────────────────────────────────────────────────────

        let station = GREAT_NORTHERN_STATIONS.find((s) => s.code === 'FPK') || GREAT_NORTHERN_STATIONS[0]
        let location = null
        let trainWalkMins = null
        let trainMapsUrl = null

        try {
          location = await getUserLocation()
          const nearest = getNearestLocation(location, GREAT_NORTHERN_STATIONS)
          if (nearest) station = nearest
          trainWalkMins = walkingMinutes(location.lat, location.lon, station.lat, station.lon)
          const travelMode = trainWalkMins <= MAX_WALK_MINUTES ? 'walking' : 'transit'
          trainMapsUrl = buildMapsUrl(location, `${station.lat},${station.lon}`, travelMode)
          setWalkingInfo({ trainWalkMins, station, mapsUrl: trainMapsUrl, travelMode, locationError: false })
        } catch (locErr) {
          trainMapsUrl = buildMapsUrl(null, `${station.lat},${station.lon}`, 'walking')
          setWalkingInfo({ trainWalkMins: null, station, mapsUrl: trainMapsUrl, travelMode: 'walking', locationError: true })
          console.warn('Could not get user location:', locErr)
        }

        setHomeRoutingInfo({ location, nearestTrain: station, trainWalkMins })

        // ── 1. GN Train only ─────────────────────────────────────────────────
        const services = await fetchDepartures(station.code, PALMERS_GREEN.code, { force })
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
          reliableDuration: true,
        }

        // ── 2. Tube + Train via Finsbury Park ────────────────────────────────
        // Shows live GN departures from FPK → PAL.
        // The user takes Piccadilly (any direction) to Finsbury Park, then boards here.
        let tubePlusTrainOption = null
        try {
          const fpkServices = await fetchDepartures(TUBE_TRAIN_INTERCHANGE.crs, PALMERS_GREEN.code, { force })
          tubePlusTrainOption = {
            id: 'tube-train-fpk',
            type: 'tube+train',
            station: { name: TUBE_TRAIN_INTERCHANGE.name },
            walkMins: null,
            journeyMins: JOURNEY_MINS_TO_PAL[TUBE_TRAIN_INTERCHANGE.crs] || null,
            destination: PALMERS_GREEN.name,
            line: 'Great Northern',
            tubeLine: 'Piccadilly',
            operator: 'Great Northern / TfL',
            mapsUrl: null,
            departures: fpkServices,
            serviceNote: 'Take Piccadilly line to Finsbury Park, then GN train',
            reliableDuration: true,
          }
        } catch {
          // Non-critical — omit if FPK fetch fails
        }

        // ── 3. Tube only — eastbound arrivals at near-home Piccadilly stations ─
        // TUBE_STATIONS are the alight-here stations (Arnos Grove, Bounds Green, Wood Green).
        // journeyMins = walk from that station to Palmers Green (the final leg home).
        // walkMins = null because we don't know the user's boarding station on the Piccadilly line.
        const tubeOptions = await Promise.all(
          TUBE_STATIONS.map(async (ts) => {
            let departures = []
            let serviceNote
            try {
              departures = await fetchTubeArrivals(ts.naptanId)
            } catch {
              serviceNote = 'Check TfL app for live times'
            }
            const walkHome = Math.round(
              walkingMinutes(ts.lat, ts.lon, PALMERS_GREEN.lat, PALMERS_GREEN.lon)
            )
            return {
              id: `tube-${ts.name.replace(/\s+/g, '-').toLowerCase()}`,
              type: 'tube',
              station: { name: ts.name, line: ts.line },
              walkMins: null,          // boarding station unknown
              journeyMins: walkHome,   // walk from this station to home
              destination: HOME_DESTINATION,
              line: ts.line,
              operator: 'TfL',
              mapsUrl: null,
              departures,
              serviceNote,
              reliableDuration: false,
            }
          })
        )

        // ── 4. Silver Street Overground (east London users only) ─────────────
        // Silver Street is east of Palmers Green. Only relevant when the user is
        // in east London (Edmonton, Tottenham, Hackney, Liverpool Street area).
        // Threshold: lon > -0.085 (east of the N13 / Palmers Green boundary).
        // Platform 2 = northbound trains from Liverpool Street toward Cheshunt.
        const isEastOfHome = location ? location.lon > -0.085 : false
        const overgroundOptions = isEastOfHome
          ? await Promise.all(
              OVERGROUND_STATIONS.map(async (os) => {
                let departures = []
                let serviceNote
                try {
                  departures = await fetchOvergroundArrivals(os.naptanId, { platformFilter: os.inboundPlatform })
                } catch {
                  serviceNote = 'Check TfL app for live times'
                }
                return {
                  id: `overground-${os.name.replace(/\s+/g, '-').toLowerCase()}`,
                  type: 'overground',
                  station: { name: os.name, line: os.line },
                  walkMins: null,
                  journeyMins: null,
                  destination: HOME_DESTINATION,
                  line: os.line,
                  operator: 'London Overground',
                  mapsUrl: null,
                  departures,
                  serviceNote: serviceNote || 'Alight here then bus 102 to Palmers Green',
                  reliableDuration: false,
                }
              })
            )
          : []

        // ── 5. Bus options near user GPS + feeder buses for long walks ──────
        let busOptions = []
        let feederBusOptions = []
        if (location) {
          try {
            const busData = await fetchNearbyBusOptions(location.lat, location.lon)

            // Generic nearby bus routes home
            busOptions = busData.map(({ route, stop, departures }) => {
              const stopWalkMins = walkingMinutes(location.lat, location.lon, stop.lat, stop.lon)
              const stopMapsUrl = buildMapsUrl(location, `${stop.lat},${stop.lon}`, 'walking')
              return {
                id: `bus-${route.toLowerCase()}-${stop.id}`,
                type: 'bus',
                station: { name: stop.name, line: route },
                walkMins: stopWalkMins,
                journeyMins: null,
                destination: HOME_DESTINATION,
                line: route,
                operator: 'TfL',
                mapsUrl: stopMapsUrl,
                departures,
                reliableDuration: false,
              }
            })

            // If walk to a train/tube station is > 15 min, add a bus-to-station option
            const longWalkTargets = []
            if (trainWalkMins != null && trainWalkMins > MAX_WALK_MINUTES) {
              longWalkTargets.push({
                key: `train-${station.code}`,
                stationName: station.name,
                stationType: 'train',
                stationCode: station.code,
                allowedRoutes: null,
              })
            }

            TUBE_STATIONS.forEach((ts) => {
              const walkToTube = Math.round(walkingMinutes(location.lat, location.lon, ts.lat, ts.lon))
              if (walkToTube > MAX_WALK_MINUTES) {
                longWalkTargets.push({
                  key: `tube-${ts.naptanId}`,
                  stationName: ts.name,
                  stationType: 'tube',
                  stationCode: ts.naptanId,
                  allowedRoutes: (TUBE_STATION_BUS_ROUTES[ts.naptanId] || []).map((r) => r.toLowerCase()),
                })
              }
            })

            const seenFeeder = new Set()
            longWalkTargets.forEach((target) => {
              busData.forEach(({ route, stop, departures }) => {
                const routeKey = route.toLowerCase()
                if (target.allowedRoutes && !target.allowedRoutes.includes(routeKey)) return

                const id = `bus-feeder-${target.key}-${routeKey}`
                if (seenFeeder.has(id)) return
                seenFeeder.add(id)

                const stopWalkMins = Math.round(walkingMinutes(location.lat, location.lon, stop.lat, stop.lon))
                const stopMapsUrl = buildMapsUrl(location, `${stop.lat},${stop.lon}`, 'walking')

                feederBusOptions.push({
                  id,
                  type: 'bus',
                  station: { name: stop.name, line: route },
                  walkMins: stopWalkMins,
                  journeyMins: null,
                  destination: target.stationName,
                  line: route,
                  operator: 'TfL',
                  mapsUrl: stopMapsUrl,
                  departures,
                  serviceNote: `Bus feeder to ${target.stationType === 'train' ? 'train' : 'tube'} at ${target.stationName}`,
                  reliableDuration: false,
                })
              })
            })
          } catch (e) {
            console.warn('Bus options failed:', e)
          }
        }

        // ── 5b. Final-leg buses near each tube alight station ─────────────────
        const finalLegRaw = (await Promise.all(
          TUBE_STATIONS.map(async (ts) => {
            const walkHome = walkingMinutes(ts.lat, ts.lon, PALMERS_GREEN.lat, PALMERS_GREEN.lon)
            if (walkHome <= MAX_WALK_MINUTES) return []
            try {
              const data = await fetchNearbyBusOptions(ts.lat, ts.lon)
              return data.map(({ route, stop, departures }) => ({
                fromTubeStation: ts.name,
                route,
                stop,
                departures,
                stopWalkMins: Math.round(walkingMinutes(ts.lat, ts.lon, stop.lat, stop.lon)),
              }))
            } catch {
              return []
            }
          })
        )).flat()

        const shownRoutes = new Set([...busOptions, ...feederBusOptions].map((b) => b.line.toLowerCase()))
        const finalLegBusOptions = finalLegRaw
          .filter(({ route }) => {
            if (shownRoutes.has(route.toLowerCase())) return false
            shownRoutes.add(route.toLowerCase())
            return true
          })
          .map(({ fromTubeStation, route, stop, departures, stopWalkMins }) => ({
            id: `bus-final-${route.toLowerCase()}-${fromTubeStation.replace(/\s+/g, '-').toLowerCase()}`,
            type: 'bus',
            station: { name: stop.name, line: route },
            walkMins: stopWalkMins,
            journeyMins: null,
            destination: HOME_DESTINATION,
            line: route,
            operator: 'TfL',
            mapsUrl: null,
            departures,
            serviceNote: `From ${fromTubeStation} → Palmers Green`,
            reliableDuration: false,
          }))

        const otherOptions = [
          ...(tubePlusTrainOption ? [tubePlusTrainOption] : []),
          ...tubeOptions,
          ...overgroundOptions,
          ...busOptions,
          ...feederBusOptions,
          ...finalLegBusOptions,
        ].sort((a, b) => getOptionSortMinutes(a) - getOptionSortMinutes(b))

        setRouteOptions([trainOption, ...otherOptions])
        setTrains(services.slice(0, 12))
        setLastUpdate(new Date())
        showStatus('success', 'Connected. Showing live departures.')
        return
      }

      // ── OUT mode only below this point ────────────────────────────────────
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
