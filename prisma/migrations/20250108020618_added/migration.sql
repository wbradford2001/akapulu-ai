/*
  Warnings:

  - You are about to drop the `Param` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `maxTokens` to the `ChatParams` table without a default value. This is not possible if the table is not empty.
  - Added the required column `temperature` to the `ChatParams` table without a default value. This is not possible if the table is not empty.
  - Added the required column `topK` to the `ChatParams` table without a default value. This is not possible if the table is not empty.
  - Added the required column `topP` to the `ChatParams` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Param" DROP CONSTRAINT "Param_chatParamId_fkey";

-- AlterTable
ALTER TABLE "ChatParams" ADD COLUMN     "maxTokens" INTEGER NOT NULL,
ADD COLUMN     "stopSequences" TEXT[],
ADD COLUMN     "temperature" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "topK" INTEGER NOT NULL,
ADD COLUMN     "topP" DOUBLE PRECISION NOT NULL;

-- DropTable
DROP TABLE "Param";
