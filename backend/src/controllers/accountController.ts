import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { decrypt } from '../utils/crypto';

export async function getAccountDetails(req: any, res: Response) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: {
        farmerIdentity: true,
        transporterIdentity: true,
        retailerIdentity: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Decrypt sensitive data
    const accountData: any = {
      id: user.id,
      did: user.did,
      role: user.role,
      name: user.name,
      trustScore: user.trustScore,
      status: user.status,
      createdAt: user.createdAt,
      publicKey: user.publicKey,
    };

    // Decrypt mobile
    try {
      accountData.mobile = decrypt(user.encMobile);
    } catch (e) {
      accountData.mobile = 'N/A';
    }

    // Add role-specific identity data
    if (user.role === 'FARMER' && user.farmerIdentity) {
      accountData.businessName = user.farmerIdentity.businessName;
      accountData.address = user.farmerIdentity.address;
      try {
        if (user.farmerIdentity.encPmKisan) {
          accountData.pmKisan = decrypt(user.farmerIdentity.encPmKisan);
        }
        if (user.farmerIdentity.encAadhaar) {
          accountData.aadhaar = decrypt(user.farmerIdentity.encAadhaar);
        }
      } catch (e) {
        // Decryption failed
      }
    } else if (user.role === 'TRANSPORTER' && user.transporterIdentity) {
      accountData.companyName = user.transporterIdentity.companyName;
      accountData.address = user.transporterIdentity.address;
      try {
        accountData.vehicleRC = decrypt(user.transporterIdentity.encVehicleRC);
        accountData.driverLicense = decrypt(user.transporterIdentity.encDriverLicense);
        accountData.gstin = decrypt(user.transporterIdentity.encGstin);
      } catch (e) {
        // Decryption failed
      }
    } else if (user.role === 'RETAILER' && user.retailerIdentity) {
      accountData.shopName = user.retailerIdentity.shopName;
      accountData.address = user.retailerIdentity.address;
      try {
        accountData.gstin = decrypt(user.retailerIdentity.encGstin);
        accountData.pan = decrypt(user.retailerIdentity.encPan);
      } catch (e) {
        // Decryption failed
      }
    }

    res.json(accountData);
  } catch (error: any) {
    console.error('Account details error:', error);
    return res.status(500).json({ error: 'Failed to fetch account details' });
  }
}

