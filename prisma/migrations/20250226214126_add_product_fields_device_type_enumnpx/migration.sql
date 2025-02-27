-- CreateEnum
CREATE TYPE "TerminalDeviceType" AS ENUM ('bbpos_chipper2x', 'bbpos_wisepad3', 'bbpos_wisepos_e', 'mobile_phone_reader', 'simulated_wisepos_e', 'stripe_m2', 'stripe_s700', 'verifone_P400', 'unknown');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "terminals" ADD COLUMN     "deviceType" "TerminalDeviceType" NOT NULL DEFAULT 'unknown',
ADD COLUMN     "lastSeenAt" TIMESTAMP(3);
