# UNI-CHAIN Seed Data Documentation

## Overview

The seed dataset now includes **all registration values** that users provide during registration, ensuring complete data consistency and enabling full testing of all features.

## Complete Registration Data Included

### Farmers (5 users)

Each farmer includes:
- ✅ **Name** - Full name
- ✅ **Mobile Number** - 10-digit mobile (starting with 9)
- ✅ **Password** - `farmer123` (for testing)
- ✅ **ID Type** - Either `AADHAAR` or `PMKISAN`
- ✅ **ID Value** - 
  - Aadhaar: 12-digit number
  - PM-KISAN: 10-12 digit number
- ✅ **Business Name** - Farm/business name
- ✅ **Address** - Complete address
- ✅ **DID** - Generated Decentralized Identifier
- ✅ **Trust Score** - 85-95% (realistic range)

**Example:**
```json
{
  "role": "FARMER",
  "name": "Ram Kumar",
  "did": "did:unichain:farm-cb14f74cd8644b22",
  "mobile": "96687397295",
  "password": "farmer123",
  "idType": "AADHAAR",
  "idValue": "717546518565",
  "businessName": "Kumar Organic Farms",
  "address": "Village: Sonpur, District: Patna, Bihar"
}
```

### Transporters (3 users)

Each transporter includes:
- ✅ **Name** - Full name
- ✅ **Mobile Number** - 10-digit mobile (starting with 9)
- ✅ **Password** - `trans123` (for testing)
- ✅ **Vehicle RC** - Vehicle registration number (e.g., WB20AB1234)
- ✅ **Driver License** - DL + 13-digit number
- ✅ **GSTIN** - 15-character GSTIN (format: 2 state + 10 PAN + 1 entity + 1 check + 1 Z)
- ✅ **Company Name** - Transport company name
- ✅ **Address** - Complete address
- ✅ **Device ID** - GPS tracking device ID
- ✅ **DID** - Generated Decentralized Identifier
- ✅ **Trust Score** - 87% (realistic for transporters)

**Example:**
```json
{
  "role": "TRANSPORTER",
  "name": "Amit Logistics",
  "did": "did:unichain:trans-1c64e6ef03fa052c",
  "mobile": "95584855507",
  "password": "trans123",
  "vehicleRC": "WB20AB1234",
  "driverLicense": "DL2872320926124",
  "gstin": "21DFDHV9005L18Z",
  "companyName": "Amit Transport Services",
  "address": "NH-16, Bhubaneswar, Odisha",
  "deviceId": "device-9793"
}
```

### Retailers (3 users)

Each retailer includes:
- ✅ **Name** - Full name
- ✅ **Mobile Number** - 10-digit mobile (starting with 9)
- ✅ **Password** - `retail123` (for testing)
- ✅ **GSTIN** - 15-character GSTIN (format: 2 state + 10 PAN + 1 entity + 1 check + 1 Z)
- ✅ **PAN** - 10-character PAN (format: 5 letters + 4 digits + 1 letter)
- ✅ **Shop Name** - Retail shop/store name
- ✅ **Address** - Complete address
- ✅ **DID** - Generated Decentralized Identifier
- ✅ **Trust Score** - 89% (realistic for retailers)

**Example:**
```json
{
  "role": "RETAILER",
  "name": "FreshMart",
  "did": "did:unichain:retail-422973e98092107b",
  "mobile": "97702781146",
  "password": "retail123",
  "gstin": "27DJSSC5913Z14Z",
  "pan": "UQHWP6651M",
  "shopName": "FreshMart Supermarket",
  "address": "Shop 12, Main Market, Pune, Maharashtra"
}
```

## Data Format Validation

All generated values follow proper Indian government format requirements:

### Aadhaar
- Format: 12 digits
- Example: `717546518565`
- Validation: `/^\d{12}$/`

### PM-KISAN
- Format: 10-12 digits
- Example: `44129543644`
- Validation: `/^\d{10,12}$/`

### Mobile Number
- Format: 10 digits starting with 9
- Example: `96687397295`
- Validation: `/^9\d{9}$/`

### GSTIN
- Format: 15 characters
- Structure: `[2 state][10 PAN][1 entity][1 check][1 Z]`
- Example: `21DFDHV9005L18Z`
- Validation: `/^[0-9A-Z]{15}$/`

### PAN
- Format: 10 characters
- Structure: `[5 letters][4 digits][1 letter]`
- Example: `UQHWP6651M`
- Validation: `/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/`

### Driver License
- Format: DL + 13 digits
- Example: `DL2872320926124`
- Validation: `/^DL\d{13}$/`

### Vehicle RC
- Format: State code + district + series + number
- Example: `WB20AB1234`
- Validation: Non-empty string

## Storage & Encryption

All sensitive data is properly encrypted in the database:

- ✅ **Mobile Numbers** - Encrypted with AES-256-CBC, also hashed for login lookup
- ✅ **Aadhaar/PM-KISAN** - Encrypted with AES-256-CBC
- ✅ **GSTIN** - Encrypted with AES-256-CBC
- ✅ **PAN** - Encrypted with AES-256-CBC
- ✅ **Vehicle RC** - Encrypted with AES-256-CBC
- ✅ **Driver License** - Encrypted with AES-256-CBC
- ✅ **Passwords** - Hashed with bcrypt (10 rounds)

## Credentials File

All registration values are saved to `SEED_CREDENTIALS.json` in the backend directory for easy reference during testing.

**Location:** `/backend/SEED_CREDENTIALS.json`

This file contains:
- All mobile numbers (for login testing)
- All DIDs (for login testing)
- All ID values (Aadhaar, PM-KISAN)
- All GSTIN, PAN, Vehicle RC, Driver License values
- All passwords (for testing)
- Complete addresses and business details

## Testing Login

You can login using either:
1. **Mobile Number** + Password
2. **DID** + Password

**Passwords:**
- Farmers: `farmer123`
- Transporters: `trans123`
- Retailers: `retail123`

**Example Login:**
```json
{
  "identifier": "96687397295",  // or use DID
  "password": "farmer123"
}
```

## Re-seeding

To regenerate the dataset with new values:

```bash
cd backend
npm run seed
```

This will:
1. Clear all existing data
2. Generate new users with all registration values
3. Create 25 batches with full lifecycle
4. Generate ledger entries
5. Save credentials to `SEED_CREDENTIALS.json`

## Verification

To verify the seed data:

```bash
cd backend
npm run verify
```

This checks:
- ✅ Number of farmers, transporters, retailers
- ✅ Number of batches
- ✅ Number of economic ledger entries
- ✅ Number of quality ledger entries

## Data Consistency

All data is consistent across modules:
- ✅ Batch IDs match across ProduceLog, EconomicLedger, QualityLedger
- ✅ DIDs match across User, Ledger entries, ProduceLog
- ✅ Vehicle RC matches TransportVehicle and TransporterIdentity
- ✅ All financial amounts are mathematically consistent
- ✅ Dates form realistic timeline progression
- ✅ Hash chains are properly linked in both ledgers

## Support for All Features

The dataset supports:
- ✅ **Registration Flow** - All fields match registration requirements
- ✅ **Login Flow** - Mobile/DID + password authentication
- ✅ **Farmer Dashboard** - Batches, quantities, earnings, trust scores
- ✅ **Transporter Dashboard** - Assigned batches, routes, delivery metrics
- ✅ **Retailer Dashboard** - Stock, sales, revenue reports
- ✅ **Ledger Views** - Economic and Quality ledgers with all fields
- ✅ **Account Pages** - All user details with decrypted sensitive data
- ✅ **Traceability** - Full batch lifecycle from harvest to sale
- ✅ **Blockchain Simulation** - Hash chains in both ledgers


