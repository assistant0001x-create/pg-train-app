const colorMap = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info: 'bg-sky-50 border-sky-200 text-sky-800',
}

export default function StatusMessage({ status }) {
  if (!status) return null
  return (
    <div className={`${colorMap[status.type]} border rounded-xl px-4 py-3 mb-4 text-sm font-medium`}>
      {status.message}
    </div>
  )
}
