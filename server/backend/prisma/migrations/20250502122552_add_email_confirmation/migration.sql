-- AlterTable
ALTER TABLE "User" ADD COLUMN     "confirmToken" TEXT,
ADD COLUMN     "confirmTokenExpiry" TIMESTAMP(3),
ADD COLUMN     "emailConfirmed" BOOLEAN NOT NULL DEFAULT false;
