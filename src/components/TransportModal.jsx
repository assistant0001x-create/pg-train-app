import TrainCard from './TrainCard'

function TrainContent({ trains, walkingInfo, trackedServiceID, onTrack }) {
  const { trainWalkMins, station } = walkingInfo || {}

  return (
    <div>
      {/* Walk info */}
      {station && (
        <div className="glass-card rounded-2xl px-4 py-3 mb-4 flex items-center gap-3">
          <span className="text-2xl">🚶</span>
          <div>
            <div className="text-sm font-semibold text-white">
              {trainWalkMins != null ? `${trainWalkMins} min walk` : 'Walk'} to {station.name}
            </div>
            <div className="text-xs text-purple-300/70">Great Northern · to Palmers Green</div>
          </div>
        </div>
      )}

      {/* Departures */}
      {trains.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 text-center text-purple-300/60 border-dashed border-2 border-purple-500/20">
          <p className="text-sm">No trains found right now</p>
        </div>
      ) : (
        <div className="space-y-3">
          {trains.map((train, index) => (
            <TrainCard
              key={train.serviceID || train.serviceId || index}
              train={train}
              index={index}
              trackedServiceID={trackedServiceID}
              onTrack={onTrack}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function TubeContent({ tubeStations }) {
  if (!tubeStations || tubeStations.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center text-purple-300/60">
        <p className="text-sm">No tube station data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {tubeStations.map((station) => (
        <div
          key={station.name}
          className="glass-card rounded-2xl px-5 py-4 border border-purple-500/20"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-xl flex-shrink-0">
                🚇
              </div>
              <div>
                <div className="text-base font-bold text-white">{station.name}</div>
                <div className="text-xs text-purple-300/70">{station.line} line</div>
              </div>
            </div>
            <div className="text-right">
              {station.walkMins != null ? (
                <>
                  <div className="text-xl font-bold text-white">{station.walkMins}</div>
                  <div className="text-[10px] text-purple-300/70 uppercase tracking-wide">min walk</div>
                </>
              ) : (
                <div className="text-sm text-purple-300/60">—</div>
              )}
            </div>
          </div>
        </div>
      ))}
      <p className="text-[11px] text-purple-300/50 text-center pt-1">
        Walk times are estimates based on your current location
      </p>
    </div>
  )
}

const MODAL_TITLES = {
  train: { icon: '🚆', label: 'Train to Palmers Green' },
  tube: { icon: '🚇', label: 'Underground nearby' },
}

export default function TransportModal({
  activeModal,
  onClose,
  trains,
  walkingInfo,
  homeRoutingInfo,
  trackedServiceID,
  onTrack,
}) {
  const isOpen = !!activeModal
  const meta = activeModal ? MODAL_TITLES[activeModal] : null

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? '' : 'pointer-events-none'}`}>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/70 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div
        className={`absolute inset-x-0 bottom-0 max-h-[90dvh] flex flex-col glass-effect rounded-t-3xl transition-transform duration-300 ease-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
      >
        {/* Handle + header */}
        <div className="flex-shrink-0 px-6 pt-4 pb-3 border-b border-purple-500/20">
          <div className="w-10 h-1 bg-purple-500/40 rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{meta?.icon}</span>
              <h2 className="text-base font-bold text-white">{meta?.label}</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300 hover:bg-purple-500/40 transition-colors text-lg leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {activeModal === 'train' && (
            <TrainContent
              trains={trains}
              walkingInfo={walkingInfo}
              trackedServiceID={trackedServiceID}
              onTrack={onTrack}
            />
          )}
          {activeModal === 'tube' && (
            <TubeContent tubeStations={homeRoutingInfo?.tubeStations} />
          )}
        </div>
      </div>
    </div>
  )
}
