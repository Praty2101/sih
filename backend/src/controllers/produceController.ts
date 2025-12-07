import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { createHash } from 'crypto';

// Helper function to generate transaction hash
function generateTxHash(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

// Helper function to get the last transaction hash for chain linking
async function getLastEconomicTxHash(): Promise<string | null> {
  const lastTx = await prisma.economicLedgerTx.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { txHash: true },
  });
  return lastTx?.txHash || null;
}

async function getLastQualityTxHash(): Promise<string | null> {
  const lastTx = await prisma.qualityLedgerTx.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { txHash: true },
  });
  return lastTx?.txHash || null;
}

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
      include: { farmerIdentity: true },
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

    // ===== CREATE LEDGER ENTRIES =====
    
    // 1. Create Economic Ledger Entry for produce registration
    const totalValue = Number(quantity) * Number(sellingPrice);
    const economicTxId = `ECO-PRODUCE-${batchId}-${timestamp}`;
    const prevEconomicTxHash = await getLastEconomicTxHash();
    const economicTxData = `${economicTxId}-${farmerDid}-${productName}-${quantity}-${sellingPrice}-${timestamp}`;
    const economicTxHash = generateTxHash(economicTxData);

    await prisma.economicLedgerTx.create({
      data: {
        txId: economicTxId,
        txHash: economicTxHash,
        prevTxHash: prevEconomicTxHash,
        ledgerType: 'ECONOMIC',
        batchId: batchId,
        fromParty: 'FARMER',
        toParty: null, // Produce registered, not yet sold
        payerDid: farmerDid,
        payeeDid: null,
        product: productName,
        quantity: Number(quantity),
        amount: totalValue,
        paymentMethod: null,
        margin: null,
        meta: {
          type: 'PRODUCE_REGISTERED',
          variety: variety || null,
          unit: unit,
          pricePerUnit: Number(sellingPrice),
          harvestDate: harvestDate,
          farmingMethod: farmingMethod,
          farmerName: user.farmerIdentity?.name || user.name || 'Unknown',
          businessName: user.farmerIdentity?.businessName || null,
          notes: notes || null,
        },
      },
    });

    // 2. Create Quality Ledger Entry for initial quality record
    const qualityTxId = `QUAL-HARVEST-${batchId}-${timestamp}`;
    const prevQualityTxHash = await getLastQualityTxHash();
    const qualityTxData = `${qualityTxId}-${farmerDid}-${batchId}-${farmingMethod}-${timestamp}`;
    const qualityTxHash = generateTxHash(qualityTxData);

    // Assign initial quality score based on farming method
    const farmingMethodScores: Record<string, number> = {
      organic: 95,
      natural: 90,
      integrated: 85,
      conventional: 75,
    };
    const initialQualityScore = farmingMethodScores[farmingMethod] || 80;

    await prisma.qualityLedgerTx.create({
      data: {
        txId: qualityTxId,
        txHash: qualityTxHash,
        prevTxHash: prevQualityTxHash,
        ledgerType: 'QUALITY',
        batchId: batchId,
        actorDid: farmerDid,
        stage: 'HARVEST',
        qualityScore: initialQualityScore,
        moistureLevel: null,
        temperature: null,
        spoilageDetected: false,
        aiVerificationHash: null,
        iotMerkleRoot: null,
        qualityData: {
          type: 'PRODUCE_REGISTERED',
          productName: productName,
          variety: variety || null,
          farmingMethod: farmingMethod,
          harvestDate: harvestDate,
          quantity: Number(quantity),
          unit: unit,
          farmerDid: farmerDid,
          notes: notes || null,
        },
      },
    });

    console.log(`[registerProduce] Created ledger entries for batch ${batchId}`);

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
      ledger: {
        economicTxId: economicTxId,
        qualityTxId: qualityTxId,
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


