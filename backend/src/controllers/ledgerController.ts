import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';

export async function getMyLedger(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { did: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const did = user.did;

    const [economicTxs, qualityTxs, zkpLogs] = await Promise.all([
      prisma.economicLedgerTx.findMany({
        where: {
          OR: [{ payerDid: did }, { payeeDid: did }],
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.qualityLedgerTx.findMany({
        where: { actorDid: did },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.zkpLog.findMany({
        where: { did },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const economic = economicTxs.map((tx) => {
      const meta: any = tx.meta || {};
      return {
        txId: tx.id,
        txHash: tx.txHash,
        txType: meta.txType || meta.type || 'Transaction',
        batchId: tx.batchId || tx.shipmentId || null,
        fromDid: tx.payerDid || null,
        toDid: tx.payeeDid || null,
        amount: tx.amount ?? null,
        margin: tx.margin ?? null,
        currency: meta.currency || meta.token || 'INR',
        timestamp: tx.createdAt,
        referenceQualityTxHash: meta.referenceQualityTxHash || null,
        meta,
      };
    });

    const quality = qualityTxs.map((tx) => {
      const data: any = tx.qualityData || {};
      return {
        txId: tx.id,
        txHash: tx.txHash,
        txType: data.txType || data.type || 'QualityEvent',
        batchId: tx.batchId || tx.shipmentId || null,
        timestamp: tx.createdAt,
        batchFingerprint: data.batchFingerprint || null,
        payload: data,
      };
    });

    const zkp = zkpLogs.map((z) => ({
      id: z.id,
      did: z.did,
      batchId: z.batchId,
      proofType: z.proofType,
      verified: z.verified,
      message: z.message,
      createdAt: z.createdAt,
    }));

    return res.json({ economic, quality, zkp });
  } catch (error: any) {
    console.error('getMyLedger error:', error);
    return res.status(500).json({ error: 'Failed to fetch ledger data' });
  }
}

// Public endpoint to get all economic ledger transactions (accessible by anyone)
export async function getEconomicLedger(req: Request, res: Response) {
  try {
    const { limit = 100, offset = 0, batchId, fromParty, toParty } = req.query;

    const where: any = {};
    if (batchId) where.batchId = batchId as string;
    if (fromParty) where.fromParty = fromParty as string;
    if (toParty) where.toParty = toParty as string;

    const [economicTxs, totalCount] = await Promise.all([
      prisma.economicLedgerTx.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        skip: Number(offset),
        include: {
          user: {
            select: {
              did: true,
              role: true,
              name: true,
            },
          },
        },
      }),
      prisma.economicLedgerTx.count({ where }),
    ]);

    // Get user roles for payer and payee
    const payerDids = [...new Set(economicTxs.map(tx => tx.payerDid).filter(Boolean) as string[])];
    const payeeDids = [...new Set(economicTxs.map(tx => tx.payeeDid).filter(Boolean) as string[])];
    const allDids = [...new Set([...payerDids, ...payeeDids])];
    
    const users = allDids.length > 0 ? await prisma.user.findMany({
      where: { did: { in: allDids } },
      select: { did: true, role: true },
    }) : [];
    
    const userRoleMap = new Map(users.map(u => [u.did, u.role]));

    const transactions = economicTxs.map((tx) => {
      const meta: any = tx.meta || {};
      const payerRole = tx.payerDid ? userRoleMap.get(tx.payerDid) : null;
      const payeeRole = tx.payeeDid ? userRoleMap.get(tx.payeeDid) : null;
      
      return {
        txId: tx.txId || tx.id,
        txHash: tx.txHash,
        prevTxHash: tx.prevTxHash,
        batchId: tx.batchId || null,
        fromParty: tx.fromParty || payerRole || 'Unknown',
        toParty: tx.toParty || payeeRole || 'Unknown',
        fromDid: tx.payerDid || null,
        toDid: tx.payeeDid || null,
        product: tx.product || meta.product || meta.commodity || 'N/A',
        quantity: tx.quantity || meta.quantity || null,
        amount: tx.amount || null,
        paymentMethod: tx.paymentMethod || meta.paymentMethod || 'N/A',
        timestamp: tx.createdAt,
        margin: tx.margin || null,
        currency: meta.currency || 'INR',
      };
    });

    return res.json({
      transactions,
      total: totalCount,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error: any) {
    console.error('getEconomicLedger error:', error);
    return res.status(500).json({ error: 'Failed to fetch economic ledger data' });
  }
}

// Public endpoint to get all quality ledger transactions (accessible by anyone)
export async function getQualityLedger(req: Request, res: Response) {
  try {
    const { limit = 100, offset = 0, batchId, stage } = req.query;

    const where: any = {};
    if (batchId) where.batchId = batchId as string;
    if (stage) where.stage = stage as string;

    const [qualityTxs, totalCount] = await Promise.all([
      prisma.qualityLedgerTx.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        skip: Number(offset),
        include: {
          user: {
            select: {
              did: true,
              role: true,
              name: true,
            },
          },
        },
      }),
      prisma.qualityLedgerTx.count({ where }),
    ]);

    // Get user roles for actors
    const actorDids = [...new Set(qualityTxs.map(tx => tx.actorDid).filter(Boolean) as string[])];
    
    const users = actorDids.length > 0 ? await prisma.user.findMany({
      where: { did: { in: actorDids } },
      select: { did: true, role: true },
    }) : [];
    
    const userRoleMap = new Map(users.map(u => [u.did, u.role]));

    const transactions = qualityTxs.map((tx) => {
      const data: any = tx.qualityData || {};
      const actorRole = tx.actorDid ? userRoleMap.get(tx.actorDid) : null;
      
      return {
        txId: tx.txId || tx.id,
        txHash: tx.txHash,
        prevTxHash: tx.prevTxHash,
        batchId: tx.batchId || null,
        actorDid: tx.actorDid || null,
        actorRole: actorRole || 'Unknown',
        stage: tx.stage || data.stage || 'Unknown',
        qualityScore: tx.qualityScore || data.qualityScore || null,
        moistureLevel: tx.moistureLevel || data.moistureLevel || null,
        temperature: tx.temperature || data.temperature || null,
        spoilageDetected: tx.spoilageDetected ?? data.spoilageDetected ?? null,
        aiVerificationHash: tx.aiVerificationHash || data.aiVerificationHash || null,
        iotMerkleRoot: tx.iotMerkleRoot || data.iotMerkleRoot || null,
        timestamp: tx.createdAt,
      };
    });

    return res.json({
      transactions,
      total: totalCount,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error: any) {
    console.error('getQualityLedger error:', error);
    return res.status(500).json({ error: 'Failed to fetch quality ledger data' });
  }
}

// Public endpoint to get all ZKP proofs (accessible by anyone)
export async function getZkpLedger(req: Request, res: Response) {
  try {
    const { limit = 100, offset = 0, batchId, proofType, verified } = req.query;

    const where: any = {};
    if (batchId) where.batchId = batchId as string;
    if (proofType) where.proofType = proofType as string;
    if (verified !== undefined) where.verified = verified === 'true';

    const [zkpLogs, totalCount] = await Promise.all([
      prisma.zkpLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        skip: Number(offset),
        include: {
          user: {
            select: {
              did: true,
              role: true,
              name: true,
            },
          },
        },
      }),
      prisma.zkpLog.count({ where }),
    ]);

    const proofs = zkpLogs.map((log) => {
      // Try to parse proofPayload to extract proof details
      let proofData: any = null;
      try {
        proofData = JSON.parse(log.proofPayload);
      } catch {
        // If parsing fails, use raw payload
        proofData = { raw: log.proofPayload };
      }

      return {
        id: log.id,
        did: log.did,
        userRole: log.user?.role || 'Unknown',
        userName: log.user?.name || 'Unknown',
        batchId: log.batchId || null,
        proofType: log.proofType,
        verified: log.verified,
        message: log.message || null,
        claim: proofData?.claim || null,
        proofHash: proofData?.proofHash || null,
        timestamp: log.createdAt,
        proofData: proofData,
      };
    });

    return res.json({ proofs, totalCount });
  } catch (error: any) {
    console.error('getZkpLedger error:', error);
    return res.status(500).json({ error: 'Failed to fetch ZKP ledger data' });
  }
}


