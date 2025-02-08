-- AlterTable
ALTER TABLE "ConversationNode" ADD COLUMN     "fallbackNodeId" TEXT;

-- AddForeignKey
ALTER TABLE "ConversationNode" ADD CONSTRAINT "ConversationNode_fallbackNodeId_fkey" FOREIGN KEY ("fallbackNodeId") REFERENCES "ConversationNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
