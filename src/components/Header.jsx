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
  const routeInfo = currentMode === 'out' ? 'Palmers Green → Moorgate' : `Current location → ${homeLabel}`
  const subtitle = currentMode === 'out' ? 'Live Great Northern departures' : 'Suggested multi-step routes home'

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 mb-4 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-xs font-semibold text-emerald-600 tracking-wide uppercase">PG Routes</p>
          <h1 className="text-2xl font-bold text-slate-900">Palmers Green</h1>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
        <button
          onClick={() => fetchTrains({ force: true })}
          className="p-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50"
          aria-label="Refresh routes"
        >
          <svg className={`w-5 h-5 text-slate-700 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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
              className={`rounded-lg py-2.5 text-sm font-semibold transition ${
                active ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-600 hover:bg-white'
              }`}
            >
              {mode.toUpperCase()}
            </button>
          )
        })}
      </div>

      <div className="text-sm text-slate-700 mb-2 font-semibold">{routeInfo}</div>
      <div className="text-xs text-slate-500">{lastUpdate ? `Updated ${lastUpdate.toLocaleTimeString('en-GB')}` : 'Loading…'}</div>

      <div className="flex items-center gap-4 flex-wrap pt-3 mt-3 border-t border-slate-200">
        {!notificationsGranted && (
          <button onClick={requestNotifications} className="text-xs text-emerald-700 font-semibold hover:text-emerald-800">
            🔔 Enable alerts
          </button>
        )}
        <button onClick={clearCacheAndReload} className="text-xs text-slate-600 font-semibold hover:text-slate-800">
          🔄 Force update
        </button>
      </div>
    </div>
  )
}
