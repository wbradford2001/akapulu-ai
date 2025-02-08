-- DropForeignKey
ALTER TABLE "ChatParamInvocation" DROP CONSTRAINT "ChatParamInvocation_preMadeChatParamId_fkey";

-- DropForeignKey
ALTER TABLE "ChatParamInvocation" DROP CONSTRAINT "ChatParamInvocation_userId_fkey";

-- DropForeignKey
ALTER TABLE "PreMadeChatParam" DROP CONSTRAINT "PreMadeChatParam_userId_fkey";

-- DropForeignKey
ALTER TABLE "TranscriptRow" DROP CONSTRAINT "TranscriptRow_chatParamInvocationId_fkey";

-- AddForeignKey
ALTER TABLE "PreMadeChatParam" ADD CONSTRAINT "PreMadeChatParam_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatParamInvocation" ADD CONSTRAINT "ChatParamInvocation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatParamInvocation" ADD CONSTRAINT "ChatParamInvocation_preMadeChatParamId_fkey" FOREIGN KEY ("preMadeChatParamId") REFERENCES "PreMadeChatParam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TranscriptRow" ADD CONSTRAINT "TranscriptRow_chatParamInvocationId_fkey" FOREIGN KEY ("chatParamInvocationId") REFERENCES "ChatParamInvocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
