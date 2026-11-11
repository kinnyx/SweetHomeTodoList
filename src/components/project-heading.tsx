// 📌 [จุดประสงค์]: หัวข้อของทุกหน้าที่แสดงงาน — ชื่อ project + รูปสมาชิก
import Link from 'next/link'
import { connection } from 'next/server'
import { db } from '@/lib/db'
import { requireUser } from '@/lib/session'
import { getCurrentProject } from '@/lib/current-project'
import { AvatarStack } from './avatar-stack'

export async function ProjectHeading({ subtitle }: { subtitle?: string }) {
  await connection()
  const user = await requireUser()
  const project = await getCurrentProject(user.id)

  const members = project.isPersonal
    ? []
    : await db.projectMember.findMany({
        where: { projectId: project.id },
        select: { user: { select: { id: true, name: true, image: true } } },
        orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
      })

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="font-display text-3xl font-semibold">{project.name}</h1>
        {subtitle && <p className="mt-1 text-ink-soft">{subtitle}</p>}
      </div>
      {members.length > 0 && (
        <Link href={`/projects/${project.id}`} aria-label="ดูสมาชิกทั้งหมด" className="rounded-full">
          <AvatarStack members={members.map((m) => m.user)} />
        </Link>
      )}
    </div>
  )
}

// ✅ ส่งออก skeleton คู่กัน — ทุกหน้าใช้ตัวเดียวกัน หน้าตาระหว่างรอเหมือนกันหมด
export function ProjectHeadingSkeleton() {
  return <div className="h-10 w-56 animate-pulse rounded bg-paper" />
}