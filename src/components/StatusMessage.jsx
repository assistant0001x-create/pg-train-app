const colorMap = {
  success: 'bg-emerald-900/30 border-emerald-500/30 text-emerald-300',
  error:   'bg-red-900/30 border-red-500/30 text-red-300',
  warning: 'bg-amber-900/30 border-amber-500/30 text-amber-300',
  info:    'bg-sky-900/30 border-sky-500/30 text-sky-300',
}

export default function StatusMessage({ status }) {
  if (!status) return null
  return (
    <div className={`${colorMap[status.type]} border rounded-xl px-4 py-3 mb-4 text-sm font-medium`}>
      {status.message}
    </div>
  )
}
