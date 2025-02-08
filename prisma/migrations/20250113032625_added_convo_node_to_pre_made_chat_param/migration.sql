/*
  Warnings:

  - A unique constraint covering the columns `[startConversationNodeId]` on the table `PreMadeChatParam` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ConversationNode" ADD COLUMN     "name" TEXT;

-- AlterTable
ALTER TABLE "PreMadeChatParam" ADD COLUMN     "startConversationNodeId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "PreMadeChatParam_startConversationNodeId_key" ON "PreMadeChatParam"("startConversationNodeId");

-- AddForeignKey
ALTER TABLE "PreMadeChatParam" ADD CONSTRAINT "PreMadeChatParam_startConversationNodeId_fkey" FOREIGN KEY ("startConversationNodeId") REFERENCES "ConversationNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
