/*
  Warnings:

  - Added the required column `userId` to the `PreMadeChatParam` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PreMadeChatParam" ADD COLUMN     "userId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "PreMadeChatParam" ADD CONSTRAINT "PreMadeChatParam_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatParamInvocation" ADD CONSTRAINT "ChatParamInvocation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
