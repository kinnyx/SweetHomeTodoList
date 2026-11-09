'use server'

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireUser } from "@/lib/session"
import { WIP_LIMIT } from "@/lib/kanban"
import { ATTACHMENT_BUCKET, storage } from "@/lib/storage"
import { accessibleTodos, findAccessibleTodo } from "@/lib/access"
import {
    CreateTodoSchema,
    StatusSchema,
    TodoIdSchema,
    UpdateTodoSchema,
} from "@/lib/validations/todo"
import type { Status } from "@/types"
import { getCurrentProject } from "@/lib/current-project"


export type ActionResult = { ok: true } | { ok: false; error: string }
export type CreateTodoState = { error: string | null }
export type TodoFormValues = { title: string; note: string; status: string; priority: string }
export type UpdateTodoState = {
    error: string | null
    saved: boolean
    values?: TodoFormValues
}

const NOT_FOUND = 'ไม่พบงานนี้ อาจถูกลบไปแล้ว'

async function checkWipLimit(projectId: string, todoId: number): Promise<string | null> {
    const inProgress = await db.todo.count({
        where: { projectId, status: 'IN_PROGRESS', id: { not: todoId } },
    })
    return inProgress >= WIP_LIMIT
        ? `"กำลังทำ" มีได้ไม่เกิน ${WIP_LIMIT} งาน — ทำให้เสร็จหรือย้ายออกก่อน`
        : null
}

export async function createTodo(
    _prevState: CreateTodoState,
    formData: FormData
): Promise<CreateTodoState> {
    const user = await requireUser()

    const parsed = CreateTodoSchema.safeParse({
        title: formData.get('title'),
        priority: formData.get('priority'),
        note: formData.get('note'),
    })

    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? 'ข้อมูลไม่ถูกต้อง' }
    }

    try {
        const project = await getCurrentProject(user.id)
        if (!project) return { error: 'ไม่พบ project ส่วนตัวของคุณ' }

        await db.todo.create({ data: { ...parsed.data, projectId: project.id, createdById: user.id }, })
    } catch {
        return { error: 'บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง' }
    }

    revalidatePath('/', 'layout')
    return { error: null }
}

export async function setTodoStatus(id: number, status: Status): Promise<ActionResult> {
    const user = await requireUser()

    // await new Promise((r) => setTimeout(r, 2000))
    // return { ok: false, error: 'ทดสอบ error' }

    const parsed = z.object({ id: TodoIdSchema, status: StatusSchema }).safeParse({ id, status })
    if (!parsed.success) return { ok: false, error: 'ข้อมูลไม่ถูกต้อง' }

    try {
        const todo = await findAccessibleTodo(user.id, parsed.data.id)
        if (!todo) return { ok: false, error: NOT_FOUND }

        if (parsed.data.status === 'IN_PROGRESS') {
            const wipError = await checkWipLimit(todo.projectId, todo.id)
            if (wipError) return { ok: false, error: wipError }
        }

        await db.todo.update({
            where: { id: todo.id },
            data: { status: parsed.data.status }
        })
    } catch {
        return { ok: false, error: NOT_FOUND }
    }

    revalidatePath('/', 'layout')
    return { ok: true }
}

export async function updateTodo(
    id: number,
    _prev: UpdateTodoState,
    formData: FormData
): Promise<UpdateTodoState> {
    const user = await requireUser()

    const values: TodoFormValues = {
        title: String(formData.get('title') ?? ''),
        note: String(formData.get('note') ?? ''),
        status: String(formData.get('status') ?? ''),
        priority: String(formData.get('priority') ?? ''),
    }

    const idCheck = TodoIdSchema.safeParse(id)
    if (!idCheck.success) return { error: 'ข้อมูลไม่ถูกต้อง', saved: false, values }

    const parsed = UpdateTodoSchema.safeParse(values)
    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? 'ข้อมูลไม่ถูกต้อง', saved: false, values }
    }

    try {
        const todo = await findAccessibleTodo(user.id, idCheck.data)
        if (!todo) return { error: NOT_FOUND, saved: false, values }

        if (parsed.data.status === 'IN_PROGRESS') {
            const wipError = await checkWipLimit(todo.projectId, todo.id)
            if (wipError) return { error: wipError, saved: false, values }
        }

        await db.todo.update({
            where: { id: todo.id },
            data: parsed.data
        })
    } catch {
        return { error: 'บันทึกไม่สำเร็จ - งานนี้อาจถูกลบไปแล้ว', saved: false, values }
    }

    revalidatePath('/', 'layout')
    return { error: null, saved: true }
}


export async function deleteTodo(id: number): Promise<ActionResult> {
    const user = await requireUser()

    const parsed = TodoIdSchema.safeParse(id)
    if (!parsed.success) return { ok: false, error: 'ข้อมูลไม่ถูกต้อง' }

    let paths: string[] = []

    try {
        const todo = await findAccessibleTodo(user.id, parsed.data)
        if (!todo) return { ok: false, error: NOT_FOUND }

        const attachments = await db.attachment.findMany({
            where: { todoId: todo.id },
            select: { path: true },
        })
        paths = attachments.map((a) => a.path)

        await db.todo.delete({ where: { id: todo.id } })
    } catch {
        return { ok: false, error: 'ลบไม่สำเร็จ อาจถูกลบไปแล้ว' }
    }

    if (paths.length > 0) {
        await storage.from(ATTACHMENT_BUCKET).remove(paths)
    }

    revalidatePath('/', 'layout')
    return { ok: true }
}

export async function completeAllTodos(): Promise<ActionResult> {
    const user = await requireUser()
    const project = await getCurrentProject(user.id)
    const scope = { ...accessibleTodos(user.id), projectId: project.id }

    try {
        await db.todo.updateMany({
            where: { ...scope, status: { not: 'DONE' } },
            data: { status: 'DONE' },
        })
    } catch {
        return { ok: false, error: 'บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง' }
    }

    revalidatePath('/', 'layout')
    return { ok: true }
}

export async function deleteCompletedTodos(): Promise<ActionResult> {
    const user = await requireUser()
    const project = await getCurrentProject(user.id)
    const scope = { ...accessibleTodos(user.id), projectId: project.id }

    let paths: string[] = []

    try {
        const attachments = await db.attachment.findMany({
            where: { todo: { ...scope, status: 'DONE' } },
            select: { path: true },
        })
        paths = attachments.map((a) => a.path)

        await db.todo.deleteMany({ where: { ...scope, status: 'DONE' } })
    } catch {
        return { ok: false, error: 'ลบไม่สำเร็จ ลองใหม่อีกครั้ง' }
    }

    if (paths.length > 0) {
        await storage.from(ATTACHMENT_BUCKET).remove(paths)
    }

    revalidatePath('/', 'layout')
    return { ok: true }
}

export async function duplicateTodo(id: number): Promise<ActionResult> {
    const user = await requireUser()

    const parsed = TodoIdSchema.safeParse(id)
    if (!parsed.success) return { ok: false, error: 'ข้อมูลไม่ถูกต้อง' }

    let newId: number

    try {
        const original = await db.todo.findFirst({
            where: { id: parsed.data, ...accessibleTodos(user.id) },
            select: { title: true, note: true, priority: true, projectId: true },
        })
        if (!original) return { ok: false, error: NOT_FOUND }

        const copy = await db.todo.create({
            data: {
                title: `สำเนา: ${original.title}`.slice(0, 255),
                note: original.note,
                priority: original.priority,
                projectId: original.projectId,
                createdById: user.id,
            },
            select: { id: true },
        })
        newId = copy.id
    } catch {
        return { ok: false, error: 'ทำสำเนาไม่สำเร็จ ลองใหม่อีกครั้ง' }
    }

    revalidatePath('/', 'layout')
    redirect(`/todos/${newId}`)
}