/*
  Warnings:

  - The `tier` column on the `Subscription` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Tier" AS ENUM ('FREE', 'PRO', 'PRO_PLUS');

-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "tier",
ADD COLUMN     "tier" "Tier" NOT NULL DEFAULT 'FREE';

-- DropEnum
DROP TYPE "SubscriptionTier";
