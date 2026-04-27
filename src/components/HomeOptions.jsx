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

export default function HomeOptions({ routeOptions, isLoading, userLocation }) {
  const preferred = routeOptions?.[0] ?? null
  const others = routeOptions?.slice(1) ?? []
  const homeLabel = HOME_ADDRESS || '73 Hazelwood Ln'

  const fromLabel = userLocation
    ? `${userLocation.lat.toFixed(3)}, ${userLocation.lon.toFixed(3)}`
    : 'Current location'

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

      {preferred && (
        <div>
          <div className="section-head">
            <span className="section-title">Routes home</span>
            <span className="section-meta">{routeOptions.length} option{routeOptions.length !== 1 ? 's' : ''} · live</span>
          </div>
          <div className="rt-list">
            <RouteOptionCard option={preferred} isPreferred />
            {others.map((option) => (
              <RouteOptionCard key={option.id} option={option} />
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
