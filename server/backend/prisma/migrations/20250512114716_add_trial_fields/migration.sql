/*
  Warnings:

  - You are about to drop the column `trialEndsAt` on the `Subscription` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Subscription_trialEndsAt_idx";

-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "trialEndsAt",
ADD COLUMN     "trialEndDate" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Subscription_trialEndDate_idx" ON "Subscription"("trialEndDate");
