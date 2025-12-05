// Dummy GPS tracking data
export const gpsTracks: Record<string, Array<{ lat: number; lng: number; timestamp: string }>> = {
  'device-001': [
    { lat: 22.57, lng: 88.36, timestamp: '2025-12-03T10:00:00Z' },
    { lat: 22.60, lng: 88.40, timestamp: '2025-12-03T10:10:00Z' },
    { lat: 22.65, lng: 88.45, timestamp: '2025-12-03T10:20:00Z' },
    { lat: 22.70, lng: 88.50, timestamp: '2025-12-03T10:30:00Z' },
  ],
  'device-002': [
    { lat: 19.08, lng: 72.87, timestamp: '2025-12-03T11:00:00Z' },
    { lat: 19.10, lng: 72.90, timestamp: '2025-12-03T11:15:00Z' },
    { lat: 19.15, lng: 72.95, timestamp: '2025-12-03T11:30:00Z' },
  ],
  'device-003': [
    { lat: 28.61, lng: 77.20, timestamp: '2025-12-03T12:00:00Z' },
    { lat: 28.65, lng: 77.25, timestamp: '2025-12-03T12:20:00Z' },
    { lat: 28.70, lng: 77.30, timestamp: '2025-12-03T12:40:00Z' },
  ],
};


