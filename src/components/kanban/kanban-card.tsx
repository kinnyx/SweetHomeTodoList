'use client'

import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import type { Todo } from "@/types"
import Link from "next/link"
import { PriorityTag } from "@/components/priority-tag"
import { todoHref } from '@/lib/back-link'
import { AssigneeBadge } from "@/components/assignee-badge"

export function KanbanCard({ todo }: { todo: Todo }) {
    const { setNodeRef, listeners, attributes, transform, isDragging } = useDraggable({
        id: todo.id,
    })

    return (
        <li
            ref={setNodeRef}
            style={{ transform: CSS.Translate.toString(transform) }}
            {...listeners}
            {...attributes}
            className={`relative touch-none cursor-grab rounded-md border border-line bg-surface p-3 ${
                isDragging ? 'z-10 cursor-grabbing shadow-lg' : ''
            }`}
        >
            <Link
                href={todoHref(todo.id, 'kanban')}
                className="todo.status === 'DONE' ? 'text-ink-soft line-through' : 'hover:underline'"
            >
                {todo.title}
            </Link>
            {todo.note && <p className="mt-1 line-clamp-2 text-xs text-ink-soft">{todo.note}</p>}
            <div className="mt-2 flex items-center justify-between">
                <PriorityTag priority={todo.priority} />
                <AssigneeBadge assignee={todo.assignee} />
            </div>
        </li>
    )
}