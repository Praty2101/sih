// Price dataset and cap calculation
export const priceDataset: Record<string, number[]> = {
  POTATO: [15, 16, 14, 17, 16],
  ONION: [18, 19, 20, 21, 19],
  TOMATO: [12, 11, 13, 12, 14],
  WHEAT: [25, 26, 24, 27, 25],
  RICE: [30, 31, 29, 32, 30],
};

export function getAveragePrice(commodity: string): number {
  const prices = priceDataset[commodity.toUpperCase()];
  if (!prices || prices.length === 0) return 0;
  const sum = prices.reduce((a, b) => a + b, 0);
  return sum / prices.length;
}

export function getMaxAllowedPrice(commodity: string): number {
  const avg = getAveragePrice(commodity);
  return avg * 1.2; // 20% cap
}

export function validatePrice(commodity: string, pricePerKg: number): {
  valid: boolean;
  maxAllowed: number;
  average: number;
} {
  const average = getAveragePrice(commodity);
  const maxAllowed = getMaxAllowedPrice(commodity);
  return {
    valid: pricePerKg <= maxAllowed,
    maxAllowed,
    average,
  };
}


