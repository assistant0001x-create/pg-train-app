const colorMap = {
  success: 'bg-pink-950/40 border-pink-700/50 text-pink-100',
  error: 'bg-red-950/40 border-red-700/50 text-red-100',
  warning: 'bg-amber-950/40 border-amber-700/50 text-amber-100',
  info: 'bg-purple-950/40 border-purple-700/50 text-purple-100',
}

export default function StatusMessage({ status }) {
  if (!status) return null
  return (
    <div className={`${colorMap[status.type]} border rounded-2xl px-4 py-3 mb-5 text-sm font-medium glass-effect backdrop-blur-sm`}>
      {status.message}
    </div>
  )
}
