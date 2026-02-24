// Dummy data for offline testing — simulates live departure boards
// Toggle off by setting VITE_DUMMY_MODE=false in your .env

function pad(n) {
  return n.toString().padStart(2, '0')
}

function fmtTime(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function addMins(date, mins) {
  return new Date(date.getTime() + mins * 60000)
}

export function generateTrainDepartures({
  offsetMins = 4,
  intervalMins = 15,
  count = 8,
  hasDelay = false,
  cancelIndex = -1,
} = {}) {
  const now = new Date()
  return Array.from({ length: count }, (_, i) => {
    const dep = addMins(now, offsetMins + i * intervalMins)
    const std = fmtTime(dep)
    const isCancelled = cancelIndex === i
    const isDelayed = hasDelay && i === 1
    const etd = isCancelled ? 'Cancelled' : isDelayed ? fmtTime(addMins(dep, 5)) : 'On time'
    return {
      std,
      etd,
      isCancelled,
      platform: '1',
      operator: 'Great Northern',
      serviceID: `DUMMY-GN-${offsetMins}-${i}`,
      serviceId: `DUMMY-GN-${offsetMins}-${i}`,
    }
  })
}

export function generateTubeDepartures({
  offsetMins = 3,
  intervalMins = 7,
  count = 8,
} = {}) {
  const now = new Date()
  return Array.from({ length: count }, (_, i) => {
    const dep = addMins(now, offsetMins + i * intervalMins)
    return {
      std: fmtTime(dep),
      etd: 'On time',
      isCancelled: false,
      platform: '2',
      operator: 'TfL',
      serviceID: `DUMMY-TFL-${offsetMins}-${i}`,
      serviceId: `DUMMY-TFL-${offsetMins}-${i}`,
    }
  })
}

// Simulates being near Palmers Green — shows realistic nearby options
export function getDummyRouteOptions() {
  return [
    {
      id: 'train-BVP',
      type: 'train',
      station: { code: 'BVP', name: 'Bowes Park' },
      walkMins: 7,
      journeyMins: 4, // Bowes Park → Palmers Green (1 stop)
      destination: 'Palmers Green',
      line: 'Great Northern',
      operator: 'Great Northern',
      mapsUrl: null,
      departures: generateTrainDepartures({ offsetMins: 4, intervalMins: 15 }),
    },
    {
      id: 'tube-BGN',
      type: 'tube',
      station: { name: 'Bounds Green', line: 'Piccadilly' },
      walkMins: 10,
      journeyMins: 20, // Bounds Green → King's Cross (southbound Piccadilly)
      destination: "King's Cross St. Pancras",
      line: 'Piccadilly',
      operator: 'TfL',
      mapsUrl: null,
      departures: generateTubeDepartures({ offsetMins: 3, intervalMins: 7 }),
    },
    {
      id: 'train-ALX',
      type: 'train',
      station: { code: 'ALX', name: 'Alexandra Palace' },
      walkMins: 14,
      journeyMins: 6, // Alexandra Palace → Palmers Green (2 stops)
      destination: 'Palmers Green',
      line: 'Great Northern',
      operator: 'Great Northern',
      mapsUrl: null,
      departures: generateTrainDepartures({ offsetMins: 8, intervalMins: 15, hasDelay: true }),
    },
    {
      id: 'tube-ARN',
      type: 'tube',
      station: { name: 'Arnos Grove', line: 'Piccadilly' },
      walkMins: 18,
      journeyMins: 22, // Arnos Grove → King's Cross (southbound Piccadilly)
      destination: "King's Cross St. Pancras",
      line: 'Piccadilly',
      operator: 'TfL',
      mapsUrl: null,
      departures: generateTubeDepartures({ offsetMins: 5, intervalMins: 7 }),
    },
  ]
}
