'use server'

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireUser } from "@/lib/session"
import { TodoIdSchema } from "@/lib/validations/todo"
import { ATTACHMENT_BUCKET, detectImageType, storage } from "@/lib/storage"
import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE, MAX_FILES_PER_TODO } from "@/lib/attachments"
import { accessibleTodos } from "@/lib/access"

export type UploadState = { error: string | null }

export async function uploadAttachment(
    todoId: number,
    _prev: UploadState,
    formData: FormData
): Promise<UploadState> {
    const user = await requireUser()

    const idCheck = TodoIdSchema.safeParse(todoId)
    if (!idCheck.success) return { error: 'ข้อมูลไม่ถูกต้อง' }

    const file = formData.get('file')
    if (!(file instanceof File) || file.size === 0) return { error: 'เลือกรูปก่อนกดแนบ' }
    if (file.size > MAX_FILE_SIZE) return { error: 'รูปใหญ่เกิน 5 MB' }

    const todo = await db.todo.findFirst({
        where: { id: idCheck.data, ...accessibleTodos(user.id) },
        select: { id: true, _count: { select: { attachments: true } } },
    })
    if (!todo) return { error: 'ไม่พบงานนี้ อาจถูกลบไปแล้ว' }
    if (todo._count.attachments >= MAX_FILES_PER_TODO) {
        return { error: `แนบได้สูงสุด ${MAX_FILES_PER_TODO} รูปต่องาน ลบรูปเก่าก่อน` }
    }

    const bytes = new Uint8Array(await file.arrayBuffer())
    const type = detectImageType(bytes)
    if (!type) return { error: 'รองรับเฉพาะรูป JPG, PNG, WEBP, และ GIF' }

    const path = `todos/${todo.id}/${crypto.randomUUID()}.${ALLOWED_IMAGE_TYPES[type]}`

    const { error: uploadError } = await storage.from(ATTACHMENT_BUCKET).upload(path, bytes, {
        contentType: type,
        upsert: false,
    })
    if (uploadError) return { error: 'อัปโหลดไม่สำเร็จ ลองใหม่อีกครั้ง' }

    try {
        await db.attachment.create({
            data: {
                todoId: todo.id,
                path,
                fileName: file.name.slice(0, 255),
                mimeType: type,
                size: file.size,
                uploadedById: user.id,
            },
        })
    } catch {
        await storage.from(ATTACHMENT_BUCKET).remove([path])
        return { error: 'บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง' }
    }
    
    revalidatePath(`/todos/${todo.id}`)
    return { error: null }
}

export async function deleteAttachment(attachmentId: string): Promise<{ ok: boolean; error?: string  }> {
    const user = await requireUser()

    const parsed = z.string().min(1).max(50).safeParse(attachmentId)
    if (!parsed.success) return { ok: false, error: 'ข้อมูลไม่ถูกต้อง' }

    const attachment = await db.attachment.findFirst({
        where: { id: parsed.data, todo: accessibleTodos(user.id) },
        select: { id: true, path: true, todoId: true },
    })
    if (!attachment) return { ok: false, error: 'ไม่พบไฟล์นี้ อาจถูกลบไปแล้ว' }

    await db.attachment.delete({ where: { id: attachment.id } })
    await storage.from(ATTACHMENT_BUCKET).remove([attachment.path])

    revalidatePath(`/todos/${attachment.todoId}`)
    return { ok: true }
}