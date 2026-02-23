export default function HomeOptions({ homeRoutingInfo, onOpenModal }) {
  if (!homeRoutingInfo) return null

  const { trainWalkMins, nearestTrain, tubeStations } = homeRoutingInfo
  const nearestTube = tubeStations?.[0]

  const trainSub = nearestTrain
    ? `${trainWalkMins != null ? `${trainWalkMins} min walk · ` : ''}${nearestTrain.name}`
    : 'Great Northern'

  const tubeSub = nearestTube
    ? `${nearestTube.walkMins != null ? `${nearestTube.walkMins} min walk · ` : ''}${nearestTube.name}`
    : 'Piccadilly Line'

  return (
    <div className="flex gap-3 mb-4">
      <button
        onClick={() => onOpenModal('train')}
        className="flex-1 glass-card rounded-2xl px-4 py-4 border border-purple-500/30 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all text-left active:scale-95"
      >
        <div className="text-xl mb-1">🚆</div>
        <div className="text-sm font-semibold text-white">Train</div>
        <div className="text-[11px] text-purple-300/70 truncate mt-0.5">{trainSub}</div>
      </button>

      <button
        onClick={() => onOpenModal('tube')}
        className="flex-1 glass-card rounded-2xl px-4 py-4 border border-purple-500/30 hover:border-blue-500/50 hover:bg-blue-500/10 transition-all text-left active:scale-95"
      >
        <div className="text-xl mb-1">🚇</div>
        <div className="text-sm font-semibold text-white">Underground</div>
        <div className="text-[11px] text-purple-300/70 truncate mt-0.5">{tubeSub}</div>
      </button>
    </div>
  )
}
