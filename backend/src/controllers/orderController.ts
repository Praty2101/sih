import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import crypto from 'crypto';

// Helper to generate transaction hash
function generateTxHash(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Helper to generate order ID
function generateOrderId(): string {
  return `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

// Create a new order and record it in the ledger
export async function createOrder(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { did: true, role: true, name: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { 
      supplyItem, 
      quantity, 
      unit,
      price,
      totalAmount,
      toRole, // FARMER, TRANSPORTER, RETAILER
      deliveryPreference,
      destination,
      notes 
    } = req.body;

    if (!supplyItem || !quantity || !toRole) {
      return res.status(400).json({ error: 'supplyItem, quantity, and toRole are required' });
    }

    const orderId = generateOrderId();
    const txHash = generateTxHash();

    // Get the last transaction hash for chain linking
    const lastTx = await prisma.economicLedgerTx.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { txHash: true },
    });

    // Create economic ledger entry for the order
    const ledgerEntry = await prisma.economicLedgerTx.create({
      data: {
        txId: orderId,
        txHash,
        prevTxHash: lastTx?.txHash || null,
        ledgerType: 'ECONOMIC',
        fromParty: user.role,
        toParty: toRole,
        payerDid: user.did,
        product: supplyItem,
        quantity: Number(quantity),
        amount: totalAmount || (price * quantity),
        paymentMethod: 'ORDER',
        meta: {
          type: 'ORDER_PLACED',
          orderId,
          unit: unit || 'kg',
          price,
          deliveryPreference,
          destination,
          notes,
          fromName: user.name,
          status: 'PENDING',
        },
      },
    });

    return res.status(201).json({
      success: true,
      orderId,
      txHash,
      ledgerEntryId: ledgerEntry.id,
      message: 'Order placed and recorded in ledger',
    });
  } catch (error: any) {
    console.error('createOrder error:', error);
    return res.status(500).json({ error: 'Failed to create order' });
  }
}

// Accept an order
export async function acceptOrder(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { did: true, role: true, name: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'orderId is required' });
    }

    // Find the original order
    const originalOrder = await prisma.economicLedgerTx.findFirst({
      where: { txId: orderId },
    });

    if (!originalOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const txHash = generateTxHash();

    // Create acceptance ledger entry
    const acceptanceEntry = await prisma.economicLedgerTx.create({
      data: {
        txId: `${orderId}-ACCEPTED`,
        txHash,
        prevTxHash: originalOrder.txHash,
        ledgerType: 'ECONOMIC',
        fromParty: user.role,
        toParty: originalOrder.fromParty,
        payerDid: originalOrder.payerDid,
        payeeDid: user.did,
        product: originalOrder.product,
        quantity: originalOrder.quantity,
        amount: originalOrder.amount,
        paymentMethod: 'ORDER_ACCEPTED',
        meta: {
          type: 'ORDER_ACCEPTED',
          orderId,
          acceptedBy: user.name,
          acceptedByDid: user.did,
          acceptedByRole: user.role,
          originalMeta: originalOrder.meta,
        },
      },
    });

    return res.json({
      success: true,
      orderId,
      txHash,
      ledgerEntryId: acceptanceEntry.id,
      message: 'Order accepted and recorded in ledger',
    });
  } catch (error: any) {
    console.error('acceptOrder error:', error);
    return res.status(500).json({ error: 'Failed to accept order' });
  }
}

// Update order status (In Transit, Delivered, etc.)
export async function updateOrderStatus(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { did: true, role: true, name: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { orderId, status, notes } = req.body;

    if (!orderId || !status) {
      return res.status(400).json({ error: 'orderId and status are required' });
    }

    // Find the latest entry for this order
    const latestEntry = await prisma.economicLedgerTx.findFirst({
      where: { 
        OR: [
          { txId: orderId },
          { txId: { startsWith: orderId } }
        ]
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!latestEntry) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const txHash = generateTxHash();

    // Create status update ledger entry
    const statusEntry = await prisma.economicLedgerTx.create({
      data: {
        txId: `${orderId}-${status}`,
        txHash,
        prevTxHash: latestEntry.txHash,
        ledgerType: 'ECONOMIC',
        fromParty: user.role,
        toParty: latestEntry.fromParty,
        payerDid: latestEntry.payerDid,
        payeeDid: user.did,
        product: latestEntry.product,
        quantity: latestEntry.quantity,
        amount: latestEntry.amount,
        paymentMethod: `ORDER_${status.toUpperCase()}`,
        meta: {
          type: `ORDER_${status.toUpperCase()}`,
          orderId,
          status,
          updatedBy: user.name,
          updatedByDid: user.did,
          updatedByRole: user.role,
          notes,
        },
      },
    });

    return res.json({
      success: true,
      orderId,
      status,
      txHash,
      ledgerEntryId: statusEntry.id,
      message: `Order status updated to ${status} and recorded in ledger`,
    });
  } catch (error: any) {
    console.error('updateOrderStatus error:', error);
    return res.status(500).json({ error: 'Failed to update order status' });
  }
}

// Get orders for the current user
export async function getMyOrders(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { did: true, role: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { type = 'all' } = req.query; // 'placed', 'received', 'all'

    let where: any = {};

    if (type === 'placed') {
      // Orders placed by this user
      where = { payerDid: user.did, paymentMethod: 'ORDER' };
    } else if (type === 'received') {
      // Orders where this user's role is the recipient
      where = { 
        toParty: user.role,
        paymentMethod: 'ORDER',
      };
    } else {
      // All orders related to this user
      where = {
        OR: [
          { payerDid: user.did },
          { payeeDid: user.did },
          { toParty: user.role, paymentMethod: 'ORDER' },
        ],
      };
    }

    const orders = await prisma.economicLedgerTx.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Group by orderId and get latest status
    const orderMap = new Map();
    
    orders.forEach((order) => {
      const meta: any = order.meta || {};
      const orderId = meta.orderId || order.txId?.split('-')[0] + '-' + order.txId?.split('-')[1];
      
      if (!orderMap.has(orderId)) {
        orderMap.set(orderId, {
          orderId,
          product: order.product,
          quantity: order.quantity,
          amount: order.amount,
          fromParty: order.fromParty,
          toParty: order.toParty,
          payerDid: order.payerDid,
          payeeDid: order.payeeDid,
          status: meta.status || meta.type?.replace('ORDER_', '') || 'PENDING',
          createdAt: order.createdAt,
          updatedAt: order.createdAt,
          history: [],
          meta,
        });
      }
      
      const existing = orderMap.get(orderId);
      existing.history.push({
        txHash: order.txHash,
        type: meta.type,
        timestamp: order.createdAt,
        by: meta.updatedBy || meta.acceptedBy || meta.fromName,
      });
      
      // Update status to latest
      if (order.createdAt > existing.updatedAt) {
        existing.status = meta.type?.replace('ORDER_', '') || existing.status;
        existing.updatedAt = order.createdAt;
        if (order.payeeDid) existing.payeeDid = order.payeeDid;
      }
    });

    return res.json({
      orders: Array.from(orderMap.values()),
      total: orderMap.size,
    });
  } catch (error: any) {
    console.error('getMyOrders error:', error);
    return res.status(500).json({ error: 'Failed to fetch orders' });
  }
}

// Get pending orders for a role (for retailers, transporters, farmers to see incoming orders)
export async function getPendingOrders(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { did: true, role: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find all ORDER_PLACED entries targeting this user's role
    const placedOrders = await prisma.economicLedgerTx.findMany({
      where: {
        toParty: user.role,
        paymentMethod: 'ORDER',
      },
      orderBy: { createdAt: 'desc' },
    });

    // Find all accepted/processed orders
    const processedOrderIds = await prisma.economicLedgerTx.findMany({
      where: {
        paymentMethod: { in: ['ORDER_ACCEPTED', 'ORDER_IN_TRANSIT', 'ORDER_DELIVERED', 'ORDER_COMPLETED'] },
      },
      select: { meta: true },
    });

    const processedIds = new Set(
      processedOrderIds.map((o: any) => o.meta?.orderId).filter(Boolean)
    );

    // Filter to only pending orders
    const pendingOrders = placedOrders
      .filter((order) => {
        const meta: any = order.meta || {};
        return !processedIds.has(meta.orderId || order.txId);
      })
      .map((order) => {
        const meta: any = order.meta || {};
        return {
          orderId: meta.orderId || order.txId,
          product: order.product,
          quantity: order.quantity,
          unit: meta.unit || 'kg',
          amount: order.amount,
          price: meta.price,
          fromParty: order.fromParty,
          fromDid: order.payerDid,
          fromName: meta.fromName,
          deliveryPreference: meta.deliveryPreference,
          destination: meta.destination,
          notes: meta.notes,
          status: 'PENDING',
          createdAt: order.createdAt,
          txHash: order.txHash,
        };
      });

    return res.json({
      orders: pendingOrders,
      total: pendingOrders.length,
    });
  } catch (error: any) {
    console.error('getPendingOrders error:', error);
    return res.status(500).json({ error: 'Failed to fetch pending orders' });
  }
}


