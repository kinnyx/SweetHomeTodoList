'use server'

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { APIError } from "better-auth/api"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { requireUser } from "@/lib/session"
import { SignInSchema, SignUpSchema, UpdateProfileSchema } from "@/lib/validations/auth"

export type AuthFormState = { error: string | null }
export type ProfileFormState = { error: string | null; saved: boolean }

export async function signUpAction(
    _prev: AuthFormState,
    formData: FormData
): Promise <AuthFormState> {
    const parsed = SignUpSchema.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
    })
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'ข้อมูลไม่ถูกต้อง' }

    try {
        await auth.api.signUpEmail({ body: parsed.data, headers: await headers() })
    } catch (error) {
        if (error instanceof APIError) return { error: 'สมัครไม่สำเร็จ - อีเมลนี้อาจถูกใช้ไปแล้ว' }
        console.error('signUpAction failed:', error)
        return { error: 'เกิดข้อผิดพลาด ลองใหม่อีกครั้ง' }
    }

    redirect('/')
}

export async function signInAction(
    _prev: AuthFormState,
    formData: FormData
): Promise<AuthFormState> {
    const parsed = SignInSchema.safeParse({
        email: formData.get('email'),
        password: formData.get('password'),
    })
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'ข้อมูลไม่ถูกต้อง' }

    try {
        await auth.api.signInEmail({ body: parsed.data, headers: await headers() })
    } catch {
        return { error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }
    }

    redirect('/')
}

export async function signOutAction() {
    await auth.api.signOut({ headers: await headers() })
    redirect('/sign-in')
}

export async function updateProfileAction(
    _prev: ProfileFormState,
    formData: FormData
): Promise<ProfileFormState> {
    await requireUser()

    const parsed = UpdateProfileSchema.safeParse({ name: formData.get('name') })
    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? 'ข้อมูลไม่ถูกต้อง', saved: false }
    }

    try {
        await auth.api.updateUser({ body: { name: parsed.data.name }, headers: await headers() })
    } catch {
        return { error: 'บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง', saved: false }
    }

    revalidatePath('/', 'layout')
    return { error: null, saved: true }
}