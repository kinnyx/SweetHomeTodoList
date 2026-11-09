'use client'

import { startTransition, useId, useOptimistic, useState } from "react"
import {
    DndContext,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core'
import type { Status, Todo } from "@/types"
import { setTodoStatus } from "@/actions/todo.actions"
import { KanbanColumn } from "./kanban-column"
import { WIP_LIMIT } from "@/lib/kanban"

const COLUMNS: { status: Status; label: string, limit?: number }[] = [
    { status: 'TODO', label: 'ต้องทำ' },
    { status: 'IN_PROGRESS', label: 'กำลังทำ', limit: WIP_LIMIT },
    { status: 'DONE', label: 'เสร็จแล้ว' },
]

function isStatus(value: unknown): value is Status {
    return COLUMNS.some((c) => c.status === value)
}

type Move = { id: number; status: Status }

export function KanbanBoard({ todos }: { todos: Todo[] }) {
    const dndId = useId()

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor)
    )

    const [error, setError] = useState<string | null>(null)

    const [optimisticTodos, moveOptimistic] = useOptimistic(todos, (state: Todo[], move: Move) =>
         state.map((t) => (t.id === move.id ? { ...t, status: move.status } : t))
    )

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event

        if (!over || !isStatus(over.id)) return

        const id = Number(active.id)
        const newStatus = over.id
        const todo = optimisticTodos.find((t) => t.id === id)

        if (!todo || todo.status === newStatus) return

        const target = COLUMNS.find((c) => c.status === newStatus)
        const countInTarget = optimisticTodos.filter((t) => t.status === newStatus).length
        if (target?.limit !== undefined && countInTarget >= target.limit) {
            setError(`"${target.label}" มีได้ไม่เกิน ${target.limit} งาน`)
            return
        }

        setError(null)
        startTransition(async () => {
            moveOptimistic({ id, status: newStatus })
            const result = await setTodoStatus(id, newStatus)
            if (!result.ok) setError(result.error)
        })
    }

    return (
        <>
            {error && (
                <p role="alert" className="mt-4 text-sm text-danger">
                    {error}
                </p>
            )}

            <DndContext id={dndId} sensors={sensors} onDragEnd={handleDragEnd}>
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                    {COLUMNS.map((col) => (
                        <KanbanColumn 
                            key={col.status}
                            status={col.status}
                            label={col.label}
                            limit={col.limit}
                            todos={optimisticTodos.filter((t) => t.status === col.status)}
                        />
                    ))}
                </div>
            </DndContext>
        </>
    )
}