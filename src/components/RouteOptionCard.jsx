import { useState } from 'react'
import { HOME_ADDRESS } from '../constants/stations'

function minsFromNow(timeStr) {
  if (!timeStr || timeStr === 'On time' || timeStr === 'Delayed') return null
  const [h, m] = timeStr.split(':').map(Number)
  if (isNaN(h) || isNaN(m)) return null
  const now = new Date()
  const dep = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m)
  if (dep < now) dep.setDate(dep.getDate() + 1)
  const mins = Math.round((dep - now) / 60000)
  return mins < 0 || mins > 300 ? null : mins
}

function effectiveTime(dep) {
  if (dep.isCancelled) return null
  return dep.etd && dep.etd !== 'On time' ? dep.etd : dep.std
}

function firstCatchable(departures, walkMins) {
  return departures
    .filter((d) => !d.isCancelled)
    .map((d) => { const t = effectiveTime(d); return t != null ? minsFromNow(t) : null })
    .filter((m) => m !== null)
    .find((m) => m >= (walkMins ?? 0)) ?? null
}

function arrivalTime(minsAhead) {
  if (minsAhead == null) return null
  const d = new Date(Date.now() + minsAhead * 60000)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function ChevDownIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6"/>
    </svg>
  )
}

// Mode color tokens
const MODE_LC = {
  walk:       'oklch(72% 0.05 250)',
  bus:        'oklch(68% 0.18 25)',
  tube:       'oklch(62% 0.16 250)',
  rail:       'oklch(72% 0.14 150)',
  overground: 'oklch(72% 0.14 50)',
}

const LINE_LC = {
  'Piccadilly':       'oklch(62% 0.16 250)',
  'Victoria':         'oklch(72% 0.13 220)',
  'Great Northern':   'oklch(72% 0.14 150)',
  'London Overground':'oklch(72% 0.14 50)',
}

function WalkSvg({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13" cy="4" r="2"/><path d="M7 22l2-7 3-2-2-5"/><path d="M10 8l-3 1-2 4"/><path d="M12 13l4 2 1 5"/>
    </svg>
  )
}
function BusSvg({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="13" rx="2"/><path d="M4 11h16"/>
      <circle cx="8" cy="17" r="1.5"/><circle cx="16" cy="17" r="1.5"/>
    </svg>
  )
}
function TubeSvg({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/><path d="M3 12h18"/>
    </svg>
  )
}
function RailSvg({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="3" width="14" height="14" rx="2"/><path d="M5 10h14"/>
      <circle cx="9" cy="14" r="0.6" fill={color} stroke="none"/>
      <circle cx="15" cy="14" r="0.6" fill={color} stroke="none"/>
      <path d="M8 17l-2 4M16 17l2 4"/>
    </svg>
  )
}

function ModeIconSvg({ mode, size = 14, color }) {
  const c = color || MODE_LC[mode] || 'currentColor'
  if (mode === 'walk') return <WalkSvg size={size} color={c} />
  if (mode === 'bus') return <BusSvg size={size} color={c} />
  if (mode === 'tube') return <TubeSvg size={size} color={c} />
  return <RailSvg size={size} color={c} />
}

// Build ribbon legs from a route option
function buildLegs(option) {
  const { type, walkMins, firstLeg, journeyMins, line, tubeLine, station } = option
  const stationName = station?.name || 'Station'

  let legs
  switch (type) {
    case 'walk':
      return [{ mode: 'walk', durMin: journeyMins, label: 'WALK', to: 'Home' }]
    case 'train':
      legs = [
        { mode: 'rail', durMin: journeyMins, label: line || 'GN', to: 'Palmers Green' },
        { mode: 'walk', durMin: 5, label: 'WALK', to: 'Home' },
      ]
      break
    case 'tube+train':
      legs = [
        { mode: 'tube', durMin: null, label: tubeLine || 'TUBE', lineName: tubeLine, to: 'Finsbury Park' },
        { mode: 'rail', durMin: journeyMins, label: 'GN', lineName: 'Great Northern', to: 'Palmers Green' },
        { mode: 'walk', durMin: 5, label: 'WALK', to: 'Home' },
      ]
      break
    case 'tube':
      legs = [
        { mode: 'tube', durMin: null, label: station?.line || 'TUBE', lineName: station?.line, to: stationName },
        { mode: 'walk', durMin: journeyMins, label: 'WALK', to: 'Home' },
      ]
      break
    case 'overground':
      legs = [
        { mode: 'overground', durMin: null, label: 'OVGD', to: stationName },
        { mode: 'bus', durMin: null, label: 'BUS', to: 'Palmers Green' },
      ]
      break
    case 'bus':
      legs = [{ mode: 'bus', durMin: null, label: line ? `${line}` : 'BUS', to: 'Home' }]
      break
    default:
      legs = [{ mode: 'rail', durMin: journeyMins, label: line || 'RAIL', to: 'Home' }]
  }

  // Prepend first-leg walk from user's current GPS to the boarding station.
  // firstLeg takes priority; fall back to legacy walkMins for backwards compat.
  const flWalkMins = firstLeg?.walkMins ?? walkMins
  const flName = firstLeg?.stationName ?? stationName
  if (flWalkMins != null) {
    return [{ mode: 'walk', durMin: flWalkMins, label: 'WALK', to: flName }, ...legs]
  }
  return legs
}

function legColor(leg) {
  return leg.lineName ? (LINE_LC[leg.lineName] || MODE_LC[leg.mode] || 'var(--fg-3)')
                      : (MODE_LC[leg.mode] || 'var(--fg-3)')
}

function RibbonLeg({ leg }) {
  const lc = legColor(leg)
  return (
    <div className="rt-r-leg" style={{ '--lc': lc }}>
      <div className="rt-r-icon"><ModeIconSvg mode={leg.mode} size={13} color={lc} /></div>
      <div className="rt-r-min">
        {leg.durMin != null ? leg.durMin : '?'}
        <span className="rt-r-min-suffix">m</span>
      </div>
      <div className="rt-r-line">{leg.label}</div>
    </div>
  )
}

function RouteRibbon({ legs }) {
  return (
    <div className="rt-ribbon">
      {legs.map((leg, i) => <RibbonLeg key={i} leg={leg} />)}
    </div>
  )
}

function RouteBars({ legs, total }) {
  const totalMins = total || legs.reduce((s, l) => s + (l.durMin || 0), 0) || 1
  return (
    <div className="rt-bars">
      <div className="rt-bars-track">
        {legs.map((leg, i) => {
          const c = legColor(leg)
          const pct = ((leg.durMin || 0) / totalMins) * 100
          return (
            <div key={i} className="rt-bar-seg" style={{ width: `${Math.max(pct, 8)}%`, background: c, flex: pct < 8 ? '0 0 auto' : undefined }}>
              <span className="rt-bar-glyph"><ModeIconSvg mode={leg.mode} size={11} color="oklch(15% 0.02 250)" /></span>
              {pct > 14 && <span className="rt-bar-min">{leg.durMin}m</span>}
            </div>
          )
        })}
      </div>
      <div className="rt-bars-legend">
        {legs.map((leg, i) => (
          <span key={i} className="rt-bars-l-item">
            <span className="rt-bars-l-sw" style={{ background: legColor(leg) }} />
            {leg.label.toLowerCase()}
          </span>
        ))}
      </div>
    </div>
  )
}

function clockAdd(baseMins) {
  const d = new Date(Date.now() + baseMins * 60000)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function RouteTimeline({ legs, leaveIn }) {
  const departIn = leaveIn ?? 0
  let runTime = 0
  return (
    <div className="rt-tl">
      {legs.map((leg, i) => {
        const c = legColor(leg)
        const startMin = runTime
        runTime += leg.durMin ?? 0
        const startClock = clockAdd(startMin + departIn)
        const endClock = clockAdd(runTime + departIn)
        return (
          <div key={i} className="rt-tl-leg">
            <div className="rt-tl-rail">
              <div className="rt-tl-pin" style={{ background: c, color: c }} />
              <div className="rt-tl-line" style={{
                background: leg.mode === 'walk'
                  ? `repeating-linear-gradient(to bottom, ${c} 0 3px, transparent 3px 7px)`
                  : c
              }} />
            </div>
            <div className="rt-tl-body">
              <div className="rt-tl-head">
                <span className="rt-tl-icon" style={{ background: `color-mix(in oklch, ${c} 18%, transparent)`, color: c }}>
                  <ModeIconSvg mode={leg.mode} size={13} color={c} />
                </span>
                <span className="rt-tl-label" style={{ color: c }}>{leg.label}</span>
                <span className="rt-tl-dur">{leg.durMin != null ? `${leg.durMin} min` : '—'}</span>
              </div>
              {leg.to && (
                <div className="rt-tl-detail">
                  <span className="rt-tl-arrow">→</span>
                  <span className="rt-tl-to">{leg.to}</span>
                </div>
              )}
              <div className="rt-tl-clock">{startClock} – {endClock}</div>
            </div>
          </div>
        )
      })}
      <div className="rt-tl-leg rt-tl-leg--end">
        <div className="rt-tl-rail">
          <div className="rt-tl-pin rt-tl-pin--end" />
        </div>
        <div className="rt-tl-body">
          <div className="rt-tl-end-label">Arrive home</div>
          <div className="rt-tl-clock">{clockAdd(runTime + departIn)}</div>
        </div>
      </div>
    </div>
  )
}

export default function RouteOptionCard({ option, isPreferred, routeStyle = 'ribbon' }) {
  const [expanded, setExpanded] = useState(false)
  const { walkMins, firstLeg, journeyMins, departures, serviceNote, reliableDuration } = option

  // Effective walk to boarding station — firstLeg wins over legacy walkMins
  const firstLegWalkMins = firstLeg?.walkMins ?? walkMins

  const catchMin = journeyMins != null ? firstCatchable(departures, firstLegWalkMins) : null
  const total = option.type === 'walk'
    ? journeyMins
    : (catchMin != null && journeyMins != null ? catchMin + journeyMins : null)

  // For tube/overground (leaveInMins: null), if the walk to the boarding station
  // is > 20 min show "Now" — user needs to start moving regardless of transit schedule.
  const leaveIn = option.type === 'walk'
    ? 0
    : 'leaveInMins' in option && option.leaveInMins === null && firstLegWalkMins > 20
    ? 0
    : 'leaveInMins' in option && option.leaveInMins === null
    ? null
    : catchMin ?? (departures.length > 0 ? firstCatchable(departures, 0) : null)
  const eta = total != null ? arrivalTime(total) : null

  const legs = buildLegs(option)
  const farFirstLeg = firstLegWalkMins != null && firstLegWalkMins > 20

  return (
    <div className={`rt${isPreferred ? ' is-primary' : ''}${expanded ? ' is-expanded' : ''}`}>
      <button className="rt-summary" onClick={() => setExpanded(x => !x)}>
        <div className="rt-summary-l">
          <div className="rt-leave">
            <span className="rt-leave-k">LEAVE</span>
            <span className="rt-leave-v">
              {'leaveInMins' in option && option.leaveInMins === null
                ? 'Check TfL'
                : leaveIn === 0
                ? 'now'
                : leaveIn != null ? `in ${leaveIn}m` : '—'}
            </span>
          </div>
          {total != null && (
            <div className="rt-total">
              <span className="rt-total-num">{total}</span>
              <span className="rt-total-unit">min</span>
            </div>
          )}
          {eta && (
            <div className="rt-eta">
              <span className="rt-eta-k">ARR</span>
              <span className="rt-eta-v">{eta}</span>
            </div>
          )}
        </div>
        <span className={`rt-chev${expanded ? ' is-open' : ''}`}>
          <ChevDownIcon />
        </span>
      </button>

      <div className="rt-body">
        {routeStyle === 'ribbon'   && <RouteRibbon legs={legs} />}
        {routeStyle === 'bars'     && <RouteBars legs={legs} total={total} />}
        {routeStyle === 'timeline' && <RouteTimeline legs={legs} leaveIn={leaveIn} />}
      </div>

      {expanded && (
        <div className="rt-expand">
          {routeStyle !== 'timeline' && (
            <RouteTimeline legs={legs} leaveIn={leaveIn} />
          )}

          {farFirstLeg && (
            <div style={{
              marginTop: 10,
              padding: '8px 12px',
              borderRadius: 8,
              background: 'oklch(28% 0.06 80 / 0.2)',
              border: '1px solid oklch(50% 0.1 80 / 0.4)',
              color: 'var(--warn)',
              fontSize: 12,
              fontFamily: '"JetBrains Mono", ui-monospace, monospace',
            }}>
              {firstLegWalkMins} min walk to {firstLeg?.stationName} — consider transit to get there
              {firstLeg?.mapsUrl && (
                <a
                  href={firstLeg.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'block', marginTop: 6, color: 'var(--accent)', textDecoration: 'underline', fontSize: 11 }}
                >
                  Get directions →
                </a>
              )}
            </div>
          )}

          {serviceNote && <div className="note-banner">{serviceNote}</div>}
          {departures.length === 0 && !serviceNote && (
            <div className="note-banner">No live departures — check TfL or National Rail.</div>
          )}
          {departures.length > 0 && (
            <>
              <div className="rt-expand-label" style={{ marginTop: routeStyle !== 'timeline' ? 12 : 0 }}>Departures</div>
              {departures.slice(0, 6).map((dep, i) => {
                const t = effectiveTime(dep)
                const mins = t ? minsFromNow(t) : null
                const isDelayed = !dep.isCancelled && dep.etd && dep.etd !== 'On time'
                return (
                  <div key={dep.serviceID || i} className="rt-dep-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={`rt-dep-time${dep.isCancelled ? ' rt-dep-time--cancelled' : ''}`}>{dep.std}</span>
                      {isDelayed && <span className="rt-dep-badge rt-dep-badge--delayed">exp {dep.etd}</span>}
                      {dep.isCancelled && <span className="rt-dep-badge rt-dep-badge--cancel">Cancelled</span>}
                    </div>
                    <span className="rt-dep-mins" style={{ color: dep.isCancelled ? 'var(--fg-4)' : isDelayed ? 'var(--warn)' : 'var(--live)' }}>
                      {dep.isCancelled ? '—' : mins !== null ? `${mins} min` : 'Due'}
                    </span>
                  </div>
                )
              })}
            </>
          )}
        </div>
      )}
    </div>
  )
}
