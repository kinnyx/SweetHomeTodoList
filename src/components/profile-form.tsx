'use client'

import { useActionState } from "react"
import { updateProfileAction, type ProfileFormState } from "@/actions/auth.action"

const initialState: ProfileFormState = { error: null, saved: false }

export function ProfileForm({ name, email }: { name: string; email: string }) {
    const [state, formAction, isPending] = useActionState(updateProfileAction, initialState)

    return (
        <form action={formAction} className="mt-4 space-y-4">
            <div className="space-y-1">
                <label htmlFor="name" className="block text-sm font-medium">ชื่อที่แสดง</label>
                <input 
                    id="name" 
                    name="name" 
                    defaultValue={name} 
                    required 
                    maxLength={100} 
                    autoComplete="name" 
                    className="w-full rounded-md border border-line bg-surface px-3 py-2" 
                />
            </div>

            <div className="space-y-1">
                <p className="text-sm font-medium">อีเมล</p>
                <p className="text-ink-soft">{email}</p>
                <p className="text-xs text-ink-soft">
                    อีเมลใช้เข้าสู่ระบบ การเปลี่ยนต้องยี่นยันผ่านอีเมล จึงยังแก้ที่นี่ไม่ได้
                </p>
            </div>

            <div className="flex items-center gap-3">
                <button
                    type="submit"
                    disabled={isPending}
                    className="rounded-md bg-ink px-4 py-2 text-sm text-surface hover:bg-ink/85 disabled:bg-ink-soft"
                >
                    {isPending ? 'กำลังบันทึก...' : 'บันทึกชื่อ'}
                </button>

                <p aria-live="polite" className="text-sm">
                    {state.error && <span className="text-danger">{state.error}</span>}
                    {state.saved && !isPending && <span className="text-done">บันทึกชื่อแล้ว</span>}
                </p>
            </div>
        </form>
    )
}