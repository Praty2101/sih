# UNI-CHAIN Database Seed Summary

## ✅ Successfully Seeded Database

The database has been populated with a complete dummy dataset for the UNI-CHAIN blockchain-based supply transparency system.

## 📊 Dataset Overview

### Users Created

#### Farmers (5)
1. **Ram Kumar** - Kumar Organic Farms (Trust Score: 92%)
   - Location: Village: Sonpur, District: Patna, Bihar
   - DID: `did:unichain:farm-*`

2. **Shyam Singh** - Singh Agro Products (Trust Score: 88%)
   - Location: Village: Madhubani, District: Madhubani, Bihar
   - DID: `did:unichain:farm-*`

3. **Mohan Das** - Das Natural Farming (Trust Score: 95%)
   - Location: Village: Gaya, District: Gaya, Bihar
   - DID: `did:unichain:farm-*`

4. **Suresh Yadav** - Yadav Fresh Produce (Trust Score: 85%)
   - Location: Village: Muzaffarpur, District: Muzaffarpur, Bihar
   - DID: `did:unichain:farm-*`

5. **Rajesh Patel** - Patel Green Farms (Trust Score: 90%)
   - Location: Village: Bhagalpur, District: Bhagalpur, Bihar
   - DID: `did:unichain:farm-*`

#### Transporters (3)
1. **Amit Logistics** - Amit Transport Services
   - Vehicle: WB20AB1234
   - Location: NH-16, Bhubaneswar, Odisha

2. **Kumar Freight** - Kumar Logistics Pvt Ltd
   - Vehicle: BR01CD5678
   - Location: NH-19, Patna, Bihar

3. **Express Cargo** - Express Cargo Solutions
   - Vehicle: DL05EF9012
   - Location: NH-44, Delhi NCR

#### Retailers (3)
1. **FreshMart** - FreshMart Supermarket
   - Location: Shop 12, Main Market, Pune, Maharashtra

2. **Green Grocers** - Green Grocers Store
   - Location: Mall Road, Patna, Bihar

3. **Farm Fresh** - Farm Fresh Outlet
   - Location: Connaught Place, New Delhi

### Produce Batches (25)

Each batch includes:
- **Unique Batch ID** (e.g., `BATCH-77CC98D7F066144B`)
- **Product Name** (Tomatoes, Wheat, Rice, Potatoes, Onions, Mangoes, Bananas, Cabbage, Cauliflower, Carrots)
- **Variety** (e.g., Cherry Tomato, IR-64, Basmati 1121, Kesar Mango)
- **Quantity** (100-600 kg or 10-60 quintals)
- **Unit** (kg, quintal)
- **Farming Method** (organic, natural, conventional, integrated)
- **Harvest Date** (spread over last 30 days)
- **Selling Price** (₹20-50 per kg or ₹3000-5000 per quintal)
- **Status Distribution**:
  - Registered: ~6 batches
  - In Transit: ~6 batches
  - Delivered: ~6 batches
  - Sold: ~7 batches

### Ledger Entries

#### Economic Ledger (77 entries)
Each batch generates multiple economic transactions:
1. **FARMER_REGISTER** - Initial batch registration
2. **TRANSPORT_PICKUP** - Farmer pays transporter (if in transit or beyond)
3. **TRANSPORT_DROPOFF** - Handover to retailer (if delivered or sold)
4. **RETAILER_RECEIVE** - Retailer receives batch (if delivered or sold)
5. **RETAILER_SALE** - Final sale to consumer (if sold)

#### Quality Ledger (76 entries)
Each batch generates quality checkpoints:
1. **Harvest Stage** - Initial quality check (Quality Score: 85-100)
2. **Sorting Stage** - Post-harvest sorting (Quality Score: 80-95)
3. **Transport Stage** - During transportation (Quality Score: 75-90, Temp: 4-12°C)
4. **Retail Stage** - At retailer location (Quality Score: 70-90)

Each quality entry includes:
- Quality Score (0-100)
- Moisture Level (%)
- Temperature (°C)
- Spoilage Detected (Boolean)
- AI Verification Hash
- IoT Merkle Root

## 🔗 Data Relationships

- All batches are linked to farmers via `farmerDid`
- Batches in transit/delivered/sold are linked to transporters via `transporterDid`
- Batches delivered/sold are linked to retailers via `retailerDid`
- All ledger entries are chained via `prevTxHash` → `txHash` (blockchain simulation)
- Economic and Quality ledgers are separate but both reference `batchId`

## 📱 Dashboard Support

### Farmer Dashboard
- ✅ Total batches this month: 25 batches
- ✅ Total quantity: Sum of all batch quantities
- ✅ Total amount earned: Calculated from sales
- ✅ Trust score trend: Individual trust scores (85-95%)
- ✅ Recent produce list: All 25 batches with status

### Transporter Dashboard
- ✅ Batches assigned: Batches in transit/delivered/sold
- ✅ Delivery efficiency: Based on transport times
- ✅ Average spoilage: Calculated from quality ledger
- ✅ Route metrics: GPS checkpoints and distances

### Retailer Dashboard
- ✅ Stock in hand: Batches delivered but not fully sold
- ✅ Sales per product: From RETAILER_SALE transactions
- ✅ Fastest moving items: Based on sale dates
- ✅ Revenue reports: From economic ledger sales

### Ledger/Blockchain View
- ✅ Economic Ledger: All 77 transactions with filters
- ✅ Quality Ledger: All 76 quality checkpoints with filters
- ✅ Blockchain chaining: All transactions linked via hash chain
- ✅ Batch traceability: Full lifecycle from harvest to sale

## 🚀 Usage

### View Data in Prisma Studio
```bash
cd backend
npm run prisma:studio
```
Visit http://localhost:5555

### Re-seed Database
```bash
cd backend
npm run seed
```

### Login Credentials (for testing)
- **Farmers**: Use any farmer DID or mobile number, password: `farmer123`
- **Transporters**: Use any transporter DID or mobile number, password: `trans123`
- **Retailers**: Use any retailer DID or mobile number, password: `retail123`

## 📝 Notes

- All sensitive data (mobile, Aadhaar, GSTIN, PAN, Vehicle RC) is encrypted using AES-256-CBC
- Mobile numbers are hashed for login lookup
- Trust scores are realistic (85-95% for farmers, 87% for transporters, 89% for retailers)
- Dates form a realistic timeline: harvest → pickup → dropoff → receive → sale
- All financial amounts are in INR (Indian Rupees)
- Quality scores decrease slightly through the supply chain (harvest: 85-100, retail: 70-90)
- Temperature logs follow cold chain requirements (4-12°C during transport)

## ✅ Data Consistency

- ✅ Batch IDs match across all modules
- ✅ Ledger entries correctly reference batchId
- ✅ Transport logs reference valid transporterDid
- ✅ Retail sales reference valid retailerDid
- ✅ Revenue, cost, and sales numbers are mathematically consistent
- ✅ Dates form realistic timeline progression
- ✅ Hash chains are properly linked (prevTxHash → txHash)


