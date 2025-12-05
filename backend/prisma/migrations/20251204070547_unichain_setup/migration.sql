-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "did" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "encMobile" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "trustScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FarmerIdentity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "encPan" TEXT,
    "encGstin" TEXT,
    "encPmKisan" TEXT,
    "encAadhaar" TEXT,
    "businessName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FarmerIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransporterIdentity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "encVehicleRC" TEXT NOT NULL,
    "encDriverLicense" TEXT NOT NULL,
    "encGstin" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransporterIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetailerIdentity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "encGstin" TEXT NOT NULL,
    "encPan" TEXT NOT NULL,
    "shopName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RetailerIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportVehicle" (
    "id" TEXT NOT NULL,
    "vehicleNo" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "transporterUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransportVehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EconomicLedgerTx" (
    "id" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "prevTxHash" TEXT,
    "ledgerType" TEXT NOT NULL DEFAULT 'ECONOMIC',
    "batchId" TEXT,
    "shipmentId" TEXT,
    "payerDid" TEXT,
    "payeeDid" TEXT,
    "amount" DOUBLE PRECISION,
    "margin" DOUBLE PRECISION,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EconomicLedgerTx_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QualityLedgerTx" (
    "id" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "prevTxHash" TEXT,
    "ledgerType" TEXT NOT NULL DEFAULT 'QUALITY',
    "batchId" TEXT,
    "shipmentId" TEXT,
    "actorDid" TEXT,
    "qualityData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QualityLedgerTx_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ZkpLog" (
    "id" TEXT NOT NULL,
    "did" TEXT NOT NULL,
    "batchId" TEXT,
    "proofType" TEXT NOT NULL,
    "proofPayload" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ZkpLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Anomaly" (
    "id" TEXT NOT NULL,
    "batchId" TEXT,
    "did" TEXT,
    "anomalyType" TEXT NOT NULL,
    "details" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Anomaly_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_did_key" ON "User"("did");

-- CreateIndex
CREATE INDEX "User_did_idx" ON "User"("did");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "FarmerIdentity_userId_key" ON "FarmerIdentity"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TransporterIdentity_userId_key" ON "TransporterIdentity"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RetailerIdentity_userId_key" ON "RetailerIdentity"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TransportVehicle_vehicleNo_key" ON "TransportVehicle"("vehicleNo");

-- CreateIndex
CREATE UNIQUE INDEX "TransportVehicle_deviceId_key" ON "TransportVehicle"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "EconomicLedgerTx_txHash_key" ON "EconomicLedgerTx"("txHash");

-- CreateIndex
CREATE INDEX "EconomicLedgerTx_batchId_idx" ON "EconomicLedgerTx"("batchId");

-- CreateIndex
CREATE INDEX "EconomicLedgerTx_payerDid_idx" ON "EconomicLedgerTx"("payerDid");

-- CreateIndex
CREATE INDEX "EconomicLedgerTx_payeeDid_idx" ON "EconomicLedgerTx"("payeeDid");

-- CreateIndex
CREATE INDEX "EconomicLedgerTx_txHash_idx" ON "EconomicLedgerTx"("txHash");

-- CreateIndex
CREATE UNIQUE INDEX "QualityLedgerTx_txHash_key" ON "QualityLedgerTx"("txHash");

-- CreateIndex
CREATE INDEX "QualityLedgerTx_batchId_idx" ON "QualityLedgerTx"("batchId");

-- CreateIndex
CREATE INDEX "QualityLedgerTx_actorDid_idx" ON "QualityLedgerTx"("actorDid");

-- CreateIndex
CREATE INDEX "QualityLedgerTx_txHash_idx" ON "QualityLedgerTx"("txHash");

-- CreateIndex
CREATE INDEX "ZkpLog_did_idx" ON "ZkpLog"("did");

-- CreateIndex
CREATE INDEX "ZkpLog_batchId_idx" ON "ZkpLog"("batchId");

-- CreateIndex
CREATE INDEX "ZkpLog_proofType_idx" ON "ZkpLog"("proofType");

-- CreateIndex
CREATE INDEX "Anomaly_batchId_idx" ON "Anomaly"("batchId");

-- CreateIndex
CREATE INDEX "Anomaly_did_idx" ON "Anomaly"("did");

-- CreateIndex
CREATE INDEX "Anomaly_anomalyType_idx" ON "Anomaly"("anomalyType");

-- AddForeignKey
ALTER TABLE "FarmerIdentity" ADD CONSTRAINT "FarmerIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransporterIdentity" ADD CONSTRAINT "TransporterIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetailerIdentity" ADD CONSTRAINT "RetailerIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EconomicLedgerTx" ADD CONSTRAINT "EconomicLedgerTx_payerDid_fkey" FOREIGN KEY ("payerDid") REFERENCES "User"("did") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityLedgerTx" ADD CONSTRAINT "QualityLedgerTx_actorDid_fkey" FOREIGN KEY ("actorDid") REFERENCES "User"("did") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZkpLog" ADD CONSTRAINT "ZkpLog_did_fkey" FOREIGN KEY ("did") REFERENCES "User"("did") ON DELETE RESTRICT ON UPDATE CASCADE;
