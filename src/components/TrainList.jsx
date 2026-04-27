import TrainCard from './TrainCard'

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

function SpinIcon() {
  return (
    <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--fg-4)' }}>
      <path d="M3 12a9 9 0 0 1 15.5-6.3L21 8"/><path d="M21 3v5h-5"/>
      <path d="M21 12a9 9 0 0 1-15.5 6.3L3 16"/><path d="M3 21v-5h5"/>
    </svg>
  )
}

function NextUpHero({ train }) {
  const scheduled = train.std || 'TBC'
  const expected = train.etd || train.eta
  const isDelayed = expected && expected !== scheduled && expected !== 'On time'
  const isCancelled = train.isCancelled

  const effectiveTime = isDelayed ? expected : scheduled
  const mins = minsFromNow(effectiveTime)
  const pct = mins === null ? 100 : Math.max(5, Math.min(100, ((15 - mins) / 15) * 100))

  const minsDisplay = mins === null ? '—' : mins <= 0 ? 'NOW' : String(mins)
  const showUnit = mins !== null && mins > 0

  return (
    <div className="next-up">
      <div className="next-up-eyebrow">NEXT TRAIN</div>
      <div className="next-up-row">
        <div className="next-up-time" style={isCancelled ? { opacity: 0.3, textDecoration: 'line-through' } : undefined}>
          {scheduled}
        </div>
        <div className="next-up-mid">
          <div className="next-up-dest">to Moorgate</div>
          <div className="next-up-meta">
            {train.platform ? `Plat ${train.platform}` : ''}
            {train.platform && train.operator ? ' · ' : ''}
            {train.operator || 'Great Northern'}
            {isCancelled && <span style={{ color: 'var(--danger)', marginLeft: 6 }}>CANCELLED</span>}
            {isDelayed && !isCancelled && <span style={{ color: 'var(--warn)', marginLeft: 6 }}>exp {expected}</span>}
          </div>
        </div>
        <div className="next-up-count">
          <div className="next-up-mins" style={isCancelled ? { color: 'var(--danger)' } : undefined}>
            {minsDisplay}
          </div>
          {showUnit && <div className="next-up-unit">min</div>}
        </div>
      </div>
      <div className="next-up-bar">
        <div className="next-up-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function TrainList({ trains, isLoading, trackedServiceID, onTrack, cardStyle = 'rich' }) {
  if (isLoading && trains.length === 0) {
    return (
      <div className="loading-state">
        <SpinIcon />
        <span className="loading-label">Loading train times…</span>
      </div>
    )
  }

  if (trains.length === 0) {
    return (
      <div className="empty-state">
        No departures found. Tap refresh to try again.
      </div>
    )
  }

  const [nextTrain, ...rest] = trains

  return (
    <div>
      <NextUpHero train={nextTrain} />

      {rest.length > 0 && (
        <>
          <div className="section-head">
            <span className="section-title">Following</span>
            <span className="section-meta">{rest.length} more</span>
          </div>
          <div className="dep-list">
            {rest.map((train) => (
              <TrainCard
                key={train.serviceID || train.serviceId || train.std}
                train={train}
                trackedServiceID={trackedServiceID}
                onTrack={onTrack}
                cardStyle={cardStyle}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
