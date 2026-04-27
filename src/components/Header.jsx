import { HOME_ADDRESS } from '../constants/stations'

function RefreshIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 15.5-6.3L21 8"/><path d="M21 3v5h-5"/>
      <path d="M21 12a9 9 0 0 1-15.5 6.3L3 16"/><path d="M3 21v-5h5"/>
    </svg>
  )
}
function BellIcon({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
      <path d="M10 21a2 2 0 0 0 4 0"/>
    </svg>
  )
}
function RailIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="3" width="14" height="14" rx="2"/>
      <path d="M5 10h14"/>
      <circle cx="9" cy="14" r="0.6" fill="currentColor" stroke="none"/>
      <circle cx="15" cy="14" r="0.6" fill="currentColor" stroke="none"/>
      <path d="M8 17l-2 4M16 17l2 4"/>
    </svg>
  )
}
function PinIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z"/>
      <circle cx="12" cy="9" r="2.5"/>
    </svg>
  )
}

export default function Header({ currentMode, setMode, isLoading, fetchTrains, lastUpdate, notificationsGranted, requestNotifications, headerStyle = 'compact', locationLabel }) {
  const isOut = currentMode === 'out'
  const homeLabel = HOME_ADDRESS || '73 Hazelwood Ln'
  const updateText = lastUpdate
    ? lastUpdate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '—'

  const inner = (
    <>
      <div className="hdr-row">
        <div>
          <div className="hdr-eyebrow">PG ROUTES · LIVE</div>
          <div className="hdr-title">Palmers Green</div>
          <div className="hdr-sub">
            {isOut
              ? <>Palmers Green <span className="arr">→</span> Moorgate</>
              : <><span className="hdr-location-label" title={locationLabel || 'Current location'}>{locationLabel || 'Current location'}</span> <span className="arr">→</span> {homeLabel}</>}
          </div>
        </div>
        <button
          className={`hdr-icon-btn${isLoading ? ' is-spinning' : ''}`}
          onClick={() => fetchTrains({ force: true })}
          aria-label="Refresh"
        >
          <RefreshIcon />
        </button>
      </div>

      <div className="seg" role="tablist">
        <div className={`seg-thumb${isOut ? '' : ' seg-thumb--right'}`} />
        <button className={`seg-btn${isOut ? ' is-active' : ''}`} onClick={() => setMode('out')} role="tab" aria-selected={isOut}>
          <RailIcon /> OUT
        </button>
        <button className={`seg-btn${!isOut ? ' is-active' : ''}`} onClick={() => setMode('home')} role="tab" aria-selected={!isOut}>
          <PinIcon /> HOME
        </button>
      </div>

      <div className={`hdr-meta${headerStyle === 'card' ? '' : ''}`}>
        <span className="live-dot" />
        <span className="live-text">Live · National Rail</span>
        <span className="dotsep">·</span>
        <span className="muted">Updated {updateText}</span>
        {!notificationsGranted && (
          <span className="hdr-actions">
            <button className="link-btn" onClick={requestNotifications}>
              <BellIcon /> Alerts
            </button>
          </span>
        )}
      </div>
    </>
  )

  if (headerStyle === 'card') {
    return <div className="hdr-card">{inner}</div>
  }
  return <div className="hdr-compact">{inner}</div>
}
