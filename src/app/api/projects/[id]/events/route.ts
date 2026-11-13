import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getProjectRole } from "@/lib/access";
import { ProjectIdSchema } from "@/lib/validations/project";
import { subscribProject } from "@/lib/realtime";
import type { ProjectEvent } from "@/types";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    // proxy.ts ไม่ได้ครอบ /api - route นี้ต้องตรวจเองทั้งหมด
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) return new Response('Unauthorized', { status: 401 })

    const { id } = await params
    const parsed = ProjectIdSchema.safeParse(id)
    // ไม่ใช่สมาชิก = 404 เหมือนหน้าเว็บ - ไม่บอกว่ามี project นี้
    if (!parsed.success || !(await getProjectRole(session.user.id, parsed.data))) {
        return new Response('Not found', { status: 404 })
    }

    const encoder = new TextEncoder()
    let cleanup = () => {}

    const stream = new ReadableStream({
        async start(controller) {
            const send = (chunk: string) => {
                try {
                    controller.enqueue(encoder.encode(chunk))
                } catch {
                    cleanup()
                }
            }

            const unsubscribe = await subscribProject(parsed.data, (event: ProjectEvent) => {
                if (event.type === 'kicked') {
                    if (event.userId === session.user.id) {
                        send(`event: kicked\ndata: ${JSON.stringify(event)}\n\n`)
                        cleanup()
                        try {
                            controller.close()
                        } catch {}
                        return
                    }
                    // ✅ คนอื่นถูกนำออก → สำหรับเรามันคือ "รายชื่อคนในออฟฟิศเปลี่ยน"
                    //    ส่งเป็น move ให้แผนที่ดึงข้อมูลใหม่ ตัวละครคนนั้นจะหายไป
                    //    และไม่ต้องส่ง userId ของคนอื่นลงไปที่ browser โดยไม่จำเป็น
                    send(`event: move\ndata: ${JSON.stringify({ type: 'move' })}\n\n`)
                    return
                }
                send(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`)
            })

            // ส่ง "ping" ทุก 25 วินาที - proxy/firewall บางตัวตัดการเชื่อมต่อที่เงียบนานเกิน
            // บรรทัดขึ้นต้นด้วย ":" คือ comment ใน SSH - browser ไม่สนใจ
            const heartbeat = setInterval(() => send(': ping\n\n'), 25_000)

            cleanup = () => {
                clearInterval(heartbeat)
                unsubscribe()
            }

            request.signal.addEventListener('abort', () => {
                cleanup()
                try {
                    controller.close()
                } catch {}
            })

            send('retry: 3000\n\n')
        },
        cancel() {
            cleanup()
        },
    })

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
        }
    })
}