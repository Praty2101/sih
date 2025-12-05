import { useState, useEffect } from 'react';
import { traceService } from '../services/trace';
import api from '../services/api';

interface JourneyStage {
  stage: string;
  role: string;
  roleName: string;
  dateTime: string;
  description: string;
  location: string;
  temperature: string | null;
  qualityScore?: number | null;
}

interface TraceResult {
  batchId: string;
  product: {
    productName: string;
    variety: string;
    productId: string;
    quantity: number;
    unit: string;
    grade: string;
    harvestDate: string;
    farmingMethod: string;
  };
  freshnessScore: number;
  starRating: number;
  farmer: {
    did: string;
    trustScore: number;
    name: string;
    address: string;
  } | null;
  transporter: {
    did: string;
    trustScore: number;
    name: string;
    address: string;
  } | null;
  retailer: {
    did: string;
    trustScore: number;
    name: string;
    address: string;
  } | null;
  journeyStages: JourneyStage[];
  qualityMetrics: {
    latestQualityScore: number | null;
    latestMoisture: number | null;
    latestTemperature: number | null;
    spoilageDetected: boolean;
  };
}

export default function ConsumerPortal() {
  const [batchId, setBatchId] = useState('');
  const [trace, setTrace] = useState<TraceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sampleBatchIds, setSampleBatchIds] = useState<string[]>([]);

  // Load sample batch IDs on mount
  useEffect(() => {
    const loadSampleBatchIds = async () => {
      try {
        const res = await api.get('/ledger/economic?limit=5');
        const batchIds = res.data.transactions
          ?.map((tx: any) => tx.batchId)
          .filter((id: string | null) => id !== null)
          .slice(0, 3) || [];
        setSampleBatchIds(batchIds);
      } catch (error) {
        console.error('Failed to load sample batch IDs');
      }
    };
    loadSampleBatchIds();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchId.trim()) {
      setError('Please enter a Batch ID');
      return;
    }
    setError('');
    setTrace(null);
    setLoading(true);

    try {
      const res = await traceService.traceBatch(batchId.trim());
      if (res.data) {
        setTrace(res.data);
      } else {
        setError('No data received from server');
      }
    } catch (err: any) {
      console.error('Trace error:', err);
      setError(err.response?.data?.error || err.message || 'Batch not found. Please check the Batch ID and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSampleClick = async (sampleId: string) => {
    if (sampleId) {
      setBatchId(sampleId);
      setError('');
      setTrace(null);
    } else {
      // Get a random batch ID from the API
      try {
        const res = await api.get('/ledger/economic?limit=5');
        if (res.data.transactions && res.data.transactions.length > 0) {
          const randomTx = res.data.transactions[Math.floor(Math.random() * res.data.transactions.length)];
          if (randomTx.batchId) {
            setBatchId(randomTx.batchId);
            setError('');
            setTrace(null);
          }
        }
      } catch (error) {
        console.error('Failed to fetch sample batch ID');
      }
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'Harvested':
        return '👨‍🌾';
      case 'Quality Check':
        return '⭐';
      case 'Pickup':
      case 'Transit':
        return '🚚';
      case 'Retail Arrival':
        return '🏪';
      default:
        return '📍';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Farmer':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Transporter':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Retailer':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'AI System':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Consumer Portal</h1>
              <p className="text-gray-600 mt-1">Trace your food's complete journey</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Scan Product QR Code Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900">Scan Product QR Code</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Enter your QR code or Product ID to view complete traceability information
          </p>

          <form onSubmit={handleSubmit} className="mb-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="batchId" className="block text-sm font-medium text-gray-700 mb-2">
                  QR Code / Product ID
                </label>
                <input
                  type="text"
                  id="batchId"
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  placeholder="e.g., BATCH-4S3ST6TRWY7"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'Tracing...' : 'Trace Product'}
                </button>
              </div>
            </div>
          </form>

          {sampleBatchIds.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-3">Try these sample Product IDs:</p>
              <div className="flex flex-wrap gap-3">
                {sampleBatchIds.map((id) => (
                  <button
                    key={id}
                    onClick={() => handleSampleClick(id)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
                  >
                    {id}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-8">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {trace && trace.product && (
          <div className="space-y-8">
            {/* Product Information Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Product Information */}
                <div>
                  <div className="flex items-center space-x-2 mb-6">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900">Product Information</h3>
                  </div>
                  
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {trace.product?.productName || 'Unknown Product'}
                  </h2>
                  <p className="text-lg text-gray-600 mb-6 capitalize">{trace.product?.variety || 'Standard'}</p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Product ID</p>
                      <p className="text-base font-semibold text-gray-900 font-mono">{trace.product.productId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Quantity</p>
                      <p className="text-base font-semibold text-gray-900">
                        {trace.product.quantity} {trace.product.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Grade</p>
                      <p className="text-base font-semibold text-gray-900">{trace.product.grade}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Harvest Date</p>
                      <p className="text-base font-semibold text-gray-900">
                        {formatDate(trace.product.harvestDate)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right: Freshness Score */}
                <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
                  <div className="text-center">
                    <p className="text-6xl font-bold text-green-600 mb-2">{trace.freshnessScore}%</p>
                    <p className="text-lg font-medium text-gray-700 mb-4">Freshness Score</p>
                    <div className="flex justify-center space-x-1 mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-6 h-6 ${
                            star <= trace.starRating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    {trace.qualityMetrics.spoilageDetected && (
                      <p className="text-sm text-red-600 font-medium">⚠️ Spoilage Detected</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Supply Chain Journey */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Supply Chain Journey</h3>
              <p className="text-gray-600 mb-8">Complete traceability from farm to your table</p>

              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                {/* Journey Stages */}
                <div className="space-y-8">
                  {trace.journeyStages && trace.journeyStages.length > 0 ? (
                    trace.journeyStages.map((stage, index) => (
                      <div key={index} className="relative flex items-start">
                        {/* Stage Icon */}
                        <div className="relative z-10 flex items-center justify-center w-12 h-12 bg-blue-600 rounded-full text-white text-xl shadow-lg">
                          {getStageIcon(stage.stage)}
                        </div>

                        {/* Stage Content */}
                        <div className="ml-6 flex-1">
                          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="text-lg font-bold text-gray-900 mb-2">{stage.stage}</h4>
                                <span
                                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(
                                    stage.role
                                  )}`}
                                >
                                  {stage.roleName}
                                </span>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">
                                  {formatDateTime(stage.dateTime)}
                                </p>
                              </div>
                            </div>

                            <p className="text-gray-700 mb-4">{stage.description}</p>

                            <div className="flex flex-wrap gap-4 text-sm">
                              <div className="flex items-center text-gray-600">
                                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>{stage.location}</span>
                              </div>
                              {stage.temperature && (
                                <div className="flex items-center text-gray-600">
                                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                  </svg>
                                  <span>{stage.temperature}</span>
                                </div>
                              )}
                              {stage.qualityScore && (
                                <div className="flex items-center text-gray-600">
                                  <span className="font-medium">Quality: {stage.qualityScore.toFixed(1)}/100</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No journey stages available for this batch.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

