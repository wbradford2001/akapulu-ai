-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'Akapulu');

-- CreateTable
CREATE TABLE "Transcript" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "content" TEXT NOT NULL,
    "chatParamInvocationId" TEXT NOT NULL,

    CONSTRAINT "Transcript_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Transcript" ADD CONSTRAINT "Transcript_chatParamInvocationId_fkey" FOREIGN KEY ("chatParamInvocationId") REFERENCES "ChatParamInvocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
