import TrainCard from './TrainCard'
import { HOME_ADDRESS } from '../constants/stations'
import { buildMapsUrl } from '../utils/maps'

export default function TrainList({ trains, isLoading, trackedServiceID, onTrack, currentMode, homeRoutingInfo }) {
  if (isLoading && trains.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 shadow-sm">
        <div className="flex flex-col items-center gap-4">
          <svg className="w-16 h-16 text-slate-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <p className="text-sm font-semibold text-slate-500">Loading train times…</p>
        </div>
      </div>
    )
  }

  if (trains.length === 0) {
    if (currentMode === 'home' && homeRoutingInfo?.location && HOME_ADDRESS) {
      const homeMapsUrl = buildMapsUrl(homeRoutingInfo.location, HOME_ADDRESS, 'transit')
      return (
        <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-600 mb-2">No Great Northern trains right now.</p>
          <a
            href={homeMapsUrl}
            target="_blank"
            rel="noopener"
            className="underline text-emerald-700 hover:text-emerald-800 transition-colors text-xs"
          >
            Use public transport to {HOME_ADDRESS}
          </a>
        </div>
      )
    }

    return (
      <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <svg className="w-20 h-20 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <div className="absolute inset-0 hidden" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 mb-1">Ready to load train times</p>
            <p className="text-xs text-slate-500">Click the refresh button above to get started</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
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
