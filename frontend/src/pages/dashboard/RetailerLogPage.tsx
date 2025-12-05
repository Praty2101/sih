import React, { useState } from 'react';

type CustomerType = 'walking-in' | 'restaurant' | 'wholesale' | 'online';

interface FormState {
  productId: string;
  quantitySold: string;
  salePrice: string;
  storeLocation: string;
  customerType: '' | CustomerType;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const initialFormState: FormState = {
  productId: '',
  quantitySold: '',
  salePrice: '',
  storeLocation: '',
  customerType: '',
};

const RetailerLogPage: React.FC = () => {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setSubmitMessage(null);
    setShowSuccess(false);
  };

  const validate = (): FormErrors => {
    const newErrors: FormErrors = {};

    if (!form.productId.trim()) {
      newErrors.productId = 'Product ID is required';
    }

    const quantity = Number(form.quantitySold);
    if (!form.quantitySold) {
      newErrors.quantitySold = 'Quantity sold is required';
    } else if (isNaN(quantity) || quantity <= 0) {
      newErrors.quantitySold = 'Quantity must be greater than 0';
    }

    const price = Number(form.salePrice);
    if (!form.salePrice) {
      newErrors.salePrice = 'Sale price is required';
    } else if (isNaN(price) || price <= 0) {
      newErrors.salePrice = 'Sale price must be greater than 0';
    }

    if (!form.storeLocation.trim()) {
      newErrors.storeLocation = 'Store location is required';
    }

    if (!form.customerType) {
      newErrors.customerType = 'Please select a customer type';
    }

    return newErrors;
  };

  const calculateRevenue = (): number => {
    const quantity = Number(form.quantitySold) || 0;
    const price = Number(form.salePrice) || 0;
    return quantity * price;
  };

  const getFormCompletion = (): number => {
    let completed = 0;
    if (form.productId.trim()) completed++;
    if (form.quantitySold && Number(form.quantitySold) > 0) completed++;
    if (form.salePrice && Number(form.salePrice) > 0) completed++;
    if (form.storeLocation.trim()) completed++;
    if (form.customerType) completed++;
    return (completed / 5) * 100;
  };

  const getCustomerTypeLabel = (type: CustomerType): string => {
    const labels: Record<CustomerType, string> = {
      'walking-in': 'Walking in Street',
      restaurant: 'Restaurant',
      wholesale: 'Wholesale Buyer',
      online: 'Online',
    };
    return labels[type];
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitMessage(null);
    setShowSuccess(false);
    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        productId: form.productId,
        quantitySold: Number(form.quantitySold),
        salePrice: Number(form.salePrice),
        storeLocation: form.storeLocation,
        customerType: form.customerType,
        totalRevenue: calculateRevenue(),
        timestamp: new Date().toISOString(),
      };

      console.log('Retailer Log payload:', payload);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      setShowSuccess(true);
      setSubmitMessage('Sale logged successfully!');

      // Reset form after 2 seconds
      setTimeout(() => {
        setForm(initialFormState);
        setShowSuccess(false);
        setSubmitMessage(null);
      }, 2000);
    } catch (error: any) {
      console.error('Error logging sale:', error);
      setSubmitMessage(error.response?.data?.error || 'Failed to log sale. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm(initialFormState);
    setErrors({});
    setSubmitMessage(null);
    setShowSuccess(false);
  };

  const completionPercentage = getFormCompletion();
  const totalRevenue = calculateRevenue();

  return (
    <div>
      {/* Professional Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Retailer Log
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Record your sales and track revenue in real-time
            </p>
          </div>
          {/* Form Completion Indicator */}
          <div className="text-right">
            <div className="text-xs text-gray-500 mb-1">Form Completion</div>
            <div className="flex items-center space-x-2">
              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-600 transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-gray-700">
                {Math.round(completionPercentage)}%
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Success Message */}
      {showSuccess && submitMessage && (
        <div className="mb-4 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800 flex items-center space-x-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span>{submitMessage}</span>
        </div>
      )}

      {/* Error Message */}
      {!showSuccess && submitMessage && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          {submitMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input Form */}
        <section className="bg-white shadow-sm rounded-xl p-6 md:p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Sale Information
          </h2>
          <form onSubmit={handleSubmit} noValidate>
            {/* Product ID */}
            <div className="mb-5">
              <label
                htmlFor="productId"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Product ID <span className="text-red-500">*</span>
              </label>
              <input
                id="productId"
                name="productId"
                type="text"
                value={form.productId}
                onChange={handleChange}
                placeholder="e.g., BATCH-ABC123"
                className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.productId
                    ? 'border-red-500 focus:ring-red-500'
                    : form.productId
                    ? 'border-green-500'
                    : 'border-gray-300'
                }`}
              />
              {errors.productId && (
                <p className="mt-1 text-xs text-red-600">{errors.productId}</p>
              )}
              {form.productId && !errors.productId && (
                <p className="mt-1 text-xs text-green-600">✓ Valid</p>
              )}
            </div>

            {/* Quantity Sold + Sale Price */}
            <div className="mb-5 grid gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="quantitySold"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Quantity Sold <span className="text-red-500">*</span>
                </label>
                <input
                  id="quantitySold"
                  name="quantitySold"
                  type="number"
                  min={1}
                  step="0.01"
                  value={form.quantitySold}
                  onChange={handleChange}
                  placeholder="e.g., 50"
                  className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.quantitySold
                      ? 'border-red-500 focus:ring-red-500'
                      : form.quantitySold && Number(form.quantitySold) > 0
                      ? 'border-green-500'
                      : 'border-gray-300'
                  }`}
                />
                {errors.quantitySold && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.quantitySold}
                  </p>
                )}
                {form.quantitySold &&
                  Number(form.quantitySold) > 0 &&
                  !errors.quantitySold && (
                    <p className="mt-1 text-xs text-green-600">✓ Valid</p>
                  )}
              </div>

              <div>
                <label
                  htmlFor="salePrice"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Sale Price (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  id="salePrice"
                  name="salePrice"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.salePrice}
                  onChange={handleChange}
                  placeholder="e.g., 100.00"
                  className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.salePrice
                      ? 'border-red-500 focus:ring-red-500'
                      : form.salePrice && Number(form.salePrice) > 0
                      ? 'border-green-500'
                      : 'border-gray-300'
                  }`}
                />
                {errors.salePrice && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.salePrice}
                  </p>
                )}
                {form.salePrice &&
                  Number(form.salePrice) > 0 &&
                  !errors.salePrice && (
                    <p className="mt-1 text-xs text-green-600">✓ Valid</p>
                  )}
              </div>
            </div>

            {/* Store Location */}
            <div className="mb-5">
              <label
                htmlFor="storeLocation"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Store Location <span className="text-red-500">*</span>
              </label>
              <input
                id="storeLocation"
                name="storeLocation"
                type="text"
                value={form.storeLocation}
                onChange={handleChange}
                placeholder="e.g., Shop 12, Main Market, Pune"
                className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.storeLocation
                    ? 'border-red-500 focus:ring-red-500'
                    : form.storeLocation
                    ? 'border-green-500'
                    : 'border-gray-300'
                }`}
              />
              {errors.storeLocation && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.storeLocation}
                </p>
              )}
              {form.storeLocation && !errors.storeLocation && (
                <p className="mt-1 text-xs text-green-600">✓ Valid</p>
              )}
            </div>

            {/* Customer Type */}
            <div className="mb-6">
              <label
                htmlFor="customerType"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Customer Type <span className="text-red-500">*</span>
              </label>
              <select
                id="customerType"
                name="customerType"
                value={form.customerType}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.customerType
                    ? 'border-red-500 focus:ring-red-500'
                    : form.customerType
                    ? 'border-green-500'
                    : 'border-gray-300'
                }`}
              >
                <option value="">Select customer type</option>
                <option value="walking-in">Walking in Street</option>
                <option value="restaurant">Restaurant</option>
                <option value="wholesale">Wholesale Buyer</option>
                <option value="online">Online</option>
              </select>
              {errors.customerType && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.customerType}
                </p>
              )}
              {form.customerType && !errors.customerType && (
                <p className="mt-1 text-xs text-green-600">✓ Valid</p>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col sm:flex-row sm:justify-end sm:space-x-3 space-y-3 sm:space-y-0">
              <button
                type="button"
                onClick={handleReset}
                className="w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Reset
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-60"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Logging Sale...' : 'Log Sale'}
              </button>
            </div>
          </form>
        </section>

        {/* Right: Real-time Data Display Panel */}
        <section className="space-y-6">
          {/* Live Sale Data Panel */}
          <div className="bg-white shadow-sm rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Live Sale Data
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Product ID</p>
                <p className="text-sm font-semibold text-gray-900">
                  {form.productId || (
                    <span className="text-gray-400 italic">Not entered</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Quantity Sold</p>
                <p className="text-sm font-semibold text-gray-900">
                  {form.quantitySold ? (
                    <>
                      {Number(form.quantitySold).toLocaleString()}{' '}
                      <span className="text-gray-500 text-xs">units</span>
                    </>
                  ) : (
                    <span className="text-gray-400 italic">Not entered</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Sale Price</p>
                <p className="text-sm font-semibold text-gray-900">
                  {form.salePrice ? (
                    <>
                      ₹{Number(form.salePrice).toFixed(2)}{' '}
                      <span className="text-gray-500 text-xs">per unit</span>
                    </>
                  ) : (
                    <span className="text-gray-400 italic">Not entered</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Store Location</p>
                <p className="text-sm font-semibold text-gray-900">
                  {form.storeLocation || (
                    <span className="text-gray-400 italic">Not entered</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Customer Type</p>
                <p className="text-sm font-semibold text-gray-900">
                  {form.customerType ? (
                    <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-700">
                      {getCustomerTypeLabel(form.customerType)}
                    </span>
                  ) : (
                    <span className="text-gray-400 italic">Not selected</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Live Revenue Calculator */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 shadow-sm rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Revenue Calculator
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Quantity Sold</span>
                <span className="text-sm font-semibold text-gray-900">
                  {form.quantitySold || '0'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Sale Price</span>
                <span className="text-sm font-semibold text-gray-900">
                  {form.salePrice ? `₹${Number(form.salePrice).toFixed(2)}` : '₹0.00'}
                </span>
              </div>
              <div className="border-t border-green-300 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-base font-semibold text-gray-900">
                    Total Revenue
                  </span>
                  <span className="text-2xl font-bold text-green-700">
                    ₹{totalRevenue.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
              {totalRevenue > 0 && (
                <p className="text-xs text-green-600 mt-2">
                  ✓ Revenue calculated automatically
                </p>
              )}
            </div>
          </div>

          {/* Status Indicators */}
          <div className="bg-white shadow-sm rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Form Status
            </h2>
            <div className="space-y-2">
              {[
                { label: 'Product ID', value: form.productId },
                { label: 'Quantity', value: form.quantitySold },
                { label: 'Sale Price', value: form.salePrice },
                { label: 'Store Location', value: form.storeLocation },
                { label: 'Customer Type', value: form.customerType },
              ].map((field) => (
                <div key={field.label} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{field.label}</span>
                  {field.value ? (
                    <span className="text-green-600 text-xs font-semibold">
                      ✓ Complete
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">Pending</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default RetailerLogPage;


