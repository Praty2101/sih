# UNI-CHAIN - Blockchain-based Supply Transparency for Agricultural Produce

A full-stack blockchain-based supply chain transparency system for agricultural produce, built for SIH (Smart India Hackathon).

## Features

- **DID-based Identity**: Decentralized identifiers for all participants
- **Dual Ledger System**: Separate Economic and Quality ledgers with blockchain-like chaining
- **Trust Score Engine**: EMA-based trust scoring system
- **Price Cap Rules**: 20% price cap validation based on reference datasets
- **ZKP Simulation**: Zero-knowledge proof verification simulation
- **GPS Tracking**: Dummy GPS tracking for transport vehicles
- **Traceability**: Complete supply chain traceability from farmer to consumer
- **Role-based Dashboards**: Separate dashboards for Farmer, Transporter, Retailer, Consumer, and Admin

## Tech Stack

### Backend
- Node.js + TypeScript
- Express.js
- PostgreSQL (via Prisma ORM)
- JWT Authentication
- bcryptjs for password hashing
- Crypto for encryption and key generation

### Frontend
- React + TypeScript
- Vite
- React Router
- Tailwind CSS
- Axios for API calls

## Project Structure

```
sih/
├── backend/
│   ├── src/
│   │   ├── config/          # Database configuration
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Auth middleware
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic services
│   │   ├── utils/           # Utility functions
│   │   └── server.ts        # Express server
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API service functions
│   │   ├── types/           # TypeScript types
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/unichain?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
MASTER_KEY="your-32-byte-master-key-for-encryption-change-this"
PORT=3001
NODE_ENV=development
```

**Important**: Replace the database credentials with your PostgreSQL credentials.

4. Create the PostgreSQL database:
```bash
createdb unichain
```

5. Generate Prisma client:
```bash
npm run prisma:generate
```

6. Run database migrations:
```bash
npm run prisma:migrate
```

7. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:3001`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Usage

### Registration

1. **Farmer Registration**:
   - Navigate to `/register/farmer`
   - Fill in PM-KISAN or Aadhaar ID, mobile, name, business name, and address
   - Default password: `default123`

2. **Transporter Registration**:
   - Navigate to `/register/transporter`
   - Fill in Vehicle RC, Driver License, GSTIN, mobile, name, company name, and address
   - Default password: `default123`

3. **Retailer Registration**:
   - Navigate to `/register/retailer`
   - Fill in GSTIN, PAN, mobile, name, shop name, and address
   - Default password: `default123`

4. **Consumer Registration**:
   - Navigate to `/register/consumer`
   - Fill in mobile, name, and address
   - Default password: `default123`

### Login

- Navigate to `/login`
- Use your DID or mobile number and password (`default123`)
- Optionally select your role

### Features by Role

#### Farmer
- View identity and trust score
- Create batch events with quality information (moisture, freshness, on-time delivery)

#### Transporter
- View identity and trust score
- Update shipment quality (route status, temperature, on-time delivery)
- GPS tracking (dummy data)

#### Retailer
- View identity and trust score
- Record sales with commodity and pricing
- Price cap validation (20% above average price)

#### Consumer
- View identity and trust score
- Track products by batch ID
- View supply chain traceability
- View GPS tracks

#### Admin
- View system overview (role statistics, ZKP verifications, anomalies)
- View all trust scores
- View all anomalies (price cap violations, ZKP failures)

### API Endpoints

#### Public Endpoints
- `POST /api/register/farmer` - Register farmer
- `POST /api/register/transporter` - Register transporter
- `POST /api/register/retailer` - Register retailer
- `POST /api/register/consumer` - Register consumer
- `POST /api/login` - Login
- `GET /api/identity/:did` - Get identity by DID
- `GET /api/trace/:batchId` - Trace batch
- `GET /api/gps/:deviceId` - Get GPS track

#### Protected Endpoints (require JWT)
- `GET /api/me` - Get current user
- `POST /api/batch/event` - Create batch event
- `POST /api/zkp/verify` - Verify ZKP proof

#### Admin Endpoints (require JWT)
- `GET /api/admin/overview` - Get system overview
- `GET /api/admin/trust-scores` - Get all trust scores
- `GET /api/admin/anomalies` - Get all anomalies

## Database Schema

### Key Models
- **User**: Core user model with DID, role, trust score
- **FarmerIdentity**: Encrypted farmer-specific data
- **TransporterIdentity**: Encrypted transporter-specific data
- **RetailerIdentity**: Encrypted retailer-specific data
- **EconomicLedgerTx**: Economic transactions with blockchain-like chaining
- **QualityLedgerTx**: Quality data with blockchain-like chaining
- **ZkpLog**: ZKP verification logs
- **Anomaly**: Anomaly records (price cap violations, ZKP failures)

## Mock Data & Verification

All external API verifications are mocked:
- PM-KISAN: Accepts 10-12 digit numbers
- Aadhaar: Accepts 12 digit numbers
- GSTIN: Accepts 15 alphanumeric characters
- PAN: Accepts format `AAAAA1234A`
- Vehicle RC: Accepts any non-empty string

## Price Cap Rules

The system includes a price dataset for common commodities:
- POTATO: [15, 16, 14, 17, 16] (avg: 15.6)
- ONION: [18, 19, 20, 21, 19] (avg: 19.4)
- TOMATO: [12, 11, 13, 12, 14] (avg: 12.4)
- WHEAT: [25, 26, 24, 27, 25] (avg: 25.4)
- RICE: [30, 31, 29, 32, 30] (avg: 30.4)

Retailers cannot set prices more than 20% above the average. Violations are logged as anomalies.

## Trust Score Calculation

Trust scores use an Exponential Moving Average (EMA) formula:
```
newScore = alpha * latestMetric + (1 - alpha) * oldScore
```

Default alpha: 0.3

Quality scores are computed based on:
- Moisture levels (optimal: 60-70%)
- Freshness (0-1 scale)
- On-time delivery (0-1 scale)

## GPS Tracking

GPS tracking uses dummy data stored in `backend/src/utils/gps.ts`. Device IDs are assigned during transporter registration.

## Development

### Backend Development
```bash
cd backend
npm run dev  # Runs with tsx watch mode
```

### Frontend Development
```bash
cd frontend
npm run dev  # Runs Vite dev server
```

### Database Management
```bash
cd backend
npm run prisma:studio  # Opens Prisma Studio for database inspection
```

## Production Build

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
npm run preview
```

## Security Notes

⚠️ **Important**: This is a demo project. For production use:
- Change all default passwords
- Use strong JWT secrets
- Use proper encryption keys (32 bytes)
- Implement proper password policies
- Add rate limiting
- Use HTTPS
- Implement proper error handling
- Add input validation and sanitization

## License

This project is built for SIH (Smart India Hackathon) demonstration purposes.

## Support

For issues or questions, please refer to the project documentation or contact the development team.


# SIH
