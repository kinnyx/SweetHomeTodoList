import { Suspense } from "react";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { requireUser } from "@/lib/session";
import { accessibleTodos } from "@/lib/access";
import { getCurrentProject } from "@/lib/current-project";

export default function KanbanPage() {
    return (
        <main className="mx-auto max-w-5xl px-6 py-12">
            <h1 className="text-3xl font-bold">บอร์ดงาน</h1>
            <p className="mt-1 text-ink-soft">ลากการ์ดไปคอลัมน์อื่นเพื่อเปลี่ยนสถานะ</p>

            <Suspense fallback={<BoardSkeleton />}>
                <BoardSection />
            </Suspense>
        </main>
    )
}

async function BoardSection() {
    await connection()
    const user = await requireUser()
    const project = await getCurrentProject(user.id)

    const todos = await db.todo.findMany({
        where: { ...accessibleTodos(user.id), projectId: project.id },
        select: { id: true, title: true, note: true, status: true, priority: true },
        orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    })

    return <KanbanBoard todos={todos} />
}

function BoardSkeleton() {
    return (
        <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 animate-pulse rounded-lg bg-paper" />
            ))}
        </div>
    )
}