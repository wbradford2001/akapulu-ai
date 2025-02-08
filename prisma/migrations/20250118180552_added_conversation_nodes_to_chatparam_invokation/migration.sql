-- AlterTable
ALTER TABLE "ConversationNode" ADD COLUMN     "chatParamInvocationId" TEXT;

-- AddForeignKey
ALTER TABLE "ConversationNode" ADD CONSTRAINT "ConversationNode_chatParamInvocationId_fkey" FOREIGN KEY ("chatParamInvocationId") REFERENCES "ChatParamInvocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
