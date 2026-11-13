'use server'

import { z } from "zod"
import { db } from "@/lib/db"
import { requireUser } from "@/lib/session"
import { getCurrentProject } from "@/lib/current-project"
import { publishProjectEvent } from "@/lib/realtime"
import { messageSelect, toChatMessage } from "@/lib/meeting"

export type SendMessageState = { error: string | null }

const MessageSchema = z.object({
    body: z.string().trim().min(1, 'พิมพ์ข้อความก่อนส่ง').max(1000, 'ข้อความยาวเกิน 1,000 ตัวอักษร'),
})

export async function sendMeetingMessage(
    _prev: SendMessageState,
    formData: FormData
): Promise<SendMessageState> {
    const user = await requireUser()

    const parsed = MessageSchema.safeParse({ body: formData.get('body') })
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'ข้อมูลไม่ถูกต้อง' }

    const project = await getCurrentProject(user.id)

    // กติกาแบบเกม: ต้องอยู่ในห้องประชุมจริงถึงพูดได้ - เช็คจาก DB ไม่ใช่จากหน้าจอ
    const me = await db.projectMember.findUnique({
        where: { projectId_userId: { projectId: project.id, userId: user.id } },
        select: { room: true },
    })
    if (me?.room !== 'MEETING') return { error: 'เดินเข้าห้องประชุมก่อนจึงจะพิมพ์แชทได้' }

    try {
        const saved = await db.meetingMessage.create({
            data: { projectId: project.id, authorId: user.id, body: parsed.data.body },
            select: messageSelect,
        })
        // บันทึกสำเร็จแล้วค่อยประกาศ - ไม่มีข้อความที่คนอื่นเห็นแต่ไม่อยู่ใน DB
        await publishProjectEvent(project.id, { type: 'chat', message: toChatMessage(saved) })
    } catch {
        return { error: 'ส่งไม่สำเร็จ ลองใหม่อีกครั้ง' }
    }

    // ไม่ต้อง revalidatePath - ข้อความไปถึงทุกคน (รวมตัวเอง) ทาง SSE แล้ว
    return { error: null }
}