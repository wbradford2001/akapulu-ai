/*
  Warnings:

  - You are about to drop the `ChatParams` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "ChatParams";

-- CreateTable
CREATE TABLE "PreMadeChatParam" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "system" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "topP" DOUBLE PRECISION NOT NULL,
    "topK" INTEGER NOT NULL,
    "maxTokens" INTEGER NOT NULL,
    "stopSequences" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreMadeChatParam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatParamInvocation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preMadeChatParamId" TEXT NOT NULL,
    "system" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "topP" DOUBLE PRECISION NOT NULL,
    "topK" INTEGER NOT NULL,
    "maxTokens" INTEGER NOT NULL,
    "stopSequences" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatParamInvocation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ChatParamInvocation" ADD CONSTRAINT "ChatParamInvocation_preMadeChatParamId_fkey" FOREIGN KEY ("preMadeChatParamId") REFERENCES "PreMadeChatParam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
