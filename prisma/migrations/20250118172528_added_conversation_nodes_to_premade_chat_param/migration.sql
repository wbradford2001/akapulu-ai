/*
  Warnings:

  - You are about to drop the column `startConversationNodeId` on the `PreMadeChatParam` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "PreMadeChatParam" DROP CONSTRAINT "PreMadeChatParam_startConversationNodeId_fkey";

-- DropIndex
DROP INDEX "PreMadeChatParam_startConversationNodeId_key";

-- AlterTable
ALTER TABLE "ConversationNode" ADD COLUMN     "preMadeChatParamId" TEXT;

-- AlterTable
ALTER TABLE "PreMadeChatParam" DROP COLUMN "startConversationNodeId";

-- AddForeignKey
ALTER TABLE "ConversationNode" ADD CONSTRAINT "ConversationNode_preMadeChatParamId_fkey" FOREIGN KEY ("preMadeChatParamId") REFERENCES "PreMadeChatParam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
