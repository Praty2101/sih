# UNI-CHAIN Zero-Knowledge Proof (ZKP) Module

A complete Zero-Knowledge Proof system for supply chain transparency without revealing sensitive data.

## Overview

This module implements a mock zk-SNARK style ZKP system that allows provers to demonstrate that certain conditions are true without revealing the underlying private data. All proofs generate a `proofHash` that can be stored in the Quality Ledger or Economic Ledger.

## Architecture

### Core Components

1. **zkpUtils.ts** - Cryptographic utilities and helper functions
2. **prover.ts** - Proof generation for different use cases
3. **verifier.ts** - Proof verification without accessing private data
4. **zkpController.ts** - Express API endpoints

## Use Cases

### 1. Quality Ledger Proofs

Proves that quality conditions are satisfied:
- Moisture level < 12%
- Temperature between 2°C and 10°C
- No sensor tampering (consistent sensor readings)

**Example:**
```typescript
const qualityData = {
  moistureLevel: 8.5,
  temperature: 5.2,
  sensorReadings: [5.1, 5.2, 5.3, 5.0],
  batchId: 'BATCH-123',
  stage: 'transport'
};

const proof = generateQualityProof(qualityData);
```

### 2. Economic Ledger Proofs

Proves economic conditions without revealing payment details:
- Payment transaction exists
- Sold quantity ≤ total quantity

**Example:**
```typescript
const economicData = {
  paymentAmount: 50000,
  totalQuantity: 1000,
  soldQuantity: 750,
  batchId: 'BATCH-123',
  transactionId: 'TXN-456'
};

const proof = generateEconomicProof(economicData);
```

### 3. Route Ledger Proofs

Proves route validity without sharing full GPS path:
- Route is valid (sequential GPS points)
- Reasonable distance
- No backtracking

**Example:**
```typescript
const routeData = {
  gpsPoints: [
    { lat: 28.6139, lng: 77.2090, timestamp: 1234567890 },
    { lat: 28.6140, lng: 77.2091, timestamp: 1234567900 },
    { lat: 28.6141, lng: 77.2092, timestamp: 1234567910 }
  ],
  expectedRoute: 'Delhi to Mumbai',
  batchId: 'BATCH-123'
};

const proof = generateRouteProof(routeData);
```

## Proof Structure

All proofs follow this structure:

```typescript
{
  claim: "Quality conditions satisfied: moisture < 12%, temperature 2-10°C, no sensor tampering",
  privateInputsHash: "sha256 hash of private inputs",
  publicInputs: {
    batchId: "BATCH-123",
    stage: "transport",
    moistureThreshold: 12,
    tempMin: 2,
    tempMax: 10,
    // ... other public data
  },
  timestamp: "2024-01-15T10:30:00.000Z",
  proof: "mock-proof-string (64 chars)",
  proofHash: "sha256 hash of entire proof"
}
```

## API Endpoints

### POST /api/zkp/generate

Generate a new ZKP proof.

**Request:**
```json
{
  "type": "quality",
  "data": {
    "moistureLevel": 8.5,
    "temperature": 5.2,
    "sensorReadings": [5.1, 5.2, 5.3],
    "batchId": "BATCH-123",
    "stage": "transport"
  }
}
```

**Response:**
```json
{
  "success": true,
  "proof": {
    "claim": "...",
    "privateInputsHash": "...",
    "publicInputs": {...},
    "timestamp": "...",
    "proof": "...",
    "proofHash": "..."
  },
  "zkpLogId": "clx...",
  "message": "ZKP proof generated successfully"
}
```

### POST /api/zkp/verify

Verify an existing ZKP proof.

**Request:**
```json
{
  "proof": {
    "claim": "...",
    "privateInputsHash": "...",
    "publicInputs": {...},
    "timestamp": "...",
    "proof": "...",
    "proofHash": "..."
  },
  "did": "did:unichain:farm-...",
  "batchId": "BATCH-123"
}
```

**Response:**
```json
{
  "verified": true,
  "message": "Quality proof verified successfully...",
  "details": {
    "batchId": "BATCH-123",
    "stage": "transport"
  },
  "zkpLogId": "clx..."
}
```

## Security Features

1. **Hash Chaining**: Proof hash is computed from the entire proof object
2. **Private Inputs Protection**: Private data is hashed and never revealed
3. **Proof Integrity**: Proof hash validation ensures proof hasn't been tampered with
4. **Merkle Roots**: IoT sensor data integrity verified via Merkle roots
5. **Constraint Validation**: All conditions are verified before proof generation

## Integration with Ledgers

Proofs can be stored in:

1. **Quality Ledger**: Store `proofHash` in `qualityData` field
2. **Economic Ledger**: Store `proofHash` in `meta` field
3. **ZKP Log**: All proofs are automatically logged in `ZkpLog` table

## Error Handling

The system will throw errors if:
- Conditions are not satisfied (cannot generate proof)
- Proof structure is invalid
- Proof hash validation fails
- Required data is missing

## Future Enhancements

- Real zk-SNARK implementation (using libraries like snarkjs)
- Batch proof generation
- Proof aggregation
- Cross-ledger proof verification
- Proof expiration and renewal


