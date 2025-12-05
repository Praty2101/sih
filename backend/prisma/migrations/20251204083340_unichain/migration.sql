/*
  Warnings:

  - Added the required column `name` to the `FarmerIdentity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `RetailerIdentity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `TransporterIdentity` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FarmerIdentity" ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "RetailerIdentity" ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TransporterIdentity" ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "name" TEXT;
