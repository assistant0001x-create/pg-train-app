// Dummy data for offline testing — simulates TfL Journey Planner responses
// Toggle off by setting VITE_DUMMY_MODE=false in your .env

function pad(n) {
  return n.toString().padStart(2, '0')
}

function clockAt(mins) {
  const d = new Date(Date.now() + mins * 60000)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Two journeys matching the shape fetchJourneys() returns: one door-to-door
// to home, one ending at Palmers Green station.
export function getDummyJourneys() {
  return {
    toHome: {
      id: 'to-home',
      durationMin: 34,
      depClock: clockAt(0),
      arrClock: clockAt(34),
      legs: [
        { mode: 'walking', durMin: 6, label: 'Walk to Wood Green', lineName: null, to: 'Wood Green', depClock: clockAt(0), arrClock: clockAt(6) },
        { mode: 'tube', durMin: 14, label: 'Piccadilly line to Bounds Green', lineName: 'Piccadilly', to: 'Bounds Green', depClock: clockAt(8), arrClock: clockAt(22) },
        { mode: 'bus', durMin: 9, label: 'Bus 184 to Hazelwood Lane', lineName: null, to: 'Hazelwood Lane', depClock: clockAt(24), arrClock: clockAt(33) },
        { mode: 'walking', durMin: 1, label: 'Walk to 73 Hazelwood Lane', lineName: null, to: '73 Hazelwood Lane', depClock: clockAt(33), arrClock: clockAt(34) },
      ],
    },
    toStation: {
      id: 'to-station',
      durationMin: 22,
      depClock: clockAt(0),
      arrClock: clockAt(22),
      legs: [
        { mode: 'walking', durMin: 7, label: 'Walk to Bowes Park', lineName: null, to: 'Bowes Park', depClock: clockAt(0), arrClock: clockAt(7) },
        { mode: 'national-rail', durMin: 4, label: 'Great Northern to Palmers Green', lineName: 'Great Northern', to: 'Palmers Green', depClock: clockAt(11), arrClock: clockAt(15) },
        { mode: 'walking', durMin: 1, label: 'Walk to platform', lineName: null, to: 'Palmers Green', depClock: clockAt(15), arrClock: clockAt(16) },
      ],
    },
  }
}
