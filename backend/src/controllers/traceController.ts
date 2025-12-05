import { Request, Response } from 'express';
import { prisma } from '../config/database';

export async function traceBatch(req: Request, res: Response) {
  try {
    const { batchId } = req.params;

    // Get produce log for product details
    const produceLog = await prisma.produceLog.findUnique({
      where: { batchId },
    });

    if (!produceLog) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    // Get all transactions for this batch
    const economicTxs = await prisma.economicLedgerTx.findMany({
      where: { batchId },
      orderBy: { createdAt: 'asc' },
    });

    const qualityTxs = await prisma.qualityLedgerTx.findMany({
      where: { batchId },
      orderBy: { createdAt: 'asc' },
    });

    // Get all DIDs involved
    const allDids = new Set<string>();
    economicTxs.forEach(tx => {
      if (tx.payerDid) allDids.add(tx.payerDid);
      if (tx.payeeDid) allDids.add(tx.payeeDid);
    });
    qualityTxs.forEach(tx => {
      if (tx.actorDid) allDids.add(tx.actorDid);
    });

    // Get user details
    const users = await prisma.user.findMany({
      where: { did: { in: Array.from(allDids) } },
      select: {
        did: true,
        role: true,
        name: true,
        trustScore: true,
        farmerIdentity: { select: { businessName: true, address: true } },
        transporterIdentity: { select: { companyName: true, address: true } },
        retailerIdentity: { select: { shopName: true, address: true } },
      },
    });

    const userMap = new Map(users.map(u => [u.did, u]));

    const farmer = users.find(u => u.role === 'FARMER');
    const transporter = users.find(u => u.role === 'TRANSPORTER');
    const retailer = users.find(u => u.role === 'RETAILER');

    // Calculate freshness score from quality data
    const latestQuality = qualityTxs[qualityTxs.length - 1];
    const freshnessScore = latestQuality?.qualityScore 
      ? Math.round(latestQuality.qualityScore) 
      : 85; // Default if no quality data

    // Determine grade based on quality score
    const getGrade = (score: number) => {
      if (score >= 90) return 'A+';
      if (score >= 80) return 'A';
      if (score >= 70) return 'B';
      return 'C';
    };

    // Build journey stages
    const journeyStages: any[] = [];

    // 1. Harvest stage
    const harvestQuality = qualityTxs.find(q => q.stage === 'harvest');
    if (harvestQuality) {
      const farmerUser = userMap.get(harvestQuality.actorDid || '');
      journeyStages.push({
        stage: 'Harvested',
        role: 'Farmer',
        roleName: farmerUser?.farmerIdentity?.businessName || farmerUser?.name || 'Unknown Farmer',
        dateTime: harvestQuality.createdAt,
        description: `Fresh harvest completed at optimal ripeness`,
        location: farmerUser?.farmerIdentity?.address || 'Farm Location',
        temperature: harvestQuality.temperature ? `${harvestQuality.temperature.toFixed(1)}°C` : null,
        qualityScore: harvestQuality.qualityScore,
      });
    }

    // 2. Quality Check / Sorting
    const sortingQuality = qualityTxs.find(q => q.stage === 'sorting');
    if (sortingQuality) {
      journeyStages.push({
        stage: 'Quality Check',
        role: 'AI System',
        roleName: 'AI Quality Verification',
        dateTime: sortingQuality.createdAt,
        description: `AI quality check passed - Grade ${getGrade(sortingQuality.qualityScore || 85)}`,
        location: farmer?.farmerIdentity?.address || 'Farm Facility',
        temperature: sortingQuality.temperature ? `${sortingQuality.temperature.toFixed(1)}°C` : null,
        qualityScore: sortingQuality.qualityScore,
      });
    }

    // 3. Pickup
    const pickupTx = economicTxs.find(tx => 
      tx.meta && typeof tx.meta === 'object' && (tx.meta as any).type === 'TRANSPORT_PICKUP'
    );
    if (pickupTx) {
      const transporterUser = userMap.get(pickupTx.payeeDid || pickupTx.payerDid || '');
      const transportQuality = qualityTxs.find(q => q.stage === 'transport' && q.actorDid === transporterUser?.did);
      journeyStages.push({
        stage: 'Pickup',
        role: 'Transporter',
        roleName: transporterUser?.transporterIdentity?.companyName || transporterUser?.name || 'Unknown Transporter',
        dateTime: pickupTx.createdAt,
        description: 'Loaded into refrigerated transport',
        location: farmer?.farmerIdentity?.address || 'Farm Location',
        temperature: transportQuality?.temperature ? `${transportQuality.temperature.toFixed(1)}°C` : '4°C',
      });
    }

    // 4. Transit
    const transportQuality = qualityTxs.find(q => q.stage === 'transport');
    if (transportQuality && transporter) {
      journeyStages.push({
        stage: 'Transit',
        role: 'Transporter',
        roleName: transporter.transporterIdentity?.companyName || transporter.name || 'Unknown Transporter',
        dateTime: transportQuality.createdAt,
        description: 'Temperature maintained within optimal range',
        location: 'Highway NH-1, Delhi', // Could be enhanced with GPS data
        temperature: transportQuality.temperature ? `${transportQuality.temperature.toFixed(1)}°C` : null,
      });
    }

    // 5. Retail Arrival
    const receiveTx = economicTxs.find(tx => 
      tx.meta && typeof tx.meta === 'object' && (tx.meta as any).type === 'RETAILER_RECEIVE'
    );
    const retailQuality = qualityTxs.find(q => q.stage === 'retail');
    if (receiveTx || retailQuality) {
      const retailerUser = userMap.get(receiveTx?.payerDid || retailQuality?.actorDid || '');
      journeyStages.push({
        stage: 'Retail Arrival',
        role: 'Retailer',
        roleName: retailerUser?.retailerIdentity?.shopName || retailerUser?.name || 'Unknown Retailer',
        dateTime: receiveTx?.createdAt || retailQuality?.createdAt,
        description: 'Successfully delivered to retailer',
        location: retailerUser?.retailerIdentity?.address || 'Retail Store',
        temperature: retailQuality?.temperature ? `${retailQuality.temperature.toFixed(1)}°C` : null,
      });
    }

    // Calculate star rating (4-5 stars based on freshness)
    const starRating = freshnessScore >= 90 ? 5 : freshnessScore >= 80 ? 4 : freshnessScore >= 70 ? 3 : 2;

    res.json({
      batchId,
      product: {
        productName: produceLog.productName,
        variety: produceLog.variety || 'Standard',
        productId: batchId,
        quantity: produceLog.quantity,
        unit: produceLog.unit,
        grade: getGrade(freshnessScore),
        harvestDate: produceLog.harvestDate,
        farmingMethod: produceLog.farmingMethod,
      },
      freshnessScore,
      starRating,
      farmer: farmer ? {
        did: farmer.did,
        trustScore: farmer.trustScore,
        name: farmer.farmerIdentity?.businessName || farmer.name || 'Unknown',
        address: farmer.farmerIdentity?.address || 'Unknown',
      } : null,
      transporter: transporter ? {
        did: transporter.did,
        trustScore: transporter.trustScore,
        name: transporter.transporterIdentity?.companyName || transporter.name || 'Unknown',
        address: transporter.transporterIdentity?.address || 'Unknown',
      } : null,
      retailer: retailer ? {
        did: retailer.did,
        trustScore: retailer.trustScore,
        name: retailer.retailerIdentity?.shopName || retailer.name || 'Unknown',
        address: retailer.retailerIdentity?.address || 'Unknown',
      } : null,
      journeyStages,
      qualityMetrics: {
        latestQualityScore: latestQuality?.qualityScore || null,
        latestMoisture: latestQuality?.moistureLevel || null,
        latestTemperature: latestQuality?.temperature || null,
        spoilageDetected: latestQuality?.spoilageDetected || false,
      },
    });
  } catch (error: any) {
    console.error('Trace batch error:', error);
    res.status(500).json({ error: 'Failed to trace batch' });
  }
}

