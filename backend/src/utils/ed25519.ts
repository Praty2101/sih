import { createHash, randomBytes as cryptoRandomBytes } from 'crypto';

// Simplified Ed25519-like keypair generation (using crypto for demo)
export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export function generateKeyPair(): KeyPair {
  const seed = cryptoRandomBytes(32);
  const publicKey = createHash('sha256').update(seed).digest('hex');
  const privateKey = seed.toString('hex');
  return { publicKey, privateKey };
}

export function sign(message: string, privateKey: string): string {
  const data = message + privateKey;
  return createHash('sha256').update(data).digest('hex');
}


