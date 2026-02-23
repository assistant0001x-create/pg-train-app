import { HOME_ADDRESS } from '../constants/stations'
import { buildTransitMapsUrl } from '../utils/maps'

export default function HomeOptions({ homeRoutingInfo }) {
  if (!homeRoutingInfo || !HOME_ADDRESS) return null

  const { location, nearestTrain, nearestTube, trainWalkMins, tubeWalkMins } = homeRoutingInfo

  const fastestUrl = buildTransitMapsUrl(location, HOME_ADDRESS)
  const busUrl = buildTransitMapsUrl(location, HOME_ADDRESS, 'bus')
  const tubeUrl = buildTransitMapsUrl(location, HOME_ADDRESS, 'subway')
  const trainUrl = buildTransitMapsUrl(location, HOME_ADDRESS, 'train')

  const trainLabel = nearestTrain ? `${nearestTrain.name} (Great Northern)` : 'nearest National Rail station'
  const tubeLabel = nearestTube ? `${nearestTube.name} (${nearestTube.line})` : 'nearest Underground station'

  const options = [
    {
      href: fastestUrl,
      icon: '⚡',
      bg: 'bg-pink-500/20',
      color: 'text-pink-300',
      title: 'Fastest mix',
      desc: 'Bus + tube + train suggestions',
    },
    {
      href: busUrl,
      icon: '🚌',
      bg: 'bg-indigo-500/20',
      color: 'text-indigo-200',
      title: 'Bus focus',
      desc: `Surface routes to ${HOME_ADDRESS}`,
    },
    {
      href: tubeUrl,
      icon: '🚇',
      bg: 'bg-purple-500/20',
      color: 'text-purple-200',
      title: 'Underground focus',
      desc: tubeWalkMins != null ? `${tubeWalkMins} min walk to ${tubeLabel}` : `Walk to ${tubeLabel}`,
    },
    {
      href: trainUrl,
      icon: '🚆',
      bg: 'bg-emerald-500/20',
      color: 'text-emerald-200',
      title: 'Train focus',
      desc: trainWalkMins != null ? `${trainWalkMins} min walk to ${trainLabel}` : `Walk to ${trainLabel}`,
    },
  ]

  return (
    <div className="glass-effect rounded-2xl p-5 border border-pink-500/20 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-purple-300/80">Quickest ways home</p>
          <h2 className="text-lg font-semibold text-white">Choose the best option right now</h2>
        </div>
        <span className="text-xs text-pink-300 font-semibold">Citymapper-style</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {options.map(({ href, icon, bg, color, title, desc }) => (
          <a
            key={title}
            href={href}
            target="_blank"
            rel="noopener"
            className="glass-card rounded-2xl p-4 hover:shadow-xl transition-all border border-purple-500/30"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center ${color}`}>
                {icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="text-xs text-purple-300/80">{desc}</p>
              </div>
            </div>
          </a>
        ))}
      </div>

      <p className="text-[11px] text-purple-300/70 mt-3">
        Links open Google Maps to show live timings and the quickest routes.
      </p>
    </div>
  )
}
