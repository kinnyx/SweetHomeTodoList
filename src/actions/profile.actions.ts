'use server'

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { 
    AVATAR_BUCKET, 
    MAX_AVATAR_SIZE,
    avatarPathFromUrl,
    avatarPublicUrl,
    detectImageType,
    storage,
} from "@/lib/storage"
import { ALLOWED_IMAGE_TYPES } from "@/lib/attachments"
import type { ActionResult } from "./todo.actions"
import { requireUser } from "@/lib/session"

export type AvatarFormState = { error: string | null }

async function removeOwnAvatarFile(userId: string, imageUrl: string | null | undefined) {
    const path = avatarPathFromUrl(imageUrl)
    if (path && path.startsWith(`users/${userId}/`)) {
        await storage.from(AVATAR_BUCKET).remove([path])
    }
}

export async function uploadAvatar(
    _prev: AvatarFormState,
    formData: FormData
): Promise<AvatarFormState> {
    const user = await requireUser()

    const file = formData.get('avatar')
    if (!(file instanceof File) || file.size === 0) return { error: 'เลือกรูปก่อน' }
    if (file.size > MAX_AVATAR_SIZE) return { error: 'รูปใหญ่เกิน 2 MB' }

    const bytes = new Uint8Array(await file.arrayBuffer())
    const type = detectImageType(bytes)

    if (!type || type === 'image/gif') return { error: 'รองรับเฉพาะ JPG, PNG และ WEBP' }

    const path = `users/${user.id}/${crypto.randomUUID()}.${ALLOWED_IMAGE_TYPES[type]}`

    const { error: uploadError } = await storage.from(AVATAR_BUCKET).upload(path, bytes, {
        contentType: type,
        upsert: false,
    })
    if (uploadError) return { error: 'อัปโหลดไม่สำเร็จ ลองใหม่อีกครั้ง' }

    try {
        await auth.api.updateUser({
            body: { image: avatarPublicUrl(path) },
            headers: await headers(),
        })
    } catch {
        await storage.from(AVATAR_BUCKET).remove([path])
        return { error: 'บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง' }
    }

    await removeOwnAvatarFile(user.id, user.image)

    revalidatePath('/', 'layout')
    return { error: null }
}

export async function removeAvatar(): Promise<ActionResult> {
    const user = await requireUser()
    if (!user.image) return { ok: true }

    try {
        await auth.api.updateUser({ body: { image: null }, headers: await headers() })
    } catch {
        return { ok: false, error: 'ลบรูปไม่สำเร็จ ลองใหม่อีกครั้ง' }
    }

    await removeOwnAvatarFile(user.id, user.image)
    revalidatePath('/', 'layout')
    return { ok: true }
}