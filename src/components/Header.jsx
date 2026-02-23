export default function Header({
  currentMode,
  setMode,
  isLoading,
  fetchTrains,
  lastUpdate,
  walkingInfo,
  autoRefreshEnabled,
  setAutoRefreshEnabled,
  notificationsGranted,
  requestNotifications,
  clearCacheAndReload,
}) {
  const routeInfo =
    currentMode === 'out'
      ? 'Palmers Green → Moorgate'
      : walkingInfo
      ? `${walkingInfo.station.name} → Palmers Green`
      : 'Your location → Home'

  function WalkingDisplay() {
    if (!walkingInfo || currentMode === 'out') return null
    const { trainWalkMins, station, mapsUrl, travelMode, locationError } = walkingInfo
    if (locationError) {
      return (
        <span>
          📍{' '}
          <a href={mapsUrl} target="_blank" rel="noopener" className="underline text-pink-300 hover:text-pink-200 transition-colors">
            Directions to {station.name}
          </a>{' '}
          (enable location for best route)
        </span>
      )
    }
    if (travelMode === 'walking' && trainWalkMins != null) {
      return (
        <span>
          🚶 {trainWalkMins} min walk to {station.name} (Great Northern) ·{' '}
          <a href={mapsUrl} target="_blank" rel="noopener" className="underline text-pink-300 hover:text-pink-200 transition-colors">
            Open walking route
          </a>
        </span>
      )
    }
    return (
      <span>
        🚌{trainWalkMins != null ? ` ${trainWalkMins} min to ${station.name} · ` : ' '}
        <a href={mapsUrl} target="_blank" rel="noopener" className="underline text-pink-300 hover:text-pink-200 transition-colors">
          Get public transport to {station.name}
        </a>
      </span>
    )
  }

  return (
    <div className="glass-effect rounded-3xl p-6 sm:p-8 mb-6 shadow-[0_20px_60px_rgba(0,0,0,0.5)] relative overflow-hidden">
      <div className="absolute inset-0 shimmer opacity-30" />
      <div className="relative z-10">

        {/* Title row */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-pink-500/20 border border-pink-500/40 animate-pulse-glow flex-shrink-0">
              <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-purple-300 mb-1 tracking-wide">TRAIN TIMES</p>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2">Palmers Green</h1>
              <p className="text-sm text-purple-200/80">Great Northern · Live departures</p>
            </div>
          </div>
          <button
            onClick={fetchTrains}
            className="p-3 rounded-2xl border border-pink-500/30 bg-pink-500/10 hover:bg-pink-500/20 transition-all hover:scale-105 hover:border-pink-500/50 backdrop-blur-sm flex-shrink-0"
            aria-label="Refresh trains"
          >
            <svg
              className={`w-6 h-6 text-pink-400 ${isLoading ? 'animate-spin' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-5 glass-card rounded-2xl p-1.5">
          {['out', 'home'].map((mode) => (
            <button
              key={mode}
              onClick={() => setMode(mode)}
              className={`flex-1 py-3 px-5 rounded-xl text-sm font-semibold transition-all ${
                currentMode === mode
                  ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/40 hover:shadow-pink-500/60'
                  : 'bg-transparent text-purple-200 hover:bg-white/5'
              }`}
            >
              {mode.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Route info */}
        <div className="text-sm mb-4 space-y-2">
          <div className="font-bold text-lg text-white">{routeInfo}</div>
          {walkingInfo && currentMode === 'home' && (
            <div className="text-xs text-pink-300 font-medium">
              <WalkingDisplay />
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-purple-300/70">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>
              {lastUpdate ? `Last updated: ${lastUpdate.toLocaleTimeString('en-GB')}` : 'Loading…'}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 flex-wrap pt-2 border-t border-purple-500/20">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-purple-200">
            <input
              type="checkbox"
              checked={autoRefreshEnabled}
              onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
              className="w-4 h-4 text-pink-500 rounded border-purple-500/30 bg-purple-900/30 focus:ring-pink-500 focus:ring-2"
            />
            <span>Auto refresh every minute</span>
          </label>
          {!notificationsGranted && (
            <button
              onClick={requestNotifications}
              className="ml-auto text-xs text-pink-400 hover:text-pink-300 font-semibold flex items-center gap-2 transition-colors"
            >
              <span>🔔</span>
              <span>Enable alerts</span>
            </button>
          )}
          <button
            onClick={clearCacheAndReload}
            className="text-xs text-purple-300 hover:text-purple-200 font-semibold flex items-center gap-2 transition-colors"
            title="Clear cache and reload"
          >
            <span>🔄</span>
            <span>Force Update</span>
          </button>
        </div>

      </div>
    </div>
  )
}
