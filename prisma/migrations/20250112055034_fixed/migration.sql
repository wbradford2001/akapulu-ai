/*
  Warnings:

  - You are about to drop the `Transcript` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Transcript" DROP CONSTRAINT "Transcript_chatParamInvocationId_fkey";

-- DropTable
DROP TABLE "Transcript";

-- CreateTable
CREATE TABLE "TranscriptRow" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "content" TEXT NOT NULL,
    "chatParamInvocationId" TEXT NOT NULL,

    CONSTRAINT "TranscriptRow_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TranscriptRow" ADD CONSTRAINT "TranscriptRow_chatParamInvocationId_fkey" FOREIGN KEY ("chatParamInvocationId") REFERENCES "ChatParamInvocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
