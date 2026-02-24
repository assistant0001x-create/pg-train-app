import { useState } from 'react'

// ── Helpers ────────────────────────────────────────────────────────────────

function minsFromNow(timeStr) {
  if (!timeStr || timeStr === 'On time' || timeStr === 'Delayed') return null
  const [h, m] = timeStr.split(':').map(Number)
  if (isNaN(h) || isNaN(m)) return null
  const now = new Date()
  const dep = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m)
  if (dep < now) dep.setDate(dep.getDate() + 1)
  return Math.round((dep - now) / 60000)
}

function effectiveTime(dep) {
  if (dep.isCancelled) return null
  return dep.etd && dep.etd !== 'On time' ? dep.etd : dep.std
}

// Earliest departure you can actually catch (departs after you arrive at station)
function firstCatchable(departures, walkMins) {
  return departures
    .filter((d) => !d.isCancelled)
    .map((d) => {
      const t = effectiveTime(d)
      return t != null ? minsFromNow(t) : null
    })
    .filter((m) => m !== null)
    .find((m) => m >= (walkMins ?? 0)) ?? null
}

// ── Transport badge chips ───────────────────────────────────────────────────

const BADGE_STYLES = {
  'Great Northern': 'bg-[#00843D] text-white',
  Piccadilly: 'bg-[#003688] text-white',
  'London Overground': 'bg-[#EE7C0E] text-white',
}

const BADGE_LABELS = {
  'Great Northern': 'GN',
  Piccadilly: 'Picc',
  'London Overground': 'OVG',
}

function ModeBadge({ line, type }) {
  const bg = type === 'bus'
    ? 'bg-[#E1251B] text-white'
    : (BADGE_STYLES[line] || 'bg-purple-700 text-white')
  const label = type === 'bus' ? line : (BADGE_LABELS[line] || line.slice(0, 4))
  const icon = type === 'train' ? '🚆' : type === 'bus' ? '🚌' : type === 'overground' ? '🚂' : '🚇'

  return (
    <span
      className={`inline-flex items-center gap-1 ${bg} text-[10px] font-extrabold px-1.5 py-0.5 rounded-[4px] tracking-tight leading-tight select-none`}
    >
      <span className="text-[11px] leading-none">{icon}</span>
      {label}
    </span>
  )
}

function WalkIcon({ mins }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-[11px] text-purple-300/50 font-medium">
      <span>🚶</span>
      {mins != null && <span>{mins}m</span>}
    </span>
  )
}

function Dot() {
  return <span className="text-purple-300/30 text-[10px] mx-0.5">·</span>
}

// ── Total journey time ──────────────────────────────────────────────────────

function TotalTime({ walkMins, journeyMins, departures }) {
  if (journeyMins == null) return null
  const catchMin = firstCatchable(departures, walkMins)
  if (catchMin == null) return null
  const total = catchMin + journeyMins
  return (
    <div className="flex-shrink-0 text-right">
      <span className="text-xl font-bold text-white leading-none">{total}</span>
      <span className="text-[10px] text-purple-300/50 ml-0.5">min</span>
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────────

export default function RouteOptionCard({ option, isLast }) {
  const [expanded, setExpanded] = useState(false)
  const { type, station, walkMins, journeyMins, destination, line, departures, mapsUrl, serviceNote } = option

  // "in 4, 19, 34 min" — next 3 non-cancelled countdowns
  const nextThree = departures
    .filter((d) => !d.isCancelled)
    .slice(0, 3)
    .map((d) => {
      const t = effectiveTime(d)
      return t != null ? minsFromNow(t) : null
    })
    .filter((m) => m !== null)

  const depsStr = departures.length > 0
    ? (nextThree.length > 0 ? `in ${nextThree.join(', ')} min` : 'No services')
    : (serviceNote || 'No live data')

  return (
    <div className={!isLast ? 'border-b border-purple-500/10' : ''}>

      {/* ── Tap row ───────────────────────────────────────────── */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full min-h-[60px] flex flex-col justify-center px-4 py-3.5 hover:bg-white/[0.04] active:bg-white/[0.08] transition-colors text-left"
      >
        {/* Line 1: mode badges + total time */}
        <div className="flex items-center justify-between gap-3 w-full">
          {/* Left: chips connected with dots */}
          <div className="flex items-center gap-0 flex-wrap">
            <ModeBadge line={line} type={type} />
            <Dot />
            <WalkIcon mins={walkMins} />
          </div>

          {/* Right: total journey time */}
          <TotalTime
            walkMins={walkMins}
            journeyMins={journeyMins}
            departures={departures}
          />
        </div>

        {/* Line 2: departure countdown */}
        <div className="flex items-center justify-between gap-2 mt-1.5">
          <span className="text-[11px] text-purple-300/55 leading-tight">
            {depsStr} from {station.name}
          </span>
          <span className="text-purple-300/30 text-[9px] flex-shrink-0">
            {expanded ? '▲' : '▼'}
          </span>
        </div>
      </button>

      {/* ── Expanded timetable ────────────────────────────────── */}
      {expanded && (
        <div className="px-4 pb-4 pt-2 bg-white/[0.025]">
          {/* Journey summary */}
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-xs leading-none">🚶</span>
            {mapsUrl ? (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-purple-300/55 hover:text-purple-200/80 transition-colors underline underline-offset-2"
              >
                {walkMins != null ? `${walkMins} min walk to` : 'Walk to'} {station.name} → {destination}
              </a>
            ) : (
              <span className="text-[11px] text-purple-300/50">
                {walkMins != null ? `${walkMins} min walk to` : 'Walk to'} {station.name} → {destination}
              </span>
            )}
          </div>

          {/* No-data note for tube options */}
          {departures.length === 0 && serviceNote && (
            <p className="text-[11px] text-purple-300/45 italic mt-1">{serviceNote}</p>
          )}

          {/* Timetable rows */}
          {departures.map((dep, i) => {
            const effTime = effectiveTime(dep)
            const mins = effTime ? minsFromNow(effTime) : null
            const isDelayed = dep.etd && dep.etd !== 'On time' && !dep.isCancelled

            return (
              <div
                key={dep.serviceID || i}
                className="flex items-center justify-between min-h-[44px] border-b border-purple-500/10 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-mono font-semibold w-11 ${
                      dep.isCancelled ? 'text-red-400/50 line-through' : 'text-white'
                    }`}
                  >
                    {dep.std}
                  </span>
                  {isDelayed && (
                    <span className="text-[10px] text-amber-400 bg-amber-500/10 rounded-md px-1.5 py-0.5 font-medium">
                      {dep.etd}
                    </span>
                  )}
                  {dep.isCancelled && (
                    <span className="text-[10px] text-red-400 bg-red-500/10 rounded-md px-1.5 py-0.5 font-medium">
                      Cancelled
                    </span>
                  )}
                </div>
                <span
                  className={`text-sm font-semibold ${
                    dep.isCancelled
                      ? 'text-red-400/50'
                      : isDelayed
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                  }`}
                >
                  {dep.isCancelled ? '—' : mins !== null ? `${mins} min` : 'Due'}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
