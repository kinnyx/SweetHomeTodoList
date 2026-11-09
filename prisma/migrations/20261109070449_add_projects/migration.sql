-- ═══ 1) ตารางใหม่ ═══
CREATE TYPE "ProjectRole" AS ENUM ('OWNER', 'MEMBER');

CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "isPersonal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProjectMember" (
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ProjectRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectMember_pkey" PRIMARY KEY ("projectId", "userId")
);

CREATE INDEX "ProjectMember_userId_idx" ON "ProjectMember"("userId");

-- ═══ 2) สร้าง project ส่วนตัวให้ผู้ใช้ทุกคนที่มีอยู่ ═══
-- ✅ id = 'personal_' + id ผู้ใช้ — รู้ล่วงหน้าได้ จึงเอาไปใช้ในขั้นที่ 3 ได้เลย
--    ไม่ต้องสร้างตารางพักข้อมูลเพื่อจับคู่ว่าใครได้ project ไหน
INSERT INTO "Project" ("id", "name", "isPersonal", "updatedAt")
SELECT 'personal_' || "id", 'งานส่วนตัว', true, CURRENT_TIMESTAMP
FROM "user";

INSERT INTO "ProjectMember" ("projectId", "userId", "role")
SELECT 'personal_' || "id", "id", 'OWNER'
FROM "user";

-- ═══ 3) ย้ายงานเดิมเข้า project ส่วนตัวของเจ้าของ ═══
ALTER TABLE "Todo" DROP CONSTRAINT "Todo_userId_fkey";
DROP INDEX "Todo_userId_status_idx";

ALTER TABLE "Todo" ADD COLUMN "projectId" TEXT;
UPDATE "Todo" SET "projectId" = 'personal_' || "userId";
ALTER TABLE "Todo" ALTER COLUMN "projectId" SET NOT NULL;

-- ✅ userId เดิมคือคนสร้างอยู่แล้ว — เปลี่ยนชื่อ column แทนการลบแล้วสร้างใหม่ ข้อมูลไม่หาย
--    (= sp_rename ใน SQL Server)
ALTER TABLE "Todo" RENAME COLUMN "userId" TO "createdById";
ALTER TABLE "Todo" ALTER COLUMN "createdById" DROP NOT NULL;

CREATE INDEX "Todo_projectId_status_idx" ON "Todo"("projectId", "status");

-- ═══ 4) Foreign keys ═══
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Todo" ADD CONSTRAINT "Todo_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Todo" ADD CONSTRAINT "Todo_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;