'use client'

import { startTransition, useOptimistic, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { moveToRoom } from "@/actions/office.actions"
import { FURNITURE, ROOMS, ROOM_ORDER, seatOf, type RoomKey } from "@/lib/office"
import type { UserSummary } from "@/types"
import { OfficeAvatar } from "./office-avatar"
import { ProjectEventsProvider, useProjectEvent } from "./project-events"

type OfficeMember = UserSummary & { room: RoomKey; currentTask: string | null }

type Props = {
    projectId: string
    meId: string
    isOwner: boolean
    members: OfficeMember[]
    // เนื้อหาของแต่ละห้อง สร้างเสร็จจาก server แล้วส่งมาเป็นชิ้นๆ
    // ห้องที่ไม่มีสิทธิ์ server ไม่ได้สร้างให้ (เป็น null) —  ข้อมูลไม่ถูกส่งมาที่ browser เลย
    panels: Record<RoomKey, ReactNode>
}

function MoveListener() {
    const router = useRouter()
    useProjectEvent((event) => {
        if (event.type === 'move') router.refresh()
    })
    return null
}

export function OfficeMap({ projectId, meId, isOwner, members, panels }: Props) {
    const [error, setError] = useState<string | null>(null)

    const [optimisticMembers, moveOptimistic] = useOptimistic(
        members,
        (state: OfficeMember[], room: RoomKey) =>
            state.map((m) => (m.id === meId ? { ...m, room } : m))
    )
    const me = optimisticMembers.find((m) => m.id === meId)

    // ให้ที่นั่งตามลำดับคนในแต่ละห้อง (เรียงตามวันที่เข้าทีมจาก server)
    const counters: Record<RoomKey, number> = { MANAGER: 0, WORK: 0, MEETING: 0, LOUNGE: 0 }
    const placed = optimisticMembers.map((m) => ({ ...m, point: seatOf(m.room, counters[m.room]++) }))

    function goTo(room: RoomKey) {
        if (!me || me.room === room) return
        if (ROOMS[room].ownerOnly && !isOwner) {
            setError('ห้องผู้จัดการเข้าได้เฉพาะเจ้าของ project')
            return
        }
        setError(null)
        startTransition(async () => {
            moveOptimistic(room)
            const result = await moveToRoom(room)
            if (!result.ok) setError(result.error)
        })
    }

    return (
        <ProjectEventsProvider projectId={projectId}>
            <MoveListener />
            {/* จอแคบเลื่อนแผนที่ซ้ายขวาได้ ไม่บีบจนตัวละครทับกัน */}
            <div className="mt-6 overflow-x-auto">
                <div className="relative aspect-[16/10] w-full min-w-[640px] overflow-hidden rounded-xl border-4 border-ink/80 bg-paper">
                    {ROOM_ORDER.map((key) => {
                        const r = ROOMS[key]
                        const locked = r.ownerOnly && !isOwner
                        const here = me?.room === key
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => goTo(key)}
                                aria-pressed={here}
                                aria-label={`${r.label}${here ? ' (คุณอยู่ที่นี่)' : ''}${locked ? ' (เฉพาะเจ้าของ)' : ''}`}
                                style={{ left: `${r.area.x}%`, top: `${r.area.y}%`, width: `${r.area.w}%`, height: `${r.area.h}%` }}
                                className={`office-floor absolute flex items-start justify-between p-3 text-left ${here ? 'outline-2 -outline-offset-4 outline-progress' : 'hover:brightness-95'
                                    } ${locked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                <span className="rounded-md bg-surface/90 px-2 py-0.5 font-display text-sm font-semibold">
                                    {r.label}
                                </span>
                                {locked && (
                                    <svg viewBox="0 0 16 16" className="size-4 text-ink-soft" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
                                        <rect x="3" y="7" width="10" height="7" rx="1.5" />
                                        <path d="M5 7V5a3 3 0 0 1 6 0v2" />
                                    </svg>
                                )}
                            </button>
                        )
                    })}

                    {FURNITURE.map((f, i) => (
                        <div
                            key={i}
                            aria-hidden="true"
                            style={{ left: `${f.x}%`, top: `${f.y}%`, width: `${f.w}%`, height: `${f.h}%` }}
                            className="pointer-events-none absolute rounded-md border border-ink/20 bg-line"
                        />
                    ))}

                    {placed.map((m) => (
                        <OfficeAvatar
                            key={m.id}
                            name={m.name}
                            image={m.image}
                            room={m.room}
                            point={m.point}
                            isMe={m.id === meId}
                            currentTask={m.currentTask}
                        />
                    ))}
                </div>
            </div>

            {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}

            <section aria-live="polite" className="mt-8">
                {me && panels[me.room]}
            </section>
        </ProjectEventsProvider>
    )
}