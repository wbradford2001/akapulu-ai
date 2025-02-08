/*
  Warnings:

  - Made the column `name` on table `ConversationNode` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ConversationNode" ALTER COLUMN "name" SET NOT NULL;
