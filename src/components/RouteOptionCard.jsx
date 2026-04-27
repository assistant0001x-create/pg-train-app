import { useState } from 'react'
import { HOME_COORDS } from '../constants/stations'

function buildDirectionsUrl(fromCoords, toCoords) {
  const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent)
  const toLoc = `${toCoords.lat},${toCoords.lon}`
  if (isIOS) {
    const from = fromCoords ? `${fromCoords.lat},${fromCoords.lon}` : 'Current+Location'
    return `https://maps.apple.com/?saddr=${from}&daddr=${toLoc}&dirflg=w`
  }
  const params = new URLSearchParams({ api: '1', travelmode: 'walking', destination: toLoc })
  if (fromCoords) params.set('origin', `${fromCoords.lat},${fromCoords.lon}`)
  return `https://www.google.com/maps/dir/?${params.toString()}`
}

function minsFromNow(timeStr) {
  if (!timeStr || timeStr === 'On time' || timeStr === 'Delayed') return null
  const [h, m] = timeStr.split(':').map(Number)
  if (isNaN(h) || isNaN(m)) return null
  const now = new Date()
  const dep = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m)
  if (dep < now) dep.setDate(dep.getDate() + 1)
  const mins = Math.round((dep - now) / 60000)
  if (mins < 0 || mins > 300) return null
  return mins
}

function effectiveTime(dep) {
  if (dep.isCancelled) return null
  return dep.etd && dep.etd !== 'On time' ? dep.etd : dep.std
}

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

const MODE_COLOURS = {
  train: '#1d1d6e',
  'tube+train': '#dc2626',
  tube: '#dc2626',
  bus: '#dc2626',
  overground: '#ea580c',
  walk: '#475569',
}

function NationalRailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="white" aria-label="National Rail" role="img">
      <path d="M3 6h9L3 15V6z" />
      <path d="M21 18h-9l9-9v9z" />
    </svg>
  )
}

function TubeRoundel() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" aria-label="Underground" role="img">
      <circle cx="12" cy="12" r="7" fill="none" stroke="white" strokeWidth="3.5" />
      <rect x="3" y="10" width="18" height="4" rx="1" fill="white" />
    </svg>
  )
}

function BusRoundel() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" aria-label="Bus" role="img">
      <circle cx="12" cy="12" r="7" fill="none" stroke="white" strokeWidth="3.5" />
      <rect x="3" y="10" width="18" height="4" rx="1" fill="white" />
    </svg>
  )
}

function TrainIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="white" aria-label="Overground train" role="img">
      <rect x="3" y="4" width="18" height="12" rx="3" />
      <path d="M5 19h3l1-3h6l1 3h3" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <circle cx="7" cy="19" r="1.5" />
      <circle cx="17" cy="19" r="1.5" />
    </svg>
  )
}

function WalkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="white" aria-label="Walk" role="img">
      <circle cx="13" cy="4.5" r="1.75" />
      <path d="M11.5 8.5c-1.2 1-2 2.5-1.5 4.5L8.5 19h2l1-4 2 2-1 3h2l1.5-4-2.5-3 1.5-3.5c.8 1 1.8 1.5 3 1.5v-2c-1.2 0-2.2-.8-2.7-1.8L11.5 8.5z" />
    </svg>
  )
}

function ModeIcon({ type }) {
  if (type === 'walk') return <WalkIcon />
  if (type === 'tube' || type === 'tube+train') return <TubeRoundel />
  if (type === 'bus') return <BusRoundel />
  if (type === 'overground') return <TrainIcon />
  return <NationalRailIcon />
}

function getModeName(option) {
  switch (option.type) {
    case 'walk': return 'Walk home'
    case 'tube': return option.line || 'London Underground'
    case 'tube+train': return `${option.tubeLine || 'Tube'} + Great Northern`
    case 'overground': return option.line || 'London Overground'
    case 'bus': return option.line ? `Bus ${option.line}` : 'Bus'
    case 'train':
    default: return option.line || 'Great Northern'
  }
}

function getStepSummary(option) {
  const { type, walkMins, journeyMins, station } = option
  const walkPart = walkMins ? `Walk ${walkMins} min` : null

  switch (type) {
    case 'walk':
      return journeyMins ? `Walk ${journeyMins} min` : 'Walk all the way'
    case 'train':
      return [walkPart, `Train ${journeyMins ?? '?'} min`, 'Walk'].filter(Boolean).join(' · ')
    case 'tube+train':
      return [`Tube to Finsbury Park`, journeyMins ? `Train ${journeyMins} min` : 'GN train', 'Walk'].join(' · ')
    case 'tube':
      return [`Tube to ${station.name}`, journeyMins ? `Walk ${journeyMins} min` : 'Walk home'].join(' · ')
    case 'overground':
      return `Overground to ${station.name} · Walk or bus home`
    case 'bus':
      return [walkPart, `Bus to Palmers Green`].filter(Boolean).join(' · ')
    default:
      return option.serviceNote || ''
  }
}

function buildStages(option) {
  const destStation = option.destination || 'Palmers Green'
  const stationCoords = option.station?.lat != null
    ? { lat: option.station.lat, lon: option.station.lon }
    : null
  switch (option.type) {
    case 'walk':
      return [{ mode: 'walk', from: 'Current location', to: destStation, mins: option.journeyMins, fromCoords: null, toCoords: HOME_COORDS }]
    case 'tube+train':
      return [
        { mode: 'tube', from: 'Current location', to: option.station.name, mins: null },
        { mode: 'train', from: option.station.name, to: destStation, mins: option.journeyMins },
      ]
    case 'tube':
      return [
        { mode: 'tube', from: 'Current location', to: option.station.name, mins: null },
        { mode: 'walk', from: option.station.name, to: destStation, mins: option.journeyMins, fromCoords: stationCoords, toCoords: HOME_COORDS },
      ]
    case 'overground':
      return [
        { mode: 'overground', from: 'Current location', to: option.station.name, mins: null },
        { mode: 'bus', from: option.station.name, to: destStation, mins: null },
      ]
    case 'bus':
      return [
        { mode: 'walk', from: 'Current location', to: option.station.name, mins: option.walkMins, fromCoords: null, toCoords: stationCoords },
        { mode: 'bus', from: option.station.name, to: destStation, mins: null },
      ]
    case 'train':
    default:
      return [
        { mode: 'walk', from: 'Current location', to: option.station.name, mins: option.walkMins, fromCoords: null, toCoords: stationCoords },
        { mode: 'train', from: option.station.name, to: destStation, mins: option.journeyMins },
      ]
  }
}

export default function RouteOptionCard({ option, isPreferred }) {
  const [expanded, setExpanded] = useState(false)
  const { walkMins, journeyMins, departures, serviceNote, reliableDuration } = option

  const catchMin = reliableDuration && journeyMins != null ? firstCatchable(departures, walkMins) : null
  const total = option.type === 'walk'
    ? journeyMins
    : (reliableDuration && catchMin != null && journeyMins != null ? catchMin + journeyMins : null)

  const nextThree = departures
    .filter((d) => !d.isCancelled)
    .slice(0, 3)
    .map((d) => {
      const t = effectiveTime(d)
      return t != null ? minsFromNow(t) : null
    })
    .filter((m) => m !== null)

  const nextMin = nextThree[0] ?? null
  const noService = departures.length > 0 && nextThree.length === 0

  const modeColour = MODE_COLOURS[option.type] || '#475569'
  const stages = buildStages(option)

  return (
    <div
      className="bg-[#1e293b] border border-[#334155] rounded-2xl overflow-hidden"
      style={isPreferred ? { borderLeft: '4px solid #f59e0b' } : undefined}
    >
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-white/5 transition-colors"
      >
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: modeColour }}
        >
          <ModeIcon type={option.type} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white leading-snug">{getModeName(option)}</p>
          <p className="text-[11px] text-white/50 mt-0.5 leading-snug truncate">{getStepSummary(option)}</p>
        </div>

        <div className="text-right shrink-0 min-w-[64px]">
          {total != null && (
            <p className="text-sm font-bold" style={{ color: '#f59e0b' }}>{total} min</p>
          )}
          {nextMin != null ? (
            <p className="text-[11px] text-white/70 font-semibold mt-0.5">Next: {nextMin} min</p>
          ) : noService ? (
            <p className="text-[11px] text-white/30 mt-0.5">No service</p>
          ) : null}
          <span className="text-[9px] text-white/20 block mt-1">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-[#334155]">
          <p className="text-[11px] text-white/40 mb-2 font-medium uppercase tracking-wide">Journey stages</p>
          <div className="space-y-2 mb-3">
            {stages.map((stage, idx) => (
              <div
                key={`${stage.mode}-${idx}`}
                className="flex items-center justify-between rounded-xl border border-[#334155] bg-[#0f172a] px-3 py-2.5"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 scale-90"
                    style={{ background: MODE_COLOURS[stage.mode] || '#475569' }}
                  >
                    <ModeIcon type={stage.mode} />
                  </div>
                  <div className="text-xs text-white/70 truncate">
                    <span className="font-semibold text-white">{stage.from}</span>
                    <span className="text-white/30 mx-1">→</span>
                    <span className="font-semibold text-white">{stage.to}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-2 shrink-0">
                  <span className="text-xs font-bold text-white/50">
                    {stage.mins != null && stage.mins > 0 ? `${stage.mins} min` : '—'}
                  </span>
                  {stage.mode === 'walk' && stage.toCoords && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        window.open(buildDirectionsUrl(stage.fromCoords, stage.toCoords), '_blank')
                      }}
                      className="text-[10px] font-semibold text-amber-400 border border-amber-400/40 rounded-full px-2 py-0.5 active:bg-amber-400/10 transition-colors"
                    >
                      ↗ Directions
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {departures.length === 0 && serviceNote && (
            <p className="text-[11px] text-white/40 italic mb-3">{serviceNote}</p>
          )}

          {departures.slice(0, 6).map((dep, i) => {
            const effTime = effectiveTime(dep)
            const mins = effTime ? minsFromNow(effTime) : null
            const isDelayed = dep.etd && dep.etd !== 'On time' && !dep.isCancelled

            return (
              <div
                key={dep.serviceID || i}
                className="flex items-center justify-between min-h-[40px] border-b border-[#334155] last:border-0"
              >
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-mono font-bold w-11 ${dep.isCancelled ? 'text-white/20 line-through' : 'text-white'}`}>
                    {dep.std}
                  </span>
                  {isDelayed && (
                    <span className="text-[10px] text-amber-400 bg-amber-400/10 rounded-md px-1.5 py-0.5 font-semibold">
                      {dep.etd}
                    </span>
                  )}
                  {dep.isCancelled && (
                    <span className="text-[10px] text-red-400 bg-red-400/10 rounded-md px-1.5 py-0.5 font-semibold">
                      Cancelled
                    </span>
                  )}
                </div>
                <span className={`text-sm font-bold ${dep.isCancelled ? 'text-white/20' : isDelayed ? 'text-amber-400' : 'text-emerald-400'}`}>
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
