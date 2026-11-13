import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { accessibleTodos } from "@/lib/access";
import { todoHref } from "@/lib/back-link";
import { PriorityTag } from "@/components/priority-tag";
import { DoneToggle } from "@/components/done-toggle";
import type { Priority } from "@/types";

export default function MyTaskPage() {
    return (
        <main className="mx-auto max-w-2xl px-6 py-12">
            <h1 className="font-display text-3xl font-semibold">งานของฉัน</h1>
            <p className="mt-1 text-ink-soft">งานที่ยังไม่เสร็จซึ่งมอบหมายให้คุณ จากทุก project</p>
            <Suspense fallback={<div className="mt-8 h-48 animate-pulse rounded-lg bg-paper" />}>
                <MyTasksSection />
            </Suspense>
        </main>
    )
}

type Row = { id: number; title: string; priority: Priority }

async function MyTasksSection() {
    await connection()
    const user = await requireUser()

    const todos = await db.todo.findMany({
        where: {
            ...accessibleTodos(user.id),
            assigneeId: user.id,
            status: { not: 'DONE' },
        },
        select: {
            id: true,
            title: true,
            priority: true,
            project: { select: { id: true, name: true } },
        },
        orderBy: [{ project: { name: 'asc' } }, { priority: 'desc' }, { createdAt: 'asc' }],
    })

    if (todos.length === 0) {
        return <p className="mt-8 text-ink-soft">ไม่มีงานค้าง — ไปดูบอร์ดของทีมว่ามีงานไหนรอคนรับอยู่บ้าง</p>
    }

    const groups = new Map<string, { name: string; todos: Row[] }>()
    for (const { project, ...todo } of todos) {
        const group = groups.get(project.id) ?? { name: project.name, todos: [] }
        group.todos.push(todo)
        groups.set(project.id, group)
    }

    return (
        <div className="mt-8 space-y-8">
            {[...groups].map(([projectId, group]) => (
                <section key={projectId} aria-labelledby={`project-${projectId}`}>
                    <h2 id={`project-${projectId}`} className="font-display text-lg font-semibold">
                        {group.name} <span className="text-ink-soft">({group.todos.length})</span>
                    </h2>
                    <ul className="mt-3 divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
                        {group.todos.map((todo) => (
                            <li key={todo.id} className="flex items-center gap-3 px-4 py-3">
                                <DoneToggle id={todo.id} done={false} title={todo.title} />
                                <Link href={todoHref(todo.id, 'mine')} className="min-w-0 flex-1 hover:underline">
                                    {todo.title}
                                </Link>
                                <PriorityTag priority={todo.priority} />
                            </li>
                        ))}
                    </ul>
                </section>
            ))}
        </div>
    )
}