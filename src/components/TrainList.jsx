import TrainCard from './TrainCard'
import { HOME_ADDRESS } from '../constants/stations'
import { buildMapsUrl } from '../utils/maps'

export default function TrainList({ trains, isLoading, trackedServiceID, onTrack, currentMode, homeRoutingInfo }) {
  if (isLoading && trains.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-10 text-center shadow-lg">
        <div className="flex flex-col items-center gap-4">
          <svg className="w-12 h-12 text-slate-300 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <p className="text-sm font-semibold text-slate-400">Loading train times…</p>
        </div>
      </div>
    )
  }

  if (trains.length === 0) {
    if (currentMode === 'home' && homeRoutingInfo?.location && HOME_ADDRESS) {
      const homeMapsUrl = buildMapsUrl(homeRoutingInfo.location, HOME_ADDRESS, 'transit')
      return (
        <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
          <p className="text-sm font-medium text-slate-600 mb-2">No Great Northern trains right now.</p>
          <a
            href={homeMapsUrl}
            target="_blank"
            rel="noopener"
            className="text-xs font-semibold text-amber-600 hover:text-amber-700 underline transition-colors"
          >
            Open transit directions in Maps
          </a>
        </div>
      )
    }

    return (
      <div className="bg-white rounded-2xl p-10 text-center shadow-lg">
        <div className="flex flex-col items-center gap-3">
          <svg className="w-16 h-16 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-slate-400 mb-1">Ready to load train times</p>
            <p className="text-xs text-slate-400">Tap the refresh button above</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {trains.map((train, index) => (
        <TrainCard
          key={train.serviceID || train.serviceId || index}
          train={train}
          index={index}
          trackedServiceID={trackedServiceID}
          onTrack={onTrack}
        />
      ))}
    </div>
  )
}
