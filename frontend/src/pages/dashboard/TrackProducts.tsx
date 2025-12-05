import { useState, useEffect } from 'react';
import { traceService } from '../../services/trace';
import api from '../../services/api';

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

export default function TrackProducts() {
  const [batchId, setBatchId] = useState('');
  const [trace, setTrace] = useState<TraceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sampleBatchIds, setSampleBatchIds] = useState<string[]>([]);

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
    const iconClass = "w-5 h-5";
    switch (stage) {
      case 'Harvested':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        );
      case 'Quality Check':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'Pickup':
      case 'Transit':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        );
      case 'Retail Arrival':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        );
      default:
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Farmer':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Transporter':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Retailer':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'AI System':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-8">
      {/* Professional Header */}
      <div className="flex items-center gap-4">
        <div className="w-1 h-12 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full"></div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Track Products</h1>
          <p className="text-gray-600 mt-1.5 text-base font-medium">Trace your food's complete journey from farm to table</p>
        </div>
      </div>

      {/* Professional Search Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Product Traceability</h2>
            <p className="text-sm text-gray-500 mt-0.5">Enter QR code or Batch ID to track</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="batchId" className="block text-sm font-semibold text-gray-700 mb-2">
                Batch ID / QR Code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="batchId"
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  placeholder="Enter Batch ID (e.g., BATCH-4S3ST6TRWY7)"
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-base font-medium bg-white"
                  required
                />
              </div>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-4 focus:ring-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-base shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Tracing...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span>Trace Product</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {sampleBatchIds.length > 0 && (
          <div className="pt-6 border-t border-gray-200">
            <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Quick Test - Sample Batch IDs:
            </p>
            <div className="flex flex-wrap gap-2">
              {sampleBatchIds.map((id) => (
                <button
                  key={id}
                  onClick={() => handleSampleClick(id)}
                  className="px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 text-sm font-medium transition-all duration-200 border border-gray-200 hover:border-gray-300 hover:shadow-sm"
                >
                  {id}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Professional Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold">{error}</span>
          </div>
        </div>
      )}

      {trace && trace.product && (
        <div className="space-y-8 animate-fadeIn">
          {/* Professional Product Information Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left: Product Information */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Product Information</h3>
                </div>
                
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {trace.product?.productName || 'Unknown Product'}
                </h2>
                <div className="inline-flex items-center px-3 py-1 rounded-md bg-gray-100 text-gray-700 text-sm font-medium mb-6">
                  <span className="capitalize">{trace.product?.variety || 'Standard'}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Product ID</p>
                    <p className="text-base font-bold text-gray-900 font-mono">{trace.product.productId}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Quantity</p>
                    <p className="text-base font-bold text-gray-900">
                      {trace.product.quantity} <span className="text-sm text-gray-600 font-normal">{trace.product.unit}</span>
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Grade</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-gray-900">{trace.product.grade}</span>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-xs font-semibold border border-emerald-200">Certified</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Harvest Date</p>
                    <p className="text-base font-bold text-gray-900">
                      {formatDate(trace.product.harvestDate)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right: Freshness Score */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-8 border-2 border-emerald-200">
                <div className="text-center">
                  <div className="mb-4">
                    <p className="text-6xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      {trace.freshnessScore}%
                    </p>
                  </div>
                  <p className="text-lg font-bold text-gray-800 mb-6">Freshness Score</p>
                  <div className="flex justify-center gap-1 mb-6">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-7 h-7 ${
                          star <= trace.starRating
                            ? 'text-amber-400 fill-current'
                            : 'text-gray-300'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  {trace.qualityMetrics.spoilageDetected ? (
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-semibold border border-red-200">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Spoilage Detected
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-semibold border border-emerald-200">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Quality Verified
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Professional Supply Chain Journey */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Supply Chain Journey</h3>
                <p className="text-sm text-gray-500 mt-0.5">Complete traceability from farm to your table</p>
              </div>
            </div>

            <div className="relative">
              {/* Professional Timeline */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-400 via-blue-400 to-purple-400 rounded-full"></div>

              {/* Journey Stages */}
              <div className="space-y-6">
                {trace.journeyStages && trace.journeyStages.length > 0 ? (
                  trace.journeyStages.map((stage, index) => (
                    <div key={index} className="relative flex items-start group">
                      {/* Stage Icon */}
                      <div className="relative z-10">
                        <div className="absolute inset-0 bg-blue-400 rounded-full blur-md opacity-20 group-hover:opacity-30 transition-opacity"></div>
                        <div className="relative flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full text-white shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                          {getStageIcon(stage.stage)}
                        </div>
                      </div>

                      {/* Stage Content */}
                      <div className="ml-6 flex-1">
                        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-300">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h4 className="text-lg font-bold text-gray-900 mb-2">{stage.stage}</h4>
                              <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold border ${getRoleBadgeColor(stage.role)}`}>
                                {stage.roleName}
                              </span>
                            </div>
                            <div className="text-right ml-4">
                              <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {formatDateTime(stage.dateTime)}
                              </div>
                            </div>
                          </div>

                          <p className="text-gray-700 mb-4 leading-relaxed font-medium">{stage.description}</p>

                          <div className="flex flex-wrap gap-3">
                            <div className="flex items-center gap-2 text-gray-700 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="text-sm font-semibold">{stage.location}</span>
                            </div>
                            {stage.temperature && (
                              <div className="flex items-center gap-2 text-gray-700 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                <span className="text-sm font-semibold">{stage.temperature}</span>
                              </div>
                            )}
                            {stage.qualityScore && (
                              <div className="flex items-center gap-2 text-gray-700 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
                                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-sm font-semibold">Quality: {stage.qualityScore.toFixed(1)}/100</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="font-semibold">No journey stages available for this batch.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
