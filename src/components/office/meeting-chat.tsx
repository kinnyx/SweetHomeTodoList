'use client'

import { useActionState, useEffect, useRef, useState } from "react"
import { sendMeetingMessage, type SendMessageState } from "@/actions/meeting.actions"
import { Avatar } from "../avatar"
import type { ChatMessage } from "@/types"
import { useProjectEvent } from "./project-events"

const timeFormat = new Intl.DateTimeFormat('th-TH', { timeStyle: 'short', timeZone: 'Asia/Bangkok' })
const initialState: SendMessageState = { error: null }

export function MeetingChat({ initialMessages, meId }: { initialMessages: ChatMessage[]; meId: string }) {
    const [messages, setMessages] = useState(initialMessages)
    const [state, formAction, isPending] = useActionState(sendMeetingMessage, initialState)
    const listRef = useRef<HTMLOListElement>(null)

    useProjectEvent((event) => {
        if (event.type !== 'chat') return
        setMessages((prev) => 
            // กันซ้ำ: ต่อสายใหม่หลังหลุด อาจได้ข้อความเดิมซ้ำ
            prev.some((m) => m.id === event.message.id)
                ? prev
                // เก็บแค่ 200 ล่าสุดในหน่วยความจำ - เปิดค้างทั้งวันก็ไม่บวม
                : [...prev, event.message].slice(-200)    
        )
    })

    // มีข้อความใหม่ -> เลื่อนลงล่างสุด
    useEffect(() => {
        const el = listRef.current
        if (el) el.scrollTop = el.scrollHeight
    }, [messages.length])

    return (
        <div className="mt-4 overflow-hidden rounded-lg border border-line bg-surface">
            {/* role="log" = screen reader อ่านข้อความใหม่ที่เข้ามาโดยไม่ต้องย้าย focus */}
            <ol ref={listRef} role="log" aria-label="แชทห้องประชุม" className="h-80 space-y-3 overflow-y-auto p-4">
                {messages.length === 0 && <li className="text-sm text-ink-soft">ยังไม่มีใครพิทพ์ - เริ่มคุยได้เลย</li>}
                {messages.map((m) => (
                    <li key={m.id} className="flex gap-3">
                        {m.author ? (
                            <Avatar name={m.author.name} image={m.author.image} size="sm" decorative />
                        ) : (
                            <span aria-hidden="true" className="size-6 shrink-0 rounded-full bg-line" />
                        )}
                        <div className="min-w-0">
                            <p className="text-sm">
                                <span className="font-medium">
                                    {m.author?.id === meId ? 'คุณ' : (m.author?.name ?? 'บัญชีที่ถูกลบแล้ว')}
                                </span>{' '}
                                <time dateTime={m.createdAt} className="text-xs text-ink-soft">
                                    {timeFormat.format(new Date(m.createdAt))}
                                </time>
                            </p>
                            {/* pre-wrap = เคารพการขึ้นบรรทัด, break-words = URL ยาว ๆ ไม่ดันกล่องล้น
                                React escape ข้อความให้เสอ - พิมพ์ <script> มาก็แสดงเป็นตัวอักษร */}
                            <p className="whitespace-pre-wrap break-words">{m.body}</p>
                        </div>
                    </li>
                ))}
            </ol>

            <form action={formAction} className="flex gap-2 border-t border-line p-3">
                <label htmlFor="chat-body" className="sr-only">ข้อความ</label>
                <input
                    id="chat-body"
                    name="body"
                    required
                    maxLength={1000}
                    autoComplete="off"
                    placeholder="พิมพ์ข้อความ"
                    className="min-w-0 flex-1 rounded-md border border-line bg-surface px-3 py-2"
                />
                <button
                    type="submit"
                    disabled={isPending}
                    className="rounded-md bg-ink px-4 py-2 text-sm text-surface hover:bg-ink/85 disabled:bg-ink-soft"
                >
                    {isPending ? 'กำลังส่ง...' : 'ส่ง'}
                </button>
            </form>
            {state.error && <p role="alert" className="px-3 pb-3 text-sm text-danger">{state.error}</p>}
        </div>
    )
}
