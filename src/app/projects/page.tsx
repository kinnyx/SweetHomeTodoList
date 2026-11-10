import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getCurrentProject } from "@/lib/current-project";
import { CreateProjectForm } from "@/components/project-forms";

const ROLE_LABEL = { OWNER: 'เจ้าของ', MEMBER: 'สมาชิก' } as const

export default function ProjectsPage() {
    return (
        <main className="mx-auto max-w-2xl px-6 py-12">
            <h1 className="font-display text-3xl font-semibold">Project</h1>

            <section aria-labelledby="create-heading" className="mt-8">
                <h2 id="create-heading" className="font-medium">สร้าง project ใหม่</h2>
                <CreateProjectForm />
            </section>

            <section aria-labelledby="list-heading" className="mt-10">
                <h2 id="list-heading" className="font-medium">project ของฉัน</h2>
                <Suspense fallback={<div className="mt-3 h-40 animate-pulse rounded-lg bg-paper" />}>
                    <ProjectList />
                </Suspense>
            </section>
        </main>
    )
}

async function ProjectList() {
    await connection()
    const user = await requireUser()
    const current = await getCurrentProject(user.id)

    const memberships = await db.projectMember.findMany({
        where: { userId: user.id },
        select: {
            role: true,
            project: {
                select: {
                    id: true,
                    name: true,
                    isPersonal: true,
                    _count: { select: { members: true, todos: true } },
                },
            },
        },
        orderBy: [{ project: { isPersonal: 'desc' } }, { joinedAt: 'asc' }],
    })

    return (
        <ul className="mt-3 divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
            {memberships.map(({ role, project }) => (
                <li key={project.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                        <Link href={`/projects/${project.id}`} className="font-medium hover:underline">
                            {project.name}
                        </Link>
                        <p className="text-sm text-ink-soft">
                            {ROLE_LABEL[role]}, {project._count.members} คน, {project._count.todos} งาน
                        </p>
                    </div>
                    {project.id === current.id && (
                        <span className="rounded-full bg-progress/10 px-2 py-0.5 text-xs text-progress">
                            เปิดอยู่
                        </span>
                    )}
                </li>
            ))}
        </ul>
    )
}