export function buildMapsUrl(origin, destination, travelMode) {
  const params = new URLSearchParams({ api: '1', travelmode: travelMode, destination })
  if (origin) params.set('origin', `${origin.lat},${origin.lon}`)
  return `https://www.google.com/maps/dir/?${params.toString()}`
}

export function buildTransitMapsUrl(origin, destination, transitMode) {
  const params = new URLSearchParams({ api: '1', travelmode: 'transit', destination })
  if (origin) params.set('origin', `${origin.lat},${origin.lon}`)
  if (transitMode) params.set('transit_mode', transitMode)
  return `https://www.google.com/maps/dir/?${params.toString()}`
}
