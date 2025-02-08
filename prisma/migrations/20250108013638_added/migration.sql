/*
  Warnings:

  - You are about to drop the column `params` on the `ModelConfig` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `ModelConfig` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ModelConfig" DROP COLUMN "params";

-- CreateTable
CREATE TABLE "Param" (
    "id" TEXT NOT NULL,
    "modelConfigId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dataType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "minVal" DOUBLE PRECISION,
    "maxVal" DOUBLE PRECISION,
    "defaultVal" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Param_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ModelConfig_name_key" ON "ModelConfig"("name");

-- AddForeignKey
ALTER TABLE "Param" ADD CONSTRAINT "Param_modelConfigId_fkey" FOREIGN KEY ("modelConfigId") REFERENCES "ModelConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
