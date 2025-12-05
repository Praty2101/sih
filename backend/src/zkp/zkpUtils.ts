import { createHash } from 'crypto';

/**
 * ZKP Utility Functions
 * Provides cryptographic hashing and helper functions for Zero-Knowledge Proofs
 */

/**
 * Generate SHA-256 hash of any data
 */
export function hash(data: string | object): string {
  const dataString = typeof data === 'string' ? data : JSON.stringify(data);
  return createHash('sha256').update(dataString).digest('hex');
}

/**
 * Generate Merkle root from an array of values
 * Simulates Merkle tree construction for IoT data integrity
 */
export function generateMerkleRoot(values: (string | number)[]): string {
  if (values.length === 0) return hash('empty');
  if (values.length === 1) return hash(String(values[0]));

  const hashedValues = values.map(v => hash(String(v)));
  
  // Simple binary tree construction
  let currentLevel = hashedValues;
  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      if (i + 1 < currentLevel.length) {
        nextLevel.push(hash(currentLevel[i] + currentLevel[i + 1]));
      } else {
        nextLevel.push(hash(currentLevel[i] + currentLevel[i]));
      }
    }
    currentLevel = nextLevel;
  }
  
  return currentLevel[0];
}

/**
 * Hash private inputs to create a commitment
 * This ensures private data is not revealed but can be verified
 */
export function hashPrivateInputs(inputs: Record<string, any>): string {
  // Sort keys for deterministic hashing
  const sortedKeys = Object.keys(inputs).sort();
  const sortedInputs = sortedKeys.map(key => `${key}:${inputs[key]}`).join('|');
  return hash(sortedInputs);
}

/**
 * Generate a proof hash from the complete proof object
 * This is what gets stored in the ledger
 */
export function generateProofHash(proof: any): string {
  // Create a deterministic representation of the proof
  const proofData = {
    claim: proof.claim,
    privateInputsHash: proof.privateInputsHash,
    publicInputs: proof.publicInputs,
    timestamp: proof.timestamp,
    proof: proof.proof,
  };
  return hash(proofData);
}

/**
 * Validate that a proof hash matches the proof object
 */
export function validateProofHash(proof: any, expectedHash: string): boolean {
  const computedHash = generateProofHash(proof);
  return computedHash === expectedHash;
}

/**
 * Generate a mock cryptographic proof string
 * In a real system, this would be a complex zk-SNARK proof
 */
export function generateMockProof(
  privateInputs: Record<string, any>,
  publicInputs: Record<string, any>,
  claim: string
): string {
  // Simulate a zk-SNARK style proof
  const proofComponents = [
    hashPrivateInputs(privateInputs),
    hash(JSON.stringify(publicInputs)),
    hash(claim),
    hash(Date.now().toString()),
  ];
  
  // Combine components to create a "proof"
  const proofString = proofComponents.join('::');
  return hash(proofString).substring(0, 64); // Return first 64 chars as "proof"
}

/**
 * Create a timestamp in ISO format
 */
export function getTimestamp(): string {
  return new Date().toISOString();
}


