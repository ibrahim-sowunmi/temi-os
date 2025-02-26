-- CreateEnum
CREATE TYPE "KnowledgeBaseScope" AS ENUM ('GLOBAL', 'LOCATION', 'READER');

-- AlterTable
ALTER TABLE "KnowledgeBase" ADD COLUMN     "scope" "KnowledgeBaseScope" NOT NULL DEFAULT 'GLOBAL';

-- CreateTable
CREATE TABLE "_KnowledgeBaseToLocation" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_KnowledgeBaseToLocation_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_KnowledgeBaseToLocation_B_index" ON "_KnowledgeBaseToLocation"("B");

-- AddForeignKey
ALTER TABLE "_KnowledgeBaseToLocation" ADD CONSTRAINT "_KnowledgeBaseToLocation_A_fkey" FOREIGN KEY ("A") REFERENCES "KnowledgeBase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_KnowledgeBaseToLocation" ADD CONSTRAINT "_KnowledgeBaseToLocation_B_fkey" FOREIGN KEY ("B") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;
