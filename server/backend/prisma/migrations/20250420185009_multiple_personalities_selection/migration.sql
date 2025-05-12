-- DropIndex
DROP INDEX "Personality_userId_key";

-- AlterTable
ALTER TABLE "Personality" ALTER COLUMN "traits" SET DATA TYPE JSONB;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "activePersonalityId" INTEGER;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_activePersonalityId_fkey" FOREIGN KEY ("activePersonalityId") REFERENCES "Personality"("id") ON DELETE SET NULL ON UPDATE CASCADE;
