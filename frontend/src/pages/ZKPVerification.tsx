import { useState } from 'react';
import Navbar from '../components/Navbar';
import { batchService } from '../services/batch';

export default function ZKPVerification() {
  const [formData, setFormData] = useState({
    did: '',
    batchId: '',
    proofType: 'MARGIN',
    proofPayload: '',
  });
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);

    try {
      const res = await batchService.verifyZKP(formData);
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Verification failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-center mb-6">ZKP Verification</h1>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">DID</label>
              <input
                type="text"
                value={formData.did}
                onChange={(e) => setFormData({ ...formData, did: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Batch ID</label>
              <input
                type="text"
                value={formData.batchId}
                onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Proof Type</label>
              <select
                value={formData.proofType}
                onChange={(e) => setFormData({ ...formData, proofType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="MARGIN">Margin</option>
                <option value="PAYMENT">Payment</option>
                <option value="ROUTE">Route</option>
                <option value="EXPIRY">Expiry</option>
              </select>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Proof Payload (include "valid" for success)</label>
              <textarea
                value={formData.proofPayload}
                onChange={(e) => setFormData({ ...formData, proofPayload: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700"
            >
              Verify
            </button>
          </form>

          {error && (
            <div className="mt-4 bg-red-100 text-red-700 p-3 rounded">{error}</div>
          )}

          {result && (
            <div className={`mt-4 p-3 rounded ${
              result.verified ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              <p><strong>Status:</strong> {result.verified ? 'Verified' : 'Failed'}</p>
              <p>{result.message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


