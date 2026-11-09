'use client'

import { useActionState } from "react"
import { signInAction, signUpAction, type AuthFormState } from "@/actions/auth.action"

const initialState: AuthFormState = { error: null }

const inputClass = 'w-full rounded-md border border-line px-3 py-2'
const labelClass = 'block text-sm font-medium text-ink'

export function SignUpForm() {
    const [state, formAction, isPending] = useActionState(signUpAction, initialState)

    return (
        <form action={formAction} className="mt-6 space-y-4">
            <div className="space-y-1">
                <label htmlFor="name" className={labelClass}>ชื่อ</label>
                <input id="name" name="name" required autoComplete="name" className={inputClass} />
            </div>
            <div className="space-y-1">
                <label htmlFor="email" className={labelClass}>อีเมล</label>
                <input id="email" name="email" type="email" required autoComplete="email" className={inputClass} />
            </div>
            <div className="space-y-1">
                <label htmlFor="password" className={labelClass}>รหัสผ่าน</label>
                <input 
                    id="password" 
                    name="password" 
                    type="password" 
                    required 
                    minLength={8} 
                    autoComplete="new-password" 
                    className={inputClass} 
                />
                <p className="text-xs text-ink-soft">อย่างน้อย 8 ตัวอักษร</p>
            </div>

            {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}

            <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-md bg-ink px-4 py-2 text-surface hover:bg-ink/85 disabled:bg-ink-soft"
            >
                {isPending ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
            </button>
        </form>        
    )
}

export function SignInForm() {
    const [state, formAction, isPending] = useActionState(signInAction, initialState)

    return (
        <form action={formAction} className="mt-6 space-y-4">
            <div className="space-y-1">
                <label htmlFor="email" className={labelClass}>อีเมล</label>
                <input id="email" name="email" type="email" required autoComplete="email" className={inputClass} />
            </div>
            <div className="space-y-1">
                <label htmlFor="password" className={labelClass}>รหัสผ่าน</label>
                <input 
                    id="password" 
                    name="password" 
                    type="password" 
                    required 
                    autoComplete="current-password" 
                    className={inputClass} 
                />  
            </div>

            {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}

            <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-md bg-ink px-4 py-2 text-surface hover:bg-ink/85 disabled:bg-ink-soft"
            >
                {isPending ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
        </form>
    )
}