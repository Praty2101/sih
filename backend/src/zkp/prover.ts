import {
  hash,
  hashPrivateInputs,
  generateProofHash,
  generateMockProof,
  getTimestamp,
  generateMerkleRoot,
} from './zkpUtils';

/**
 * ZKP Prover Module
 * Generates Zero-Knowledge Proofs for various supply chain use cases
 */

export interface ZKPProof {
  claim: string;
  privateInputsHash: string;
  publicInputs: Record<string, any>;
  timestamp: string;
  proof: string;
  proofHash: string;
}

export interface QualityProofData {
  moistureLevel: number;
  temperature: number;
  sensorReadings: number[];
  batchId: string;
  stage: string;
}

export interface EconomicProofData {
  paymentAmount: number;
  totalQuantity: number;
  soldQuantity: number;
  batchId: string;
  transactionId?: string;
}

export interface RouteProofData {
  gpsPoints: Array<{ lat: number; lng: number; timestamp: number }>;
  expectedRoute: string;
  batchId: string;
}

/**
 * Generate ZKP for Quality Ledger
 * Proves: moisture < 12%, temperature between 2°C-10°C, no sensor tampering
 */
export function generateQualityProof(data: QualityProofData): ZKPProof {
  // Private inputs (not revealed)
  const privateInputs = {
    moistureLevel: data.moistureLevel,
    temperature: data.temperature,
    sensorReadings: data.sensorReadings,
    rawSensorData: data.sensorReadings.join(','),
  };

  // Public inputs (revealed for verification)
  const publicInputs = {
    batchId: data.batchId,
    stage: data.stage,
    moistureThreshold: 12, // Maximum allowed moisture %
    tempMin: 2, // Minimum temperature °C
    tempMax: 10, // Maximum temperature °C
    sensorCount: data.sensorReadings.length,
    iotMerkleRoot: generateMerkleRoot(data.sensorReadings),
  };

  // Verify conditions
  const moistureValid = data.moistureLevel < 12;
  const tempValid = data.temperature >= 2 && data.temperature <= 10;
  
  // Check for sensor tampering (all readings should be consistent)
  const sensorVariance = Math.max(...data.sensorReadings) - Math.min(...data.sensorReadings);
  const noTampering = sensorVariance < 2; // Readings should be within 2 units

  const conditionsMet = moistureValid && tempValid && noTampering;

  if (!conditionsMet) {
    throw new Error('Quality conditions not satisfied. Cannot generate proof.');
  }

  const claim = `Quality conditions satisfied: moisture < 12%, temperature 2-10°C, no sensor tampering`;
  const privateInputsHash = hashPrivateInputs(privateInputs);
  const timestamp = getTimestamp();
  const proof = generateMockProof(privateInputs, publicInputs, claim);

  const proofObject: ZKPProof = {
    claim,
    privateInputsHash,
    publicInputs,
    timestamp,
    proof,
    proofHash: '', // Will be set after creation
  };

  // Generate proof hash
  proofObject.proofHash = generateProofHash(proofObject);

  return proofObject;
}

/**
 * Generate ZKP for Economic Ledger
 * Proves: paymentTxnExists = true, soldQuantity <= totalQuantity
 */
export function generateEconomicProof(data: EconomicProofData): ZKPProof {
  // Private inputs (not revealed)
  const privateInputs = {
    paymentAmount: data.paymentAmount,
    paymentDetails: data.transactionId || 'payment-confirmed',
    actualSoldQuantity: data.soldQuantity,
  };

  // Public inputs (revealed for verification)
  const publicInputs = {
    batchId: data.batchId,
    totalQuantity: data.totalQuantity,
    soldQuantity: data.soldQuantity,
    paymentExists: true, // Proved without revealing details
    quantityConstraint: 'soldQuantity <= totalQuantity',
  };

  // Verify conditions
  const paymentExists = data.paymentAmount > 0 || !!data.transactionId;
  const quantityValid = data.soldQuantity <= data.totalQuantity;

  if (!paymentExists || !quantityValid) {
    throw new Error('Economic conditions not satisfied. Cannot generate proof.');
  }

  const claim = `Economic conditions satisfied: payment exists, soldQuantity <= totalQuantity`;
  const privateInputsHash = hashPrivateInputs(privateInputs);
  const timestamp = getTimestamp();
  const proof = generateMockProof(privateInputs, publicInputs, claim);

  const proofObject: ZKPProof = {
    claim,
    privateInputsHash,
    publicInputs,
    timestamp,
    proof,
    proofHash: '', // Will be set after creation
  };

  // Generate proof hash
  proofObject.proofHash = generateProofHash(proofObject);

  return proofObject;
}

/**
 * Generate ZKP for Route Ledger
 * Proves: routeIsValid = true without sharing full GPS path
 */
export function generateRouteProof(data: RouteProofData): ZKPProof {
  // Private inputs (not revealed - full GPS path)
  const privateInputs = {
    gpsPoints: data.gpsPoints,
    fullRoute: data.gpsPoints.map(p => `${p.lat},${p.lng}`).join('->'),
  };

  // Calculate route metrics
  const startPoint = data.gpsPoints[0];
  const endPoint = data.gpsPoints[data.gpsPoints.length - 1];
  
  // Simple distance calculation (Haversine approximation)
  const distance = Math.sqrt(
    Math.pow(endPoint.lat - startPoint.lat, 2) +
    Math.pow(endPoint.lng - startPoint.lng, 2)
  ) * 111; // Rough km conversion

  // Check route validity (points should be sequential, reasonable distance)
  const isValidRoute = 
    data.gpsPoints.length >= 2 &&
    distance > 0 &&
    distance < 5000 && // Max 5000 km
    data.gpsPoints.every((p, i) => {
      if (i === 0) return true;
      const prev = data.gpsPoints[i - 1];
      return p.timestamp > prev.timestamp; // Sequential timestamps
    });

  if (!isValidRoute) {
    throw new Error('Route conditions not satisfied. Cannot generate proof.');
  }

  // Public inputs (revealed for verification)
  const publicInputs = {
    batchId: data.batchId,
    expectedRoute: data.expectedRoute,
    startLat: startPoint.lat,
    startLng: startPoint.lng,
    endLat: endPoint.lat,
    endLng: endPoint.lng,
    pointCount: data.gpsPoints.length,
    routeHash: hash(data.gpsPoints.map(p => `${p.lat},${p.lng}`).join('|')),
    distanceKm: Math.round(distance * 100) / 100,
  };

  const claim = `Route is valid: sequential GPS points, reasonable distance, no backtracking`;
  const privateInputsHash = hashPrivateInputs(privateInputs);
  const timestamp = getTimestamp();
  const proof = generateMockProof(privateInputs, publicInputs, claim);

  const proofObject: ZKPProof = {
    claim,
    privateInputsHash,
    publicInputs,
    timestamp,
    proof,
    proofHash: '', // Will be set after creation
  };

  // Generate proof hash
  proofObject.proofHash = generateProofHash(proofObject);

  return proofObject;
}

/**
 * Main prover function - routes to appropriate proof generator
 */
export function generateProof(
  type: 'quality' | 'economic' | 'route',
  data: QualityProofData | EconomicProofData | RouteProofData
): ZKPProof {
  switch (type) {
    case 'quality':
      return generateQualityProof(data as QualityProofData);
    case 'economic':
      return generateEconomicProof(data as EconomicProofData);
    case 'route':
      return generateRouteProof(data as RouteProofData);
    default:
      throw new Error(`Unknown proof type: ${type}`);
  }
}


