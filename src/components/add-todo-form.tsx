'use client'

import { useActionState } from "react"
import { createTodo, type CreateTodoState } from '@/actions/todo.actions'
import { PRIORITY_LABEL, PRIORITY_ORDER } from "@/lib/priority"

const initialState: CreateTodoState = { error: null }

export function AddTodoForm() {
    // 📌 useActionState เชื่อม form กับ Server Action ให้ 3 อย่าง:
    //    state     = ผลลัพธ์ล่าสุดที่ action ส่งกลับ (มี error ไหม)
    //    formAction = ใส่ใน <form action={...}>
    //    isPending = กำลังส่งอยู่หรือเปล่า (เอาไว้ปิดปุ่ม กันกดซ้ำ)
    const [state, formAction, isPending] = useActionState(createTodo, initialState)

    return (
        <form action={formAction} className="mt-8 space-y-2">
            <div className="flex gap-2">
                <input 
                    name="title"
                    required
                    maxLength={255}
                    placeholder="เพิ่มงานใหม่"
                    aria-label="ชื่องาน"
                    className="flex-1 rounded-md border border-line px-3 py-2"
                />
                <select 
                    name="priority"
                    defaultValue="MEDIUM"
                    aria-label="ความสำคัญ"
                    className="rounded-md border border-line px-2"
                >
                    {PRIORITY_ORDER.map((p) => (
                        <option key={p} value={p}>
                            {PRIORITY_LABEL[p]}
                        </option>
                    ))}
                </select>
            </div>

            <input 
                name="note"
                maxLength={500}
                placeholder="รายละเอียด (ไม่บังคับ)"
                aria-label="รายละเอียด"
                className="w-full rounded-md border border-line px-3 py-2 text-sm" 
            />

            <button
                type="submit"
                disabled={isPending}
                className="rounded-md bg-ink px-4 py-2 text-sm text-surface hover:bg-ink/85 disabled:bg-ink-soft"
            >
                {isPending ? "กำลังเพิ่ม..." : 'เพิ่มงาน'}
            </button>

            {state.error && (
                <p role="alert" className="text-sm text-danger">
                    {state.error}
                </p>
            )}
        </form>
    )
}