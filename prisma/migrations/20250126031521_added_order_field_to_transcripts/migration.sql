/*
  Warnings:

  - Added the required column `order` to the `TranscriptRow` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TranscriptRow" ADD COLUMN     "order" INTEGER NOT NULL;
