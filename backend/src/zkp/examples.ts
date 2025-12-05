/**
 * ZKP Module Usage Examples
 * This file demonstrates how to use the ZKP module for different use cases
 */

import { generateProof } from './prover';
import { verifyProof } from './verifier';
import type { QualityProofData, EconomicProofData, RouteProofData } from './prover';

// Example 1: Quality Proof
export function exampleQualityProof() {
  const qualityData: QualityProofData = {
    moistureLevel: 8.5,
    temperature: 5.2,
    sensorReadings: [5.1, 5.2, 5.3, 5.0, 5.1],
    batchId: 'BATCH-77CC98D7F066144B',
    stage: 'transport',
  };

  try {
    const proof = generateProof('quality', qualityData);
    console.log('Quality Proof Generated:', proof);
    
    const verification = verifyProof(proof);
    console.log('Verification Result:', verification);
    
    return { proof, verification };
  } catch (error: any) {
    console.error('Failed to generate quality proof:', error.message);
    return null;
  }
}

// Example 2: Economic Proof
export function exampleEconomicProof() {
  const economicData: EconomicProofData = {
    paymentAmount: 50000,
    totalQuantity: 1000,
    soldQuantity: 750,
    batchId: 'BATCH-77CC98D7F066144B',
    transactionId: 'TXN-ABC123XYZ',
  };

  try {
    const proof = generateProof('economic', economicData);
    console.log('Economic Proof Generated:', proof);
    
    const verification = verifyProof(proof);
    console.log('Verification Result:', verification);
    
    return { proof, verification };
  } catch (error: any) {
    console.error('Failed to generate economic proof:', error.message);
    return null;
  }
}

// Example 3: Route Proof
export function exampleRouteProof() {
  const routeData: RouteProofData = {
    gpsPoints: [
      { lat: 28.6139, lng: 77.2090, timestamp: 1705312800 }, // Delhi
      { lat: 28.6140, lng: 77.2091, timestamp: 1705312900 },
      { lat: 28.6141, lng: 77.2092, timestamp: 1705313000 },
      { lat: 19.0760, lng: 72.8777, timestamp: 1705316000 }, // Mumbai
    ],
    expectedRoute: 'Delhi to Mumbai',
    batchId: 'BATCH-77CC98D7F066144B',
  };

  try {
    const proof = generateProof('route', routeData);
    console.log('Route Proof Generated:', proof);
    
    const verification = verifyProof(proof);
    console.log('Verification Result:', verification);
    
    return { proof, verification };
  } catch (error: any) {
    console.error('Failed to generate route proof:', error.message);
    return null;
  }
}

// Example 4: Invalid Quality Proof (will fail)
export function exampleInvalidQualityProof() {
  const invalidData: QualityProofData = {
    moistureLevel: 15, // Too high (> 12%)
    temperature: 15, // Too high (> 10°C)
    sensorReadings: [5.1, 5.2, 5.3],
    batchId: 'BATCH-123',
    stage: 'transport',
  };

  try {
    const proof = generateProof('quality', invalidData);
    console.log('This should not print');
    return proof;
  } catch (error: any) {
    console.log('Expected error:', error.message);
    return null;
  }
}

// Run examples (uncomment to test)
// exampleQualityProof();
// exampleEconomicProof();
// exampleRouteProof();
// exampleInvalidQualityProof();


