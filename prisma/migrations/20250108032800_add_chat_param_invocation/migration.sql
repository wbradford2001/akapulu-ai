-- DropForeignKey
ALTER TABLE "ChatParamInvocation" DROP CONSTRAINT "ChatParamInvocation_preMadeChatParamId_fkey";

-- AlterTable
ALTER TABLE "ChatParamInvocation" ALTER COLUMN "preMadeChatParamId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ChatParamInvocation" ADD CONSTRAINT "ChatParamInvocation_preMadeChatParamId_fkey" FOREIGN KEY ("preMadeChatParamId") REFERENCES "PreMadeChatParam"("id") ON DELETE SET NULL ON UPDATE CASCADE;
