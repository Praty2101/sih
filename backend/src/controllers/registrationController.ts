import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { generateKeyPair } from '../utils/ed25519';
import { generateDID, encrypt, generateMnemonic, hashMobile } from '../utils/crypto';
import {
  verifyPMKISAN,
  verifyAadhaar,
  verifyGSTIN,
  verifyPAN,
  verifyVehicleRC,
} from '../utils/identityVerification';
import { appendEconomicTx } from '../services/ledger';

export async function registerFarmer(req: Request, res: Response) {
  try {
    const { idType, idValue, mobile, name, businessName, address, password } = req.body;

    // Validate required fields
    if (!idType || !idValue || !mobile || !name || !businessName || !address || !password) {
      return res.status(400).json({ error: 'All fields including password are required' });
    }

    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Normalize idType to uppercase
    const normalizedIdType = idType?.toUpperCase();

    if (normalizedIdType !== 'PMKISAN' && normalizedIdType !== 'AADHAAR') {
      return res.status(400).json({ error: 'Invalid ID type. Please select PM-KISAN or Aadhaar.' });
    }

    let verified = false;
    if (normalizedIdType === 'PMKISAN') {
      verified = await verifyPMKISAN(idValue);
    } else if (normalizedIdType === 'AADHAAR') {
      verified = await verifyAadhaar(idValue);
    }

    if (!verified) {
      return res.status(400).json({ 
        error: `Identity verification failed. ${normalizedIdType === 'AADHAAR' ? 'Aadhaar must be exactly 12 digits.' : 'PM-KISAN must be 10-12 digits.'}` 
      });
    }

    const keyPair = generateKeyPair();
    const did = generateDID('farm', keyPair.publicKey);
    const encMobile = encrypt(mobile);
    const mobileHash = hashMobile(mobile);
    const encIdValue = encrypt(idValue);
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        role: 'FARMER',
        did,
        publicKey: keyPair.publicKey,
        encMobile,
        mobileHash,
        name,
        trustScore: 0.5,
        status: 'ACTIVE',
        passwordHash,
        farmerIdentity: {
          create: {
            encPmKisan: normalizedIdType === 'PMKISAN' ? encIdValue : null,
            encAadhaar: normalizedIdType === 'AADHAAR' ? encIdValue : null,
            name,
            businessName,
            address,
          },
        },
      },
    });

    await appendEconomicTx({
      batchId: `register-${user.id}`,
      payerDid: did,
      meta: { type: 'REGISTER_FARMER', name, businessName },
    });

    const mnemonic = generateMnemonic();

    res.json({
      did,
      publicKey: keyPair.publicKey,
      trustScore: user.trustScore,
      mnemonic,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ 
      error: error.message || 'Registration failed. Please check your database connection and try again.' 
    });
  }
}

export async function registerTransporter(req: Request, res: Response) {
  try {
    const { vehicleRC, driverLicense, gstin, mobile, name, companyName, address, password } = req.body;

    if (!vehicleRC || !driverLicense || !gstin || !mobile || !name || !companyName || !address || !password) {
      return res.status(400).json({ error: 'All fields including password are required' });
    }

    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const gstinValid = await verifyGSTIN(gstin);
    const rcValid = await verifyVehicleRC(vehicleRC);

    if (!gstinValid || !rcValid) {
      return res.status(400).json({ error: 'Identity verification failed. Please check your GSTIN and Vehicle RC format.' });
    }

    // Check if vehicle already exists
    const existingVehicle = await prisma.transportVehicle.findUnique({
      where: { vehicleNo: vehicleRC },
    });

    if (existingVehicle) {
      return res.status(400).json({ 
        error: 'This vehicle RC is already registered. Please use a different vehicle or contact support if this is your vehicle.' 
      });
    }

    // Check if mobile number is already registered
    const mobileHash = hashMobile(mobile);
    const existingUser = await prisma.user.findFirst({
      where: { mobileHash },
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: 'This mobile number is already registered. Please use a different mobile number or login with your existing account.' 
      });
    }

    const keyPair = generateKeyPair();
    const did = generateDID('trans', keyPair.publicKey);
    const encMobile = encrypt(mobile);
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        role: 'TRANSPORTER',
        did,
        publicKey: keyPair.publicKey,
        encMobile,
        mobileHash,
        name,
        trustScore: 0.5,
        status: 'ACTIVE',
        passwordHash,
        transporterIdentity: {
          create: {
            encVehicleRC: encrypt(vehicleRC),
            encDriverLicense: encrypt(driverLicense),
            encGstin: encrypt(gstin),
            name,
            companyName,
            address,
          },
        },
      },
    });

    // Generate a unique deviceId
    let deviceId: string = '';
    let deviceExists = true;
    while (deviceExists) {
      deviceId = `device-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`;
      const existingDevice = await prisma.transportVehicle.findUnique({
        where: { deviceId },
      });
      if (!existingDevice) {
        deviceExists = false;
      }
    }

    await prisma.transportVehicle.create({
      data: {
        vehicleNo: vehicleRC,
        deviceId: deviceId!,
        transporterUserId: user.id,
      },
    });

    await appendEconomicTx({
      batchId: `register-${user.id}`,
      payerDid: did,
      meta: { type: 'REGISTER_TRANSPORTER', name, companyName },
    });

    res.json({
      did,
      publicKey: keyPair.publicKey,
      trustScore: user.trustScore,
      deviceId,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ 
      error: error.message || 'Registration failed. Please check your database connection and try again.' 
    });
  }
}

export async function registerRetailer(req: Request, res: Response) {
  try {
    const { gstin, pan, mobile, name, shopName, address, password } = req.body;

    if (!gstin || !pan || !mobile || !name || !shopName || !address || !password) {
      return res.status(400).json({ error: 'All fields including password are required' });
    }

    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const gstinValid = await verifyGSTIN(gstin);
    const panValid = await verifyPAN(pan);

    if (!gstinValid || !panValid) {
      return res.status(400).json({ error: 'Identity verification failed. Please check your GSTIN and PAN format.' });
    }

    const keyPair = generateKeyPair();
    const did = generateDID('retail', keyPair.publicKey);
    const encMobile = encrypt(mobile);
    const mobileHash = hashMobile(mobile);
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        role: 'RETAILER',
        did,
        publicKey: keyPair.publicKey,
        encMobile,
        mobileHash,
        name,
        trustScore: 0.5,
        status: 'ACTIVE',
        passwordHash,
        retailerIdentity: {
          create: {
            encGstin: encrypt(gstin),
            encPan: encrypt(pan),
            name,
            shopName,
            address,
          },
        },
      },
    });

    await appendEconomicTx({
      batchId: `register-${user.id}`,
      payerDid: did,
      meta: { type: 'REGISTER_RETAILER', name, shopName },
    });

    res.json({
      did,
      publicKey: keyPair.publicKey,
      trustScore: user.trustScore,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ 
      error: error.message || 'Registration failed. Please check your database connection and try again.' 
    });
  }
}

export async function registerConsumer(req: Request, res: Response) {
  try {
    const { mobile, name, address, password } = req.body;

    if (!mobile || !name || !address || !password) {
      return res.status(400).json({ error: 'All fields including password are required' });
    }

    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const keyPair = generateKeyPair();
    const did = generateDID('cons', keyPair.publicKey);
    const encMobile = encrypt(mobile);
    const mobileHash = hashMobile(mobile);
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        role: 'CONSUMER',
        did,
        publicKey: keyPair.publicKey,
        encMobile,
        mobileHash,
        name,
        trustScore: 0.5,
        status: 'ACTIVE',
        passwordHash,
      },
    });

    res.json({
      did,
      publicKey: keyPair.publicKey,
      trustScore: user.trustScore,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ 
      error: error.message || 'Registration failed. Please check your database connection and try again.' 
    });
  }
}

