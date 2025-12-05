import api from './api';

export interface Supply {
  id: string;
  name: string;
  unit: string;
  currentPrice: number;
  previousPrice: number;
  changePercent: number;
  category: string;
  icon: string;
  lastUpdated: string;
  quantityLeft: number;
}

export interface SuppliesResponse {
  success: boolean;
  supplies: Supply[];
  lastUpdated: string;
}

export const suppliesService = {
  getSupplies: async (): Promise<SuppliesResponse> => {
    const response = await api.get<SuppliesResponse>('/supplies');
    return response.data;
  },
  updateSupplyQuantity: async (productName: string, quantity: number) => {
    const response = await api.post('/supplies/update-quantity', {
      productName,
      quantity,
    });
    return response.data;
  },
};

