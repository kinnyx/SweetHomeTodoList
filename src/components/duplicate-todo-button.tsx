'use client'

import { useState, useTransition } from "react"
import { duplicateTodo } from "@/actions/todo.actions"

export function DuplicateTodoButton({ id }: { id: number }) {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    function handleClick() {
        setError(null)
        startTransition(async () => {
            const result = await duplicateTodo(id)
            if (!result.ok) setError(result.error)
        })
    }

    return (
        <div>
            <button
                type="button"
                onClick={handleClick}
                disabled={isPending}
                className="rounded-md border border-line px-3 py-1.5 text-sm hover:bg-paper disabled:opacity-50"
            >
                {isPending ? 'กำลังทำสำเนา...' : 'ทำสำเนางาน'}
            </button>
            {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
        </div>
    )
}