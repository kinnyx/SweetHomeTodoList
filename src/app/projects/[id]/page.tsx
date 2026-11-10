import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { ProjectIdSchema } from "@/lib/validations/project";
import { 
    deleteProject, 
    leaveProject, 
    openProject, 
    removeMember, 
} from "@/actions/project.action";
import { ActionButton } from "@/components/action-button";
import { InviteMemberForm, RenameProjectForm } from "@/components/project-forms";

type Params = Promise<{ id: string }>

const ROLE_LABEL = { OWNER: 'เจ้าของ', MEMBER: 'สมาชิก' } as const

export default function ProjectPage({ params }: { params: Params }) {
    return (
        <main className="mx-auto max-w-2xl px-6 py-12">
            <Link href="/projects" className="text-sm text-ink-soft hover:text-ink">
                กลับไปรายการ project
            </Link>
            <Suspense fallback={<div className="mt-4 h-64 animate-pulse rounded-lg bg-paper" />}>
                <ProjectDetail params={params} />
            </Suspense>
        </main>
    )
}

async function ProjectDetail({ params }: { params: Params }) {
    await connection()
    const user = await requireUser()
    const { id } = await params

    const parsed = ProjectIdSchema.safeParse(id)
    if (!parsed.success) notFound()

    const membership = await db.projectMember.findUnique({
        where: { projectId_userId: { projectId: parsed.data, userId: user.id } },
        select: {
            role: true,
            project: {
                select: {
                    id: true,
                    name: true,
                    isPersonal: true,
                    members: {
                        select: { role: true, user: { select: { id: true, name: true, email: true } } },
                        orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }]
                    },
                },
            },
        },
    })
    if (!membership) notFound()

    const { project } = membership
    const isOwner = membership.role === 'OWNER'

    return (
        <>
            <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl font-semibold">{project.name}</h1>
                    <p className="mt-1 text-sm text-ink-soft">
                        {project.isPersonal ? 'project ส่วนตัว — มีแค่คุณ' : `คุณเป็น${ROLE_LABEL[membership.role]}`}
                    </p>
                </div>
                <ActionButton 
                    action={openProject.bind(null, project.id)}
                    label="เปิด project นี้"
                    pendingLabel="กำลังเปิด..."
                    variant="primary"
                />
            </div>

            {isOwner && (
                <section aria-labelledby="rename-heading" className="mt-10 border-t border-line pt-6">
                    <h2 id="rename-heading" className="font-display text-lg font-semibold">ชื่อ project</h2>
                    <RenameProjectForm key={project.name} projectId={project.id} name={project.name} />
                </section>
            )}

            <section aria-labelledby="members-heading" className="mt-10 border-t border-line pt-6">
                <h2 id="member-heading" className="font-display text-lg font-semibold">
                    สมาชิก <span className="text-ink-soft">({project.members.length})</span>
                </h2>

                {isOwner && !project.isPersonal && <InviteMemberForm projectId= {project.id} />}

                <ul className="mt-4 divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
                    {project.members.map((m) => (
                        <li key={m.user.id} className="flex items-center gap-3 px-4 py-3">
                            <div className="min-w-0 flex-1">
                                <p className="font-medium">
                                    {m.user.name}
                                    {m.user.id === user.id && <span className="text-ink-soft"> (คุณ)</span>}
                                </p>
                                <p className="truncate text-sm text-ink-soft">{m.user.email}</p>
                            </div>
                            <span className="text-sm text-ink-soft">{ROLE_LABEL[m.role]}</span>
                            {isOwner && m.role === 'MEMBER' && (
                                <ActionButton 
                                    action={removeMember.bind(null, project.id, m.user.id)}
                                    label="นำออก"
                                    pendingLabel="กำลังนำออก..."
                                    confirmText={`นำ ${m.user.name} ออกจาก project?`}
                                    variant="danger"
                                />
                            )}
                        </li>
                    ))}
                </ul>
            </section>

            {!isOwner && (
                <section aria-labelledby="leave-heading" className="mt-12 border-t border-line pt-6">
                    <h2 id="leave-heading" className="font-display text-lg font-semibold">ออกจาก project</h2>
                    <p className="mt-1 text-sm text-ink-soft">งานที่คุณสร้างไว้ยังอยู่ใน project นี้</p>
                    <div className="mt-4">
                        <ActionButton 
                            action={leaveProject.bind(null, project.id)}
                            label="ออกจาก project"
                            pendingLabel="กำลังออก..."
                            confirmText={`ออกจาก "${project.name}"? ต้องให้เจ้าของเชิญใหม่ถ้าจะกลับมา`}
                            variant="danger"
                        />
                    </div>
                </section>
            )}

            {isOwner && !project.isPersonal && (
                <section aria-labelledby="delete-heading" className="mt-12 border-t border-line pt-6">
                    <h2 id="delete-heading" className="font-display text-lg font-semibold">ลบ project</h2>
                    <p className="mt-1 text-sm text-ink-soft">
                        ลบงาน รูปแนบ และสมาชิกทั้งหมด กู้คืนไม่ได้
                    </p>
                    <div className="mt-4">
                        <ActionButton 
                            action={deleteProject.bind(null, project.id)}
                            label="ลบ project"
                            pendingLabel="กำลังลบ..."
                            confirmText={`ลบ "${project.name}" และงานทั้งหมดในนี้ กู้คืนไม่ได้`}
                            variant="danger"
                        />
                    </div>
                </section>
            )}
        </>
    )
}