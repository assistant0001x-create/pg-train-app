import { useEffect, useRef, useState } from 'react'

const HOME_DEST = '73 Hazelwood Lane, London N13 5HE'
const FALLBACK_ORIGIN = { lat: 51.5642, lng: -0.1065 } // Finsbury Park

let _mapsPromise = null

function loadMapsApi(apiKey) {
  if (_mapsPromise) return _mapsPromise
  if (window.google?.maps?.DirectionsService) {
    _mapsPromise = Promise.resolve(window.google.maps)
    return _mapsPromise
  }
  _mapsPromise = new Promise((resolve, reject) => {
    window.__pgMapsReady = () => resolve(window.google.maps)
    const s = document.createElement('script')
    s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=__pgMapsReady`
    s.async = true
    s.onerror = () => {
      _mapsPromise = null
      reject(new Error('Google Maps failed to load'))
    }
    document.head.appendChild(s)
  })
  return _mapsPromise
}

export default function GoogleMapsPanel({ userLocation }) {
  const mapRef = useRef(null)
  const rendererRef = useRef(null)
  const [error, setError] = useState(null)
  const [mapLoading, setMapLoading] = useState(true)
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  useEffect(() => {
    if (!apiKey || !mapRef.current) return
    setMapLoading(true)
    setError(null)
    let cancelled = false

    loadMapsApi(apiKey)
      .then((maps) => {
        if (cancelled || !mapRef.current) return

        const map = new maps.Map(mapRef.current, {
          zoom: 13,
          center: userLocation ? { lat: userLocation.lat, lng: userLocation.lon } : FALLBACK_ORIGIN,
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
          gestureHandling: 'cooperative',
        })

        if (rendererRef.current) rendererRef.current.setMap(null)
        const renderer = new maps.DirectionsRenderer({ map, suppressMarkers: false })
        rendererRef.current = renderer

        const origin = userLocation
          ? { lat: userLocation.lat, lng: userLocation.lon }
          : FALLBACK_ORIGIN

        new maps.DirectionsService().route(
          { origin, destination: HOME_DEST, travelMode: maps.TravelMode.TRANSIT },
          (result, status) => {
            if (cancelled) return
            setMapLoading(false)
            if (status === 'OK') {
              renderer.setDirections(result)
            } else {
              setError('No transit route found.')
            }
          }
        )
      })
      .catch(() => {
        if (!cancelled) {
          setMapLoading(false)
          setError('Could not load Google Maps.')
        }
      })

    return () => { cancelled = true }
  }, [apiKey, userLocation?.lat, userLocation?.lon])

  if (!apiKey) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 text-center mb-4">
        <p className="text-sm font-semibold text-slate-500">Google Maps not configured</p>
        <p className="text-xs text-slate-400 mt-1">Set VITE_GOOGLE_MAPS_API_KEY to enable transit directions.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-4">
      <div className="px-4 py-3 border-b border-slate-100">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Transit to Home</p>
        <p className="text-sm font-semibold text-slate-800 mt-0.5">73 Hazelwood Lane, N13</p>
        {!userLocation && (
          <p className="text-[10px] text-amber-500 mt-0.5">Showing routes from Finsbury Park — no GPS</p>
        )}
      </div>
      <div className="relative">
        <div ref={mapRef} style={{ height: 300 }} className="w-full" />
        {(mapLoading || error) && (
          <div className="absolute inset-0 bg-slate-50 flex items-center justify-center">
            {error
              ? <p className="text-sm text-slate-400">{error}</p>
              : <p className="text-sm text-slate-400">Loading map…</p>
            }
          </div>
        )}
      </div>
    </div>
  )
}
