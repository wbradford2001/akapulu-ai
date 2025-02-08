-- CreateTable
CREATE TABLE "ConversationNode" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "expectedSpeech" TEXT,
    "nextId" TEXT,
    "options" TEXT[],
    "traverseNumberOfOptions" INTEGER,
    "isStart" BOOLEAN NOT NULL DEFAULT false,
    "isEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationNode_pkey" PRIMARY KEY ("id")
);
