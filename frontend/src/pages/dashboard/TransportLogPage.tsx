import { useState, useEffect } from 'react';
import { authService } from '../../services/auth';
import { dashboardService } from '../../services/dashboard';
import { traceService } from '../../services/trace';

type TransportFormState = {
  batchId: string;
  currentLocation: string;
  temperature: string;
  pickupDate: string;
  etaDate: string;
};

export default function TransportLogPage() {
  const [form, setForm] = useState<TransportFormState>({
    batchId: '',
    currentLocation: '',
    temperature: '',
    pickupDate: '',
    etaDate: '',
  });

  const [errors, setErrors] = useState<Partial<TransportFormState>>({});
  const [user, setUser] = useState<any>(null);
  const [availableBatches, setAvailableBatches] = useState<any[]>([]);

  useEffect(() => {
    loadUser();
    loadAvailableBatches();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await authService.getMe();
      setUser(userData);
    } catch (error) {
      console.error('Failed to load user');
    }
  };

  const loadAvailableBatches = async () => {
    try {
      const response = await dashboardService.getTransporterBatches();
      setAvailableBatches(response.data.batches || []);
    } catch (error) {
      console.error('Failed to load batches:', error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    
    // If batchId is entered, try to find batch details
    if (name === 'batchId' && value.trim()) {
      const batch = availableBatches.find(b => b.batchId === value.trim());
      if (batch) {
        // Auto-fill pickup date if not set
        if (!form.pickupDate) {
          setForm(prev => ({ ...prev, pickupDate: new Date().toISOString().split('T')[0] }));
        }
      }
    }
  };

  const validate = () => {
    const newErrors: Partial<TransportFormState> = {};
    if (!form.batchId.trim()) newErrors.batchId = 'Batch ID is required';
    if (!form.currentLocation.trim()) newErrors.currentLocation = 'Current location is required';
    if (!form.temperature.trim()) newErrors.temperature = 'Temperature is required';
    if (!form.pickupDate) newErrors.pickupDate = 'Pick up date is required';
    if (!form.etaDate) newErrors.etaDate = 'Estimated arrival date is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Find batch details from available batches
    let batchDetails = availableBatches.find(b => b.batchId === form.batchId);
    
    // If not found in available batches, try to fetch from trace API
    if (!batchDetails) {
      try {
        const traceResponse = await traceService.traceBatch(form.batchId);
        if (traceResponse.data?.product) {
          batchDetails = {
            batchId: form.batchId,
            productName: traceResponse.data.product.name || 'Unknown Product',
            quantity: traceResponse.data.product.quantity || 0,
            unit: traceResponse.data.product.unit || 'kg',
            sellingPrice: 0, // Not available from trace
          };
        }
      } catch (error) {
        console.warn('Could not fetch batch details from trace API:', error);
      }
    }
    
    // Create transport log entry
    const transportLog = {
      batchId: form.batchId,
      productName: batchDetails?.productName || form.batchId, // Use batchId as fallback
      quantity: batchDetails?.quantity || 0,
      unit: batchDetails?.unit || 'kg',
      sellingPrice: batchDetails?.sellingPrice || 0,
      currentLocation: form.currentLocation,
      temperature: parseFloat(form.temperature),
      pickupDate: form.pickupDate,
      etaDate: form.etaDate,
      status: 'In Transit', // Will be "Delivered" when retailer receives
      date: form.pickupDate || new Date().toISOString(),
      transporterDid: user?.did || null,
      createdAt: new Date().toISOString(),
    };

    // Save transport log to localStorage
    try {
      const existingLogs = JSON.parse(localStorage.getItem('unichain_transport_logs') || '[]');
      // Check if log for this batch already exists
      const existingIndex = existingLogs.findIndex((log: any) => log.batchId === form.batchId);
      
      if (existingIndex >= 0) {
        // Update existing log
        existingLogs[existingIndex] = transportLog;
      } else {
        // Add new log
        existingLogs.push(transportLog);
      }
      
      // Sort by date (newest first)
      existingLogs.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      localStorage.setItem('unichain_transport_logs', JSON.stringify(existingLogs));
      
      // Increment total produce transported
      const currentTotal = parseFloat(localStorage.getItem('unichain_transporter_total_produce') || '1520');
      const increment = transportLog.quantity || 50; // Use actual quantity or default
      const newTotal = currentTotal + increment;
      localStorage.setItem('unichain_transporter_total_produce', newTotal.toString());
      
      // Dispatch custom event to notify dashboard to refresh
      window.dispatchEvent(new CustomEvent('transportLogUpdated'));
      
      // Show success message
      alert(`Transport log saved successfully for ${transportLog.productName} (${transportLog.quantity} ${transportLog.unit})`);
      
      // Reset form
      setForm({
        batchId: '',
        currentLocation: '',
        temperature: '',
        pickupDate: '',
        etaDate: '',
      });
    } catch (error) {
      console.error('Failed to save transport log:', error);
      alert('Failed to save transport log. Please try again.');
    }
  };

  const journeyStages = [
    { key: 'created', label: 'Batch Created (Farmer)', active: !!form.batchId },
    { key: 'picked', label: 'Picked Up', active: !!form.pickupDate },
    { key: 'in_transit', label: 'In Transit', active: !!form.currentLocation },
    { key: 'near_destination', label: 'Near Destination', active: !!form.etaDate },
    { key: 'delivered', label: 'Delivered (Retailer)', active: false },
  ];

  const temperatureValue = Number(form.temperature);
  const tempStatus =
    !form.temperature
      ? 'Unknown'
      : isNaN(temperatureValue)
      ? 'Invalid'
      : temperatureValue < 2 || temperatureValue > 12
      ? 'Out of safe range'
      : 'Within safe range';

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Transport Log</h1>
        <p className="mt-1 text-sm text-gray-600">
          Record live shipment details linked to farmer batch IDs and track journey status.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Form */}
        <section className="bg-white shadow-sm rounded-xl p-6 md:p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Log Shipment Details</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Batch ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Batch ID (from Farmer) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="batchId"
                value={form.batchId}
                onChange={handleChange}
                placeholder="e.g., BATCH-ABC123"
                list="batch-list"
                className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.batchId ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                }`}
              />
              <datalist id="batch-list">
                {availableBatches.map((batch) => (
                  <option key={batch.batchId} value={batch.batchId}>
                    {batch.productName} - {batch.quantity} {batch.unit}
                  </option>
                ))}
              </datalist>
              {errors.batchId && (
                <p className="mt-1 text-xs text-red-600">{errors.batchId}</p>
              )}
              {form.batchId && availableBatches.find(b => b.batchId === form.batchId) && (
                <p className="mt-1 text-xs text-green-600">
                  ✓ Found: {availableBatches.find(b => b.batchId === form.batchId)?.productName} 
                  ({availableBatches.find(b => b.batchId === form.batchId)?.quantity} {availableBatches.find(b => b.batchId === form.batchId)?.unit})
                </p>
              )}
            </div>

            {/* Current Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Current Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="currentLocation"
                value={form.currentLocation}
                onChange={handleChange}
                placeholder="e.g., NH-16, near Bhubaneswar toll"
                className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.currentLocation ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                }`}
              />
              {errors.currentLocation && (
                <p className="mt-1 text-xs text-red-600">{errors.currentLocation}</p>
              )}
            </div>

            {/* Temperature */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Temperature (°C) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="temperature"
                value={form.temperature}
                onChange={handleChange}
                placeholder="e.g., 8"
                className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.temperature ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                }`}
              />
              {errors.temperature && (
                <p className="mt-1 text-xs text-red-600">{errors.temperature}</p>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Pick Up Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="pickupDate"
                  value={form.pickupDate}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.pickupDate ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.pickupDate && (
                  <p className="mt-1 text-xs text-red-600">{errors.pickupDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Estimated Arrival Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="etaDate"
                  value={form.etaDate}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.etaDate ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.etaDate && (
                  <p className="mt-1 text-xs text-red-600">{errors.etaDate}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Save Transport Log
              </button>
            </div>
          </form>
        </section>

        {/* Right: Live status + Journey timeline */}
        <section className="space-y-4">
          {/* Real-time summary card */}
          <div className="bg-white shadow-sm rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Live Shipment Status</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500">Batch ID</p>
                <p className="font-mono text-xs break-all">
                  {form.batchId
                    ? `${form.batchId} → TRANSPORTATION (${form.pickupDate || 'no pickup date yet'})`
                    : 'Not set'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Current Location</p>
                <p className="font-medium text-gray-800">
                  {form.currentLocation || 'Awaiting pickup location'}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500">Temperature</p>
                  <p className="font-medium text-gray-800">
                    {form.temperature ? `${form.temperature} °C` : 'No reading'}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    tempStatus === 'Within safe range'
                      ? 'bg-green-100 text-green-700'
                      : tempStatus === 'Out of safe range'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {tempStatus}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-gray-500">Pick Up</p>
                  <p className="font-medium text-gray-800">
                    {form.pickupDate || 'Not set'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">ETA</p>
                  <p className="font-medium text-gray-800">
                    {form.etaDate || 'Not set'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Journey timeline */}
          <div className="bg-white shadow-sm rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Journey Timeline</h2>
            <ol className="relative border-l border-gray-200 text-sm">
              {journeyStages.map((stage, index) => {
                const isActive = stage.active;
                const isLast = index === journeyStages.length - 1;
                return (
                  <li key={stage.key} className={`mb-6 ml-4 ${isLast ? 'mb-0' : ''}`}>
                    <div
                      className={`absolute w-3 h-3 rounded-full -left-1.5 border ${
                        isActive
                          ? 'bg-indigo-600 border-indigo-600'
                          : 'bg-white border-gray-300'
                      }`}
                    ></div>
                    <p className="font-medium text-gray-900">{stage.label}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stage.key === 'created' && (form.batchId ? 'Linked to farmer batch.' : 'Waiting for batch ID.')}
                      {stage.key === 'picked' && (form.pickupDate ? `Picked on ${form.pickupDate}.` : 'Pickup date not set.')}
                      {stage.key === 'in_transit' &&
                        (form.currentLocation ? `Currently near ${form.currentLocation}.` : 'Not yet in transit.')}
                      {stage.key === 'near_destination' &&
                        (form.etaDate ? `Estimated arrival on ${form.etaDate}.` : 'ETA not set.')}
                      {stage.key === 'delivered' && 'Will be marked when retailer receives batch.'}
                    </p>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>
      </div>
    </div>
  );
}



