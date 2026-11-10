import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getCurrentProject } from "@/lib/current-project";
import { ProjectSwitcher } from "./project-switcher";

export async function ProjectSwitcherSection() {
    const session = await getSession()
    if (!session) return null

    const current = await getCurrentProject(session.user.id)
    const projects = await db.project.findMany({
        where: { members: { some: { userId: session.user.id } } },
        select: { id: true, name: true },
        orderBy: [{ isPersonal: 'desc' }, { name: 'asc' }],
    })

    return (
        <div className="flex items-center gap-2">
            <ProjectSwitcher projects={projects} currentId={current.id} />
            <Link href="/projects" className="text-ink-soft hover:text-ink">
                จัดการ
            </Link>
        </div>
    )
}