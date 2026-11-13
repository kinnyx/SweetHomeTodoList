// [จุดประสงค์]: ประกาศเหตุการณ์ผ่าน PostgreSQL และกระจายให้ผู้ฟังใน server นี้
import 'server-only'
import { EventEmitter } from 'node:events'
import { Client } from 'pg'
import { db } from '@/lib/db'
import type { ProjectEvent } from '@/types'

const CHANNEL = 'project_events'

// ── ฝั่งประกาศ ───────────────────────────────────────────────────
export async function publishProjectEvent(projectId: string, event: ProjectEvent) {
    // $executeRaw แบบ tagged template = ค่าใน ${} ถูกส่งเป็น parameter เสมอ ไม่มี SQL injection
    // payload ของ NOTIFY ได้ไม่เกิน ~8,000 byte - ข้อความ 1,000 ตัวอักษรไทยราว 3,000 byte ยังพอ
    await db.$executeRaw`SELECT pg_notify(${CHANNEL}, ${JSON.stringify({ projectId, event })})`
}

// ── ฝั่งฟัง ──────────────────────────────────────────────────────
type Hub = { emitter: EventEmitter; ready: Promise<void> }
const globalForHub = globalThis as unknown as { projectHub?: Hub }

function startHub(): Hub {
    const emitter = new EventEmitter()
    // ผู้ฟังหลายคนต่อ project เป็นเรื่องปกติ - ปิดคำเตือน "listener เยอะเกิน"
    emitter.setMaxListeners(0)

    const client = new Client({ connectionString: process.env.DATABASE_URL })
    const reset = () => {
        globalForHub.projectHub = undefined // ครั้งหน้ามีคนต่อเข้ามา จะสร้างใหม่เอง
    }

    const ready = (async () => {
        await client.connect()
        client.on('notification', (msg) => {
            if (msg.channel !== CHANNEL || !msg.payload) return
            try {
                const { projectId, event } = JSON.parse(msg.payload) as { projectId: string; event: ProjectEvent }
                // ใช้ projectId เป็นชื่อเหตุการณ์ - ผู้ฟังได้เฉพาะของ project ตัวเอง
                emitter.emit(projectId, event)
            } catch {

            }
        })
        client.on('error', reset)
        client.on('end', reset)
        await client.query(`LISTEN ${CHANNEL}`)
    })()
    ready.catch(reset)

    return { emitter, ready }
}

export async function subscribProject(projectId: string, listener: (event: ProjectEvent) => void) {
    // globalthis เหมือน db.ts - hot reload ตอน dev จะไม่สร้างตัวฟังซ้อนกัน
    globalForHub.projectHub ??= startHub()
    const hub = globalForHub.projectHub
    await hub.ready
    hub.emitter.on(projectId, listener)
    return () => {
        hub.emitter.off(projectId, listener)
    }
}

