'use client'

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { deleteTodo } from "@/actions/todo.actions"

export function DeleteTodoButton({ id, title }: { id: number; title: string }) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    function handleClick() {
        if (!window.confirm(`ลบงาน "${title}" ใช่ไหม? ลบแล้วกู้คืนไม่ได้`)) return

        setError(null)
        startTransition(async () => {
            const result = await deleteTodo(id)
            if (!result.ok) {
                setError(result.error)
                return
            }
            router.push('/')
        })
    }

    return (
        <div>
            <button
                type="button"
                onClick={handleClick}
                disabled={isPending}
                className="rounded-md border border-danger/40 px-4 py-2 text-sm text-danger hover:bg-danger/10 disabled:opacity-50"
            >
                {isPending ? 'กำลังลบ...' : 'ลบงาน'}
            </button>
            {error && (
                <p role="alert" className="mt-2 text-sm text-danger">
                    {error}
                </p>
            )}
        </div>
    )
}