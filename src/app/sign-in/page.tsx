import { Suspense } from "react";
import Link from "next/link";
import { SignInForm } from "@/components/auth-form";
import { RedirectIfSignedIn } from "@/components/redirect-if-signed-in";

export default function SignInPage() {
    return (
        <main className="mx-auto max-w-sm px-6 py-16">
            <Suspense fallback={null}>
                <RedirectIfSignedIn />
            </Suspense>
            <h1 className="text-2xl font-bold">เข้าสู่ระบบ</h1>
            <SignInForm />
            <p className="mt-6 text-center text-sm text-ink-soft">
                ยังไม่มีบัญชี?{' '}
                <Link href="/sign-up" className="font-medium text-ink underline">
                    สมัครสมาชิก
                </Link>
            </p>
        </main>
    )
}