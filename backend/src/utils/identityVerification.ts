// Mock identity verification functions

export async function verifyPMKISAN(idValue: string): Promise<boolean> {
  // Mock: accept if non-empty and matches pattern
  return /^\d{10,12}$/.test(idValue);
}

export async function verifyAadhaar(idValue: string): Promise<boolean> {
  // Mock: accept if 12 digits
  return /^\d{12}$/.test(idValue);
}

export async function verifyGSTIN(gstin: string): Promise<boolean> {
  // Mock: accept if 15 characters
  return /^[0-9A-Z]{15}$/.test(gstin);
}

export async function verifyPAN(pan: string): Promise<boolean> {
  // Mock: accept if matches PAN format
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);
}

export async function verifyVehicleRC(rc: string): Promise<boolean> {
  // Mock: accept if non-empty
  return rc.length > 0;
}


