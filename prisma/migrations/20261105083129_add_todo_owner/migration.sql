-- DropIndex
DROP INDEX "Todo_status_idx";

-- AlterTable
ALTER TABLE "Todo" ADD COLUMN "userId" TEXT;
UPDATE "Todo" SET "userId" = (SELECT id FROM "user" WHERE email = 'kin1@windowslive.com');
ALTER TABLE "Todo" ALTER COLUMN "userId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Todo_userId_status_idx" ON "Todo"("userId", "status");

-- AddForeignKey
ALTER TABLE "Todo" ADD CONSTRAINT "Todo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;