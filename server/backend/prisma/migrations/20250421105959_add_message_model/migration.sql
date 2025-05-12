-- CreateEnum
CREATE TYPE "Sender" AS ENUM ('user', 'bot');

-- CreateTable
CREATE TABLE "Message" (
    "id" SERIAL NOT NULL,
    "personalityId" INTEGER NOT NULL,
    "sender" "Sender" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_personalityId_fkey" FOREIGN KEY ("personalityId") REFERENCES "Personality"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
