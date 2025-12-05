import { useState, useEffect } from 'react';
import { adminService } from '../../services/admin';

export default function AdminDashboard() {
  const [overview, setOverview] = useState<any>(null);
  const [trustScores, setTrustScores] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      if (activeTab === 'overview') {
        const res = await adminService.getOverview();
        setOverview(res.data);
      } else if (activeTab === 'trust') {
        const res = await adminService.getTrustScores();
        setTrustScores(res.data);
      } else if (activeTab === 'anomalies') {
        const res = await adminService.getAnomalies();
        setAnomalies(res.data);
      }
    } catch (error) {
      console.error('Failed to load data');
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded ${
            activeTab === 'overview' ? 'bg-green-600 text-white' : 'bg-gray-200'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('trust')}
          className={`px-4 py-2 rounded ${
            activeTab === 'trust' ? 'bg-green-600 text-white' : 'bg-gray-200'
          }`}
        >
          Trust Scores
        </button>
        <button
          onClick={() => setActiveTab('anomalies')}
          className={`px-4 py-2 rounded ${
            activeTab === 'anomalies' ? 'bg-green-600 text-white' : 'bg-gray-200'
          }`}
        >
          Anomalies
        </button>
      </div>

      {activeTab === 'overview' && overview && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-2">Total ZKP Verifications</h3>
              <p className="text-3xl font-bold text-green-600">{overview.totalZKPVerifications}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-2">Total Anomalies</h3>
              <p className="text-3xl font-bold text-red-600">{overview.totalAnomalies}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Role Statistics</h3>
            <div className="space-y-4">
              {overview.roleStats.map((stat: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-semibold">{stat.role}</p>
                    <p className="text-sm text-gray-600">Count: {stat.count}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">Avg Trust Score</p>
                    <p className="text-sm text-gray-600">
                      {stat.avgTrustScore ? stat.avgTrustScore.toFixed(2) : 'N/A'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'trust' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Trust Scores</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">DID</th>
                  <th className="text-left p-2">Role</th>
                  <th className="text-left p-2">Trust Score</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {trustScores.map((user, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2 text-sm">{user.did}</td>
                    <td className="p-2">{user.role}</td>
                    <td className="p-2 font-semibold">{user.trustScore.toFixed(2)}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        user.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'anomalies' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Anomalies</h3>
          <div className="space-y-4">
            {anomalies.map((anomaly, idx) => (
              <div key={idx} className="p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold">{anomaly.anomalyType}</p>
                    <p className="text-sm text-gray-600">Batch: {anomaly.batchId || 'N/A'}</p>
                    <p className="text-sm text-gray-600">DID: {anomaly.did || 'N/A'}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    anomaly.status === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {anomaly.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {new Date(anomaly.createdAt).toLocaleString()}
                </p>
                {anomaly.details && (
                  <div className="mt-2 p-2 bg-white rounded text-xs">
                    <pre>{JSON.stringify(anomaly.details, null, 2)}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


