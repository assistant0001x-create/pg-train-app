import { calculateDistance } from '../utils/distance'
import { PALMERS_GREEN } from '../constants/stations'

const PROVIDERS = [
  {
    name: 'Uber',
    base: 2.50,
    perKm: 1.60,
    labelBg: 'bg-black',
    labelText: 'text-white',
    url: 'https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[formatted_address]=73+Hazelwood+Lane+London+N13+5HE',
  },
  {
    name: 'Freenow',
    base: 2.80,
    perKm: 1.70,
    labelBg: 'bg-yellow-400',
    labelText: 'text-yellow-900',
    url: 'https://ride.free-now.com/',
  },
  {
    name: 'Bolt',
    base: 2.00,
    perKm: 1.30,
    labelBg: 'bg-[#34d186]',
    labelText: 'text-white',
    url: 'https://bolt.eu/en/cities/london/',
  },
]

// Straight-line distance × urban road factor ≈ road distance
const ROAD_FACTOR = 1.3
const DRIVING_KMH = 25

export default function HireCarSection({ userLocation }) {
  let distanceKm = null
  let travelMins = null

  if (userLocation) {
    const straight = calculateDistance(
      userLocation.lat, userLocation.lon,
      PALMERS_GREEN.lat, PALMERS_GREEN.lon,
    )
    distanceKm = +(straight * ROAD_FACTOR).toFixed(1)
    travelMins = Math.round((distanceKm / DRIVING_KMH) * 60)
  }

  return (
    <div className="mb-5">
      <p className="text-[10px] font-semibold text-white/40 mb-2 px-1 uppercase tracking-wide">
        Hire Car — est. fares
      </p>
      <div className="space-y-3">
        {PROVIDERS.map((p) => {
          const fare = distanceKm != null
            ? `£${(p.base + p.perKm * distanceKm).toFixed(2)}`
            : null

          return (
            <a
              key={p.name}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between bg-slate-800 rounded-2xl shadow-md px-4 py-4 border border-white/5 active:opacity-75 transition-opacity"
            >
              <div className="flex items-center gap-3">
                <span className={`${p.labelBg} ${p.labelText} rounded-lg px-2.5 py-1 text-xs font-bold shrink-0`}>
                  {p.name}
                </span>
                <div>
                  {distanceKm != null ? (
                    <>
                      <p className="text-sm font-semibold text-white">est. {fare}</p>
                      <p className="text-[11px] text-white/40">{travelMins} min · {distanceKm} km</p>
                    </>
                  ) : (
                    <p className="text-sm text-white/40">Enable location for estimate</p>
                  )}
                </div>
              </div>
              <svg className="w-4 h-4 text-white/25 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          )
        })}
      </div>
    </div>
  )
}
