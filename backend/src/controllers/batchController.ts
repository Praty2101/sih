import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { appendEconomicTx, appendQualityTx } from '../services/ledger';
import { calculateTrustScore, computeQualityScore } from '../utils/trustScore';
import { validatePrice } from '../utils/priceCap';

export async function createBatchEvent(req: any, res: Response) {
  const { role, batchId, metrics, economicInfo, qualityInfo } = req.body;
  const actorDid = req.body.actorDid || req.did;

  if (!actorDid || !batchId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const user = await prisma.user.findUnique({ where: { did: actorDid } });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Price cap validation for retailers
  if (economicInfo && user.role === 'RETAILER' && economicInfo.commodity && economicInfo.pricePerKg) {
    const validation = validatePrice(economicInfo.commodity, economicInfo.pricePerKg);
    if (!validation.valid) {
      await prisma.anomaly.create({
        data: {
          batchId,
          did: actorDid,
          anomalyType: 'PRICE_CAP_VIOLATION',
          details: {
            commodity: economicInfo.commodity,
            pricePerKg: economicInfo.pricePerKg,
            maxAllowed: validation.maxAllowed,
            average: validation.average,
          },
          status: 'FAILED',
        },
      });

      return res.status(400).json({
        error: 'Price exceeds 20% of reference average',
        maxAllowed: validation.maxAllowed,
        average: validation.average,
      });
    }
  }

  // Append to economic ledger if economic info provided
  if (economicInfo) {
    await appendEconomicTx({
      batchId,
      payerDid: economicInfo.payerDid || actorDid,
      payeeDid: economicInfo.payeeDid,
      amount: economicInfo.amount,
      margin: economicInfo.margin,
      meta: {
        commodity: economicInfo.commodity,
        pricePerKg: economicInfo.pricePerKg,
        ...economicInfo,
      },
    });
  }

  // Append to quality ledger if quality info provided
  if (qualityInfo) {
    await appendQualityTx({
      batchId,
      actorDid,
      qualityData: qualityInfo,
    });
  }

  // Update trust score
  let newTrustScore = user.trustScore;
  if (metrics) {
    const latestMetric = metrics.qualityScore || metrics.onTime || (1 - (metrics.complaintRate || 0));
    newTrustScore = calculateTrustScore(user.trustScore, latestMetric);
  } else if (qualityInfo) {
    const qualityScore = computeQualityScore(qualityInfo);
    newTrustScore = calculateTrustScore(user.trustScore, qualityScore);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { trustScore: newTrustScore },
  });

  res.json({
    success: true,
    trustScore: newTrustScore,
    batchId,
  });
}


