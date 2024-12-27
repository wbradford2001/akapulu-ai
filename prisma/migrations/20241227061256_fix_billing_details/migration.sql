/*
  Warnings:

  - You are about to drop the column `guidanceScale` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `initialImageUrl` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `negativePrompt` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `prompt` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `steps` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `maxImagesPerMonth` on the `Plan` table. All the data in the column will be lost.
  - You are about to drop the column `monthlyCost` on the `Plan` table. All the data in the column will be lost.
  - You are about to drop the column `subscriptionId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Subscription` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `completionTime` to the `Image` table without a default value. This is not possible if the table is not empty.
  - Added the required column `creditsPurchased` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `costPerCredit` to the `Plan` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Image" DROP CONSTRAINT "Image_userId_fkey";

-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_planId_fkey";

-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_userId_fkey";

-- AlterTable
ALTER TABLE "Image" DROP COLUMN "guidanceScale",
DROP COLUMN "initialImageUrl",
DROP COLUMN "negativePrompt",
DROP COLUMN "prompt",
DROP COLUMN "steps",
DROP COLUMN "userId",
ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "completionTime" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "creditsPurchased" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Plan" DROP COLUMN "maxImagesPerMonth",
DROP COLUMN "monthlyCost",
ADD COLUMN     "costPerCredit" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "subscriptionId",
ADD COLUMN     "credits" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "Subscription";

-- CreateTable
CREATE TABLE "Follow" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserToImage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "imageId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "negativePrompt" TEXT,
    "guidanceScale" DOUBLE PRECISION NOT NULL,
    "steps" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserToImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Follow_followerId_followingId_key" ON "Follow"("followerId", "followingId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserToImage" ADD CONSTRAINT "UserToImage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserToImage" ADD CONSTRAINT "UserToImage_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
