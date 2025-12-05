import { Request, Response } from 'express';
import { prisma } from '../config/database';

export async function getOverview(req: Request, res: Response) {
  const users = await prisma.user.groupBy({
    by: ['role'],
    _count: { id: true },
    _avg: { trustScore: true },
  });

  const zkpCount = await prisma.zkpLog.count();
  const anomalyCount = await prisma.anomaly.count({ where: { status: 'FAILED' } });

  res.json({
    roleStats: users.map(u => ({
      role: u.role,
      count: u._count.id,
      avgTrustScore: u._avg.trustScore,
    })),
    totalZKPVerifications: zkpCount,
    totalAnomalies: anomalyCount,
  });
}

export async function getTrustScores(req: Request, res: Response) {
  const users = await prisma.user.findMany({
    select: {
      did: true,
      role: true,
      trustScore: true,
      status: true,
    },
    orderBy: { trustScore: 'desc' },
  });

  res.json(users);
}

export async function getAnomalies(req: Request, res: Response) {
  const anomalies = await prisma.anomaly.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  res.json(anomalies);
}


