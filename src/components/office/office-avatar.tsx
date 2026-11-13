'use client'

import { useLayoutEffect, useRef } from "react"
import { Avatar } from "@/components/avatar"
import { walkPath, type Point, type RoomKey } from "@/lib/office"

type Props = {
    name: string
    image: string | null
    room: RoomKey
    point: Point
    isMe: boolean
    currentTask: string | null
}

export function OfficeAvatar({ name, image, room, point, isMe, currentTask }: Props) {
    const ref = useRef<HTMLDivElement>(null)
    // จำตำแหน่งรอบก่อน - useRef เปลี่ยนค่าแล้วไม่ทำให้วาดใหม่
    const previous = useRef({ room, point })

    // เช็คห้องฝั่ง browser - ตอนเดินออกจากห้องทำงาน (optimistic) ป้ายหายทันที
    // ไม่ต้องรอ server
    const showTask = room === 'WORK' && currentTask

    // useLayoutEffect = ทำงานหลัง React วาดตำแหน่งใหม่ แต่ก่อนจอแสดงผล
    // จึงเริ่ม animation จากจุดเดิมได้ทันที ไม่มีแวบที่ตัวละครโผล่ที่ปลายทางก่อน
    useLayoutEffect(() => {
        const from = previous.current
        previous.current = { room, point }

        const el = ref.current
        const map = el?.parentElement
        if (!el || !map) return
        if (from.room === room && from.point.x === point.x && from.point.y === point.y) return
        // ผู้ใช้ที่ตั้งค่าเครื่องให้ลดการเคลื่อนไหว - ย้ายทันที ไม่เดิน
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

        const { width, height } = map.getBoundingClientRect()
        const toPx = (p: Point) => ({ x: (p.x * width) / 100, y: (p.y * height) / 100 })
        const path = walkPath(from.point, from.room, point, room).map(toPx)
        const end = toPx(point)

        // ความเร็วคงที่: แต่ละช่วงใช้เวลาตามความยาว (offset = สัดส่วยระยะทางที่เดินมาแล้ว)
        const length = path.slice(1).map((p, i) => Math.hypot(p.x - path[i].x, p.y - path[i].y))
        const total = length.reduce((sum, d) => sum + d, 0)
        if (total === 0) return

        let walked = 0
        const keyframes = path.map((p, i) => {
            if (i > 0) walked += length[i - 1]
            return {
                offset: walked / total,
                // เลื่อน "ย้อน" จากตำแหน่งปลายทาง — ช่วงสุดท้ายคือ translate(0, 0) = จุดใหม่พอดี
                transform: `translate(${p.x - end.x}px, ${p.y - end.y}px)`,
            }
        })

        // Web Animation API — เหมือน CSS animation แต่สร้างจากโค๊ดได้
        el.animate(keyframes, { duration: Math.min(2400, Math.max(400, total * 3)) })
    }, [room, point])

    return (
        <div
            ref={ref}
            style={{ left: `${point.x}%`, top: `${point.y}%` }}
            className="pointer-events-none absolute -mt-4 -ml-4 flex w-8 flex-col items-center"
        >
            {showTask && (
                <span
                    title={currentTask}
                    className="absolute bottom-full left-1/2 mb-1 max-w-40 -translate-x-1/2 truncate rounded-md border border-line bg-surface px-2 text-[11px] leading-5 shadow-sm"
                >
                    {currentTask}
                </span>
            )}
            <span className={isMe ? 'rounded-full ring-2 ring-progress ring-offset-2 ring-offset-surface' : ''}>
                <Avatar name={name} image={image} decorative />
            </span>
            <span className="mt-1 whitespace-nowrap rounded bg-ink/85 px-1.5 text-[11px] leading-5 text-surface">
                {isMe ? 'คุณ' : name}
            </span>
        </div>
    )
}