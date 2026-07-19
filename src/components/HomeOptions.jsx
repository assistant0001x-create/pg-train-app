import JourneyCard from './JourneyCard'
import { HOME_ADDRESS, PALMERS_GREEN } from '../constants/stations'

function PinIcon({ size = 12, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z"/>
      <circle cx="12" cy="9" r="2.5"/>
    </svg>
  )
}

export default function HomeOptions({ routeOptions, isLoading, userLocation, mockLocation }) {
  const toHome = routeOptions?.find((r) => r.id === 'to-home') ?? null
  const toStation = routeOptions?.find((r) => r.id === 'to-station') ?? null
  const homeLabel = HOME_ADDRESS || '73 Hazelwood Lane, N13 5HE'

  if (isLoading && !toHome && !toStation) {
    return (
      <div>
        <div className="from-row">
          <div className="from-row-l">
            <div className="from-row-pin"><PinIcon color="oklch(78% 0.14 80)" /></div>
            <div>
              <div className="from-row-k">FROM</div>
              <div className="from-row-v" style={{ color: 'var(--fg-3)' }}>Finding location…</div>
            </div>
          </div>
          <div />
          <div className="from-row-r">
            <div>
              <div className="from-row-k">TO</div>
              <div className="from-row-v">{homeLabel}</div>
            </div>
          </div>
        </div>
        {mockLocation && (
          <div className="mock-loc-banner">
            Mock location active — {mockLocation.lat.toFixed(4)}, {mockLocation.lon.toFixed(4)}
          </div>
        )}
        <div className="loading-state" style={{ padding: '28px 20px' }}>
          <span className="loading-label">Finding routes near you…</span>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="from-row">
        <div className="from-row-l">
          <div className="from-row-pin"><PinIcon color="oklch(78% 0.14 80)" /></div>
          <div>
            <div className="from-row-k">FROM</div>
            <div className="from-row-v">{userLocation ? 'Current location' : 'Location unknown'}</div>
          </div>
        </div>
        <div />
        <div className="from-row-r">
          <div>
            <div className="from-row-k">TO</div>
            <div className="from-row-v">{homeLabel}</div>
          </div>
        </div>
      </div>

      {mockLocation && (
        <div className="mock-loc-banner">
          Mock location active — {mockLocation.lat.toFixed(4)}, {mockLocation.lon.toFixed(4)}
        </div>
      )}

      {toHome && (
        <div>
          <div className="section-head">
            <span className="section-title">Quickest route home</span>
            <span className="section-meta">All TfL modes</span>
          </div>
          <div className="rt-list">
            <JourneyCard journey={toHome} defaultExpanded />
          </div>
        </div>
      )}

      {toStation && (
        <div>
          <div className="section-head" style={{ marginTop: 16 }}>
            <span className="section-title">Quickest to {PALMERS_GREEN.name} station</span>
            <span className="section-meta">TfL live</span>
          </div>
          <div className="rt-list">
            <JourneyCard journey={toStation} />
          </div>
        </div>
      )}

      {!toHome && !toStation && !isLoading && (
        <div className="empty-state">No route options found. Tap refresh to try again.</div>
      )}
    </div>
  )
}
