/*
  Warnings:

  - You are about to drop the column `chatParamInvocationId` on the `ConversationNode` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ConversationNode" DROP CONSTRAINT "ConversationNode_chatParamInvocationId_fkey";

-- AlterTable
ALTER TABLE "ConversationNode" DROP COLUMN "chatParamInvocationId";

-- CreateTable
CREATE TABLE "ChatParamInvocationConversationNode" (
    "chatParamInvocationId" TEXT NOT NULL,
    "conversationNodeId" TEXT NOT NULL,

    CONSTRAINT "ChatParamInvocationConversationNode_pkey" PRIMARY KEY ("chatParamInvocationId","conversationNodeId")
);

-- AddForeignKey
ALTER TABLE "ChatParamInvocationConversationNode" ADD CONSTRAINT "ChatParamInvocationConversationNode_chatParamInvocationId_fkey" FOREIGN KEY ("chatParamInvocationId") REFERENCES "ChatParamInvocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatParamInvocationConversationNode" ADD CONSTRAINT "ChatParamInvocationConversationNode_conversationNodeId_fkey" FOREIGN KEY ("conversationNodeId") REFERENCES "ConversationNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
