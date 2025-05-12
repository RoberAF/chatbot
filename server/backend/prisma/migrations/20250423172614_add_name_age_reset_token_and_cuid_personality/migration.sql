/*
  Warnings:

  - The primary key for the `Personality` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_personalityId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_activePersonalityId_fkey";

-- AlterTable
ALTER TABLE "Message" ALTER COLUMN "personalityId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Personality" DROP CONSTRAINT "Personality_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Personality_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Personality_id_seq";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "age" INTEGER,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpiry" TIMESTAMP(3),
ALTER COLUMN "activePersonalityId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_activePersonalityId_fkey" FOREIGN KEY ("activePersonalityId") REFERENCES "Personality"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_personalityId_fkey" FOREIGN KEY ("personalityId") REFERENCES "Personality"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
