'use client'

import { useState, useTransition } from "react"
import type { ActionResult } from "@/actions/todo.actions"

type Props = {
    action: () => Promise<ActionResult>
    label: string
    pendingLabel: string
    confirmText?: string
    variant?: 'default' | 'danger' | 'primary'
}

const styles = {
    default: 'border border-line hover:bg-paper',
    danger: 'border border-danger/40 text-danger hover:bg-danger/10',
    primary: 'bg-ink text-surface hover:bg-ink/85',
}

export function ActionButton({ action, label, pendingLabel, confirmText, variant = 'default' }: Props) {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    function handleClick() {
        if (confirmText && !window.confirm(confirmText)) return
        setError(null)
        startTransition(async () => {
            const result = await action()
            if (!result.ok) setError(result.error)
        })
    }

    return (
        <div>
            <button
                type="button"
                onClick={handleClick}
                disabled={isPending}
                className={`rounded-md px-3 py-1.5 text-sm disabled:opacity-50 ${styles[variant]}`}
            >
                {isPending ? pendingLabel : label}
            </button>
            {error && <p role="alert" className="mt-1 text-xs text-danger">{error}</p>}
        </div>
    )
}