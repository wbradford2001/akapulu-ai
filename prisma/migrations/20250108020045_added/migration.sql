/*
  Warnings:

  - You are about to drop the column `difficulty` on the `ChatParams` table. All the data in the column will be lost.
  - You are about to drop the column `maxTime` on the `ChatParams` table. All the data in the column will be lost.
  - You are about to drop the column `model` on the `ChatParams` table. All the data in the column will be lost.
  - You are about to drop the column `modelParams` on the `ChatParams` table. All the data in the column will be lost.
  - You are about to drop the column `mood` on the `ChatParams` table. All the data in the column will be lost.
  - You are about to drop the column `tone` on the `ChatParams` table. All the data in the column will be lost.
  - You are about to drop the column `defaultVal` on the `Param` table. All the data in the column will be lost.
  - You are about to drop the column `modelConfigId` on the `Param` table. All the data in the column will be lost.
  - You are about to drop the `ModelConfig` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Objection` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `system` to the `ChatParams` table without a default value. This is not possible if the table is not empty.
  - Added the required column `chatParamId` to the `Param` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Param` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Objection" DROP CONSTRAINT "Objection_chatParamId_fkey";

-- DropForeignKey
ALTER TABLE "Param" DROP CONSTRAINT "Param_modelConfigId_fkey";

-- AlterTable
ALTER TABLE "ChatParams" DROP COLUMN "difficulty",
DROP COLUMN "maxTime",
DROP COLUMN "model",
DROP COLUMN "modelParams",
DROP COLUMN "mood",
DROP COLUMN "tone",
ADD COLUMN     "system" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Param" DROP COLUMN "defaultVal",
DROP COLUMN "modelConfigId",
ADD COLUMN     "chatParamId" TEXT NOT NULL,
ADD COLUMN     "defaultValue" JSONB,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "ModelConfig";

-- DropTable
DROP TABLE "Objection";

-- AddForeignKey
ALTER TABLE "Param" ADD CONSTRAINT "Param_chatParamId_fkey" FOREIGN KEY ("chatParamId") REFERENCES "ChatParams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
