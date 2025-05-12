/*
  Warnings:

  - You are about to drop the column `hadTrial` on the `Subscription` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "hadTrial",
ADD COLUMN     "hasUsedTrial" BOOLEAN NOT NULL DEFAULT false;
