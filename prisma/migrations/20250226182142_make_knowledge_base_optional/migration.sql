/*
  Warnings:

  - Added the required column `locationId` to the `terminals` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "terminals" DROP CONSTRAINT "terminals_knowledgeBaseId_fkey";

-- AlterTable
ALTER TABLE "terminals" ADD COLUMN     "locationId" TEXT NOT NULL,
ALTER COLUMN "knowledgeBaseId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "stripeLocationId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "address" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Location_stripeLocationId_key" ON "Location"("stripeLocationId");

-- AddForeignKey
ALTER TABLE "terminals" ADD CONSTRAINT "terminals_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "terminals" ADD CONSTRAINT "terminals_knowledgeBaseId_fkey" FOREIGN KEY ("knowledgeBaseId") REFERENCES "KnowledgeBase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
