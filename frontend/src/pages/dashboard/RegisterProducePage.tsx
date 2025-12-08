import React, { useState, useEffect } from 'react';
import { produceService } from '../../services/produce';
import { suppliesService, Supply } from '../../services/supplies';

type UnitOption = 'kg' | 'quintal' | 'tonne' | 'crate' | 'bag';

type FarmingMethod = 'organic' | 'natural' | 'conventional' | 'integrated';

interface FormState {
  productName: string;
  variety: string;
  quantity: string;
  unit: '' | UnitOption;
  harvestDate: string;
  farmingMethod: '' | FarmingMethod;
  sellingPrice: string;
  temperature: string;
  moistureLevel: string;
  notes: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const initialFormState: FormState = {
  productName: '',
  variety: '',
  quantity: '',
  unit: '',
  harvestDate: '',
  farmingMethod: '',
  sellingPrice: '',
  temperature: '',
  moistureLevel: '',
  notes: '',
};

const RegisterProducePage: React.FC = () => {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [loadingSupplies, setLoadingSupplies] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  // Fetch supplies from the backend on component mount
  useEffect(() => {
    const fetchSupplies = async () => {
      try {
        setLoadingSupplies(true);
        const response = await suppliesService.getSupplies();
        if (response.success) {
          // Sort supplies by category and then by name
          const sortedSupplies = response.supplies.sort((a, b) => {
            if (a.category !== b.category) {
              return a.category.localeCompare(b.category);
            }
            return a.name.localeCompare(b.name);
          });
          setSupplies(sortedSupplies);
        }
      } catch (error) {
        console.error('Error fetching supplies:', error);
      } finally {
        setLoadingSupplies(false);
      }
    };
    fetchSupplies();
  }, []);

  // Group supplies by category for the dropdown
  const suppliesByCategory = supplies.reduce((acc, supply) => {
    if (!acc[supply.category]) {
      acc[supply.category] = [];
    }
    acc[supply.category].push(supply);
    return acc;
  }, {} as Record<string, Supply[]>);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setSubmitMessage(null);
  };

  const validate = (): FormErrors => {
    const newErrors: FormErrors = {};

    if (!form.productName.trim()) {
      newErrors.productName = 'Product name is required';
    }

    const quantityNumber = Number(form.quantity);
    if (!form.quantity) {
      newErrors.quantity = 'Quantity is required';
    } else if (isNaN(quantityNumber) || quantityNumber <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    if (!form.unit) {
      newErrors.unit = 'Please select a unit';
    }

    if (!form.harvestDate) {
      newErrors.harvestDate = 'Please choose a harvest date';
    } else if (form.harvestDate > today) {
      newErrors.harvestDate = 'Harvest date cannot be in the future';
    }

    if (!form.farmingMethod) {
      newErrors.farmingMethod = 'Please select a farming method';
    }

    const sellingPriceNumber = Number(form.sellingPrice);
    if (!form.sellingPrice) {
      newErrors.sellingPrice = 'Selling price is required';
    } else if (isNaN(sellingPriceNumber) || sellingPriceNumber < 0) {
      newErrors.sellingPrice = 'Selling price must be a valid positive number';
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitMessage(null);
    setBatchId(null);
    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        productName: form.productName,
        variety: form.variety || undefined,
        quantity: Number(form.quantity),
        unit: form.unit,
        harvestDate: form.harvestDate,
        farmingMethod: form.farmingMethod,
        sellingPrice: Number(form.sellingPrice),
        temperature: form.temperature ? Number(form.temperature) : undefined,
        moistureLevel: form.moistureLevel ? Number(form.moistureLevel) : undefined,
        notes: form.notes || undefined,
      };

      const response = await produceService.registerProduce(payload);
      setBatchId(response.data.batchId);
      setSubmitMessage(`Produce registered successfully! Batch ID: ${response.data.batchId}`);
      
      // Reset form after successful submission
      setTimeout(() => {
        setForm(initialFormState);
        setBatchId(null);
      }, 3000);
    } catch (error: any) {
      console.error('Error registering produce:', error);
      setSubmitMessage(error.response?.data?.error || 'Failed to register produce. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm(initialFormState);
    setErrors({});
    setSubmitMessage(null);
    setBatchId(null);
  };

  return (
    <div>
      {/* Page header */}
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Register Produce
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Add details of your harvested produce to generate a trusted batch record.
        </p>
      </header>

      {/* Success/Error message */}
      {submitMessage && (
        <div className={`mb-4 rounded-md border px-4 py-3 text-sm ${
          batchId 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {submitMessage}
          {batchId && (
            <div className="mt-2 p-2 bg-white rounded border border-green-300">
              <p className="text-xs text-gray-600 mb-1">Your Batch ID:</p>
              <p className="font-mono text-sm font-semibold text-green-700">{batchId}</p>
            </div>
          )}
        </div>
      )}

      {/* Form card */}
      <section className="bg-white shadow-sm rounded-xl p-6 md:p-8">
        <form onSubmit={handleSubmit} noValidate>
          {/* Product Name - Dropdown with supplies from API */}
          <div className="mb-5">
            <label
              htmlFor="productName"
              className="block text-sm font-medium text-gray-700"
            >
              Product Name <span className="text-red-500">*</span>
            </label>
            <select
              id="productName"
              name="productName"
              value={form.productName}
              onChange={handleChange}
              disabled={loadingSupplies}
              className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.productName
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300'
              } ${loadingSupplies ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            >
              <option value="">
                {loadingSupplies ? 'Loading supplies...' : 'Select a product'}
              </option>
              {Object.entries(suppliesByCategory).map(([category, categorySupplies]) => (
                <optgroup key={category} label={`── ${category} ──`}>
                  {categorySupplies.map((supply) => (
                    <option key={supply.id} value={supply.name}>
                      {supply.icon} {supply.name} (₹{supply.currentPrice}/{supply.unit})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Select the product from the available supplies.
            </p>
            {errors.productName && (
              <p className="mt-1 text-xs text-red-600">{errors.productName}</p>
            )}
          </div>

          {/* Variety */}
          <div className="mb-5">
            <label
              htmlFor="variety"
              className="block text-sm font-medium text-gray-700"
            >
              Variety
            </label>
            <input
              id="variety"
              name="variety"
              type="text"
              value={form.variety}
              onChange={handleChange}
              placeholder="e.g., 1121, Cherry Tomato"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Mention the specific variety if available.
            </p>
          </div>

          {/* Quantity + Unit */}
          <div className="mb-5 grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="quantity"
                className="block text-sm font-medium text-gray-700"
              >
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                id="quantity"
                name="quantity"
                type="number"
                min={1}
                value={form.quantity}
                onChange={handleChange}
                placeholder="e.g., 500"
                className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.quantity
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300'
                }`}
              />
              {errors.quantity && (
                <p className="mt-1 text-xs text-red-600">{errors.quantity}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="unit"
                className="block text-sm font-medium text-gray-700"
              >
                Unit <span className="text-red-500">*</span>
              </label>
              <select
                id="unit"
                name="unit"
                value={form.unit}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.unit ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select unit</option>
                <option value="kg">Kilogram (kg)</option>
                <option value="quintal">Quintal</option>
                <option value="tonne">Tonne</option>
                <option value="crate">Crate</option>
                <option value="bag">Bag</option>
              </select>
              {errors.unit && (
                <p className="mt-1 text-xs text-red-600">{errors.unit}</p>
              )}
            </div>
          </div>

          {/* Harvest Date */}
          <div className="mb-5">
            <label
              htmlFor="harvestDate"
              className="block text-sm font-medium text-gray-700"
            >
              Harvest Date <span className="text-red-500">*</span>
            </label>
            <input
              id="harvestDate"
              name="harvestDate"
              type="date"
              value={form.harvestDate}
              onChange={handleChange}
              max={today}
              className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.harvestDate
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300'
              }`}
            />
            <p className="mt-1 text-xs text-gray-500">
              Select the date on which this produce was harvested.
            </p>
            {errors.harvestDate && (
              <p className="mt-1 text-xs text-red-600">{errors.harvestDate}</p>
            )}
          </div>

          {/* Farming Method */}
          <div className="mb-5">
            <fieldset>
              <legend className="block text-sm font-medium text-gray-700 mb-2">
                Farming Method <span className="text-red-500">*</span>
              </legend>
              <p className="text-xs text-gray-500 mb-2">
                Choose the method used to grow this crop.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { value: 'organic', label: 'Organic' },
                  { value: 'natural', label: 'Natural Farming' },
                  { value: 'conventional', label: 'Conventional' },
                  { value: 'integrated', label: 'Integrated Farming' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center space-x-2 rounded-lg border px-3 py-2 cursor-pointer text-sm ${
                      form.farmingMethod === option.value
                        ? 'border-green-600 bg-green-50 text-green-800'
                        : 'border-gray-300 hover:border-green-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="farmingMethod"
                      value={option.value}
                      checked={form.farmingMethod === option.value}
                      onChange={handleChange}
                      className="text-green-600 focus:ring-green-500"
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
              {errors.farmingMethod && (
                <p className="mt-2 text-xs text-red-600">{errors.farmingMethod}</p>
              )}
            </fieldset>
          </div>

          {/* Selling Price */}
          <div className="mb-5">
            <label
              htmlFor="sellingPrice"
              className="block text-sm font-medium text-gray-700"
            >
              Selling Price (₹) <span className="text-red-500">*</span>
            </label>
            <input
              id="sellingPrice"
              name="sellingPrice"
              type="number"
              min={0}
              step="0.01"
              value={form.sellingPrice}
              onChange={handleChange}
              placeholder="e.g., 50.00"
              className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.sellingPrice
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300'
              }`}
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter the selling price per unit (in ₹).
            </p>
            {errors.sellingPrice && (
              <p className="mt-1 text-xs text-red-600">{errors.sellingPrice}</p>
            )}
          </div>

          {/* Temperature and Moisture Level */}
          <div className="mb-5 grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="temperature"
                className="block text-sm font-medium text-gray-700"
              >
                Temperature (°C)
              </label>
              <input
                id="temperature"
                name="temperature"
                type="number"
                min={-10}
                max={50}
                step="0.1"
                value={form.temperature}
                onChange={handleChange}
                placeholder="e.g., 4.0"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Optimal range: 2°C - 8°C for cold chain storage
              </p>
            </div>
            <div>
              <label
                htmlFor="moistureLevel"
                className="block text-sm font-medium text-gray-700"
              >
                Moisture Level (%)
              </label>
              <input
                id="moistureLevel"
                name="moistureLevel"
                type="number"
                min={0}
                max={100}
                step="0.1"
                value={form.moistureLevel}
                onChange={handleChange}
                placeholder="e.g., 65.0"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Typical range: 60-80% for most produce
              </p>
            </div>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700"
            >
              Optional Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Any additional notes about this batch (optional)."
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Actions */}
          <div className="mt-4 flex flex-col sm:flex-row sm:justify-end sm:space-x-3 space-y-3 sm:space-y-0">
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
              {isSubmitting ? 'Saving...' : 'Save Produce'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default RegisterProducePage;

