/*
  Warnings:

  - You are about to drop the column `CreatedById` on the `Todo` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Todo" DROP CONSTRAINT "Todo_CreatedById_fkey";

-- AlterTable
ALTER TABLE "Todo" DROP COLUMN "CreatedById",
ADD COLUMN     "createdById" TEXT;

-- AddForeignKey
ALTER TABLE "Todo" ADD CONSTRAINT "Todo_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
