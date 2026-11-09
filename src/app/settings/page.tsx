import { Suspense } from "react";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import type { Status } from "@/types";
import { ProfileForm } from "@/components/profile-form";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { accessibleTodos } from "@/lib/access";

const STATUS_LABEL: Record<Status, string> = {
    TODO: 'ต้องทำ',
    IN_PROGRESS: 'กำลังทำ',
    DONE: 'เสร็จแล้ว',
}

const dateFormat = new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'long',
    timeZone: 'Asia/Bangkok',
})

export default function SettingPage() {
    return (
        <main className="mx-auto max-w-xl px-6 py-12">
            <h1 className="font-display text-3xl font-semibold">ตั้งค่า</h1>

            <section aria-labelledby="profile-heading" className="mt-10 border-t border-line pt-6">
                <h2 id="profile-heading" className="font-display text-lg font-semibold">ข้อมูลส่วนตัว</h2>
                <Suspense fallback={<div className="mt-4 h-40 animate-pulse rounded-md bg-paper" />}>
                    <ProfileSection />
                </Suspense>
            </section>

            <section aria-labelledby="summary-heading" className="mt-10 border-t border-line pt-6">
                <h2 id="summary-heading" className="font-display text-lg font-semibold">สรุปงาน</h2>
                <Suspense fallback={<div className="mt-4 h-40 animate-pulse rounded-md bg-paper" />}>
                    <SummarySection />
                </Suspense>
            </section>

            <section aria-labelledby="display-heading" className="mt-10 border-t border-line pt-6">
                <h2 id="display-heading" className="font-display text-lg font-semibold">การแสดงผล</h2>
                <ThemeSwitcher />
            </section>
        </main>
    )
}

async function ProfileSection() {
    await connection()
    const user = await requireUser()
    return <ProfileForm key={user.name} name={user.name} email={user.email} />
}

async function SummarySection() {
    await connection()
    const user = await requireUser()

    const groups = await db.todo.groupBy({
        by: ['status'],
        where: { ...accessibleTodos(user.id) },
        _count: { _all: true },
    })

    const counts: Record<Status, number> = { TODO: 0, IN_PROGRESS: 0, DONE: 0 }
    for (const g of groups) counts[g.status] = g._count._all

    return (
        <>
            <p className="mt-2 text-sm text-ink-soft">
                ใช้งานตั้งแต่ {dateFormat.format(user.createdAt)}
            </p>
            <ul className="mt-4 grid grid-cols-3 gap-3">
                {(Object.keys(STATUS_LABEL) as Status[]).map((status) => (
                    <li key={status} className="rounded-lg border border-line bg-surface p-4 text-center">
                        <p className="font-display text-2xl font-semibold tabular-nums">{counts[status]}</p>
                        <p className="mt-1 text-sm text-ink-soft">{STATUS_LABEL[status]}</p>
                    </li>
                ))}
            </ul>
        </>
    )
}