/*
  Warnings:

  - Changed the type of `nodeType` on the `ConversationNode` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ConversationNodeType" AS ENUM ('regular', 'options');

-- AlterTable
ALTER TABLE "ConversationNode" DROP COLUMN "nodeType",
ADD COLUMN     "nodeType" "ConversationNodeType" NOT NULL;

-- DropEnum
DROP TYPE "CovnersationNodeType";
