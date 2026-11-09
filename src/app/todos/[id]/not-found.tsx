import Link from "next/link";

export default function TodoNotFound() {
    return (
        <main className="mx-auto max-w-2xl px-6 py-12">
            <h1 className="font-display text-3xl font-semibold">ไม่พบงานนี้</h1>
            <p className="mt-2 text-ink-soft">งานอาจถูกลบไปแล้ว หรือลิงก์ไม่ถูกต้อง</p>
            <Link
                href="/"
                className="mt-6 inline-block rounded-md bg-ink px-4 py-2 text-sm text-surface hover:bg-ink/85"
            >
                ไปหน้ารายการ
            </Link>
        </main>
    )
}