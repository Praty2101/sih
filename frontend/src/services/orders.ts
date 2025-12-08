import api from './api';

export interface OrderData {
  supplyItem: string;
  quantity: number;
  unit: string;
  price: number;
  totalAmount: number;
  toRole: 'FARMER' | 'TRANSPORTER' | 'RETAILER';
  deliveryPreference: string;
  destination: string;
  notes?: string;
}

export interface Order {
  orderId: string;
  product: string;
  quantity: number;
  unit?: string;
  amount: number;
  price?: number;
  fromParty: string;
  toParty: string;
  fromDid?: string;
  payerDid?: string;
  payeeDid?: string;
  fromName?: string;
  deliveryPreference?: string;
  destination?: string;
  notes?: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  txHash?: string;
  history?: Array<{
    txHash: string;
    type: string;
    timestamp: string;
    by?: string;
  }>;
}

export const ordersService = {
  // Create a new order (recorded in ledger)
  createOrder: async (orderData: OrderData) => {
    const response = await api.post('/orders/create', orderData);
    return response.data;
  },

  // Accept an order
  acceptOrder: async (orderId: string) => {
    const response = await api.post('/orders/accept', { orderId });
    return response.data;
  },

  // Update order status
  updateStatus: async (orderId: string, status: string, notes?: string) => {
    const response = await api.post('/orders/status', { orderId, status, notes });
    return response.data;
  },

  // Get my orders (placed and received)
  getMyOrders: async (type: 'placed' | 'received' | 'all' = 'all') => {
    const response = await api.get(`/orders/my?type=${type}`);
    return response.data;
  },

  // Get pending orders for my role
  getPendingOrders: async () => {
    const response = await api.get('/orders/pending');
    return response.data;
  },
};


