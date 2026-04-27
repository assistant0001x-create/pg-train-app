import { ACCENT_SWATCHES } from '../hooks/useTweaks'

function GearIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>
    </svg>
  )
}

function RadioGroup({ options, value, onChange }) {
  return (
    <div className="tweaks-radio-group">
      {options.map((opt) => (
        <button
          key={opt.value}
          className={`tweaks-radio-btn${value === opt.value ? ' is-active' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export default function TweaksDrawer({ tweaks, setTweak, open, onClose }) {
  return (
    <>
      <button className="gear-btn" onClick={onClose} aria-label="Settings">
        <GearIcon />
      </button>

      {open && (
        <>
          <div className="tweaks-backdrop" onClick={onClose} />
          <div className="tweaks-drawer" role="dialog" aria-label="Display settings">
            <div className="tweaks-handle"><div className="tweaks-handle-bar" /></div>
            <div className="tweaks-title">Display settings</div>

            <div className="tweaks-section">
              <div className="tweaks-section-label">Header</div>
              <RadioGroup
                value={tweaks.headerStyle}
                onChange={(v) => setTweak('headerStyle', v)}
                options={[{ value: 'compact', label: 'Compact' }, { value: 'card', label: 'Card' }]}
              />
            </div>

            <div className="tweaks-section">
              <div className="tweaks-section-label">Departure cards</div>
              <RadioGroup
                value={tweaks.cardStyle}
                onChange={(v) => setTweak('cardStyle', v)}
                options={[{ value: 'rich', label: 'Rich' }, { value: 'minimal', label: 'Minimal' }]}
              />
            </div>

            <div className="tweaks-section">
              <div className="tweaks-section-label">Route cards</div>
              <RadioGroup
                value={tweaks.routeStyle}
                onChange={(v) => setTweak('routeStyle', v)}
                options={[
                  { value: 'ribbon', label: 'Ribbon' },
                  { value: 'bars', label: 'Bars' },
                  { value: 'timeline', label: 'Timeline' },
                ]}
              />
            </div>

            <div className="tweaks-section">
              <div className="tweaks-section-label">Accent colour</div>
              <div className="tweaks-swatch-group">
                {ACCENT_SWATCHES.map(({ key, color }) => (
                  <button
                    key={key}
                    className={`tweaks-swatch${tweaks.accent === key ? ' is-active' : ''}`}
                    style={{ background: color }}
                    onClick={() => setTweak('accent', key)}
                    aria-label={key}
                  />
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
