-- CreateTable
CREATE TABLE "ProduceLog" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "farmerDid" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "variety" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "harvestDate" TIMESTAMP(3) NOT NULL,
    "farmingMethod" TEXT NOT NULL,
    "sellingPrice" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProduceLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProduceLog_batchId_key" ON "ProduceLog"("batchId");

-- CreateIndex
CREATE INDEX "ProduceLog_farmerDid_idx" ON "ProduceLog"("farmerDid");

-- CreateIndex
CREATE INDEX "ProduceLog_batchId_idx" ON "ProduceLog"("batchId");

-- CreateIndex
CREATE INDEX "ProduceLog_createdAt_idx" ON "ProduceLog"("createdAt");

-- AddForeignKey
ALTER TABLE "ProduceLog" ADD CONSTRAINT "ProduceLog_farmerDid_fkey" FOREIGN KEY ("farmerDid") REFERENCES "User"("did") ON DELETE CASCADE ON UPDATE CASCADE;
