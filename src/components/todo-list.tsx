'use client'

import { startTransition, useOptimistic, useState } from "react"
import type { Todo } from "@/types"
import { TodoItem } from "./todo-item"
import {
    completeAllTodos,
    deleteCompletedTodos,
    deleteTodo,
    setTodoStatus,
    type ActionResult,
} from '@/actions/todo.actions'

type Filter = 'all' | 'active' | 'done'

const filterOptions: { value: Filter; label: string }[] =[
    { value: 'all', label: 'ทั้งหมด' },
    { value: 'active', label: 'ยังไม่เสร็จ' },
    { value: 'done', label: 'เสร็จแล้ว' },
]

type OptimisticAction = 
    | { type: 'toggle'; id: number }
    | { type: 'delete'; id: number }
    | { type: 'completeAll' }
    | { type: 'deleteCompleted' }

function applyChange(state: Todo[], action: OptimisticAction): Todo[] {
    switch (action.type) {
        case 'toggle':
            return state.map((t) =>
                t.id === action.id ? { ...t, status: t.status === 'DONE' ? 'TODO' : 'DONE' } : t
            )
        case 'delete':
            return state.filter((t) => t.id !== action.id)
        case 'completeAll':
            return state.map((t) => ({ ...t, status: 'DONE' }))
        case 'deleteCompleted':
            return state.filter((t) => t.status !== 'DONE')
    }
}

export function TodoList({ todos }: { todos: Todo[] }) {
    const [filter, setFilter] = useState<Filter>('all')
    const [error, setError] = useState<string | null>(null)

    const [optimisticTodos, addOptimistic] = useOptimistic(todos, applyChange)

    const remaining = optimisticTodos.filter((t) => t.status !== 'DONE').length
    const doneCount = optimisticTodos.length - remaining
    const visibleTodos = optimisticTodos.filter((t) => {
        if (filter === 'active') return t.status !== 'DONE'
        if (filter === 'done') return t.status === 'DONE'
        return true 
    })

    function run(change: OptimisticAction, serverCall: () => Promise<ActionResult>) {
        setError(null)
        startTransition(async () => {
            addOptimistic(change)
            const result = await serverCall()
            if (!result.ok) setError(result.error)
        })
    }

    function handleToggle(id: number) {
        const todo = optimisticTodos.find((t) => t.id === id)
        if (!todo) return
        const next = todo.status === 'DONE' ? 'TODO' : 'DONE'
        run({ type: 'toggle', id }, () => setTodoStatus(id, next))
    }

    function handleDelete(id: number) {
        if (!window.confirm('ลบงานนี้ใช่ไหม')) return
        run({ type: 'delete', id }, () => deleteTodo(id))
    }

    function handleCompleteAll() {
        run({ type: 'completeAll' }, completeAllTodos)
    }

    function handleDeleteCompleted() {
        // ✅ บอกจำนวนให้ชัด ผู้ใช้จะได้รู้ว่ากำลังจะลบอะไร
        if (!window.confirm(`ลบงานที่เสร็จแล้ว ${doneCount} งานใช่ไหม?`)) return
        run({ type: 'deleteCompleted' }, deleteCompletedTodos)  }

    return (
        <>
            <p className="mt-1 text-ink-soft">เหลืออีก {remaining} งาน</p>

            <div className="mt-6 flex gap-2">
                {filterOptions.map((opt) => (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFilter(opt.value)}
                        aria-pressed={filter === opt.value}
                        className={`rounded-md px-3 py-1.5 text-sm ${
                            filter === opt.value
                                ? 'bg-ink text-surface'
                                : 'bg-paper text-ink hover:bg-line'
                        }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            {error && (
                <p role="alert" className="mt-4 text-sm text-danger">
                    {error}
                </p>
            )}

            {/* ✅ แผ่นเดียว: ขอบรอบนอก + เส้นแบ่งระหว่างแถว (divide-y) */}
            <ul className="mt-4 divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
                {visibleTodos.map((todo) => (
                    <TodoItem key={todo.id} todo={todo} onToggle={handleToggle} onDelete={handleDelete} />
                ))}
            </ul>

            {visibleTodos.length === 0 && (
                <p className="mt-4 text-sm text-ink-soft">ไม่มีงานในหมวดนี้</p>
            )}

            <div className="mt-6 flex gap-4">
                <button
                    type="button"
                    onClick={handleCompleteAll}
                    disabled={remaining === 0}
                    className="text-sm text-ink-soft underline hover:text-ink disabled:text-ink-soft/40 disabled:no-underline"
                >
                    ทำเสร็จทั้งหมด
                </button>

                <button
                    type="button"
                    onClick={handleDeleteCompleted}
                    disabled={doneCount === 0}
                    className="text-sm text-danger underline hover:text-danger/80 disabled:text-ink-soft/40 disabled:no-underline"
                >
                    ลบงานที่เสร็จแล้ว
                </button>
            </div>
            
        </>
    )
}