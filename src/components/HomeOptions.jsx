import RouteOptionCard from './RouteOptionCard'

export default function HomeOptions({ routeOptions, isLoading }) {
  if (isLoading && (!routeOptions || routeOptions.length === 0)) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-slate-500 mb-4 shadow-sm">
        <p className="text-sm">Finding routes near you…</p>
      </div>
    )
  }

  if (!routeOptions || routeOptions.length === 0) return null

  const [preferred, ...others] = routeOptions

  return (
    <div className="mb-5 space-y-3">
      {preferred && (
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-2 px-1 uppercase tracking-wide">Preferred Train Route</p>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <RouteOptionCard option={preferred} isLast />
          </div>
        </div>
      )}

      {others.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-slate-500 mb-2 px-1">Other options (fastest first)</p>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            {others.map((option, i) => (
              <RouteOptionCard
                key={option.id}
                option={option}
                isLast={i === others.length - 1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
