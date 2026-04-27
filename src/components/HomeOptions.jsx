import RouteOptionCard from './RouteOptionCard'
import { HOME_ADDRESS } from '../constants/stations'

function PinIcon({ size = 12, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z"/>
      <circle cx="12" cy="9" r="2.5"/>
    </svg>
  )
}

export default function HomeOptions({ routeOptions, isLoading, userLocation, routeStyle = 'ribbon', mockLocation }) {
  const preferred = routeOptions?.[0] ?? null
  const preferredIsGN = preferred?.isPreferredGN ?? false
  const multimodal = preferredIsGN ? (routeOptions?.[1] ?? null) : null
  const fallbackOptions = !preferredIsGN ? (routeOptions ?? []) : []
  const homeLabel = HOME_ADDRESS || '73 Hazelwood Ln'

  if (isLoading && !preferred) {
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

      {preferred && preferredIsGN && (
        <div>
          <div className="section-head">
            <span className="section-title">Best route home</span>
            <span className="section-meta">Great Northern · live</span>
          </div>
          <div className="rt-list">
            <RouteOptionCard option={preferred} isPreferred defaultExpanded routeStyle={routeStyle} />
          </div>

          {multimodal && (
            <>
              <div className="section-head" style={{ marginTop: 16 }}>
                <span className="section-title">Alternative</span>
                <span className="section-meta">1 option</span>
              </div>
              <div className="rt-list">
                <RouteOptionCard key={multimodal.id} option={multimodal} routeStyle={routeStyle} />
              </div>
            </>
          )}
        </div>
      )}

      {preferred && !preferredIsGN && (
        <div>
          <div className="section-head">
            <span className="section-title">Routes home</span>
            <span className="section-meta">{fallbackOptions.length} option{fallbackOptions.length !== 1 ? 's' : ''} · live</span>
          </div>
          <div className="rt-list">
            {fallbackOptions.map((option) => (
              <RouteOptionCard key={option.id} option={option} routeStyle={routeStyle} />
            ))}
          </div>
        </div>
      )}

      {!preferred && !isLoading && (
        <div className="empty-state">No route options found. Tap refresh to try again.</div>
      )}
    </div>
  )
}
