import express from 'express';
import { registerFarmer, registerTransporter, registerRetailer, registerConsumer } from '../controllers/registrationController';
import { login, getMe } from '../controllers/authController';
import { createBatchEvent } from '../controllers/batchController';
import { traceBatch } from '../controllers/traceController';
import { generateZKP, verifyZKP } from '../controllers/zkpController';
import { getGPSTrack } from '../controllers/gpsController';
import { getIdentity } from '../controllers/identityController';
import { getOverview, getTrustScores, getAnomalies } from '../controllers/adminController';
import { getMyLedger, getEconomicLedger, getQualityLedger, getZkpLedger } from '../controllers/ledgerController';
import { getAccountDetails } from '../controllers/accountController';
import { registerProduce, getProduceLogs } from '../controllers/produceController';
import { getFarmerBatches, getTransporterBatches, getRetailerBatches, getDashboardMetrics } from '../controllers/dashboardController';
import { getSupplies, updateSupplyQuantity } from '../controllers/suppliesController';
import { createOrder, acceptOrder, updateOrderStatus, getMyOrders, getPendingOrders } from '../controllers/orderController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Public routes
router.post('/register/farmer', registerFarmer);
router.post('/register/transporter', registerTransporter);
router.post('/register/retailer', registerRetailer);
router.post('/register/consumer', registerConsumer);
router.post('/login', login);
router.get('/identity/:did', getIdentity);
router.get('/trace/:batchId', traceBatch);
router.get('/gps/:deviceId', getGPSTrack);
router.get('/ledger/economic', getEconomicLedger); // Public endpoint for all economic ledger data
router.get('/ledger/quality', getQualityLedger); // Public endpoint for all quality ledger data
router.get('/ledger/zkp', getZkpLedger); // Public endpoint for all ZKP proofs
router.get('/supplies', getSupplies); // Public endpoint for supply prices
router.post('/supplies/update-quantity', authMiddleware, updateSupplyQuantity); // Protected endpoint to update supply quantity

// Protected routes
router.get('/me', authMiddleware, getMe);
router.get('/account', authMiddleware, getAccountDetails);
router.get('/ledger/me', authMiddleware, getMyLedger);
router.post('/batch/event', authMiddleware, createBatchEvent);
router.post('/zkp/generate', authMiddleware, generateZKP);
router.post('/zkp/verify', verifyZKP); // Public endpoint for verification
router.post('/produce/register', authMiddleware, registerProduce);
router.get('/produce/logs', authMiddleware, getProduceLogs);
router.get('/dashboard/farmer/batches', authMiddleware, getFarmerBatches);
router.get('/dashboard/transporter/batches', authMiddleware, getTransporterBatches);
router.get('/dashboard/retailer/batches', authMiddleware, getRetailerBatches);
router.get('/dashboard/metrics', authMiddleware, getDashboardMetrics);

// Order routes (tracked in ledger)
router.post('/orders/create', authMiddleware, createOrder);
router.post('/orders/accept', authMiddleware, acceptOrder);
router.post('/orders/status', authMiddleware, updateOrderStatus);
router.get('/orders/my', authMiddleware, getMyOrders);
router.get('/orders/pending', authMiddleware, getPendingOrders);

// Admin routes
router.get('/admin/overview', authMiddleware, getOverview);
router.get('/admin/trust-scores', authMiddleware, getTrustScores);
router.get('/admin/anomalies', authMiddleware, getAnomalies);

export default router;

