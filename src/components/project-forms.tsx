'use client'

import { useActionState } from "react"
import { 
    createProject,
    inviteMember,
    renameProject,
    type ProjectFormState, 
} from "@/actions/project.action"

const initialState: ProjectFormState = { error: null }
const inputClass = 'min-w-0 flex-1 rounded-md border border-line bg-surface px-3 py-2'
const buttonClass = 
    'rounded-md bg-ink px-4 py-2 text-sm text-surface hover:bg-ink/85 disabled:bg-ink-soft'

export function CreateProjectForm() {
    const [state, formAction, isPending] = useActionState(createProject, initialState)

    return (
        <form action={formAction} className="mt-3">
            <div className="flex gap-2">
                <label htmlFor="project-name" className="sr-only">ชื่อ project</label>
                <input
                    id="project-name"
                    name="name"
                    required
                    maxLength={100}
                    placeholder="เช่น ทีมรายงานสาขา"
                    className={inputClass}
                />
                <button type="submit" disabled={isPending} className={buttonClass}>
                    {isPending ? 'กำลังสร้าง...' : 'สร้าง project'}
                </button>
            </div>
            {state.error && <p role="alert" className="mt-2 text-sm text-danger">{state.error}</p>}
        </form>
    )
}

export function InviteMemberForm({ projectId }: { projectId: string }) {
    const [state, formAction, isPending] = useActionState(
        inviteMember.bind(null, projectId),
        initialState
    )

    return (
        <form action={formAction} className="mt-3">
            <div className="flex gap-2">
                <label htmlFor="invite-email" className="sr-only">อีเมลของคนที่จะเชิญ</label>
                <input
                    id="invite-email"
                    name="email" 
                    type="email"
                    required
                    autoComplete="off"
                    placeholder="อีเมลของเพื่อนร่วมทีม"
                    className={inputClass} 
                />
                <button type="submit" disabled={isPending} className={buttonClass}>
                    {isPending ? 'กำลังเชิญ...' : 'เชิญ'}
                </button>
            </div>
            <p aria-live="polite" className="mt-2 text-sm">
                {state.error && <span className="text-danger">{state.error}</span>}
                {state.message && !isPending && <span className="text-done">{state.message}</span>}
            </p>
        </form>
    )
}

export function RenameProjectForm({ projectId, name }: { projectId: string; name: string }) {
    const [state, formAction, isPending] = useActionState(
        renameProject.bind(null, projectId),
        initialState
    )

    return (
        <form action={formAction} className="mt-3">
            <div className="flex gap-2">
                <label htmlFor="rename" className="sr-only">ชื่อ project</label>
                <input 
                    id="rename" 
                    name="name"
                    defaultValue={name}
                    required
                    maxLength={100}
                    className={inputClass}
                />
                <button type="submit" disabled={isPending} className={buttonClass}>
                    {isPending ? 'กำลังบันทึก...' : 'บันทึกชื่อ'}
                </button>
            </div>
            <p aria-live="polite" className="mt-2 text-sm">
                {state.error && <span className="text-danger">{state.error}</span>}
                {state.message && !isPending && <span className="text-done">{state.message}</span>}
            </p>
        </form>
    )
}