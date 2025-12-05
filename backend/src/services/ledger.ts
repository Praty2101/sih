import { prisma } from '../config/database';
import { createHash } from 'crypto';

export async function getLastTxHash(ledgerType: 'ECONOMIC' | 'QUALITY'): Promise<string | null> {
  if (ledgerType === 'ECONOMIC') {
    const lastTx = await prisma.economicLedgerTx.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { txHash: true },
    });
    return lastTx?.txHash || null;
  } else {
    const lastTx = await prisma.qualityLedgerTx.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { txHash: true },
    });
    return lastTx?.txHash || null;
  }
}

export function generateTxHash(data: any): string {
  const str = JSON.stringify(data);
  return createHash('sha256').update(str).digest('hex');
}

export async function appendEconomicTx(data: {
  batchId?: string;
  shipmentId?: string;
  payerDid?: string;
  payeeDid?: string;
  fromParty?: string; // farmer, transporter, retailer
  toParty?: string; // farmer, transporter, retailer
  product?: string;
  quantity?: number;
  amount?: number;
  paymentMethod?: string; // UPI / Cash / Settlement
  margin?: number;
  meta?: any;
}) {
  const prevTxHash = await getLastTxHash('ECONOMIC');
  const txData = { ...data, prevTxHash, timestamp: Date.now() };
  const txHash = generateTxHash(txData);
  
  // Generate unique txId
  const txId = `TX-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

  return prisma.economicLedgerTx.create({
    data: {
      txId,
      txHash,
      prevTxHash,
      batchId: data.batchId,
      shipmentId: data.shipmentId,
      payerDid: data.payerDid,
      payeeDid: data.payeeDid,
      fromParty: data.fromParty,
      toParty: data.toParty,
      product: data.product,
      quantity: data.quantity,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      margin: data.margin,
      meta: data.meta || {},
    },
  });
}

export async function appendQualityTx(data: {
  batchId?: string;
  shipmentId?: string;
  actorDid?: string;
  stage?: string; // harvest, sorting, transport, retail
  qualityScore?: number; // 0-100
  moistureLevel?: number;
  temperature?: number;
  spoilageDetected?: boolean;
  aiVerificationHash?: string;
  iotMerkleRoot?: string;
  qualityData?: any; // Additional data for backward compatibility
}) {
  const prevTxHash = await getLastTxHash('QUALITY');
  const txData = { ...data, prevTxHash, timestamp: Date.now() };
  const txHash = generateTxHash(txData);
  
  // Generate unique txId
  const txId = `QL-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

  return prisma.qualityLedgerTx.create({
    data: {
      txId,
      txHash,
      prevTxHash,
      batchId: data.batchId,
      shipmentId: data.shipmentId,
      actorDid: data.actorDid,
      stage: data.stage,
      qualityScore: data.qualityScore,
      moistureLevel: data.moistureLevel,
      temperature: data.temperature,
      spoilageDetected: data.spoilageDetected,
      aiVerificationHash: data.aiVerificationHash,
      iotMerkleRoot: data.iotMerkleRoot,
      qualityData: data.qualityData || {},
    },
  });
}

