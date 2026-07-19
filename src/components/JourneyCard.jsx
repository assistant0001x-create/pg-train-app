import { useState } from 'react'
import { ModeIconSvg, ChevDownIcon } from './modeIcons'
import { MODE_LC, LINE_LC } from '../utils/transportColors'

// TfL mode ids -> the icon/colour buckets RouteOptionCard already defines
const TFL_MODE_BUCKET = {
  walking: 'walk',
  cycle: 'walk',
  bus: 'bus',
  coach: 'bus',
  tube: 'tube',
  dlr: 'tube',
  tram: 'tube',
  'national-rail': 'rail',
  'elizabeth-line': 'rail',
  overground: 'overground',
  'river-bus': 'overground',
}

function bucket(modeId) {
  return TFL_MODE_BUCKET[modeId] || 'rail'
}

function legColor(leg) {
  return (leg.lineName && LINE_LC[leg.lineName]) || MODE_LC[bucket(leg.mode)] || 'var(--fg-3)'
}

export default function JourneyCard({ journey, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  if (!journey) return null

  const { durationMin, legs } = journey
  const depClock = journey.depClock
  const arrClock = journey.arrClock

  return (
    <div className={`rt${expanded ? ' is-expanded' : ''}`}>
      <button className="rt-summary" onClick={() => setExpanded((x) => !x)}>
        <div className="rt-summary-l">
          <div className="rt-leave">
            <span className="rt-leave-k">DEPART</span>
            <span className="rt-leave-v">{depClock || 'now'}</span>
          </div>
          <div className="rt-total">
            <span className="rt-total-num">{durationMin}</span>
            <span className="rt-total-unit">min</span>
          </div>
          {arrClock && (
            <div className="rt-eta">
              <span className="rt-eta-k">ARR</span>
              <span className="rt-eta-v">{arrClock}</span>
            </div>
          )}
        </div>
        <span className={`rt-chev${expanded ? ' is-open' : ''}`}><ChevDownIcon /></span>
      </button>

      <div className="rt-body">
        <div className="rt-ribbon">
          {legs.map((leg, i) => {
            const c = legColor(leg)
            return (
              <div key={i} className="rt-r-leg" style={{ '--lc': c }}>
                <div className="rt-r-icon"><ModeIconSvg mode={bucket(leg.mode)} size={13} color={c} /></div>
                <div className="rt-r-min">
                  {leg.durMin != null ? leg.durMin : '?'}
                  <span className="rt-r-min-suffix">m</span>
                </div>
                <div className="rt-r-line">{bucket(leg.mode).toUpperCase()}</div>
              </div>
            )
          })}
        </div>
      </div>

      {expanded && (
        <div className="rt-expand">
          <div className="rt-tl">
            {legs.map((leg, i) => {
              const c = legColor(leg)
              return (
                <div key={i} className="rt-tl-leg">
                  <div className="rt-tl-rail">
                    <div className="rt-tl-pin" style={{ background: c }} />
                    <div className="rt-tl-line" style={{
                      background: leg.mode === 'walking'
                        ? `repeating-linear-gradient(to bottom, ${c} 0 3px, transparent 3px 7px)`
                        : c
                    }} />
                  </div>
                  <div className="rt-tl-body">
                    <div className="rt-tl-head">
                      <span className="rt-tl-icon" style={{ background: `color-mix(in oklch, ${c} 18%, transparent)`, color: c }}>
                        <ModeIconSvg mode={bucket(leg.mode)} size={13} color={c} />
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
                    <div className="rt-tl-clock">{leg.depClock || '—'} – {leg.arrClock || '—'}</div>
                  </div>
                </div>
              )
            })}
            <div className="rt-tl-leg rt-tl-leg--end">
              <div className="rt-tl-rail"><div className="rt-tl-pin rt-tl-pin--end" /></div>
              <div className="rt-tl-body">
                <div className="rt-tl-end-label">Arrive</div>
                <div className="rt-tl-clock">{arrClock || '—'}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
