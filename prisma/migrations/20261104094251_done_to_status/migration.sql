-- 1) สร้าง enum ใหม่
CREATE TYPE "Status" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');

-- 2) เพิ่ม column ใหม่ (ทุกแถวเริ่มที่ TODO)
ALTER TABLE "Todo" ADD COLUMN "status" "Status" NOT NULL DEFAULT 'TODO';

-- 3) ย้ายข้อมูล: งานที่เคยเสร็จ → DONE
UPDATE "Todo" SET "status" = 'DONE' WHERE "done" = true;

-- 4) ลบ column เก่า
ALTER TABLE "Todo" DROP COLUMN "done";

-- 5) index
CREATE INDEX "Todo_status_idx" ON "Todo"("status");