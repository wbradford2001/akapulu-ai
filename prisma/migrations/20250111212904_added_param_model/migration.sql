/*
  Warnings:

  - You are about to drop the column `maxTokens` on the `ChatParamInvocation` table. All the data in the column will be lost.
  - You are about to drop the column `prompt` on the `ChatParamInvocation` table. All the data in the column will be lost.
  - You are about to drop the column `stopSequences` on the `ChatParamInvocation` table. All the data in the column will be lost.
  - You are about to drop the column `system` on the `ChatParamInvocation` table. All the data in the column will be lost.
  - You are about to drop the column `temperature` on the `ChatParamInvocation` table. All the data in the column will be lost.
  - You are about to drop the column `topK` on the `ChatParamInvocation` table. All the data in the column will be lost.
  - You are about to drop the column `topP` on the `ChatParamInvocation` table. All the data in the column will be lost.
  - You are about to drop the column `maxTokens` on the `PreMadeChatParam` table. All the data in the column will be lost.
  - You are about to drop the column `prompt` on the `PreMadeChatParam` table. All the data in the column will be lost.
  - You are about to drop the column `stopSequences` on the `PreMadeChatParam` table. All the data in the column will be lost.
  - You are about to drop the column `system` on the `PreMadeChatParam` table. All the data in the column will be lost.
  - You are about to drop the column `temperature` on the `PreMadeChatParam` table. All the data in the column will be lost.
  - You are about to drop the column `topK` on the `PreMadeChatParam` table. All the data in the column will be lost.
  - You are about to drop the column `topP` on the `PreMadeChatParam` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ChatParamInvocation" DROP COLUMN "maxTokens",
DROP COLUMN "prompt",
DROP COLUMN "stopSequences",
DROP COLUMN "system",
DROP COLUMN "temperature",
DROP COLUMN "topK",
DROP COLUMN "topP";

-- AlterTable
ALTER TABLE "PreMadeChatParam" DROP COLUMN "maxTokens",
DROP COLUMN "prompt",
DROP COLUMN "stopSequences",
DROP COLUMN "system",
DROP COLUMN "temperature",
DROP COLUMN "topK",
DROP COLUMN "topP";

-- CreateTable
CREATE TABLE "Param" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL,
    "minVal" DOUBLE PRECISION,
    "maxVal" DOUBLE PRECISION,
    "defaultValue" TEXT NOT NULL,
    "includeInDefaultUI" BOOLEAN NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Param_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PreMadeChatParamParams" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PreMadeChatParamParams_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ChatParamInvocationParams" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ChatParamInvocationParams_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_PreMadeChatParamParams_B_index" ON "_PreMadeChatParamParams"("B");

-- CreateIndex
CREATE INDEX "_ChatParamInvocationParams_B_index" ON "_ChatParamInvocationParams"("B");

-- AddForeignKey
ALTER TABLE "_PreMadeChatParamParams" ADD CONSTRAINT "_PreMadeChatParamParams_A_fkey" FOREIGN KEY ("A") REFERENCES "Param"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PreMadeChatParamParams" ADD CONSTRAINT "_PreMadeChatParamParams_B_fkey" FOREIGN KEY ("B") REFERENCES "PreMadeChatParam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChatParamInvocationParams" ADD CONSTRAINT "_ChatParamInvocationParams_A_fkey" FOREIGN KEY ("A") REFERENCES "ChatParamInvocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChatParamInvocationParams" ADD CONSTRAINT "_ChatParamInvocationParams_B_fkey" FOREIGN KEY ("B") REFERENCES "Param"("id") ON DELETE CASCADE ON UPDATE CASCADE;
