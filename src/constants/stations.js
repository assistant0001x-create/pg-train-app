export const GREAT_NORTHERN_STATIONS = [
  { code: 'MOG', name: 'Moorgate', lat: 51.5188, lon: -0.0886 },
  { code: 'OLD', name: 'Old Street', lat: 51.5263, lon: -0.0877 },
  { code: 'EXR', name: 'Essex Road', lat: 51.5394, lon: -0.1042 },
  { code: 'HBY', name: 'Highbury & Islington', lat: 51.5461, lon: -0.1038 },
  { code: 'DRN', name: 'Drayton Park', lat: 51.5531, lon: -0.1117 },
  { code: 'FPK', name: 'Finsbury Park', lat: 51.5642, lon: -0.1065 },
  { code: 'HRY', name: 'Harringay', lat: 51.5818, lon: -0.1094 },
  { code: 'HPY', name: 'Hornsey', lat: 51.5875, lon: -0.1169 },
  { code: 'ALX', name: 'Alexandra Palace', lat: 51.5978, lon: -0.1197 },
  { code: 'BVP', name: 'Bowes Park', lat: 51.6021, lon: -0.1196 },
  { code: 'ARN', name: 'Arnos Grove', lat: 51.6163, lon: -0.1334 },
  { code: 'WGC', name: 'Winchmore Hill', lat: 51.6341, lon: -0.1008 },
  { code: 'GAN', name: 'Grange Park', lat: 51.6414, lon: -0.1044 },
  { code: 'ENF', name: 'Enfield Chase', lat: 51.6527, lon: -0.1047 },
  { code: 'GNT', name: 'Gordon Hill', lat: 51.6781, lon: -0.0852 },
  { code: 'CWN', name: 'Crews Hill', lat: 51.6945, lon: -0.0797 },
  { code: 'CHN', name: 'Cuffley', lat: 51.7086, lon: -0.1021 },
]

export const PALMERS_GREEN = { code: 'PAL', name: 'Palmers Green', lat: 51.6176, lon: -0.1116 }
export const MOORGATE = { code: 'MOG', name: 'Moorgate' }

// Piccadilly stations nearest home — used as alight-here targets in HOME mode
// Shows eastbound arrivals (trains coming from central London toward Cockfosters)
export const TUBE_STATIONS = [
  { name: 'Arnos Grove',  line: 'Piccadilly', lat: 51.6163, lon: -0.1334, naptanId: '940GZZLUASG' },
  { name: 'Bounds Green', line: 'Piccadilly', lat: 51.6071, lon: -0.1242, naptanId: '940GZZLUBDS' },
  { name: 'Wood Green',   line: 'Piccadilly', lat: 51.5974, lon: -0.1243, naptanId: '940GZZLUWOG' },
]

// Finsbury Park: Piccadilly → GN interchange for "Tube + Train" HOME option
export const TUBE_TRAIN_INTERCHANGE = {
  naptanId: '940GZZLUFPK',
  name: 'Finsbury Park',
  crs: 'FPK',
}

export const HOME_ADDRESS = import.meta.env.VITE_HOME_ADDRESS || ''

export const MAX_WALK_MINUTES = 15
export const DEPARTURE_NOTIFY_MINUTES = 15

// Bus routes that serve the N13 / Palmers Green area
export const BUS_ROUTES_HOME = ['329', '121', 'w6', '34', '184', '299', '298', '102']

// Bus routes that stop near each Piccadilly tube station (for bus supplements)
export const TUBE_STATION_BUS_ROUTES = {
  '940GZZLUASG': ['184', '34', '121'],        // Arnos Grove
  '940GZZLUBDS': ['184', '299', '102'],        // Bounds Green
  '940GZZLUWOG': ['W6', '299', '184'],         // Wood Green
}

// London Overground — Silver Street (for users coming from east London)
// Platform 2 = northbound trains from Liverpool Street toward Cheshunt
export const OVERGROUND_STATIONS = [
  { name: 'Silver Street', line: 'London Overground', lat: 51.614688, lon: -0.06724, naptanId: '910GSIVRST', inboundPlatform: 'Platform 2' },
]

// Bus routes that stop near each overground station (for bus supplements)
export const OVERGROUND_STATION_BUS_ROUTES = {
  '910GSIVRST': ['102', '34'], // Silver Street → bus to Palmers Green
}

// Approximate GN journey times (minutes) from each station to Palmers Green
export const JOURNEY_MINS_TO_PAL_EXPORT = {
  MOG: 30, OLD: 27, EXR: 24, HBY: 21, DRN: 18,
  FPK: 15, HRY: 12, HPY: 9, ALX: 6, BVP: 4,
  WGC: 4, GAN: 6, ENF: 9, GNT: 12, CWN: 15, CHN: 18,
}
