/*
  Warnings:

  - You are about to drop the column `createdById` on the `Todo` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Todo" DROP CONSTRAINT "Todo_createdById_fkey";

-- AlterTable
ALTER TABLE "Todo" DROP COLUMN "createdById",
ADD COLUMN     "CreatedById" TEXT;

-- AddForeignKey
ALTER TABLE "Todo" ADD CONSTRAINT "Todo_CreatedById_fkey" FOREIGN KEY ("CreatedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
