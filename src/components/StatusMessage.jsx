export default function StatusMessage({ status }) {
  if (!status) return null
  return (
    <div className={`status-banner status-banner--${status.type}`}>
      {status.message}
    </div>
  )
}
