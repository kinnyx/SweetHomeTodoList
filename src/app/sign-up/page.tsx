import { Suspense } from "react";
import Link from "next/link";
import { SignUpForm } from "@/components/auth-form";
import { RedirectIfSignedIn } from "@/components/redirect-if-signed-in";

export default function SignUpPage() {
    return (
        <main className="mx-auto max-w-sm px-6 py-16">
            <Suspense fallback={null}>
                <RedirectIfSignedIn />
            </Suspense>
            <h1 className="text-2xl font-bold">สมัครสมาชิก</h1>
            <SignUpForm />
            <p className="mt-6 text-center text-sm text-ink-soft">
                มีบัญชีแล้ว?{' '}
                <Link href="/sign-in" className="font-medium text-ink underline">
                    เข้าสู่ระบบ
                </Link>
            </p>
        </main>
    )
}