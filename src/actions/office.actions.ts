'use server'

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { requireUser } from "@/lib/session"
import { getCurrentProject } from "@/lib/current-project"
import { ROOMS, type RoomKey } from "@/lib/office"
import { RoomSchema } from "@/lib/validations/office"
import { publishProjectEvent } from "@/lib/realtime"
import type { ActionResult } from "./todo.actions"

export async function moveToRoom(room: RoomKey): Promise<ActionResult> {
    const user = await requireUser()

    const parsed = RoomSchema.safeParse(room)
    if (!parsed.success) return { ok: false, error: 'ข้อมูลไม่ถูกต้อง' }

    const project = await getCurrentProject(user.id)

    if (ROOMS[parsed.data].ownerOnly && project.role !== 'OWNER') {
        return { ok: false, error: 'ห้องผู้จัดการเข้าได้เฉพาะเจ้าของ project' }
    }

    try {
        await db.projectMember.update({
            where: { projectId_userId: { projectId: project.id, userId: user.id } },
            data: { room: parsed.data, roomAt: new Date() },
        })
        await publishProjectEvent(project.id, { type: 'move' })
    } catch {
        return { ok: false, error: 'ย้ายห้องไม่สำเร็จ ลองใหม่อีกครั้ง' }
    }

    revalidatePath('/office')
    return { ok: true }
}