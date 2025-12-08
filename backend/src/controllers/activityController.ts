import { Response } from 'express';
import { prisma } from '../config/database';
import { createHash } from 'crypto';

interface AuthRequest {
  userId?: string;
  did?: string;
  body: any;
}

// Helper function to generate transaction hash
function generateTxHash(data: string): string {
  return createHash('sha256').update(data + Date.now().toString()).digest('hex');
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

// =====================
// TRANSPORTER ACTIVITIES
// =====================

/**
 * Record when a transporter picks up a batch from a farmer
 */
export async function transporterPickup(req: AuthRequest, res: Response) {
  try {
    if (!req.userId || !req.did) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { transporterIdentity: true },
    });

    if (!user || user.role !== 'TRANSPORTER') {
      return res.status(403).json({ error: 'Only transporters can perform pickup' });
    }

    const {
      batchId,
      farmerDid,
      productName,
      quantity,
      unit,
      pickupLocation,
      vehicleNo,
      temperature,
      notes,
    } = req.body;

    if (!batchId || !productName || !quantity) {
      return res.status(400).json({ error: 'batchId, productName, and quantity are required' });
    }

    const timestamp = Date.now();
    const txId = `PICKUP-${batchId}-${timestamp}`;

    // Create Economic Ledger Entry
    const prevEconomicTxHash = await getLastEconomicTxHash();
    const economicTxHash = generateTxHash(`${txId}-economic`);

    await prisma.economicLedgerTx.create({
      data: {
        txId,
        txHash: economicTxHash,
        prevTxHash: prevEconomicTxHash,
        ledgerType: 'ECONOMIC',
        batchId,
        fromParty: 'FARMER',
        toParty: 'TRANSPORTER',
        payerDid: farmerDid || null,
        payeeDid: req.did,
        product: productName,
        quantity: Number(quantity),
        amount: null, // Transport pickup doesn't involve payment
        paymentMethod: null,
        meta: {
          type: 'TRANSPORT_PICKUP',
          transporterName: user.transporterIdentity?.companyName || user.name,
          transporterDid: req.did,
          vehicleNo: vehicleNo || null,
          pickupLocation: pickupLocation || 'Farm',
          unit: unit || 'kg',
          notes: notes || null,
          timestamp: new Date().toISOString(),
        },
      },
    });

    // Create Quality Ledger Entry
    const prevQualityTxHash = await getLastQualityTxHash();
    const qualityTxHash = generateTxHash(`${txId}-quality`);

    await prisma.qualityLedgerTx.create({
      data: {
        txId: `QUAL-${txId}`,
        txHash: qualityTxHash,
        prevTxHash: prevQualityTxHash,
        ledgerType: 'QUALITY',
        batchId,
        actorDid: req.did,
        stage: 'PICKUP',
        qualityScore: 90, // Initial pickup quality
        temperature: temperature ? Number(temperature) : null,
        moistureLevel: null,
        spoilageDetected: false,
        qualityData: {
          type: 'TRANSPORT_PICKUP',
          productName,
          quantity: Number(quantity),
          unit: unit || 'kg',
          vehicleNo: vehicleNo || null,
          pickupLocation: pickupLocation || 'Farm',
          notes: notes || null,
        },
      },
    });

    console.log(`[transporterPickup] Recorded pickup for batch ${batchId} by ${user.name}`);

    res.json({
      success: true,
      message: 'Pickup recorded in ledger',
      txId,
      batchId,
    });
  } catch (error: any) {
    console.error('Error recording transporter pickup:', error);
    res.status(500).json({ error: error.message || 'Failed to record pickup' });
  }
}

/**
 * Update transport conditions (temperature, location, etc.)
 */
export async function updateTransportConditions(req: AuthRequest, res: Response) {
  try {
    if (!req.userId || !req.did) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { transporterIdentity: true },
    });

    if (!user || user.role !== 'TRANSPORTER') {
      return res.status(403).json({ error: 'Only transporters can update transport conditions' });
    }

    const {
      batchId,
      temperature,
      moistureLevel,
      currentLocation,
      gpsCoordinates,
      spoilageDetected,
      notes,
    } = req.body;

    if (!batchId) {
      return res.status(400).json({ error: 'batchId is required' });
    }

    const timestamp = Date.now();
    const txId = `TRANSIT-${batchId}-${timestamp}`;

    // Create Quality Ledger Entry for transport conditions
    const prevQualityTxHash = await getLastQualityTxHash();
    const qualityTxHash = generateTxHash(`${txId}-quality`);

    // Calculate quality score based on conditions
    let qualityScore = 90;
    if (temperature) {
      // Optimal temperature range: 2-8°C for perishables
      const temp = Number(temperature);
      if (temp < 0 || temp > 15) {
        qualityScore -= 20;
      } else if (temp < 2 || temp > 8) {
        qualityScore -= 10;
      }
    }
    if (spoilageDetected) {
      qualityScore -= 30;
    }

    await prisma.qualityLedgerTx.create({
      data: {
        txId,
        txHash: qualityTxHash,
        prevTxHash: prevQualityTxHash,
        ledgerType: 'QUALITY',
        batchId,
        actorDid: req.did,
        stage: 'TRANSIT',
        qualityScore,
        temperature: temperature ? Number(temperature) : null,
        moistureLevel: moistureLevel ? Number(moistureLevel) : null,
        spoilageDetected: spoilageDetected || false,
        qualityData: {
          type: 'TRANSPORT_CONDITIONS_UPDATE',
          transporterName: user.transporterIdentity?.companyName || user.name,
          currentLocation: currentLocation || null,
          gpsCoordinates: gpsCoordinates || null,
          notes: notes || null,
          timestamp: new Date().toISOString(),
        },
      },
    });

    console.log(`[updateTransportConditions] Updated conditions for batch ${batchId}`);

    res.json({
      success: true,
      message: 'Transport conditions recorded in ledger',
      txId,
      batchId,
      qualityScore,
    });
  } catch (error: any) {
    console.error('Error updating transport conditions:', error);
    res.status(500).json({ error: error.message || 'Failed to update conditions' });
  }
}

/**
 * Record when a transporter delivers a batch to a retailer
 */
export async function transporterDelivery(req: AuthRequest, res: Response) {
  try {
    if (!req.userId || !req.did) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { transporterIdentity: true },
    });

    if (!user || user.role !== 'TRANSPORTER') {
      return res.status(403).json({ error: 'Only transporters can perform delivery' });
    }

    const {
      batchId,
      retailerDid,
      productName,
      quantity,
      unit,
      deliveryLocation,
      temperature,
      transportFee,
      notes,
    } = req.body;

    if (!batchId || !productName || !quantity) {
      return res.status(400).json({ error: 'batchId, productName, and quantity are required' });
    }

    const timestamp = Date.now();
    const txId = `DELIVERY-${batchId}-${timestamp}`;

    // Create Economic Ledger Entry
    const prevEconomicTxHash = await getLastEconomicTxHash();
    const economicTxHash = generateTxHash(`${txId}-economic`);

    await prisma.economicLedgerTx.create({
      data: {
        txId,
        txHash: economicTxHash,
        prevTxHash: prevEconomicTxHash,
        ledgerType: 'ECONOMIC',
        batchId,
        fromParty: 'TRANSPORTER',
        toParty: 'RETAILER',
        payerDid: req.did,
        payeeDid: retailerDid || null,
        product: productName,
        quantity: Number(quantity),
        amount: transportFee ? Number(transportFee) : null,
        paymentMethod: transportFee ? 'TRANSPORT_FEE' : null,
        meta: {
          type: 'TRANSPORT_DELIVERY',
          transporterName: user.transporterIdentity?.companyName || user.name,
          transporterDid: req.did,
          deliveryLocation: deliveryLocation || 'Retail Store',
          unit: unit || 'kg',
          notes: notes || null,
          timestamp: new Date().toISOString(),
        },
      },
    });

    // Create Quality Ledger Entry
    const prevQualityTxHash = await getLastQualityTxHash();
    const qualityTxHash = generateTxHash(`${txId}-quality`);

    await prisma.qualityLedgerTx.create({
      data: {
        txId: `QUAL-${txId}`,
        txHash: qualityTxHash,
        prevTxHash: prevQualityTxHash,
        ledgerType: 'QUALITY',
        batchId,
        actorDid: req.did,
        stage: 'DELIVERY',
        qualityScore: 85, // Delivery quality score
        temperature: temperature ? Number(temperature) : null,
        moistureLevel: null,
        spoilageDetected: false,
        qualityData: {
          type: 'TRANSPORT_DELIVERY',
          productName,
          quantity: Number(quantity),
          unit: unit || 'kg',
          deliveryLocation: deliveryLocation || 'Retail Store',
          notes: notes || null,
        },
      },
    });

    console.log(`[transporterDelivery] Recorded delivery for batch ${batchId} by ${user.name}`);

    res.json({
      success: true,
      message: 'Delivery recorded in ledger',
      txId,
      batchId,
    });
  } catch (error: any) {
    console.error('Error recording transporter delivery:', error);
    res.status(500).json({ error: error.message || 'Failed to record delivery' });
  }
}

// =====================
// RETAILER ACTIVITIES
// =====================

/**
 * Record when a retailer receives a batch from transporter
 */
export async function retailerReceive(req: AuthRequest, res: Response) {
  try {
    if (!req.userId || !req.did) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { retailerIdentity: true },
    });

    if (!user || user.role !== 'RETAILER') {
      return res.status(403).json({ error: 'Only retailers can receive batches' });
    }

    const {
      batchId,
      transporterDid,
      productName,
      quantity,
      unit,
      qualityOnReceipt,
      temperature,
      notes,
    } = req.body;

    if (!batchId || !productName || !quantity) {
      return res.status(400).json({ error: 'batchId, productName, and quantity are required' });
    }

    const timestamp = Date.now();
    const txId = `RECEIVE-${batchId}-${timestamp}`;

    // Create Economic Ledger Entry
    const prevEconomicTxHash = await getLastEconomicTxHash();
    const economicTxHash = generateTxHash(`${txId}-economic`);

    await prisma.economicLedgerTx.create({
      data: {
        txId,
        txHash: economicTxHash,
        prevTxHash: prevEconomicTxHash,
        ledgerType: 'ECONOMIC',
        batchId,
        fromParty: 'TRANSPORTER',
        toParty: 'RETAILER',
        payerDid: transporterDid || null,
        payeeDid: req.did,
        product: productName,
        quantity: Number(quantity),
        amount: null,
        paymentMethod: null,
        meta: {
          type: 'RETAILER_RECEIVE',
          retailerName: user.retailerIdentity?.shopName || user.name,
          retailerDid: req.did,
          unit: unit || 'kg',
          qualityOnReceipt: qualityOnReceipt || 'Good',
          notes: notes || null,
          timestamp: new Date().toISOString(),
        },
      },
    });

    // Create Quality Ledger Entry
    const prevQualityTxHash = await getLastQualityTxHash();
    const qualityTxHash = generateTxHash(`${txId}-quality`);

    // Determine quality score based on receipt condition
    const qualityScoreMap: Record<string, number> = {
      'Excellent': 95,
      'Good': 85,
      'Fair': 70,
      'Poor': 50,
    };
    const qualityScore = qualityScoreMap[qualityOnReceipt] || 80;

    await prisma.qualityLedgerTx.create({
      data: {
        txId: `QUAL-${txId}`,
        txHash: qualityTxHash,
        prevTxHash: prevQualityTxHash,
        ledgerType: 'QUALITY',
        batchId,
        actorDid: req.did,
        stage: 'RETAIL_RECEIVE',
        qualityScore,
        temperature: temperature ? Number(temperature) : null,
        moistureLevel: null,
        spoilageDetected: qualityOnReceipt === 'Poor',
        qualityData: {
          type: 'RETAILER_RECEIVE',
          productName,
          quantity: Number(quantity),
          unit: unit || 'kg',
          qualityOnReceipt: qualityOnReceipt || 'Good',
          shopName: user.retailerIdentity?.shopName || user.name,
          notes: notes || null,
        },
      },
    });

    console.log(`[retailerReceive] Recorded receipt for batch ${batchId} by ${user.retailerIdentity?.shopName || user.name}`);

    res.json({
      success: true,
      message: 'Receipt recorded in ledger',
      txId,
      batchId,
      qualityScore,
    });
  } catch (error: any) {
    console.error('Error recording retailer receipt:', error);
    res.status(500).json({ error: error.message || 'Failed to record receipt' });
  }
}

/**
 * Record a sale to consumer
 */
export async function retailerSale(req: AuthRequest, res: Response) {
  try {
    if (!req.userId || !req.did) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { retailerIdentity: true },
    });

    if (!user || user.role !== 'RETAILER') {
      return res.status(403).json({ error: 'Only retailers can record sales' });
    }

    const {
      batchId,
      productName,
      quantity,
      unit,
      pricePerUnit,
      totalAmount,
      consumerDid,
      paymentMethod,
      notes,
    } = req.body;

    if (!productName || !quantity || !pricePerUnit) {
      return res.status(400).json({ error: 'productName, quantity, and pricePerUnit are required' });
    }

    const timestamp = Date.now();
    const saleId = `SALE-${user.id.substring(0, 8)}-${timestamp}`;
    const txId = batchId ? `${saleId}-${batchId}` : saleId;

    // Create Economic Ledger Entry
    const prevEconomicTxHash = await getLastEconomicTxHash();
    const economicTxHash = generateTxHash(`${txId}-economic`);

    const calculatedTotal = totalAmount || (Number(quantity) * Number(pricePerUnit));

    await prisma.economicLedgerTx.create({
      data: {
        txId,
        txHash: economicTxHash,
        prevTxHash: prevEconomicTxHash,
        ledgerType: 'ECONOMIC',
        batchId: batchId || null,
        fromParty: 'RETAILER',
        toParty: 'CONSUMER',
        payerDid: consumerDid || null,
        payeeDid: req.did,
        product: productName,
        quantity: Number(quantity),
        amount: calculatedTotal,
        paymentMethod: paymentMethod || 'CASH',
        meta: {
          type: 'RETAILER_SALE',
          retailerName: user.retailerIdentity?.shopName || user.name,
          retailerDid: req.did,
          pricePerUnit: Number(pricePerUnit),
          unit: unit || 'kg',
          saleId,
          notes: notes || null,
          timestamp: new Date().toISOString(),
        },
      },
    });

    // Create Quality Ledger Entry (for traceability)
    const prevQualityTxHash = await getLastQualityTxHash();
    const qualityTxHash = generateTxHash(`${txId}-quality`);

    await prisma.qualityLedgerTx.create({
      data: {
        txId: `QUAL-${txId}`,
        txHash: qualityTxHash,
        prevTxHash: prevQualityTxHash,
        ledgerType: 'QUALITY',
        batchId: batchId || null,
        actorDid: req.did,
        stage: 'RETAIL_SALE',
        qualityScore: 80, // Standard sale quality
        temperature: null,
        moistureLevel: null,
        spoilageDetected: false,
        qualityData: {
          type: 'RETAILER_SALE',
          productName,
          quantity: Number(quantity),
          unit: unit || 'kg',
          pricePerUnit: Number(pricePerUnit),
          totalAmount: calculatedTotal,
          shopName: user.retailerIdentity?.shopName || user.name,
          notes: notes || null,
        },
      },
    });

    console.log(`[retailerSale] Recorded sale of ${quantity} ${unit} ${productName} by ${user.retailerIdentity?.shopName || user.name}`);

    res.json({
      success: true,
      message: 'Sale recorded in ledger',
      txId,
      saleId,
      totalAmount: calculatedTotal,
    });
  } catch (error: any) {
    console.error('Error recording retailer sale:', error);
    res.status(500).json({ error: error.message || 'Failed to record sale' });
  }
}

/**
 * Update retailer inventory status
 */
export async function updateInventory(req: AuthRequest, res: Response) {
  try {
    if (!req.userId || !req.did) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { retailerIdentity: true },
    });

    if (!user || user.role !== 'RETAILER') {
      return res.status(403).json({ error: 'Only retailers can update inventory' });
    }

    const {
      batchId,
      productName,
      quantity,
      unit,
      action, // 'STOCK_CHECK', 'SPOILAGE', 'ADJUSTMENT'
      qualityStatus,
      spoilageQuantity,
      notes,
    } = req.body;

    if (!productName || !action) {
      return res.status(400).json({ error: 'productName and action are required' });
    }

    const timestamp = Date.now();
    const txId = `INVENTORY-${user.id.substring(0, 8)}-${timestamp}`;

    // Create Quality Ledger Entry for inventory update
    const prevQualityTxHash = await getLastQualityTxHash();
    const qualityTxHash = generateTxHash(`${txId}-quality`);

    // Determine quality score based on status
    let qualityScore = 80;
    if (qualityStatus === 'Fresh') qualityScore = 95;
    else if (qualityStatus === 'Good') qualityScore = 85;
    else if (qualityStatus === 'Near Expiry') qualityScore = 60;
    else if (qualityStatus === 'Spoiled') qualityScore = 20;

    await prisma.qualityLedgerTx.create({
      data: {
        txId,
        txHash: qualityTxHash,
        prevTxHash: prevQualityTxHash,
        ledgerType: 'QUALITY',
        batchId: batchId || null,
        actorDid: req.did,
        stage: 'INVENTORY',
        qualityScore,
        temperature: null,
        moistureLevel: null,
        spoilageDetected: action === 'SPOILAGE' || qualityStatus === 'Spoiled',
        qualityData: {
          type: `INVENTORY_${action}`,
          productName,
          quantity: quantity ? Number(quantity) : null,
          unit: unit || 'kg',
          qualityStatus: qualityStatus || null,
          spoilageQuantity: spoilageQuantity ? Number(spoilageQuantity) : null,
          shopName: user.retailerIdentity?.shopName || user.name,
          notes: notes || null,
          timestamp: new Date().toISOString(),
        },
      },
    });

    // If there's spoilage, also record in economic ledger (loss)
    if (action === 'SPOILAGE' && spoilageQuantity) {
      const prevEconomicTxHash = await getLastEconomicTxHash();
      const economicTxHash = generateTxHash(`${txId}-economic`);

      await prisma.economicLedgerTx.create({
        data: {
          txId: `${txId}-LOSS`,
          txHash: economicTxHash,
          prevTxHash: prevEconomicTxHash,
          ledgerType: 'ECONOMIC',
          batchId: batchId || null,
          fromParty: 'RETAILER',
          toParty: null,
          payerDid: req.did,
          payeeDid: null,
          product: productName,
          quantity: Number(spoilageQuantity),
          amount: null,
          paymentMethod: 'LOSS',
          meta: {
            type: 'INVENTORY_SPOILAGE_LOSS',
            retailerName: user.retailerIdentity?.shopName || user.name,
            unit: unit || 'kg',
            notes: notes || null,
            timestamp: new Date().toISOString(),
          },
        },
      });
    }

    console.log(`[updateInventory] Recorded ${action} for ${productName} by ${user.retailerIdentity?.shopName || user.name}`);

    res.json({
      success: true,
      message: 'Inventory update recorded in ledger',
      txId,
      qualityScore,
    });
  } catch (error: any) {
    console.error('Error updating inventory:', error);
    res.status(500).json({ error: error.message || 'Failed to update inventory' });
  }
}

/**
 * Get activity logs for the current user
 */
export async function getMyActivityLogs(req: AuthRequest, res: Response) {
  try {
    if (!req.did) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get economic ledger entries
    const economicLogs = await prisma.economicLedgerTx.findMany({
      where: {
        OR: [
          { payerDid: req.did },
          { payeeDid: req.did },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Get quality ledger entries
    const qualityLogs = await prisma.qualityLedgerTx.findMany({
      where: { actorDid: req.did },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({
      success: true,
      economicLogs: economicLogs.map(log => ({
        txId: log.txId,
        txHash: log.txHash,
        batchId: log.batchId,
        product: log.product,
        quantity: log.quantity,
        amount: log.amount,
        fromParty: log.fromParty,
        toParty: log.toParty,
        paymentMethod: log.paymentMethod,
        meta: log.meta,
        createdAt: log.createdAt,
      })),
      qualityLogs: qualityLogs.map(log => ({
        txId: log.txId,
        txHash: log.txHash,
        batchId: log.batchId,
        stage: log.stage,
        qualityScore: log.qualityScore,
        temperature: log.temperature,
        moistureLevel: log.moistureLevel,
        spoilageDetected: log.spoilageDetected,
        qualityData: log.qualityData,
        createdAt: log.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch activity logs' });
  }
}


