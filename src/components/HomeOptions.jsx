import RouteOptionCard from './RouteOptionCard'

export default function HomeOptions({ routeOptions, isLoading }) {
  if (isLoading && (!routeOptions || routeOptions.length === 0)) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center text-purple-300/60 mb-4">
        <p className="text-sm">Finding routes near you…</p>
      </div>
    )
  }

  if (!routeOptions || routeOptions.length === 0) return null

  return (
    <div className="mb-5">
      {/* Plain section header — outside the panel, like CityMapper */}
      <p className="text-sm font-semibold text-purple-200/50 mb-2 px-1">Suggested</p>

      {/* All routes in one glass panel */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {routeOptions.map((option, i) => (
          <RouteOptionCard
            key={option.id}
            option={option}
            isLast={i === routeOptions.length - 1}
          />
        ))}
      </div>
    </div>
  )
}
