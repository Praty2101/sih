import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { createHash } from 'crypto';

export async function registerProduce(req: any, res: Response) {
  try {
    const {
      productName,
      variety,
      quantity,
      unit,
      harvestDate,
      farmingMethod,
      sellingPrice,
      notes,
    } = req.body;

    const farmerDid = req.did;

    if (!farmerDid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate required fields
    if (!productName || !quantity || !unit || !harvestDate || !farmingMethod || sellingPrice === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (quantity <= 0) {
      return res.status(400).json({ error: 'Quantity must be greater than 0' });
    }

    if (sellingPrice < 0) {
      return res.status(400).json({ error: 'Selling price cannot be negative' });
    }

    // Verify user is a farmer
    const user = await prisma.user.findUnique({
      where: { did: farmerDid },
    });

    if (!user || user.role !== 'FARMER') {
      return res.status(403).json({ error: 'Only farmers can register produce' });
    }

    // Generate batch ID: hash of farmerDid + timestamp + productName
    const timestamp = Date.now();
    const batchIdInput = `${farmerDid}-${timestamp}-${productName}-${quantity}`;
    const batchId = `BATCH-${createHash('sha256').update(batchIdInput).digest('hex').substring(0, 16).toUpperCase()}`;

    // Create produce log
    const produceLog = await prisma.produceLog.create({
      data: {
        batchId,
        farmerDid,
        productName,
        variety: variety || null,
        quantity: Number(quantity),
        unit,
        harvestDate: new Date(harvestDate),
        farmingMethod,
        sellingPrice: Number(sellingPrice),
        notes: notes || null,
      },
    });

    // Update supply quantity - normalize product name to uppercase for matching
    const productId = productName.toUpperCase().trim();
    const quantityToAdd = Number(quantity);

    // Try to find existing supply quantity record
    const existingSupply = await prisma.supplyQuantity.findUnique({
      where: { productId },
    });

    if (existingSupply) {
      // Update existing quantity
      await prisma.supplyQuantity.update({
        where: { productId },
        data: {
          quantity: {
            increment: quantityToAdd,
          },
        },
      });
    } else {
      // Create new supply quantity record
      await prisma.supplyQuantity.create({
        data: {
          productId,
          quantity: quantityToAdd,
          unit,
        },
      });
    }

    res.json({
      success: true,
      batchId: produceLog.batchId,
      produceLog: {
        id: produceLog.id,
        batchId: produceLog.batchId,
        productName: produceLog.productName,
        variety: produceLog.variety,
        quantity: produceLog.quantity,
        unit: produceLog.unit,
        harvestDate: produceLog.harvestDate,
        farmingMethod: produceLog.farmingMethod,
        sellingPrice: produceLog.sellingPrice,
        notes: produceLog.notes,
        createdAt: produceLog.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Error registering produce:', error);
    res.status(500).json({ error: error.message || 'Failed to register produce' });
  }
}

export async function getProduceLogs(req: any, res: Response) {
  try {
    const farmerDid = req.did;

    if (!farmerDid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Calculate date 15 days ago
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    // Fetch produce logs from last 15 days
    const produceLogs = await prisma.produceLog.findMany({
      where: {
        farmerDid,
        createdAt: {
          gte: fifteenDaysAgo,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      produceLogs: produceLogs.map(log => ({
        id: log.id,
        batchId: log.batchId,
        productName: log.productName,
        variety: log.variety,
        quantity: log.quantity,
        unit: log.unit,
        harvestDate: log.harvestDate,
        farmingMethod: log.farmingMethod,
        sellingPrice: log.sellingPrice,
        notes: log.notes,
        createdAt: log.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching produce logs:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch produce logs' });
  }
}

export async function cleanupOldProduceLogs() {
  try {
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    const result = await prisma.produceLog.deleteMany({
      where: {
        createdAt: {
          lt: fifteenDaysAgo,
        },
      },
    });

    console.log(`Cleaned up ${result.count} produce logs older than 15 days`);
    return result.count;
  } catch (error: any) {
    console.error('Error cleaning up produce logs:', error);
    return 0;
  }
}


