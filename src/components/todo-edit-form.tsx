'use client'

import { useActionState } from "react"
import { updateTodo, type UpdateTodoState } from "@/actions/todo.actions"
import type { Priority , Status} from '@/types'
import { PRIORITY_LABEL, PRIORITY_ORDER } from "@/lib/priority"
import { StatusPicker } from "./status-picker"

type EditableTodo = {
    id:number
    title: string
    note: string | null
    status: Status
    priority: Priority
}

const initialState: UpdateTodoState = { error: null, saved: false }

export function TodoEditForm({ todo }: { todo: EditableTodo }) {
    const updateThisTodo = updateTodo.bind(null, todo.id)
    const [state, formAction, isPending] = useActionState(updateThisTodo, initialState)

    const v = state.values ?? {
        title: todo.title,
        note: todo.note ?? '',
        status: todo.status,
        priority: todo.priority,
    }

    return (
        <form action={formAction} className="mt-8 space-y-6">
            <div className="space-y-1">
                <label htmlFor="title" className="block text-sm font-medium">ชื่องาน</label>
                <input
                    id="title"
                    name="title"
                    defaultValue={v.title}
                    required
                    maxLength={255}
                    className="w-full rounded-md border border-line bg-surface px-3 py-2"
                />
            </div>

            <div className="space-y-1">
                <label htmlFor="note" className="block text-sm font-medium">รายละเอียด</label>
                <textarea 
                    id="note" 
                    name="note"
                    defaultValue={v.note}
                    rows={6}
                    maxLength={5000}
                    placeholder="ขั้นตอน ลิงก์ หรือสิ่งที่ต้องจำ"
                    className="w-full rounded-md border border-line bg-surface px-3 py-2" 
                />
            </div>

            <StatusPicker defaultValue={v.status} />

            <div className="space-y-1">
                <label htmlFor="priority" className="block text-sm font-medium">ความสำคัญ</label>
                <select 
                    id="priority"
                    name="priority"
                    defaultValue={v.priority}
                    className="rounded-md border border-line bg-surface px-3 py-2"
                >
                    {PRIORITY_ORDER.map((p) => (
                        <option key={p} value={p}>
                            {PRIORITY_LABEL[p]}
                        </option>
                    ))}
                </select>
            </div>

            <div className="flex items-center gap-3">
                <button
                    type="submit"
                    disabled={isPending}
                    className="rounded-md bg-ink px-4 py-2 text-sm text-surface hover:bg-ink/85 disabled:bg-ink-soft"
                >
                    {isPending ? 'กำลังบันทึก...' : 'บันทึกงาน'}
                </button>
                    <p aria-live="polite" className="text-sm">
                        {state.error && <span className="text-danger">{state.error}</span>}
                        {state.saved && !isPending && <span className="text-done">บันทึกงานแล้ว</span>}
                    </p>
            </div>
        </form>
    )
}