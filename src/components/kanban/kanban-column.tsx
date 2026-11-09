'use client'

import { useDroppable } from "@dnd-kit/core"
import type { Status, Todo } from "@/types"
import { KanbanCard } from "./kanban-card"

type KanbanColumnProps = {
    status: Status
    label: string
    todos: Todo[]
    limit?: number
}

export function KanbanColumn({ status, label, todos, limit }: KanbanColumnProps) {
    const { setNodeRef, isOver } = useDroppable({ id: status })
    const isFull = limit !== undefined && todos.length >= limit

    return (
        <section
            ref={setNodeRef}
            aria-label={label}
            className={`rounded-lg p-3 transition-colors ${
                isOver ? 'bg-progress/10 ring-2 ring-progress/50' : 'bg-paper'
            }`}
        >
            <header className="flex items-center justify-between">
                <h2 className="font-medium">{label}</h2>
                <span className={`rounded-full px-2 text-xs tabular-nums ${
                    isFull ? 'bg-danger/15 text-danger' : 'bg-line text-ink-soft'
                }`}>
                    {limit !== undefined ? `${todos.length}/${limit}` : todos.length}
                </span>
            </header>

            <ul className="mt-3 min-h-24 space-y-2">
                {todos.length === 0 ? (
                    <li className="flex h-24 items-center justify-center rounded-md border-2 border-dashed border-line text-sm text-ink-soft">
                        ลากการ์ดมาวางที่นี่
                    </li>
                ) : (
                    todos.map((todo) => 
                        <KanbanCard key={todo.id} todo={todo} />)
                )}                
            </ul>
        </section>
    )
}