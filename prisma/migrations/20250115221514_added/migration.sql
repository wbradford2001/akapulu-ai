/*
  Warnings:

  - You are about to drop the column `wordForWord` on the `ConversationNode` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ConversationNode" DROP COLUMN "wordForWord",
ADD COLUMN     "aiWordForWord" BOOLEAN;
