'use client'

import { useOptimistic, useState, useTransition } from "react"
import { setTodoStatus } from "@/actions/todo.actions"

type DoneToggleProps = {
    id: number
    done: boolean
    title: string
}

export function DoneToggle({ id, done, title }: DoneToggleProps) {
    const [optimisticDone, setOptimisticDone] = useOptimistic(done)
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    function handleClick() {
        const next = !optimisticDone
        setError(null)

        startTransition(async () => {
            setOptimisticDone(next)
            const result = await setTodoStatus(id, next ? 'DONE' : 'TODO')
            if (!result.ok) setError(result.error)
        })
    }

    return (
        <div>
            <button
                type="button"
                onClick={handleClick}
                disabled={isPending}
                aria-pressed={optimisticDone}
                aria-label={optimisticDone ? `ยกเลิกเสร็จ: ${title}` : `ทำเครื่องหมายเสร็จ: ${title}`}
                className="flex h-7 w-7 items-center justify-center rounded border border-line hover:bg-paper disabled:opacity-50"
            >
                {optimisticDone ? '✓' : ''}
            </button>
            {error && (
                <p role="alert" className="mt-1 text-xs text-danger">
                    {error}
                </p>
            )}
        </div>
    )
}