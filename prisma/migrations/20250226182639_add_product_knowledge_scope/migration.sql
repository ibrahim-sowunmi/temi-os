-- AlterEnum
ALTER TYPE "KnowledgeBaseScope" ADD VALUE 'PRODUCT';

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_knowledgeBaseId_fkey";

-- AlterTable
ALTER TABLE "products" ALTER COLUMN "knowledgeBaseId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_knowledgeBaseId_fkey" FOREIGN KEY ("knowledgeBaseId") REFERENCES "KnowledgeBase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
