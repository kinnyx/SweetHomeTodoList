import 'server-only'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

export const CURRENT_PROJECT_COOKIE = 'current-project'

export type CurrentProject = {
    id: string
    name: string
    isPersonal: boolean
    role: 'OWNER'| 'MEMBER'
}

export async function ensurePersonalProject(userId: string): Promise<CurrentProject> {
    const existing = await db.projectMember.findFirst({
        where: { userId, role: 'OWNER', project: { isPersonal: true } },
        select: { project: { select: { id: true, name: true } } },
    })
    if (existing) return { ...existing.project, isPersonal: true, role: 'OWNER' }

    const created = await db.project.create({
        data: {
            name: 'งานส่วนตัว',
            isPersonal: true,
            members: { create: { userId, role: 'OWNER' } },
        },
        select: { id: true, name: true },
    })
    return { ...created, isPersonal: true, role: 'OWNER' }
}

export async function getCurrentProject(userId: string): Promise<CurrentProject> {
    const wantedId = (await cookies()).get(CURRENT_PROJECT_COOKIE)?.value

    if (wantedId) {
        const membership = await db.projectMember.findUnique({
            where: { projectId_userId: { projectId: wantedId, userId }},
            select: { role: true, project: { select: { id: true, name:true, isPersonal: true } } },
        })
        if (membership) return { ...membership.project, role: membership.role }
    }

    return ensurePersonalProject(userId)
}