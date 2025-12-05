import { Response } from 'express';
import { prisma } from '../config/database';

// Extended supply prices dataset with more commodities and daily prices
// 10 Fruits, 15 Vegetables, 5 Grains, and Pulses
export const supplyPrices: Record<string, {
  name: string;
  unit: string;
  currentPrice: number;
  previousPrice: number;
  changePercent: number;
  category: string;
  icon: string;
  lastUpdated: string;
}> = {
  // FRUITS (10 items)
  APPLE: {
    name: 'Apple',
    unit: 'kg',
    currentPrice: 120,
    previousPrice: 115,
    changePercent: 4.35,
    category: 'Fruits',
    icon: '🍎',
    lastUpdated: new Date().toISOString(),
  },
  MANGO: {
    name: 'Mango',
    unit: 'kg',
    currentPrice: 80,
    previousPrice: 85,
    changePercent: -5.88,
    category: 'Fruits',
    icon: '🥭',
    lastUpdated: new Date().toISOString(),
  },
  BANANA: {
    name: 'Banana',
    unit: 'kg',
    currentPrice: 45,
    previousPrice: 42,
    changePercent: 7.14,
    category: 'Fruits',
    icon: '🍌',
    lastUpdated: new Date().toISOString(),
  },
  ORANGE: {
    name: 'Orange',
    unit: 'kg',
    currentPrice: 65,
    previousPrice: 68,
    changePercent: -4.41,
    category: 'Fruits',
    icon: '🍊',
    lastUpdated: new Date().toISOString(),
  },
  GRAPES: {
    name: 'Grapes',
    unit: 'kg',
    currentPrice: 90,
    previousPrice: 88,
    changePercent: 2.27,
    category: 'Fruits',
    icon: '🍇',
    lastUpdated: new Date().toISOString(),
  },
  WATERMELON: {
    name: 'Watermelon',
    unit: 'kg',
    currentPrice: 25,
    previousPrice: 23,
    changePercent: 8.70,
    category: 'Fruits',
    icon: '🍉',
    lastUpdated: new Date().toISOString(),
  },
  POMEGRANATE: {
    name: 'Pomegranate',
    unit: 'kg',
    currentPrice: 150,
    previousPrice: 145,
    changePercent: 3.45,
    category: 'Fruits',
    icon: '🍎',
    lastUpdated: new Date().toISOString(),
  },
  PAPAYA: {
    name: 'Papaya',
    unit: 'kg',
    currentPrice: 35,
    previousPrice: 33,
    changePercent: 6.06,
    category: 'Fruits',
    icon: '🥭',
    lastUpdated: new Date().toISOString(),
  },
  GUAVA: {
    name: 'Guava',
    unit: 'kg',
    currentPrice: 40,
    previousPrice: 38,
    changePercent: 5.26,
    category: 'Fruits',
    icon: '🍈',
    lastUpdated: new Date().toISOString(),
  },
  STRAWBERRY: {
    name: 'Strawberry',
    unit: 'kg',
    currentPrice: 200,
    previousPrice: 195,
    changePercent: 2.56,
    category: 'Fruits',
    icon: '🍓',
    lastUpdated: new Date().toISOString(),
  },
  
  // VEGETABLES (15 items)
  POTATO: {
    name: 'Potato',
    unit: 'kg',
    currentPrice: 16,
    previousPrice: 15,
    changePercent: 6.67,
    category: 'Vegetables',
    icon: '🥔',
    lastUpdated: new Date().toISOString(),
  },
  ONION: {
    name: 'Onion',
    unit: 'kg',
    currentPrice: 20,
    previousPrice: 19,
    changePercent: 5.26,
    category: 'Vegetables',
    icon: '🧅',
    lastUpdated: new Date().toISOString(),
  },
  TOMATO: {
    name: 'Tomato',
    unit: 'kg',
    currentPrice: 13,
    previousPrice: 12,
    changePercent: 8.33,
    category: 'Vegetables',
    icon: '🍅',
    lastUpdated: new Date().toISOString(),
  },
  CARROT: {
    name: 'Carrot',
    unit: 'kg',
    currentPrice: 35,
    previousPrice: 33,
    changePercent: 6.06,
    category: 'Vegetables',
    icon: '🥕',
    lastUpdated: new Date().toISOString(),
  },
  CABBAGE: {
    name: 'Cabbage',
    unit: 'kg',
    currentPrice: 22,
    previousPrice: 20,
    changePercent: 10.00,
    category: 'Vegetables',
    icon: '🥬',
    lastUpdated: new Date().toISOString(),
  },
  CAULIFLOWER: {
    name: 'Cauliflower',
    unit: 'kg',
    currentPrice: 30,
    previousPrice: 28,
    changePercent: 7.14,
    category: 'Vegetables',
    icon: '🥦',
    lastUpdated: new Date().toISOString(),
  },
  BRINJAL: {
    name: 'Brinjal',
    unit: 'kg',
    currentPrice: 25,
    previousPrice: 24,
    changePercent: 4.17,
    category: 'Vegetables',
    icon: '🍆',
    lastUpdated: new Date().toISOString(),
  },
  LADYFINGER: {
    name: 'Lady Finger',
    unit: 'kg',
    currentPrice: 40,
    previousPrice: 38,
    changePercent: 5.26,
    category: 'Vegetables',
    icon: '🥒',
    lastUpdated: new Date().toISOString(),
  },
  CUCUMBER: {
    name: 'Cucumber',
    unit: 'kg',
    currentPrice: 28,
    previousPrice: 26,
    changePercent: 7.69,
    category: 'Vegetables',
    icon: '🥒',
    lastUpdated: new Date().toISOString(),
  },
  SPINACH: {
    name: 'Spinach',
    unit: 'kg',
    currentPrice: 32,
    previousPrice: 30,
    changePercent: 6.67,
    category: 'Vegetables',
    icon: '🥬',
    lastUpdated: new Date().toISOString(),
  },
  BELLPEPPER: {
    name: 'Bell Pepper',
    unit: 'kg',
    currentPrice: 60,
    previousPrice: 58,
    changePercent: 3.45,
    category: 'Vegetables',
    icon: '🫑',
    lastUpdated: new Date().toISOString(),
  },
  PEAS: {
    name: 'Peas',
    unit: 'kg',
    currentPrice: 50,
    previousPrice: 48,
    changePercent: 4.17,
    category: 'Vegetables',
    icon: '🫛',
    lastUpdated: new Date().toISOString(),
  },
  BEANS: {
    name: 'Beans',
    unit: 'kg',
    currentPrice: 45,
    previousPrice: 43,
    changePercent: 4.65,
    category: 'Vegetables',
    icon: '🫛',
    lastUpdated: new Date().toISOString(),
  },
  RADISH: {
    name: 'Radish',
    unit: 'kg',
    currentPrice: 18,
    previousPrice: 17,
    changePercent: 5.88,
    category: 'Vegetables',
    icon: '🥕',
    lastUpdated: new Date().toISOString(),
  },
  PUMPKIN: {
    name: 'Pumpkin',
    unit: 'kg',
    currentPrice: 15,
    previousPrice: 14,
    changePercent: 7.14,
    category: 'Vegetables',
    icon: '🎃',
    lastUpdated: new Date().toISOString(),
  },
  
  // GRAINS (5 items)
  WHEAT: {
    name: 'Wheat',
    unit: 'kg',
    currentPrice: 26,
    previousPrice: 25,
    changePercent: 4.00,
    category: 'Grains',
    icon: '🌾',
    lastUpdated: new Date().toISOString(),
  },
  RICE: {
    name: 'Rice',
    unit: 'kg',
    currentPrice: 31,
    previousPrice: 30,
    changePercent: 3.33,
    category: 'Grains',
    icon: '🍚',
    lastUpdated: new Date().toISOString(),
  },
  CORN: {
    name: 'Corn',
    unit: 'kg',
    currentPrice: 28,
    previousPrice: 26,
    changePercent: 7.69,
    category: 'Grains',
    icon: '🌽',
    lastUpdated: new Date().toISOString(),
  },
  BARLEY: {
    name: 'Barley',
    unit: 'kg',
    currentPrice: 24,
    previousPrice: 23,
    changePercent: 4.35,
    category: 'Grains',
    icon: '🌾',
    lastUpdated: new Date().toISOString(),
  },
  MILLET: {
    name: 'Millet',
    unit: 'kg',
    currentPrice: 35,
    previousPrice: 33,
    changePercent: 6.06,
    category: 'Grains',
    icon: '🌾',
    lastUpdated: new Date().toISOString(),
  },
  
  // PULSES
  LENTIL: {
    name: 'Lentil',
    unit: 'kg',
    currentPrice: 95,
    previousPrice: 92,
    changePercent: 3.26,
    category: 'Pulses',
    icon: '🫘',
    lastUpdated: new Date().toISOString(),
  },
  CHICKPEA: {
    name: 'Chickpea',
    unit: 'kg',
    currentPrice: 85,
    previousPrice: 83,
    changePercent: 2.41,
    category: 'Pulses',
    icon: '🫘',
    lastUpdated: new Date().toISOString(),
  },
  BLACKGRAM: {
    name: 'Black Gram',
    unit: 'kg',
    currentPrice: 100,
    previousPrice: 98,
    changePercent: 2.04,
    category: 'Pulses',
    icon: '🫘',
    lastUpdated: new Date().toISOString(),
  },
  GREENGRAM: {
    name: 'Green Gram',
    unit: 'kg',
    currentPrice: 90,
    previousPrice: 88,
    changePercent: 2.27,
    category: 'Pulses',
    icon: '🫘',
    lastUpdated: new Date().toISOString(),
  },
  KIDNEYBEAN: {
    name: 'Kidney Bean',
    unit: 'kg',
    currentPrice: 110,
    previousPrice: 108,
    changePercent: 1.85,
    category: 'Pulses',
    icon: '🫘',
    lastUpdated: new Date().toISOString(),
  },
  PIGEONPEA: {
    name: 'Pigeon Pea',
    unit: 'kg',
    currentPrice: 88,
    previousPrice: 86,
    changePercent: 2.33,
    category: 'Pulses',
    icon: '🫘',
    lastUpdated: new Date().toISOString(),
  },
};

// Initialize supply quantities with random values if they don't exist
async function initializeSupplyQuantities() {
  try {
    for (const [productId, supplyData] of Object.entries(supplyPrices)) {
      const existing = await prisma.supplyQuantity.findUnique({
        where: { productId },
      });

      if (!existing) {
        // Generate random quantity between 50 and 500 kg (or appropriate unit)
        const randomQuantity = Math.floor(Math.random() * 450) + 50;
        await prisma.supplyQuantity.create({
          data: {
            productId,
            quantity: randomQuantity,
            unit: supplyData.unit,
          },
        });
        console.log(`[initializeSupplyQuantities] Created ${productId} with quantity ${randomQuantity}`);
      } else if (existing.quantity === 0) {
        // If quantity is 0, initialize with random value
        const randomQuantity = Math.floor(Math.random() * 450) + 50;
        await prisma.supplyQuantity.update({
          where: { productId },
          data: { quantity: randomQuantity },
        });
        console.log(`[initializeSupplyQuantities] Updated ${productId} from 0 to ${randomQuantity}`);
      }
    }
  } catch (error: any) {
    console.error('Error initializing supply quantities:', error);
  }
}

export async function getSupplies(req: any, res: Response) {
  try {
    const { category } = req.query;
    
    // Initialize quantities if needed (for items with 0 or missing quantities)
    await initializeSupplyQuantities();
    
    // Fetch quantities from database
    const supplyQuantities = await prisma.supplyQuantity.findMany();
    const quantityMap = new Map(
      supplyQuantities.map(sq => [sq.productId, sq.quantity])
    );

    // Map supply prices with quantities
    let supplies = Object.entries(supplyPrices).map(([key, value]) => {
      const quantity = quantityMap.get(key) || 0;
      return {
        id: key,
        ...value,
        quantityLeft: quantity,
      };
    });

    // Filter by category if provided
    if (category && category !== 'All') {
      supplies = supplies.filter(s => s.category === category);
    }

    res.json({
      success: true,
      supplies,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching supplies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch supplies data',
    });
  }
}

export async function updateSupplyQuantity(req: any, res: Response) {
  try {
    const { productName, quantity } = req.body;

    if (!productName || quantity === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Product name and quantity are required',
      });
    }

    // Normalize product name to uppercase for matching
    const productId = productName.toUpperCase().trim();
    const quantityToDecrease = Number(quantity);

    if (quantityToDecrease <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Quantity must be greater than 0',
      });
    }

    // Try to find existing supply quantity record
    const existingSupply = await prisma.supplyQuantity.findUnique({
      where: { productId },
    });

    if (existingSupply) {
      // Check if we have enough quantity
      if (existingSupply.quantity < quantityToDecrease) {
        return res.status(400).json({
          success: false,
          error: `Insufficient quantity. Available: ${existingSupply.quantity}`,
        });
      }

      // Update existing quantity (decrease)
      const updated = await prisma.supplyQuantity.update({
        where: { productId },
        data: {
          quantity: {
            decrement: quantityToDecrease,
          },
        },
      });

      res.json({
        success: true,
        message: `Supply quantity updated successfully`,
        supply: {
          productId: updated.productId,
          quantity: updated.quantity,
          unit: updated.unit,
        },
      });
    } else {
      // If supply doesn't exist, create it with 0 quantity (order accepted but no stock)
      const created = await prisma.supplyQuantity.create({
        data: {
          productId,
          quantity: 0,
          unit: 'kg', // Default unit, can be enhanced
        },
      });

      res.json({
        success: true,
        message: `Supply quantity record created (no stock available)`,
        supply: {
          productId: created.productId,
          quantity: created.quantity,
          unit: created.unit,
        },
      });
    }
  } catch (error: any) {
    console.error('Error updating supply quantity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update supply quantity',
    });
  }
}
