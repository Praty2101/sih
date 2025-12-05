import { useState } from 'react';
import Navbar from '../components/Navbar';
import { traceService } from '../services/trace';
import { TraceResult, GPSPoint } from '../types';

export default function Trace() {
  const [batchId, setBatchId] = useState('');
  const [trace, setTrace] = useState<TraceResult | null>(null);
  const [gpsTrack, setGpsTrack] = useState<GPSPoint[] | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setTrace(null);
    setGpsTrack(null);

    try {
      const res = await traceService.traceBatch(batchId);
      setTrace(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Batch not found');
    }
  };

  const handleViewGPS = async (deviceId: string) => {
    try {
      const res = await traceService.getGPS(deviceId);
      setGpsTrack(res.data);
    } catch (err: any) {
      setError('GPS track not found');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white p-8 rounded-lg shadow-md mb-6">
          <h1 className="text-2xl font-bold text-center mb-6">Track Product</h1>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Batch ID</label>
              <input
                type="text"
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700"
            >
              Track
            </button>
          </form>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded mb-6">{error}</div>
        )}

        {trace && (
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-6">Trace Timeline</h2>
            
            {/* Participants */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {trace.farmer && (
                <div className="bg-green-50 p-4 rounded">
                  <h3 className="font-semibold">Farmer</h3>
                  <p className="text-sm text-gray-600">{trace.farmer.name}</p>
                  <p className="text-sm">DID: {trace.farmer.did}</p>
                  <p className="text-sm">Trust: {trace.farmer.trustScore.toFixed(2)}</p>
                </div>
              )}
              {trace.transporter && (
                <div className="bg-blue-50 p-4 rounded">
                  <h3 className="font-semibold">Transporter</h3>
                  <p className="text-sm text-gray-600">{trace.transporter.name}</p>
                  <p className="text-sm">DID: {trace.transporter.did}</p>
                  <p className="text-sm">Trust: {trace.transporter.trustScore.toFixed(2)}</p>
                  <button
                    onClick={() => handleViewGPS('device-001')}
                    className="mt-2 text-xs bg-blue-600 text-white px-2 py-1 rounded"
                  >
                    View GPS
                  </button>
                </div>
              )}
              {trace.retailer && (
                <div className="bg-yellow-50 p-4 rounded">
                  <h3 className="font-semibold">Retailer</h3>
                  <p className="text-sm text-gray-600">{trace.retailer.name}</p>
                  <p className="text-sm">DID: {trace.retailer.did}</p>
                  <p className="text-sm">Trust: {trace.retailer.trustScore.toFixed(2)}</p>
                </div>
              )}
            </div>

            {/* Events Timeline */}
            <div className="space-y-4">
              <h3 className="font-semibold">Events</h3>
              {trace.events.map((event, idx) => (
                <div key={idx} className="border-l-4 border-green-500 pl-4 py-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">{event.actorRole}</span>
                    <span className="text-sm text-gray-500">
                      {new Date(event.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{event.summary}</p>
                  <p className="text-xs text-gray-400 mt-1">DID: {event.did}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {gpsTrack && (
          <div className="bg-white p-8 rounded-lg shadow-md mt-6">
            <h2 className="text-xl font-bold mb-4">GPS Track</h2>
            <div className="space-y-2">
              {gpsTrack.map((point, idx) => (
                <div key={idx} className="flex justify-between p-2 bg-gray-50 rounded">
                  <span>Point {idx + 1}</span>
                  <span className="text-sm">
                    {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(point.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


