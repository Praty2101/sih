import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { generateProof } from '../zkp/prover';
import { verifyProof } from '../zkp/verifier';
import type { QualityProofData, EconomicProofData, RouteProofData } from '../zkp/prover';

/**
 * Generate a Zero-Knowledge Proof
 * POST /api/zkp/generate
 */
export async function generateZKP(req: AuthRequest, res: Response) {
  try {
    const { type, data } = req.body;
    const did = req.did;

    if (!did) {
      return res.status(401).json({ error: 'Unauthorized: DID not found.' });
    }

    if (!type || !['quality', 'economic', 'route'].includes(type)) {
      return res.status(400).json({ 
        error: 'Invalid proof type. Must be: quality, economic, or route.' 
      });
    }

    if (!data) {
      return res.status(400).json({ error: 'Missing proof data.' });
    }

    // Validate data based on type
    if (type === 'quality') {
      const qualityData = data as QualityProofData;
      if (!qualityData.moistureLevel || !qualityData.temperature || !qualityData.batchId) {
        return res.status(400).json({ 
          error: 'Missing required quality data: moistureLevel, temperature, batchId' 
        });
      }
      if (!qualityData.sensorReadings || !Array.isArray(qualityData.sensorReadings)) {
        return res.status(400).json({ 
          error: 'Missing or invalid sensorReadings array' 
        });
      }
    } else if (type === 'economic') {
      const economicData = data as EconomicProofData;
      if (!economicData.batchId || economicData.totalQuantity === undefined || 
          economicData.soldQuantity === undefined) {
        return res.status(400).json({ 
          error: 'Missing required economic data: batchId, totalQuantity, soldQuantity' 
        });
      }
    } else if (type === 'route') {
      const routeData = data as RouteProofData;
      if (!routeData.batchId || !routeData.gpsPoints || !Array.isArray(routeData.gpsPoints)) {
        return res.status(400).json({ 
          error: 'Missing required route data: batchId, gpsPoints array' 
        });
      }
      if (routeData.gpsPoints.length < 2) {
        return res.status(400).json({ 
          error: 'Route must have at least 2 GPS points' 
        });
      }
    }

    // Generate proof
    let proof;
    try {
      proof = generateProof(type, data);
    } catch (error: any) {
      return res.status(400).json({ 
        error: `Failed to generate proof: ${error.message}` 
      });
    }

    // Store proof in database
    const zkpLog = await prisma.zkpLog.create({
      data: {
        did,
        batchId: data.batchId || null,
        proofType: type.toUpperCase(),
        proofPayload: JSON.stringify(proof),
        verified: true, // Proofs are verified at generation time
        message: 'Proof generated successfully',
      },
    });

    res.status(201).json({
      success: true,
      proof,
      zkpLogId: zkpLog.id,
      message: 'ZKP proof generated successfully',
    });
  } catch (error: any) {
    console.error('Error generating ZKP:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to generate ZKP proof.' 
    });
  }
}

/**
 * Verify a Zero-Knowledge Proof
 * POST /api/zkp/verify
 */
export async function verifyZKP(req: Request, res: Response) {
  try {
    const { proof, did, batchId } = req.body;

    if (!proof) {
      return res.status(400).json({ error: 'Missing proof object.' });
    }

    // Validate proof structure
    if (!proof.claim || !proof.privateInputsHash || !proof.publicInputs || 
        !proof.timestamp || !proof.proof || !proof.proofHash) {
      return res.status(400).json({ 
        error: 'Invalid proof structure. Missing required fields.' 
      });
    }

    // Verify proof
    const verificationResult = verifyProof(proof);

    // Store verification result in database
    const zkpLog = await prisma.zkpLog.create({
      data: {
        did: did || 'anonymous',
        batchId: batchId || proof.publicInputs?.batchId || null,
        proofType: proof.claim.includes('Quality') ? 'QUALITY' : 
                   proof.claim.includes('Economic') ? 'ECONOMIC' : 
                   proof.claim.includes('Route') ? 'ROUTE' : 'UNKNOWN',
        proofPayload: JSON.stringify(proof),
        verified: verificationResult.verified,
        message: verificationResult.message,
      },
    });

    // Create anomaly if verification failed
    if (!verificationResult.verified) {
      await prisma.anomaly.create({
        data: {
          batchId: batchId || proof.publicInputs?.batchId || null,
          did: did || 'anonymous',
          anomalyType: 'ZKP_FAILURE',
          details: {
            proofType: zkpLog.proofType,
            verificationResult: {
              verified: verificationResult.verified,
              message: verificationResult.message,
              details: verificationResult.details,
            },
            proofHash: proof.proofHash,
          },
          status: 'FAILED',
        },
      });
    }

    res.json({
      verified: verificationResult.verified,
      message: verificationResult.message,
      details: verificationResult.details,
      zkpLogId: zkpLog.id,
    });
  } catch (error: any) {
    console.error('Error verifying ZKP:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to verify ZKP proof.' 
    });
  }
}

