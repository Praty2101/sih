import { useEffect, useState } from 'react';
import { adminService } from '../services/admin';

export default function Analytics() {
  const [overview, setOverview] = useState<any>(null);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    try {
      const res = await adminService.getOverview();
      setOverview(res.data);
    } catch (error) {
      console.error('Failed to load overview');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>
      {overview && (
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
      )}
    </div>
  );
}


