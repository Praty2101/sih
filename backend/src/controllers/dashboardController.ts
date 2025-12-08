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
    const userDid = req.did;

    // Get user's trust score
    let trustScore = 0.5; // Default trust score
    if (userDid) {
      const user = await prisma.user.findUnique({
        where: { did: userDid },
        select: { trustScore: true },
      });
      if (user) {
        trustScore = user.trustScore;
      }
    }

    // 1. Total Orders Tracked - Count all orders from Economic Ledger
    const totalOrders = await prisma.economicLedgerTx.count({
      where: {
        OR: [
          { paymentMethod: 'Order Placed' },
          { paymentMethod: 'Order Accepted' },
          { paymentMethod: 'ORDER' },
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
        qualityScore: true,
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

    // Calculate freshness score based on:
    // 1. Temperature readings (deviation from optimal 2-8°C range)
    // 2. Days difference between harvest date and registration date
    let freshnessScore = 100; // Start with perfect score
    let temperatureScore = 100;
    let freshnessFromAge = 100;
    
    // Get produce logs for user or all
    let produceLogs: any[] = [];
    if (userDid) {
      produceLogs = await prisma.produceLog.findMany({
        where: { farmerDid: userDid },
        select: { 
          batchId: true, 
          harvestDate: true, 
          createdAt: true,
          productName: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 50, // Recent batches
      });
    }
    
    if (produceLogs.length === 0) {
      produceLogs = await prisma.produceLog.findMany({
        select: { 
          batchId: true, 
          harvestDate: true, 
          createdAt: true,
          productName: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    }
    
    // Calculate freshness based on days between harvest and registration
    if (produceLogs.length > 0) {
      const ageScores: number[] = [];
      
      for (const log of produceLogs) {
        const harvestDate = new Date(log.harvestDate);
        const registrationDate = new Date(log.createdAt);
        
        // Calculate days difference
        const daysDiff = Math.floor(
          (registrationDate.getTime() - harvestDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        // Freshness decay: 
        // 0 days = 100%, 1 day = 95%, 2 days = 85%, 3 days = 70%, 4+ days = decreasing
        let ageScore = 100;
        if (daysDiff === 0) {
          ageScore = 100; // Same day registration - perfect freshness
        } else if (daysDiff === 1) {
          ageScore = 95; // 1 day old
        } else if (daysDiff === 2) {
          ageScore = 85; // 2 days old
        } else if (daysDiff === 3) {
          ageScore = 70; // 3 days old
        } else if (daysDiff === 4) {
          ageScore = 55; // 4 days old
        } else if (daysDiff === 5) {
          ageScore = 40; // 5 days old
        } else if (daysDiff > 5) {
          ageScore = Math.max(10, 40 - (daysDiff - 5) * 5); // Further decay
        }
        
        ageScores.push(ageScore);
      }
      
      // Average age-based freshness
      if (ageScores.length > 0) {
        freshnessFromAge = Math.round(
          ageScores.reduce((a, b) => a + b, 0) / ageScores.length
        );
      }
    }
    
    // Calculate temperature-based freshness score
    // Get temperature readings for user's batches
    const userBatchIds = produceLogs.map(p => p.batchId);
    let tempReadings: any[] = [];
    
    if (userBatchIds.length > 0) {
      tempReadings = await prisma.qualityLedgerTx.findMany({
        where: {
          batchId: { in: userBatchIds },
          temperature: { not: null },
        },
        select: { temperature: true },
      });
    }
    
    if (tempReadings.length === 0) {
      // Get all temperature readings if no user-specific data
      tempReadings = await prisma.qualityLedgerTx.findMany({
        where: { temperature: { not: null } },
        select: { temperature: true },
        take: 100,
      });
    }
    
    if (tempReadings.length > 0) {
      const tempScores: number[] = [];
      
      for (const reading of tempReadings) {
        const temp = reading.temperature as number;
        let tempScore = 100;
        
        // Optimal range: 2°C - 8°C (cold chain)
        if (temp >= 2 && temp <= 8) {
          tempScore = 100; // Perfect temperature
        } else if (temp >= 0 && temp < 2) {
          tempScore = 90; // Slightly too cold
        } else if (temp > 8 && temp <= 12) {
          tempScore = 80; // Slightly too warm
        } else if (temp < 0) {
          tempScore = 60; // Freezing - damages produce
        } else if (temp > 12 && temp <= 15) {
          tempScore = 50; // Too warm - spoilage risk
        } else if (temp > 15) {
          tempScore = Math.max(10, 50 - (temp - 15) * 5); // Very warm - rapid spoilage
        }
        
        tempScores.push(tempScore);
      }
      
      if (tempScores.length > 0) {
        temperatureScore = Math.round(
          tempScores.reduce((a, b) => a + b, 0) / tempScores.length
        );
      }
    }
    
    // Final freshness score: weighted average (60% age, 40% temperature)
    // If no temperature data, use only age
    if (tempReadings.length > 0) {
      freshnessScore = Math.round(freshnessFromAge * 0.6 + temperatureScore * 0.4);
    } else {
      freshnessScore = freshnessFromAge;
    }
    
    console.log('[getDashboardMetrics] Freshness calculation:', {
      freshnessFromAge,
      temperatureScore,
      finalFreshnessScore: freshnessScore,
      produceLogsCount: produceLogs.length,
      tempReadingsCount: tempReadings.length,
    });

    // Cold chain stability: percentage of readings within optimal range
    const totalTempReadings = qualityTxs.length;
    const goodTempReadings = totalTempReadings - coldChainBreaks;
    const coldChainStability = totalTempReadings > 0 
      ? Math.round((goodTempReadings / totalTempReadings) * 100) 
      : 94; // Default if no readings

    // Traceability rate is always 100% (system requirement)
    const traceabilityRate = 100;

    // Ensure traceabilityRate is a valid number
    const finalTraceabilityRate = isNaN(traceabilityRate) ? 100 : Math.max(0, Math.min(100, traceabilityRate));
    
    console.log('[getDashboardMetrics] Metrics:', {
      totalBatchesInSystem,
      totalTrackedBatches,
      coldChainBreaks,
      trustScore,
      freshnessScore,
      coldChainStability,
    });

    res.json({
      totalOrders,
      totalBatches,
      traceabilityRate: Math.round(finalTraceabilityRate * 100) / 100,
      coldChainBreaks,
      totalTrackedBatches,
      trustScore: Math.round(trustScore * 100), // Convert to percentage (0-100)
      freshnessScore,
      coldChainStability,
      deviations: coldChainBreaks,
    });
  } catch (error: any) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch dashboard metrics.' });
  }
}


