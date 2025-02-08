/*
  Warnings:

  - You are about to drop the column `params` on the `ChatParamInvocation` table. All the data in the column will be lost.
  - You are about to drop the column `params` on the `PreMadeChatParam` table. All the data in the column will be lost.
  - Added the required column `customParams` to the `ChatParamInvocation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `modelParams` to the `ChatParamInvocation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customParams` to the `PreMadeChatParam` table without a default value. This is not possible if the table is not empty.
  - Added the required column `modelParams` to the `PreMadeChatParam` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ChatParamInvocation" DROP COLUMN "params",
ADD COLUMN     "customParams" JSONB NOT NULL,
ADD COLUMN     "modelParams" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "PreMadeChatParam" DROP COLUMN "params",
ADD COLUMN     "customParams" JSONB NOT NULL,
ADD COLUMN     "modelParams" JSONB NOT NULL;
