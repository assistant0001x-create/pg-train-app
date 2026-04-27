import RouteOptionCard from './RouteOptionCard'
import GoogleMapsPanel from './GoogleMapsPanel'
import HireCarSection from './HireCarSection'

export default function HomeOptions({ routeOptions, isLoading, userLocation }) {
  const preferred = routeOptions?.[0] ?? null

  if (isLoading && !preferred) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 text-center mb-4">
        <p className="text-sm text-slate-500">Finding routes near you…</p>
      </div>
    )
  }

  return (
    <div className="mb-5 space-y-4">
      {preferred && (
        <div>
          <p className="text-[10px] font-semibold text-white/40 mb-2 px-1 uppercase tracking-wide">
            Preferred Train Route
          </p>
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <RouteOptionCard option={preferred} isLast />
          </div>
        </div>
      )}

      <GoogleMapsPanel userLocation={userLocation} />

      <HireCarSection userLocation={userLocation} />
    </div>
  )
}
