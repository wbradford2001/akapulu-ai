/*
  Warnings:

  - Added the required column `ignoreInTranscript` to the `ConversationNode` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ConversationNode" ADD COLUMN     "ignoreInTranscript" BOOLEAN NOT NULL;
