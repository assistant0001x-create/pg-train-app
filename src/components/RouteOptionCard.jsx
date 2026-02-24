import { useState } from 'react'

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

const MODE_ICON = {
  walk: '🚶',
  tube: 'tube',
  train: 'train',
  overground: 'overground',
  bus: 'bus',
}

function getStepTokens(option) {
  switch (option.type) {
    case 'walk':
      return ['walk']
    case 'tube+train':
      return ['walk', 'tube', 'train', 'walk']
    case 'tube':
      return ['walk', 'tube', 'walk']
    case 'overground':
      return ['walk', 'overground', 'bus', 'walk']
    case 'bus':
      return ['walk', 'bus', 'walk']
    case 'train':
    default:
      return ['walk', 'train', 'walk']
  }
}

function ModeGlyph({ mode }) {
  if (mode === 'walk') {
    return <span className="text-2xl leading-none">{MODE_ICON.walk}</span>
  }

  if (mode === 'tube') {
    return (
      <svg viewBox="0 0 64 64" className="w-8 h-8" aria-label="Underground" role="img">
        <circle cx="32" cy="32" r="24" fill="none" stroke="#E32017" strokeWidth="10" />
        <rect x="8" y="27" width="48" height="10" rx="1" fill="#003688" />
      </svg>
    )
  }

  if (mode === 'bus') {
    return (
      <svg viewBox="0 0 64 64" className="w-8 h-8" aria-label="Bus" role="img">
        <circle cx="32" cy="32" r="24" fill="none" stroke="#DC241F" strokeWidth="10" />
        <rect x="10" y="27" width="44" height="10" rx="1" fill="#0019A8" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 64 64" className="w-8 h-8" aria-label="Rail" role="img">
      <rect x="6" y="16" width="52" height="32" rx="6" fill="#7C1F3A" />
      <path d="M14 32h36" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      <path d="M16 24l10 8-10 8" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M48 24l-10 8 10 8" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function StepStrip({ option }) {
  const steps = getStepTokens(option)
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {steps.map((step, i) => (
        <div key={`${step}-${i}`} className="inline-flex items-center">
          <span className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 w-11 h-11">
            <ModeGlyph mode={step} />
          </span>
          {i < steps.length - 1 && <span className="mx-1 text-slate-300 text-sm">•</span>}
        </div>
      ))}
    </div>
  )
}

function durationLabel(mins) {
  return mins != null && mins > 0 ? `${mins} min` : '—'
}

function buildStages(option) {
  const destStation = option.destination || 'Palmers Green'
  switch (option.type) {
    case 'walk':
      return [
        { mode: 'walk', from: 'Current location', to: destStation, mins: option.journeyMins },
      ]
    case 'tube+train':
      return [
        { mode: 'tube', from: 'Current location', to: option.station.name, mins: null },
        { mode: 'train', from: option.station.name, to: destStation, mins: option.journeyMins },
      ]
    case 'tube':
      return [
        { mode: 'tube', from: 'Current location', to: option.station.name, mins: null },
        { mode: 'walk', from: option.station.name, to: destStation, mins: option.journeyMins },
      ]
    case 'overground':
      return [
        { mode: 'overground', from: 'Current location', to: option.station.name, mins: null },
        { mode: 'bus', from: option.station.name, to: destStation, mins: null },
      ]
    case 'bus':
      return [
        { mode: 'walk', from: 'Current location', to: option.station.name, mins: option.walkMins },
        { mode: 'bus', from: option.station.name, to: destStation, mins: null },
      ]
    case 'train':
    default:
      return [
        { mode: 'walk', from: 'Current location', to: option.station.name, mins: option.walkMins },
        { mode: 'train', from: option.station.name, to: destStation, mins: option.journeyMins },
      ]
  }
}

export default function RouteOptionCard({ option, isLast }) {
  const [expanded, setExpanded] = useState(false)
  const { station, walkMins, journeyMins, departures, serviceNote, reliableDuration } = option

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

  const catchMin = reliableDuration && journeyMins != null ? firstCatchable(departures, walkMins) : null
  const total = option.type === 'walk'
    ? journeyMins
    : (reliableDuration && catchMin != null && journeyMins != null ? catchMin + journeyMins : null)
  const stages = buildStages(option)

  return (
    <div className={!isLast ? 'border-b border-slate-200' : ''}>
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full min-h-[84px] flex flex-col justify-center px-4 py-3.5 hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
      >
        <div className="flex items-start justify-between gap-3 w-full">
          <div className="flex-1">
            <StepStrip option={option} />
            <div className="mt-1.5 text-xs text-slate-700 leading-tight font-medium">
              Duration: {total != null ? `${total} min` : '—'}
            </div>
            <div className="mt-1 text-[11px] text-slate-500 leading-tight">
              {depsStr} from {station.name}
            </div>
          </div>

          <span className="text-slate-300 text-[9px] mt-1">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-2 bg-slate-50/70">
          <p className="text-[11px] text-slate-500 mb-2">Journey stages</p>
          <div className="space-y-2 mb-3">
            {stages.map((stage, idx) => (
              <div key={`${stage.mode}-${idx}`} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <ModeGlyph mode={stage.mode} />
                  <div className="text-xs text-slate-700 truncate">
                    <span className="font-semibold">{stage.from}</span>
                    <span className="text-slate-400 mx-1">→</span>
                    <span className="font-semibold">{stage.to}</span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-slate-600 ml-2">{durationLabel(stage.mins)}</span>
              </div>
            ))}
          </div>

          {departures.length === 0 && serviceNote && <p className="text-[11px] text-slate-500 italic mt-1">{serviceNote}</p>}

          {departures.map((dep, i) => {
            const effTime = effectiveTime(dep)
            const mins = effTime ? minsFromNow(effTime) : null
            const isDelayed = dep.etd && dep.etd !== 'On time' && !dep.isCancelled

            return (
              <div key={dep.serviceID || i} className="flex items-center justify-between min-h-[44px] border-b border-slate-200 last:border-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-mono font-semibold w-11 ${dep.isCancelled ? 'text-red-400/50 line-through' : 'text-slate-900'}`}>
                    {dep.std}
                  </span>
                  {isDelayed && <span className="text-[10px] text-amber-400 bg-amber-500/10 rounded-md px-1.5 py-0.5 font-medium">{dep.etd}</span>}
                  {dep.isCancelled && <span className="text-[10px] text-red-400 bg-red-500/10 rounded-md px-1.5 py-0.5 font-medium">Cancelled</span>}
                </div>
                <span className={`text-sm font-semibold ${dep.isCancelled ? 'text-red-400/50' : isDelayed ? 'text-amber-400' : 'text-emerald-600'}`}>
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
