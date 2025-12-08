import api from './api';

// =====================
// TRANSPORTER ACTIVITIES
// =====================

export interface PickupData {
  batchId: string;
  farmerDid?: string;
  productName: string;
  quantity: number;
  unit?: string;
  pickupLocation?: string;
  vehicleNo?: string;
  temperature?: number;
  notes?: string;
}

export interface TransportConditionsData {
  batchId: string;
  temperature?: number;
  moistureLevel?: number;
  currentLocation?: string;
  gpsCoordinates?: string;
  spoilageDetected?: boolean;
  notes?: string;
}

export interface DeliveryData {
  batchId: string;
  retailerDid?: string;
  productName: string;
  quantity: number;
  unit?: string;
  deliveryLocation?: string;
  temperature?: number;
  transportFee?: number;
  notes?: string;
}

// =====================
// RETAILER ACTIVITIES
// =====================

export interface ReceiveData {
  batchId: string;
  transporterDid?: string;
  productName: string;
  quantity: number;
  unit?: string;
  qualityOnReceipt?: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  temperature?: number;
  notes?: string;
}

export interface SaleData {
  batchId?: string;
  productName: string;
  quantity: number;
  unit?: string;
  pricePerUnit: number;
  totalAmount?: number;
  consumerDid?: string;
  paymentMethod?: string;
  notes?: string;
}

export interface InventoryData {
  batchId?: string;
  productName: string;
  quantity?: number;
  unit?: string;
  action: 'STOCK_CHECK' | 'SPOILAGE' | 'ADJUSTMENT';
  qualityStatus?: 'Fresh' | 'Good' | 'Near Expiry' | 'Spoiled';
  spoilageQuantity?: number;
  notes?: string;
}

export interface ActivityLog {
  txId: string;
  txHash: string;
  batchId?: string;
  product?: string;
  quantity?: number;
  amount?: number;
  fromParty?: string;
  toParty?: string;
  paymentMethod?: string;
  meta?: any;
  createdAt: string;
}

export interface QualityLog {
  txId: string;
  txHash: string;
  batchId?: string;
  stage?: string;
  qualityScore?: number;
  temperature?: number;
  moistureLevel?: number;
  spoilageDetected?: boolean;
  qualityData?: any;
  createdAt: string;
}

export const activityService = {
  // Transporter activities
  recordPickup: async (data: PickupData) => {
    const response = await api.post('/transporter/pickup', data);
    return response.data;
  },

  updateTransportConditions: async (data: TransportConditionsData) => {
    const response = await api.post('/transporter/conditions', data);
    return response.data;
  },

  recordDelivery: async (data: DeliveryData) => {
    const response = await api.post('/transporter/delivery', data);
    return response.data;
  },

  // Retailer activities
  recordReceive: async (data: ReceiveData) => {
    const response = await api.post('/retailer/receive', data);
    return response.data;
  },

  recordSale: async (data: SaleData) => {
    const response = await api.post('/retailer/sale', data);
    return response.data;
  },

  updateInventory: async (data: InventoryData) => {
    const response = await api.post('/retailer/inventory', data);
    return response.data;
  },

  // Activity logs
  getMyActivityLogs: async (): Promise<{ economicLogs: ActivityLog[]; qualityLogs: QualityLog[] }> => {
    const response = await api.get('/activity/logs');
    return response.data;
  },
};


