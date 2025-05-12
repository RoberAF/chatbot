-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "hadTrial" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isTrialActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "trialEndsAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Subscription_trialEndsAt_idx" ON "Subscription"("trialEndsAt");

-- CreateIndex
CREATE INDEX "Subscription_isTrialActive_idx" ON "Subscription"("isTrialActive");
