/*
  Warnings:

  - Added the required column `nodeType` to the `ConversationNode` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CovnersationNodeType" AS ENUM ('regular', 'options');

-- AlterTable
ALTER TABLE "ConversationNode" ADD COLUMN     "nodeType" "CovnersationNodeType" NOT NULL;
