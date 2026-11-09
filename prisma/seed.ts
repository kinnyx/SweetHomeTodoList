import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'
import { accessibleTodos } from '@/lib/access'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  // ✅ seed ให้บัญชีแรกในระบบ — ต้องสมัครผ่านหน้าเว็บก่อน
  //    (สร้าง user ใน seed ตรง ๆ ไม่ได้ เพราะรหัสผ่านต้อง hash แบบเดียวกับที่ Better Auth ใช้)
  const user = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } })
  if (!user) throw new Error('ยังไม่มีผู้ใช้ — สมัครสมาชิกผ่านหน้าเว็บก่อนรัน seed')

  const membership = await prisma.projectMember.findFirst({
    where: { userId: user.id, role: 'OWNER', project: { isPersonal: true } },
    select: { projectId: true },
  })

  if (!membership) throw new Error('ผู้ใช้ยังไม่มี Project ส่วนตัว')

  // ⚠️ ลบเฉพาะงานของ user นี้ ไม่แตะของคนอื่น
  await prisma.todo.deleteMany({ where: { ...accessibleTodos(user.id) } })

  await prisma.todo.createMany({
    data: [
      { title: 'ตรวจยอดขายสาขาประจำวัน', status: 'DONE', priority: 'LOW', projectId: membership.projectId, createdById: user.id, },
      { title: 'แก้ stored procedure รายงานสต๊อก', status: 'IN_PROGRESS', priority: 'MEDIUM', projectId: membership.projectId, createdById: user.id, },
      { title: 'เรียน Next.js บทที่ 9', priority: 'HIGH', projectId: membership.projectId, createdById: user.id,  },
    ],
  })

  console.log(`ใส่ข้อมูลให้ ${user.email} แล้ว`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())