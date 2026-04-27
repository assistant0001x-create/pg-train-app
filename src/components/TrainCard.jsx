export default function TrainCard({ train, index, trackedServiceID, onTrack }) {
  const scheduled = train.std || train.sta
  const expected = train.etd || train.eta
  const isCancelled = train.isCancelled
  const isDelayed = !isCancelled && expected && expected !== scheduled && expected !== 'On time'
  const serviceId = train.serviceID || train.serviceId || ''
  const isTracked = serviceId && serviceId === trackedServiceID

  let statusLabel = 'On time'
  let statusClass = 'text-emerald-500'

  if (isCancelled) {
    statusLabel = 'Cancelled'
    statusClass = 'text-red-500'
  } else if (isDelayed) {
    statusLabel = 'Delayed'
    statusClass = 'text-amber-500'
  }

  return (
    <div
      onClick={() => onTrack(serviceId)}
      className={`bg-white rounded-2xl cursor-pointer px-4 py-4 shadow-lg hover:shadow-xl transition-shadow ${
        isTracked ? 'ring-2 ring-amber-400' : ''
      }`}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className={`text-3xl font-bold leading-none ${isCancelled ? 'text-slate-300 line-through' : 'text-slate-900'}`}>
            {scheduled || 'TBC'}
          </div>
          {isDelayed && (
            <div className="text-xs text-amber-500 font-semibold mt-1">Expected {expected}</div>
          )}
        </div>

        <div className="text-right">
          <span className={`text-xs font-bold tracking-wide uppercase ${statusClass}`}>
            {statusLabel}
          </span>
          {isTracked && (
            <div className="mt-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-[10px] font-semibold text-amber-700 border border-amber-200">
                Tracking
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs pt-3 border-t border-slate-100">
        <div>
          <span className="text-slate-400 font-medium">Platform</span>
          <span className="ml-2 text-slate-700 font-semibold">{train.platform || '—'}</span>
        </div>
        <div className="text-right">
          <span className="text-slate-400 font-medium">Operator</span>
          <span className="ml-2 text-slate-700 font-semibold">{train.operator || '—'}</span>
        </div>
      </div>
    </div>
  )
}
