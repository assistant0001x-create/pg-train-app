import { HOME_ADDRESS } from '../constants/stations'

export default function Header({
  currentMode,
  setMode,
  isLoading,
  fetchTrains,
  lastUpdate,
  notificationsGranted,
  requestNotifications,
  clearCacheAndReload,
}) {
  const homeLabel = HOME_ADDRESS || '73 Hazelwood Lane, N13 5HE'
  const subtitle = currentMode === 'out'
    ? 'Palmers Green → Moorgate'
    : `Current location → ${homeLabel}`

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 mb-4 shadow-xl">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-[10px] font-bold text-amber-500 tracking-widest uppercase">PG Routes</p>
          <h1 className="text-2xl font-bold text-slate-900 leading-tight">Palmers Green</h1>
          <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
        </div>
        <button
          onClick={() => fetchTrains({ force: true })}
          className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 active:bg-slate-700 transition-colors shrink-0"
          aria-label="Refresh routes"
        >
          <svg
            className={`w-5 h-5 text-white ${isLoading ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 bg-slate-100 rounded-xl p-1 mb-4">
        {['out', 'home'].map((mode) => {
          const active = currentMode === mode
          return (
            <button
              key={mode}
              onClick={() => setMode(mode)}
              className={`rounded-lg py-2.5 text-sm font-bold tracking-wide transition-all ${
                active
                  ? 'bg-amber-400 text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {mode.toUpperCase()}
            </button>
          )
        })}
      </div>

      <div className="text-xs text-slate-400">
        {lastUpdate ? `Updated ${lastUpdate.toLocaleTimeString('en-GB')}` : 'Loading…'}
      </div>

      <div className="flex items-center gap-4 flex-wrap pt-3 mt-3 border-t border-slate-100">
        {!notificationsGranted && (
          <button
            onClick={requestNotifications}
            className="text-xs text-amber-600 font-semibold hover:text-amber-700"
          >
            Enable alerts
          </button>
        )}
        <button
          onClick={clearCacheAndReload}
          className="text-xs text-slate-400 font-semibold hover:text-slate-600"
        >
          Force update
        </button>
      </div>
    </div>
  )
}
