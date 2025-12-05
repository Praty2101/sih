export interface User {
  id: string;
  did: string;
  role: string;
  trustScore: number;
  status: string;
}

export interface TraceResult {
  batchId: string;
  farmer: { did: string; trustScore: number; name: string } | null;
  transporter: { did: string; trustScore: number; name: string } | null;
  retailer: { did: string; trustScore: number; name: string } | null;
  events: Array<{
    actorRole: string;
    did: string;
    timestamp: string;
    summary: string;
  }>;
}

export interface GPSPoint {
  lat: number;
  lng: number;
  timestamp: string;
}


