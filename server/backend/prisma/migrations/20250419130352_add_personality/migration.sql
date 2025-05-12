-- CreateTable
CREATE TABLE "Personality" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "traits" JSON NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Personality_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Personality_userId_key" ON "Personality"("userId");

-- AddForeignKey
ALTER TABLE "Personality" ADD CONSTRAINT "Personality_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
