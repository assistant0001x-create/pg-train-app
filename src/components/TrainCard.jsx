export default function TrainCard({ train, index, trackedServiceID, onTrack }) {
  const scheduled = train.std || train.sta
  const expected = train.etd || train.eta
  const isCancelled = train.isCancelled
  const isDelayed = !isCancelled && expected && expected !== scheduled && expected !== 'On time'
  const serviceId = train.serviceID || train.serviceId || ''
  const isTracked = serviceId && serviceId === trackedServiceID

  let status = 'On time'
  let statusColor = 'text-emerald-700'

  if (isCancelled) {
    status = 'Cancelled'
    statusColor = 'text-red-700'
  } else if (isDelayed) {
    status = 'Delayed'
    statusColor = 'text-amber-700'
  }

  return (
    <div
      onClick={() => onTrack(serviceId)}
      className={`bg-white border border-slate-200 rounded-2xl cursor-pointer px-4 py-3 shadow-sm hover:shadow-md transition ${isTracked ? 'ring-2 ring-emerald-300' : ''}`}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-2xl font-bold text-slate-900 leading-tight">{scheduled || 'TBC'}</div>
          {isDelayed && <div className="text-xs text-amber-700 font-semibold mt-0.5">Expected {expected}</div>}
        </div>

        <div className={`text-right ${statusColor} text-xs font-bold tracking-wide uppercase`}>
          {status}
          {isTracked && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
              Tracking
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 mt-2 pt-2 border-t border-slate-200">
        <div>
          <span className="font-semibold text-slate-700">Platform</span>
          <span className="ml-2">{train.platform || '—'}</span>
        </div>
        <div className="text-right">
          <span className="font-semibold text-slate-700">Operator</span>
          <span className="ml-2">{train.operator || 'Unknown'}</span>
        </div>
      </div>
    </div>
  )
}
