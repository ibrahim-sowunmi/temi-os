/*
  Warnings:

  - A unique constraint covering the columns `[stripePriceId]` on the table `products` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "products" ADD COLUMN     "currency" TEXT DEFAULT 'usd',
ADD COLUMN     "price" INTEGER,
ADD COLUMN     "stripePriceId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "products_stripePriceId_key" ON "products"("stripePriceId");
