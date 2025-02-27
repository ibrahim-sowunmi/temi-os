/*
  Warnings:

  - Added the required column `merchantId` to the `KnowledgeBase` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "KnowledgeBase" ADD COLUMN     "merchantId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "KnowledgeBase" ADD CONSTRAINT "KnowledgeBase_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
