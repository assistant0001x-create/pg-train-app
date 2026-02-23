export default function TrainCard({ train, index, trackedServiceID, onTrack }) {
  const scheduled = train.std || train.sta
  const expected = train.etd || train.eta
  const isCancelled = train.isCancelled
  const isDelayed = !isCancelled && expected && expected !== scheduled && expected !== 'On time'
  const serviceId = train.serviceID || train.serviceId || ''
  const isTracked = serviceId && serviceId === trackedServiceID

  let status = 'On time'
  let statusColor = 'text-pink-300'
  let borderColor = 'border-pink-500/50'
  let accentColor = 'bg-pink-500'
  let bgGradient = 'from-pink-500/10 to-purple-500/10'

  if (isCancelled) {
    status = 'Cancelled'
    statusColor = 'text-red-300'
    borderColor = 'border-red-500/50'
    accentColor = 'bg-red-500'
    bgGradient = 'from-red-500/10 to-rose-500/10'
  } else if (isDelayed) {
    status = 'Delayed'
    statusColor = 'text-amber-300'
    borderColor = 'border-amber-500/50'
    accentColor = 'bg-amber-500'
    bgGradient = 'from-amber-500/10 to-yellow-500/10'
  }

  return (
    <div
      onClick={() => onTrack(serviceId)}
      className={`train-card glass-card rounded-2xl cursor-pointer hover:bg-gradient-to-r ${bgGradient} px-5 py-4 hover:shadow-xl animate-slide-in relative overflow-hidden ${isTracked ? 'ring-2 ring-pink-400/50' : ''}`}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${accentColor}`} />

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${bgGradient} border ${borderColor}`}>
            <svg className="w-6 h-6 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <div className="text-3xl font-bold text-white leading-tight">{scheduled || 'TBC'}</div>
            {isDelayed && (
              <div className="text-xs text-amber-300 font-semibold mt-1">Exp {expected}</div>
            )}
          </div>
        </div>

        <div className={`text-right ${statusColor} text-xs font-bold tracking-wide uppercase`}>
          {status}
          {isTracked && (
            <span className="ml-2 inline-flex items-center px-2.5 py-1 rounded-full bg-pink-500/20 text-[10px] font-semibold text-pink-300 border border-pink-400/40">
              Tracking
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs text-purple-200/70 mt-3 pt-3 border-t border-purple-500/20">
        <div>
          <span className="font-semibold text-purple-200">Platform</span>
          <span className="ml-2">{train.platform || 'TBC'}</span>
        </div>
        <div className="text-right">
          <span className="font-semibold text-purple-200">Operator</span>
          <span className="ml-2">{train.operator || 'Unknown'}</span>
        </div>
      </div>
    </div>
  )
}
