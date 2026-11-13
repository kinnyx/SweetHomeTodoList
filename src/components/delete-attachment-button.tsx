'use client'

import { useTransition } from "react"
import { deleteAttachment } from "@/actions/attachment.actions"

export function DeleteAttachmentButton({ id, fileName }: { id: string; fileName: string }) {
    const [isPending, startTransition] = useTransition()

    function handleClick() {
        if (!window.confirm(`ลบรูป "${fileName}" ใช่ไหม?`)) return
        startTransition(async () => {
            const result = await deleteAttachment(id)
            if (!result.ok && result.error) window.alert(result.error)
        })
    }

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={isPending}
            aria-label={`ลบรูป ${fileName}`}
            className="rounded px-2 py-1 text-xs text-ink-soft hover:bg-danger/10 hover:text-danger disabled:opacity-50"
        >
            {isPending ? 'กำลังลบ...' : 'ลบ'}
        </button>
    )
}