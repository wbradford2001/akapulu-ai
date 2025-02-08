/*
  Warnings:

  - Added the required column `params` to the `PreMadeChatParam` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PreMadeChatParam" ADD COLUMN     "params" JSONB NOT NULL;
