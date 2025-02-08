-- AddForeignKey
ALTER TABLE "TranscriptRow" ADD CONSTRAINT "TranscriptRow_convoNodeId_fkey" FOREIGN KEY ("convoNodeId") REFERENCES "ConversationNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
