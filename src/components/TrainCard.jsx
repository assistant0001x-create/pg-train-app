import { useState } from 'react'

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

function ChevDownIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6"/>
    </svg>
  )
}

export default function TrainCard({ train, trackedServiceID, onTrack }) {
  const [expanded, setExpanded] = useState(false)
  const scheduled = train.std || train.sta || 'TBC'
  const expected = train.etd || train.eta
  const isCancelled = train.isCancelled
  const isDelayed = !isCancelled && expected && expected !== scheduled && expected !== 'On time'
  const serviceId = train.serviceID || train.serviceId || ''
  const isTracked = serviceId && serviceId === trackedServiceID

  const effectiveTime = isDelayed ? expected : scheduled
  const mins = minsFromNow(effectiveTime)
  const isSoon = mins !== null && mins <= 5

  const statusColor = isCancelled ? 'var(--danger)' : isDelayed ? 'var(--warn)' : 'var(--live)'
  const statusLabel = isCancelled ? 'CANCELLED' : isDelayed ? 'DELAYED' : 'ON TIME'
  const countdownText = mins === null ? null : mins <= 0 ? 'boarding now' : `in ${mins} min`

  return (
    <div className={`dep${isSoon ? ' is-soon' : ''}${expanded ? ' is-expanded' : ''}${isTracked ? ' is-tracked' : ''}`}>
      <button
        className="dep-main"
        onClick={() => setExpanded(x => !x)}
        aria-expanded={expanded}
      >
        <div className="dep-time-col">
          <div className={`dep-time${isCancelled ? ' dep-time--cancelled' : ''}`}>{scheduled}</div>
          {countdownText && <div className="dep-countdown">{countdownText}</div>}
          {isDelayed && <div className="dep-expected">exp {expected}</div>}
        </div>

        <div className="dep-mid">
          <div className="dep-dest">to Moorgate</div>
          <div className="dep-meta-row">
            {train.platform && (
              <span className="dep-chip">
                <span className="chip-k">PLAT</span>
                <span className="chip-v">{train.platform}</span>
              </span>
            )}
            {train.operator && (
              <span className="dep-chip dep-chip--op">{train.operator}</span>
            )}
            {isTracked && (
              <span className="dep-chip dep-chip--tracked">TRACKING</span>
            )}
          </div>
        </div>

        <div className="dep-right">
          <span className="dep-status" style={{ color: statusColor, borderColor: statusColor }}>
            <span className="dep-status-dot" style={{ background: statusColor }} />
            {statusLabel}
          </span>
          <span className={`dep-chev${expanded ? ' is-open' : ''}`}>
            <ChevDownIcon />
          </span>
        </div>
      </button>

      {expanded && (
        <div className="dep-expand">
          <div className="dep-expand-label">Details</div>
          <div className="dep-expand-detail">
            {isDelayed && <>Expected departure: <strong style={{ color: 'var(--warn)' }}>{expected}</strong><br /></>}
            {isCancelled && <span style={{ color: 'var(--danger)' }}>This service has been cancelled.<br /></span>}
            {train.platform && <>Platform {train.platform} · </>}{train.operator || 'Great Northern'}
          </div>
          {serviceId && (
            <div className="dep-expand-note">
              <button
                style={{ color: isTracked ? 'var(--warn)' : 'var(--accent)', fontFamily: 'inherit', cursor: 'pointer' }}
                onClick={(e) => { e.stopPropagation(); onTrack(serviceId) }}
              >
                {isTracked ? '↓ Stop tracking this train' : '↑ Track this train for delay alerts'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
