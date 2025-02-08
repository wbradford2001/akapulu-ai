/*
  Warnings:

  - You are about to drop the column `fallbackNodeId` on the `ConversationNode` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ConversationNode" DROP CONSTRAINT "ConversationNode_fallbackNodeId_fkey";

-- AlterTable
ALTER TABLE "ConversationNode" DROP COLUMN "fallbackNodeId",
ADD COLUMN     "fallbackNodeName" TEXT;
