'use client'

import { useActionState, useEffect, useRef, useState, type ChangeEvent } from "react"
import { uploadAttachment, type UploadState } from "@/actions/attachment.action"
import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE, formatFileSize } from "@/lib/attachments"
import { url } from "inspector/promises"

type Preview = { url: string; name: string; size: number }

const initialState: UploadState = { error: null }

export function AttachmentUploadForm({ todoId }: { todoId: number }) {
    const [preview, setPreview] = useState<Preview | null>(null)

    const previewUrlRef = useRef<string | null>(null)

    function replacePreview(next: Preview | null) {
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
            previewUrlRef.current = next?.url ?? null
        setPreview(next)
    }

    useEffect(() => {
        return () => {
            if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
        }
    }, [])

    const uploadThisTodo = uploadAttachment.bind(null, todoId)

    const [state, formAction, isPending] = useActionState(
        async (prev: UploadState, formData: FormData) => {
            const result = await uploadThisTodo(prev, formData)
            replacePreview(null)
            return result
        },
        initialState
    )

    function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) {
            replacePreview(null)
            return
        }
        replacePreview({ url: URL.createObjectURL(file), name: file.name, size: file.size })
    }

    const tooLarge = preview !== null && preview.size > MAX_FILE_SIZE

    return (
        <form action={formAction} className="mt-4 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
                <label htmlFor="file" className="sr-only">เลือกรูป</label>
                <input 
                    id="file" 
                    name="file" 
                    type="file" 
                    required
                    accept={Object.keys(ALLOWED_IMAGE_TYPES).join(',')}
                    onChange={handleFileChange}
                    className="text-sm text-ink-soft file:mr-3 file:rounded-md file:border file:border-line file:bg-surface file:px-3 file:py-1.5 file:text-ink hover:file:bg-paper"
                />
                <button
                    type="submit"
                    disabled={isPending || tooLarge}
                    className="rounded-md bg-ink px-4 py-1.5 text-sm text-surface hover:bg-ink/85 disabled:bg-ink-soft"
                >
                    {isPending ? 'กำลังอัปโหลด...' : 'แนบรูป'}
                </button>
            </div>

            {preview && (
                <div className="flex- items-center gap-3">
                    <img
                        src={preview.url}
                        alt="ตัวอย่างรูปที่เลือก"
                        className="size-16 rounded-md border border-line object-cover"
                    />
                    <div className="min-w-0 text-sm">
                        <p className="truncate">{preview.name}</p>
                        <p className={tooLarge ? 'text-danger' : 'text-ink-soft'}>
                            {formatFileSize(preview.size)}
                            {tooLarge && ' — ใหญ่เกิน 5 MB เลือกรูปอื่นหรือย่อขนาดก่อน'}
                        </p>
                    </div>
                </div>
            )}

            {!preview && <p className="text-xs text-ink-soft">JPG, PNG, WEBP หรือ GIF ไม่เกิน 5 MB</p>}
            
            {state.error && (
                <p role="alert" className="text-sm text-danger">
                    {state.error}
                </p>
            )}
        </form>
    )
}