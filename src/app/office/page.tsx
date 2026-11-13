// [จุดประสงค์]: หน้า /office - server เตรียมคน + เนื้อหาทุกห้อง แล้วส่งให้แผนที่
import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { accessibleTodos } from "@/lib/access";
import { getCurrentProject } from "@/lib/current-project";
import { userSummarySelect } from "@/lib/todo-select";
import { todoHref } from "@/lib/back-link";
import { ROOMS, type RoomKey } from "@/lib/office";
import { Avatar } from "@/components/avatar";
import { OfficeMap } from "@/components/office/office-map";
import { ProjectHeading, ProjectHeadingSkeleton } from "@/components/project-heading";
import { messageSelect, toChatMessage } from "@/lib/meeting";
import { MeetingChat } from "@/components/office/meeting-chat";

export default function OfficePage() {
    return (
        <main className="mx-auto max-w-5xl px-6 py-12">
            <Suspense fallback={<ProjectHeadingSkeleton />}>
                <ProjectHeading subtitle="คลิกห้องเพื่อเดินไปที่นั่น" />
            </Suspense>
            <Suspense fallback={<div className="mt-6 aspect-[16/10] animate-pulse rounded-xl bg-paper" />}>
                <OfficeSection />
            </Suspense>
        </main>
    )
}

async function OfficeSection() {
    await connection()
    const user = await requireUser()
    const project = await getCurrentProject(user.id)
    const isOwner = project.role === 'OWNER'

    const members = await db.projectMember.findMany({
        where: { projectId: project.id },
        select: { room: true, user: { select: userSummarySelect } },
        orderBy: { joinedAt: 'asc' },
    })

    // งาน "กำลังทำ" ทีมีผู้รับผิดชอบใน project นี้ — query เดียว ได้ของทุกคน
    // (ไม่ query ทีละคน ซึ่งจะกลายเป็น N+1 query เหมือนวน SELECT ในลูป)
    const working = await db.todo.findMany({
        where: {
            ...accessibleTodos(user.id),
            projectId: project.id,
            status: 'IN_PROGRESS',
            assigneeId: { not: null },
        },
        select: { title: true, assigneeId: true },
        orderBy: { updatedAt: 'desc' },
    })

    // คนละหลายงาน -> เอางานที่ขยับล่าสุด (มาก่อนเพราะ orderBy desc)
    const taskByUser = new Map<string, string>()
    for (const t of working) {
        if (t.assigneeId && !taskByUser.has(t.assigneeId)) taskByUser.set(t.assigneeId, t.title)
    }

    const panels: Record<RoomKey, ReactNode> = {
        WORK: <WorkPanel userId={user.id} projectId={project.id} />,
        // ไม่ใช่เจ้าของ -> ไม่สร้างเนื้อหาห้องผู้จัดการเลย
        // ซ่อนแค่ฝั่งหน้าจอไม่พอ เพราะข้อมูลที่ส่งไป browser แล้ว เปิด DevTools ก็เห็น
        MANAGER: isOwner ? <ManagerPanel userId={user.id} projectId={project.id} /> : null,
        MEETING: <MeetingPanel userId={user.id} projectId={project.id} />,
        LOUNGE: <LoungePanel />,
    }

    return (
        <OfficeMap 
            projectId={project.id}
            meId={user.id}
            isOwner={isOwner}
            members={members.map((m) => ({ ...m.user, room: m.room, currentTask: taskByUser.get(m.user.id) ?? null }))}
            panels={panels}
        />
    )
}

function PanelHeading({ room }: { room: RoomKey }) {
    return (
        <>
            <h2 className="font-display text-xl font-semibold">{ROOMS[room].label}</h2>
            <p className="text-sm text-ink-soft">{ROOMS[room].hint}</p>
        </>
    )
}

async function WorkPanel({ userId, projectId }: { userId: string; projectId: string }) {
    const tasks = await db.todo.findMany({
        where: { ...accessibleTodos(userId), projectId, status: 'IN_PROGRESS' },
        select: { id: true, title: true, assignee: { select: userSummarySelect } },
        orderBy: { updatedAt: 'desc' },
    })

    return (
        <div>
            <PanelHeading room="WORK" />
            {tasks.length === 0 ? (
                <p className="mt-4 text-ink-soft">ยังไม่มีใครเริ่มงาน — ลากการ์ดเข้า &quot;กำลังทำ&quot; ในบอร์ดเพื่อเริ่ม</p>
            ) : (
                <ul className="mt-4 divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
                    {tasks.map((t) => (
                        <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                            {t.assignee ? (
                                <Avatar name={t.assignee.name} image={t.assignee.image} size="sm" decorative />
                            ) : (
                                <span aria-hidden="true" className="size-6 rounded-full border border-dashed border-ink-soft" />
                            )}
                            <Link href={todoHref(t.id)} className="min-w-0 flex-1 hover:underline">{t.title}</Link>
                            <span className="text-sm text-ink-soft">{t.assignee?.name ?? 'ยังไม่มีคนรับ'}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

async function ManagerPanel({ userId, projectId }: { userId: string; projectId: string }) {
    const scope = { ...accessibleTodos(userId), projectId }
    const [groups, unassigned] = await Promise.all([
        db.todo.groupBy({ by: ['status'], where: scope, _count: { _all: true } }),
        db.todo.findMany({
            where: { ...scope, assigneeId: null, status: { not: 'DONE' } },
            select: { id: true, title: true },
            orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
            take: 10,
        }),
    ])

    const count = (s: string) => groups.find((g) => g.status === s)?._count._all ?? 0

    return (
        <div>
            <PanelHeading room="MANAGER" />
            <ul className="mt-4 grid grid-cols-3 gap-3">
                {[['TODO', 'ต้องทำ'], ['IN_PROGRESS', 'กำลังทำ'], ['DONE', 'เสร็จแล้ว']].map(([s, label]) => (
                    <li key={s} className="rounded-lg border border-line bg-surface p-4 text-center">
                        <p className="font-display text-2xl font-semibold tabular-nums">{count(s)}</p>
                        <p className="text-sm text-ink-soft">{label}</p>
                    </li>
                ))}
            </ul>
            <h3 className="mt-6 font-medium">รอมอบหมาย</h3>
            {unassigned.length === 0 ? (
                <p className="mt-2 text-ink-soft">ทุกงานมีคนรับแล้ว</p>
            ) : (
                <ul className="mt-2 space-y-1">
                    {unassigned.map((t) => (
                        <li key={t.id}>
                            <Link href={todoHref(t.id)} className="hover:underline">{t.title}</Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

async function MeetingPanel({ userId, projectId }: { userId: string; projectId: string }) {
    // 50 ล่าสุด: เรียงใหม่สุดก่อนเพื่อ take ได้ตัวล่าสุด แล้วกลับลำดับให้เก่าอยู่บน
    const rows = await db.meetingMessage.findMany({
        where: { projectId },
        select: messageSelect,
        orderBy: { createdAt: 'desc' },
        take: 50,
    })
    
    return (
        <div>
            <PanelHeading room="MEETING" />
            <MeetingChat initialMessages={rows.reverse().map(toChatMessage)} meId={userId} />
        </div>
    )
}

function LoungePanel() {
    return (
        <div>
            <PanelHeading room="LOUNGE" />
            <p className="mt-4 text-ink-soft">พร้อมทำงานเมื่อไหร่ คลิกห้องทำงานบนแผนที่</p>
        </div>
    )
}