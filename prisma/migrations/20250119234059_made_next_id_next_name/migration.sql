/*
  Warnings:

  - You are about to drop the column `nextId` on the `ConversationNode` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ConversationNode" DROP COLUMN "nextId",
ADD COLUMN     "nextName" TEXT;
