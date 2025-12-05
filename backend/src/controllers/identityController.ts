import { Request, Response } from 'express';
import { prisma } from '../config/database';

export async function getIdentity(req: Request, res: Response) {
  const { did } = req.params;

  const user = await prisma.user.findUnique({
    where: { did },
    select: {
      did: true,
      role: true,
      trustScore: true,
      status: true,
      publicKey: true,
      createdAt: true,
    },
  });

  if (!user) {
    return res.status(404).json({ error: 'Identity not found' });
  }

  res.json(user);
}


