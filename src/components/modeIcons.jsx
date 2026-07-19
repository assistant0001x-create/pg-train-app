// Mode icons shared by RouteOptionCard and JourneyCard.
import { MODE_LC } from '../utils/transportColors'

export function ChevDownIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6"/>
    </svg>
  )
}

function WalkSvg({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13" cy="4" r="2"/><path d="M7 22l2-7 3-2-2-5"/><path d="M10 8l-3 1-2 4"/><path d="M12 13l4 2 1 5"/>
    </svg>
  )
}
function BusSvg({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="13" rx="2"/><path d="M4 11h16"/>
      <circle cx="8" cy="17" r="1.5"/><circle cx="16" cy="17" r="1.5"/>
    </svg>
  )
}
function TubeSvg({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/><path d="M3 12h18"/>
    </svg>
  )
}
function RailSvg({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="3" width="14" height="14" rx="2"/><path d="M5 10h14"/>
      <circle cx="9" cy="14" r="0.6" fill={color} stroke="none"/>
      <circle cx="15" cy="14" r="0.6" fill={color} stroke="none"/>
      <path d="M8 17l-2 4M16 17l2 4"/>
    </svg>
  )
}

export function ModeIconSvg({ mode, size = 14, color }) {
  const c = color || MODE_LC[mode] || 'currentColor'
  if (mode === 'walk') return <WalkSvg size={size} color={c} />
  if (mode === 'bus') return <BusSvg size={size} color={c} />
  if (mode === 'tube') return <TubeSvg size={size} color={c} />
  return <RailSvg size={size} color={c} />
}
