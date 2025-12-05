-- AlterTable
ALTER TABLE "User" ADD COLUMN     "mobileHash" TEXT;

-- CreateIndex
CREATE INDEX "User_mobileHash_idx" ON "User"("mobileHash");
