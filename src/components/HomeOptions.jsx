import RouteOptionCard from './RouteOptionCard'
import HireCarSection from './HireCarSection'

export default function HomeOptions({ routeOptions, isLoading, userLocation }) {
  const preferred = routeOptions?.[0] ?? null
  const others = routeOptions?.slice(1) ?? []

  if (isLoading && !preferred) {
    return (
      <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-6 text-center mb-4">
        <p className="text-sm text-white/40">Finding routes near you…</p>
      </div>
    )
  }

  return (
    <div className="mb-5 space-y-4">
      {preferred && (
        <div>
          <p className="text-[10px] font-semibold text-amber-400/80 mb-2 px-1 uppercase tracking-wide">
            Fastest home via Palmers Green
          </p>
          <RouteOptionCard option={preferred} isPreferred />
        </div>
      )}

      {others.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-white/30 mb-2 px-1 uppercase tracking-wide">
            Other options
          </p>
          <div className="space-y-2">
            {others.map((option) => (
              <RouteOptionCard key={option.id} option={option} />
            ))}
          </div>
        </div>
      )}

      <HireCarSection userLocation={userLocation} />
    </div>
  )
}
