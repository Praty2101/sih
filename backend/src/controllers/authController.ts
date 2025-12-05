import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { hashMobile } from '../utils/crypto';

export async function login(req: Request, res: Response) {
  const { identifier, password, role } = req.body;

  // Build search conditions: always try DID; if identifier looks like a mobile number, also try mobileHash
  const orConditions: any[] = [{ did: identifier }];

  if (/^\d{8,15}$/.test(identifier)) {
    const mobileHash = hashMobile(identifier);
    orConditions.push({ mobileHash });
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: orConditions,
      role: role || undefined,
    },
  });

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role, did: user.did },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' }
  );

  res.json({ token, user: { id: user.id, did: user.did, role: user.role, trustScore: user.trustScore } });
}

export async function getMe(req: any, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: {
      id: true,
      did: true,
      role: true,
      name: true,
      trustScore: true,
      status: true,
      createdAt: true,
    },
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(user);
}

