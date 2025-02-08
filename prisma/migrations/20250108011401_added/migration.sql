/*
  Warnings:

  - You are about to drop the column `credits` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `BillingDetails` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Image` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Payment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserToImage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "BillingDetails" DROP CONSTRAINT "BillingDetails_userId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserToImage" DROP CONSTRAINT "UserToImage_imageId_fkey";

-- DropForeignKey
ALTER TABLE "UserToImage" DROP CONSTRAINT "UserToImage_userId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "credits";

-- DropTable
DROP TABLE "BillingDetails";

-- DropTable
DROP TABLE "Image";

-- DropTable
DROP TABLE "Payment";

-- DropTable
DROP TABLE "UserToImage";

-- CreateTable
CREATE TABLE "ChatParams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "mood" TEXT NOT NULL,
    "maxTime" INTEGER,
    "prompt" TEXT NOT NULL,
    "modelParams" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatParams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "params" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModelConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Objection" (
    "id" TEXT NOT NULL,
    "chatParamId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "expectedResponses" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Objection_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Objection" ADD CONSTRAINT "Objection_chatParamId_fkey" FOREIGN KEY ("chatParamId") REFERENCES "ChatParams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
