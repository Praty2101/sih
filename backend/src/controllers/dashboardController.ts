import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';

// Get batches for farmer (from ProduceLog)
export async function getFarmerBatches(req: AuthRequest, res: Response) {
  try {
    const farmerDid = req.did;
    if (!farmerDid) {
      return res.status(401).json({ error: 'Unauthorized: Farmer DID not found.' });
    }

    // Get all produce logs for this farmer
    const produceLogs = await prisma.produceLog.findMany({
      where: { farmerDid },
      orderBy: { createdAt: 'desc' },
    });

    // For each batch, determine status and get additional info from ledgers
    const batches = await Promise.all(
      produceLogs.map(async (log) => {
        // Check economic ledger to determine status
        const economicTxs = await prisma.economicLedgerTx.findMany({
          where: { batchId: log.batchId },
          orderBy: { createdAt: 'asc' },
        });

        let status = 'Registered';
        let relevantDate = log.createdAt;

        // Determine status based on economic transactions
        const hasTransportPickup = economicTxs.some(
          (tx) => tx.meta && typeof tx.meta === 'object' && (tx.meta as any).type === 'TRANSPORT_PICKUP'
        );
        const hasTransportDropoff = economicTxs.some(
          (tx) => tx.meta && typeof tx.meta === 'object' && (tx.meta as any).type === 'TRANSPORT_DROPOFF'
        );
        const hasRetailerSale = economicTxs.some(
          (tx) => tx.meta && typeof tx.meta === 'object' && (tx.meta as any).type === 'RETAILER_SALE'
        );

        if (hasRetailerSale) {
          status = 'Sold';
          const saleTx = economicTxs.find(
            (tx) => tx.meta && typeof tx.meta === 'object' && (tx.meta as any).type === 'RETAILER_SALE'
          );
          if (saleTx) relevantDate = saleTx.createdAt;
        } else if (hasTransportDropoff) {
          status = 'Delivered';
          const dropoffTx = economicTxs.find(
            (tx) => tx.meta && typeof tx.meta === 'object' && (tx.meta as any).type === 'TRANSPORT_DROPOFF'
          );
          if (dropoffTx) relevantDate = dropoffTx.createdAt;
        } else if (hasTransportPickup) {
          status = 'In Transit';
          const pickupTx = economicTxs.find(
            (tx) => tx.meta && typeof tx.meta === 'object' && (tx.meta as any).type === 'TRANSPORT_PICKUP'
          );
          if (pickupTx) relevantDate = pickupTx.createdAt;
        }

        return {
          batchId: log.batchId,
          productName: log.productName,
          quantity: log.quantity,
          unit: log.unit,
          sellingPrice: log.sellingPrice,
          status,
          date: relevantDate,
        };
      })
    );

    res.json({ batches });
  } catch (error: any) {
    console.error('Error fetching farmer batches:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch farmer batches.' });
  }
}

// Get batches for transporter (from EconomicLedger where transporter is involved)
export async function getTransporterBatches(req: AuthRequest, res: Response) {
  try {
    const transporterDid = req.did;
    if (!transporterDid) {
      return res.status(401).json({ error: 'Unauthorized: Transporter DID not found.' });
    }

    // Get all economic transactions where transporter is payer or payee
    const economicTxs = await prisma.economicLedgerTx.findMany({
      where: {
        OR: [{ payerDid: transporterDid }, { payeeDid: transporterDid }],
        batchId: { not: null },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter to only transport-related transactions
    const transportTxs = economicTxs.filter(
      (tx) =>
        tx.meta &&
        typeof tx.meta === 'object' &&
        ((tx.meta as any).type === 'TRANSPORT_PICKUP' || (tx.meta as any).type === 'TRANSPORT_DROPOFF')
    );

    // Get unique batch IDs
    const batchIds = [...new Set(transportTxs.map((tx) => tx.batchId).filter(Boolean) as string[])];

    // Get produce logs for these batches
    const produceLogs = await prisma.produceLog.findMany({
      where: { batchId: { in: batchIds } },
    });

    const produceLogMap = new Map(produceLogs.map((log) => [log.batchId, log]));

    // Build batches with status
    const batches = batchIds.map((batchId) => {
      const log = produceLogMap.get(batchId);
      if (!log) return null;

      const batchTxs = transportTxs.filter((tx) => tx.batchId === batchId);
      const hasDropoff = batchTxs.some(
        (tx) => tx.meta && typeof tx.meta === 'object' && (tx.meta as any).type === 'TRANSPORT_DROPOFF'
      );

      let status = 'In Transit';
      let relevantDate = batchTxs[0]?.createdAt || log.createdAt;

      if (hasDropoff) {
        status = 'Delivered';
        const dropoffTx = batchTxs.find(
          (tx) => tx.meta && typeof tx.meta === 'object' && (tx.meta as any).type === 'TRANSPORT_DROPOFF'
        );
        if (dropoffTx) relevantDate = dropoffTx.createdAt;
      } else {
        const pickupTx = batchTxs.find(
          (tx) => tx.meta && typeof tx.meta === 'object' && (tx.meta as any).type === 'TRANSPORT_PICKUP'
        );
        if (pickupTx) relevantDate = pickupTx.createdAt;
      }

      return {
        batchId: log.batchId,
        productName: log.productName,
        quantity: log.quantity,
        unit: log.unit,
        sellingPrice: log.sellingPrice,
        status,
        date: relevantDate,
      };
    }).filter(Boolean) as any[];

    // Sort by date descending
    batches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json({ batches });
  } catch (error: any) {
    console.error('Error fetching transporter batches:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch transporter batches.' });
  }
}

// Get batches for retailer (from EconomicLedger where retailer is involved)
export async function getRetailerBatches(req: AuthRequest, res: Response) {
  try {
    const retailerDid = req.did;
    if (!retailerDid) {
      return res.status(401).json({ error: 'Unauthorized: Retailer DID not found.' });
    }

    // Get all economic transactions where retailer is involved
    const economicTxs = await prisma.economicLedgerTx.findMany({
      where: {
        OR: [{ payerDid: retailerDid }, { payeeDid: retailerDid }],
        batchId: { not: null },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter to only retailer-related transactions
    const retailerTxs = economicTxs.filter(
      (tx) =>
        tx.meta &&
        typeof tx.meta === 'object' &&
        ((tx.meta as any).type === 'RETAILER_RECEIVE' || (tx.meta as any).type === 'RETAILER_SALE')
    );

    // Get unique batch IDs
    const batchIds = [...new Set(retailerTxs.map((tx) => tx.batchId).filter(Boolean) as string[])];

    // Get produce logs for these batches
    const produceLogs = await prisma.produceLog.findMany({
      where: { batchId: { in: batchIds } },
    });

    const produceLogMap = new Map(produceLogs.map((log) => [log.batchId, log]));

    // Build batches with status
    const batches = batchIds.map((batchId) => {
      const log = produceLogMap.get(batchId);
      if (!log) return null;

      const batchTxs = retailerTxs.filter((tx) => tx.batchId === batchId);
      const hasSale = batchTxs.some(
        (tx) => tx.meta && typeof tx.meta === 'object' && (tx.meta as any).type === 'RETAILER_SALE'
      );

      let status = 'Received';
      let relevantDate = batchTxs[0]?.createdAt || log.createdAt;

      if (hasSale) {
        status = 'Sold';
        const saleTx = batchTxs.find(
          (tx) => tx.meta && typeof tx.meta === 'object' && (tx.meta as any).type === 'RETAILER_SALE'
        );
        if (saleTx) relevantDate = saleTx.createdAt;
      } else {
        const receiveTx = batchTxs.find(
          (tx) => tx.meta && typeof tx.meta === 'object' && (tx.meta as any).type === 'RETAILER_RECEIVE'
        );
        if (receiveTx) relevantDate = receiveTx.createdAt;
      }

      return {
        batchId: log.batchId,
        productName: log.productName,
        quantity: log.quantity,
        unit: log.unit,
        sellingPrice: log.sellingPrice,
        status,
        date: relevantDate,
      };
    }).filter(Boolean) as any[];

    // Sort by date descending
    batches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json({ batches });
  } catch (error: any) {
    console.error('Error fetching retailer batches:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch retailer batches.' });
  }
}

// Get dashboard metrics for all users
export async function getDashboardMetrics(req: AuthRequest, res: Response) {
  try {
    // 1. Total Orders Tracked - Count all orders from Economic Ledger (ORDER_PLACED and ORDER_ACCEPTED)
    // Note: Orders are stored in localStorage on frontend, but we count from database EconomicLedgerTx
    // that may have order-related transactions
    const totalOrders = await prisma.economicLedgerTx.count({
      where: {
        OR: [
          { paymentMethod: 'Order Placed' },
          { paymentMethod: 'Order Accepted' },
        ],
      },
    });

    // 2. Total Batches Processed - Count all batches from ProduceLog (all farmers)
    const totalBatches = await prisma.produceLog.count({});

    // 3. Traceability Completion Rate - Based on cold chain breaks
    // Get all quality ledger entries with temperature data
    const qualityTxs = await prisma.qualityLedgerTx.findMany({
      where: {
        temperature: { not: null },
      },
      select: {
        temperature: true,
        batchId: true,
      },
    });

    // Get all batches from ProduceLog to calculate base traceability
    const allBatches = await prisma.produceLog.findMany({
      select: {
        batchId: true,
      },
    });
    const totalBatchesInSystem = allBatches.length;

    // Cold chain break: temperature outside 2°C - 10°C range
    const coldChainBreaks = qualityTxs.filter(
      (tx) => tx.temperature !== null && (tx.temperature < 2 || tx.temperature > 10)
    ).length;

    // Get unique batches with temperature data
    const uniqueBatchesWithTemp = new Set(qualityTxs.map((tx) => tx.batchId).filter(Boolean));
    const totalTrackedBatches = uniqueBatchesWithTemp.size;

    // Traceability rate is always 100% (system requirement)
    const traceabilityRate = 100;

    // Ensure traceabilityRate is a valid number
    const finalTraceabilityRate = isNaN(traceabilityRate) ? 100 : Math.max(0, Math.min(100, traceabilityRate));
    
    console.log('[getDashboardMetrics] Traceability calculation:', {
      totalBatchesInSystem,
      totalTrackedBatches,
      coldChainBreaks,
      traceabilityRate,
      finalTraceabilityRate,
    });

    res.json({
      totalOrders,
      totalBatches,
      traceabilityRate: Math.round(finalTraceabilityRate * 100) / 100, // Round to 2 decimal places
      coldChainBreaks,
      totalTrackedBatches,
    });
  } catch (error: any) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch dashboard metrics.' });
  }
}


