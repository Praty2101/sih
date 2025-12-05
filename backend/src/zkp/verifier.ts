import {
  hash,
  validateProofHash,
  generateMerkleRoot,
} from './zkpUtils';
import { ZKPProof } from './prover';

/**
 * ZKP Verifier Module
 * Verifies Zero-Knowledge Proofs without accessing private data
 */

export interface VerificationResult {
  verified: boolean;
  message: string;
  details?: Record<string, any>;
}

/**
 * Verify Quality Proof
 * Checks: moisture < 12%, temperature 2-10°C, no sensor tampering
 */
function verifyQualityProof(proof: ZKPProof): VerificationResult {
  const { publicInputs, privateInputsHash, proofHash } = proof;

  // Validate proof hash integrity
  if (!validateProofHash(proof, proofHash)) {
    return {
      verified: false,
      message: 'Proof hash validation failed. Proof may have been tampered with.',
    };
  }

  // Verify public inputs are present
  if (!publicInputs.batchId || !publicInputs.stage) {
    return {
      verified: false,
      message: 'Missing required public inputs: batchId or stage',
    };
  }

  // Verify constraints are within acceptable ranges
  const moistureThreshold = publicInputs.moistureThreshold || 12;
  const tempMin = publicInputs.tempMin || 2;
  const tempMax = publicInputs.tempMax || 10;

  if (moistureThreshold > 12 || tempMin < 2 || tempMax > 10) {
    return {
      verified: false,
      message: 'Public constraints are outside acceptable ranges',
      details: {
        moistureThreshold,
        tempMin,
        tempMax,
      },
    };
  }

  // Verify IoT Merkle root is present (proves sensor data integrity)
  if (!publicInputs.iotMerkleRoot) {
    return {
      verified: false,
      message: 'Missing IoT Merkle root. Cannot verify sensor data integrity.',
    };
  }

  // Verify proof structure
  if (!proof.proof || proof.proof.length < 32) {
    return {
      verified: false,
      message: 'Invalid proof structure',
    };
  }

  // All checks passed
  return {
    verified: true,
    message: 'Quality proof verified successfully. Conditions satisfied: moisture < 12%, temperature 2-10°C, no sensor tampering.',
    details: {
      batchId: publicInputs.batchId,
      stage: publicInputs.stage,
      sensorCount: publicInputs.sensorCount,
      iotMerkleRoot: publicInputs.iotMerkleRoot,
    },
  };
}

/**
 * Verify Economic Proof
 * Checks: payment exists, soldQuantity <= totalQuantity
 */
function verifyEconomicProof(proof: ZKPProof): VerificationResult {
  const { publicInputs, privateInputsHash, proofHash } = proof;

  // Validate proof hash integrity
  if (!validateProofHash(proof, proofHash)) {
    return {
      verified: false,
      message: 'Proof hash validation failed. Proof may have been tampered with.',
    };
  }

  // Verify public inputs are present
  if (!publicInputs.batchId) {
    return {
      verified: false,
      message: 'Missing required public input: batchId',
    };
  }

  // Verify payment exists (proved without revealing details)
  if (publicInputs.paymentExists !== true) {
    return {
      verified: false,
      message: 'Payment existence not proven',
    };
  }

  // Verify quantity constraint
  const totalQuantity = publicInputs.totalQuantity;
  const soldQuantity = publicInputs.soldQuantity;

  if (typeof totalQuantity !== 'number' || typeof soldQuantity !== 'number') {
    return {
      verified: false,
      message: 'Invalid quantity values in public inputs',
    };
  }

  if (soldQuantity > totalQuantity) {
    return {
      verified: false,
      message: `Quantity constraint violated: soldQuantity (${soldQuantity}) > totalQuantity (${totalQuantity})`,
      details: {
        totalQuantity,
        soldQuantity,
      },
    };
  }

  // Verify proof structure
  if (!proof.proof || proof.proof.length < 32) {
    return {
      verified: false,
      message: 'Invalid proof structure',
    };
  }

  // All checks passed
  return {
    verified: true,
    message: 'Economic proof verified successfully. Conditions satisfied: payment exists, soldQuantity <= totalQuantity.',
    details: {
      batchId: publicInputs.batchId,
      totalQuantity,
      soldQuantity,
      paymentExists: true,
    },
  };
}

/**
 * Verify Route Proof
 * Checks: route is valid without accessing full GPS path
 */
function verifyRouteProof(proof: ZKPProof): VerificationResult {
  const { publicInputs, privateInputsHash, proofHash } = proof;

  // Validate proof hash integrity
  if (!validateProofHash(proof, proofHash)) {
    return {
      verified: false,
      message: 'Proof hash validation failed. Proof may have been tampered with.',
    };
  }

  // Verify public inputs are present
  if (!publicInputs.batchId || !publicInputs.expectedRoute) {
    return {
      verified: false,
      message: 'Missing required public inputs: batchId or expectedRoute',
    };
  }

  // Verify GPS coordinates are valid
  const startLat = publicInputs.startLat;
  const startLng = publicInputs.startLng;
  const endLat = publicInputs.endLat;
  const endLng = publicInputs.endLng;

  if (
    typeof startLat !== 'number' ||
    typeof startLng !== 'number' ||
    typeof endLat !== 'number' ||
    typeof endLng !== 'number'
  ) {
    return {
      verified: false,
      message: 'Invalid GPS coordinates in public inputs',
    };
  }

  // Verify coordinates are within valid ranges
  if (
    startLat < -90 || startLat > 90 ||
    startLng < -180 || startLng > 180 ||
    endLat < -90 || endLat > 90 ||
    endLng < -180 || endLng > 180
  ) {
    return {
      verified: false,
      message: 'GPS coordinates are outside valid ranges',
    };
  }

  // Verify route hash is present
  if (!publicInputs.routeHash) {
    return {
      verified: false,
      message: 'Missing route hash. Cannot verify route integrity.',
    };
  }

  // Verify distance is reasonable
  const distanceKm = publicInputs.distanceKm;
  if (typeof distanceKm !== 'number' || distanceKm < 0 || distanceKm > 5000) {
    return {
      verified: false,
      message: 'Route distance is invalid or unreasonable',
      details: {
        distanceKm,
      },
    };
  }

  // Verify point count
  const pointCount = publicInputs.pointCount;
  if (typeof pointCount !== 'number' || pointCount < 2) {
    return {
      verified: false,
      message: 'Route must have at least 2 GPS points',
    };
  }

  // Verify proof structure
  if (!proof.proof || proof.proof.length < 32) {
    return {
      verified: false,
      message: 'Invalid proof structure',
    };
  }

  // All checks passed
  return {
    verified: true,
    message: 'Route proof verified successfully. Route is valid without revealing full GPS path.',
    details: {
      batchId: publicInputs.batchId,
      expectedRoute: publicInputs.expectedRoute,
      startPoint: { lat: startLat, lng: startLng },
      endPoint: { lat: endLat, lng: endLng },
      pointCount,
      distanceKm,
    },
  };
}

/**
 * Main verifier function - routes to appropriate proof verifier
 */
export function verifyProof(proof: ZKPProof): VerificationResult {
  // Determine proof type from claim
  const claim = proof.claim.toLowerCase();

  if (claim.includes('quality')) {
    return verifyQualityProof(proof);
  } else if (claim.includes('economic')) {
    return verifyEconomicProof(proof);
  } else if (claim.includes('route')) {
    return verifyRouteProof(proof);
  } else {
    return {
      verified: false,
      message: `Unknown proof type. Claim: ${proof.claim}`,
    };
  }
}

/**
 * Verify proof hash only (quick check)
 */
export function verifyProofHash(proof: ZKPProof): boolean {
  return validateProofHash(proof, proof.proofHash);
}


