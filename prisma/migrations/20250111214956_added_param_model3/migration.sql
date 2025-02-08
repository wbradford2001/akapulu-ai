/*
  Warnings:

  - You are about to drop the `Param` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ChatParamInvocationParams` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_PreMadeChatParamParams` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_ChatParamInvocationParams" DROP CONSTRAINT "_ChatParamInvocationParams_A_fkey";

-- DropForeignKey
ALTER TABLE "_ChatParamInvocationParams" DROP CONSTRAINT "_ChatParamInvocationParams_B_fkey";

-- DropForeignKey
ALTER TABLE "_PreMadeChatParamParams" DROP CONSTRAINT "_PreMadeChatParamParams_A_fkey";

-- DropForeignKey
ALTER TABLE "_PreMadeChatParamParams" DROP CONSTRAINT "_PreMadeChatParamParams_B_fkey";

-- AlterTable
ALTER TABLE "ChatParamInvocation" ADD COLUMN     "params" JSONB NOT NULL DEFAULT '{}';

-- DropTable
DROP TABLE "Param";

-- DropTable
DROP TABLE "_ChatParamInvocationParams";

-- DropTable
DROP TABLE "_PreMadeChatParamParams";
