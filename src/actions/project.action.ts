'use server'

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { requireUser } from "@/lib/session"
import { getProjectRole } from "@/lib/access"
import { CURRENT_PROJECT_COOKIE } from "@/lib/current-project"
import { ATTACHMENT_BUCKET, storage } from "@/lib/storage"
import { InviteSchema, ProjectIdSchema, ProjectNameSchema } from "@/lib/validations/project"
import type { ActionResult } from "./todo.actions"

export type ProjectFormState = { error: string | null; message?: string }

const NOT_FOUND = 'ไม่พบ Project นี้'
const BAD_INPUT = 'ข้อมูลไม่ถูกต้อง'

async function setCurrentProjectCookie(projectId: string) {
    ;(await cookies()).set(CURRENT_PROJECT_COOKIE, projectId, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
    })
}

async function clearCurrentProjectIf(projectId: string) {
    const store = await cookies()
    if (store.get(CURRENT_PROJECT_COOKIE)?.value === projectId) {
        store.delete(CURRENT_PROJECT_COOKIE)
    }
}

export async function switchProject(projectId: string): Promise<ActionResult> {
    const user = await requireUser()

    const parsed = ProjectIdSchema.safeParse(projectId)
    if (!parsed.success) return { ok: false, error: BAD_INPUT }

    const role = await getProjectRole(user.id, parsed.data)
    if (!role) return { ok: false, error: NOT_FOUND }

    await setCurrentProjectCookie(parsed.data)
    revalidatePath('/', 'layout')
    return { ok: true }
}

export async function openProject(projectId: string): Promise<ActionResult> {
    const result = await switchProject(projectId)
    if (!result.ok) return result
    redirect('/')
}

export async function createProject(
    _prev: ProjectFormState,
    formData: FormData
): Promise<ProjectFormState> {
    const user = await requireUser()

    const parsed = ProjectNameSchema.safeParse({ name: formData.get('name') })
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? BAD_INPUT }

    let projectId: string
    try {
        const project = await db.project.create({
            data: {
                name: parsed.data.name,
                members: { create: { userId: user.id, role: 'OWNER' } },
            },
            select: { id: true },
        })
        projectId = project.id
    } catch {
        return { error: 'สร้าง project ไม่สำเร็จ ลองใหม่อีกครั้ง' }
    }

    await setCurrentProjectCookie(projectId)
    revalidatePath('/', 'layout')
    redirect(`/project/${projectId}`)
}

export async function inviteMember(
    projectId: string,
    _prev: ProjectFormState,
    formData: FormData
): Promise<ProjectFormState> {
    const user = await requireUser()

    const idCheck = ProjectIdSchema.safeParse(projectId)
    if (!idCheck.success) return { error: BAD_INPUT }

    const parsed = InviteSchema.safeParse({ email: formData.get('email') })
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? BAD_INPUT }

    const role = await getProjectRole(user.id, idCheck.data)
    if (!role) return { error: NOT_FOUND }
    if (role !== 'OWNER') return { error: 'เฉพาะเจ้าของ project ที่เชิญสมาชิกได้' }

    const project = await db.project.findUnique({
        where: { id: idCheck.data },
        select: { isPersonal: true },
    })
    if (project?.isPersonal) return { error: 'project ส่วนตัวเชิญคนอื่นไม่ได้ — สร้าง project ใหม่สำหรับทีม' }

    const invitee = await db.user.findFirst({
        where: { email: parsed.data.email },
        select: { id: true, name: true },
    })
    if (!invitee) return { error: 'ไม่พบผู้ใช้อีเมลนี้ — ให้เขาสมัครสมาชิกก่อน แล้วค่อยเชิญอีกครั้ง' }

    if (await getProjectRole(invitee.id, idCheck.data)) {
        return { error: `${invitee.name} เป็นสมาชิกอยู่แล้ว` }
    }

    try {
        await db.projectMember.create({
            data: { projectId: idCheck.data, userId: invitee.id, role: 'MEMBER' },
        })
    } catch {
        return { error: 'เชิญไม่สำเร็จ ลองใหม่อีกครั้ง' }
    }

    revalidatePath(`/projects/${idCheck.data}`)
    return { error: null, message: `เพิ่ม ${invitee.name} เข้า project แล้ว` }
}

export async function removeMember(projectId: string, memberUserId: string): Promise<ActionResult> {
    const user = await requireUser()

    const idCheck = ProjectIdSchema.safeParse(projectId)
    const memberCheck = ProjectIdSchema.safeParse(memberUserId)
    if (!idCheck.success || !memberCheck.success) return { ok: false, error: BAD_INPUT }

    const role = await getProjectRole(user.id, idCheck.data)
    if (!role) return { ok: false, error: NOT_FOUND }
    if (role !== 'OWNER') return { ok: false, error: 'เฉพาะเจ้าของ project ที่ลบสมาชิกได้' }
    if (memberCheck.data === user.id) {
        return { ok: false, error: 'เจ้าของออกจาก project ไม่ได้ — ลบ project แทน' }
    }

    const { count } = await db.projectMember.deleteMany({
        where: { projectId: idCheck.data, userId: memberCheck.data, role: 'MEMBER' },
    })
    if (count === 0) return { ok: false, error: 'ไม่พบสมาชิกคนนี้ อาจถูกลบไปแล้ว' }

    revalidatePath(`/projects/${idCheck.data}`)
    return { ok: true }
}

export async function leaveProject(projectId: string): Promise<ActionResult> {
    const user = await requireUser()

    const parsed = ProjectIdSchema.safeParse(projectId)
    if (!parsed.success) return { ok: false, error: BAD_INPUT }

    const role = await getProjectRole(user.id, parsed.data)
    if (!role) return { ok: false, error: NOT_FOUND }
    if (role === 'OWNER') return { ok: false, error: 'เจ้าของออกจาก project ไม่ได้ — ลบ project แทน' }

    try {
        await db.projectMember.delete({
            where: { projectId_userId: { projectId: parsed.data, userId: user.id } },
        })
    } catch {
        return { ok: false, error: 'ออกจาก project ไม่สำเร็จ ลองใหม่อีกครั้ง' }
    }

    await clearCurrentProjectIf(parsed.data)
    revalidatePath('/', 'layout')
    redirect('/projects')
}

export async function deleteProject(projectId: string): Promise<ActionResult> {
    const user = await requireUser()

    const parsed = ProjectIdSchema.safeParse(projectId)
    if (!parsed.success) return { ok: false, error: BAD_INPUT }

    const role = await getProjectRole(user.id, parsed.data)
    if (!role) return { ok: false, error: NOT_FOUND }
    if (role !== 'OWNER') return { ok: false, error: 'เฉพาะเจ้าของที่ลบ project ได้' }

    let paths: string[] = []
    try {
        const project = await db.project.findUnique({
            where: { id: parsed.data },
            select: { isPersonal: true },
        })
        if (project?.isPersonal) return { ok: false, error: 'ลบ project ส่วนตัวไม่ได้' }

        const attachments = await db.attachment.findMany({
            where: { todo: { projectId: parsed.data } },
            select: { path: true },
        })
        paths = attachments.map((a) => a.path)

        await db.project.delete({ where: { id: parsed.data } })
    } catch {
        return { ok: false, error: 'ลบ project ไม่สำเร็จ ลองใหม่อีกครั้ง' }
    }

    if (paths.length > 0) await storage.from(ATTACHMENT_BUCKET).remove(paths)

    await clearCurrentProjectIf(parsed.data)
    revalidatePath('/', 'layout')
    redirect('/projects')
}