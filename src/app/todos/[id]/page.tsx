import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { TodoIdSchema } from "@/lib/validations/todo";
import { BACK_LINKS, FromSchema } from "@/lib/back-link";
import { TodoEditForm } from "@/components/todo-edit-form";
import { DeleteTodoButton } from "@/components/delete-todo-button";
import { DuplicateTodoButton } from "@/components/duplicate-todo-button";
import { AttachmentList } from "@/components/attachment-list";
import { AttachmentUploadForm } from "@/components/attachment-upload-form";
import { accessibleTodos } from "@/lib/access";

type Params = Promise<{ id: string }>
type SearchParams = Promise<Record<string, string | string[] | undefined>>

const dateFormat = new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Bangkok',
})

export default function TodoDetailPage({ 
    params,
    searchParams, 
}: { 
    params: Params
    searchParams: SearchParams 
}) {
    return (
        <main className="mx-auto max-w-2xl px-6 py-12">
            <Suspense fallback={<BackLinkView from="list" />}>
                <BackLink searchParams={searchParams} />
            </Suspense>
            <Suspense fallback={<DetailSkeleton />}>
                <TodoDetail params={params} />
            </Suspense>
        </main>
    )
}

async function BackLink({ searchParams }: { searchParams: SearchParams }) {
    const { from } = await searchParams
    return <BackLinkView from={FromSchema.parse(from)} />
}

function BackLinkView({ from }: { from: keyof typeof BACK_LINKS }) {
    const link = BACK_LINKS[from]
    return (
        <Link href={link.href} className="text-sm text-ink-soft hover:text-ink">
            {link.label}
        </Link>
    )
}

async function TodoDetail({ params }: { params: Params }) {
    await connection()
    const user = await requireUser()
    const { id } = await params

    const parsed = TodoIdSchema.safeParse(Number(id))
    if (!parsed.success) notFound()

    const todo = await db.todo.findFirst({
        where: { id: parsed.data, ...accessibleTodos(user.id) },
        select: {
            id: true,
            title: true,
            note: true,
            status: true,
            priority: true,
            createdAt: true,
            updatedAt: true,
            createdBy: { select: { name: true } },
            project: { select: { name: true, isPersonal: true } },
        },
    })

    if (!todo) notFound()

    return (
        <>
            <h1 className="mt-4 font-display text-3xl font-semibold">{todo.title}</h1>
            <p className="mt-1 text-sm text-ink-soft">
                {todo.project.name}
                {!todo.project.isPersonal && (
                    <>, สร้างโดย {todo.createdBy?.name ?? 'บัญชีที่ถูกลบแล้ว'}</>
                )}
            </p>
            <p className="text-sm text-ink-soft">
                สร้างเมื่อ { dateFormat.format(todo.createdAt) }
                {todo.updatedAt.getTime() !== todo.createdAt.getTime() &&
                    `, แก้ไขล่าสุด ${dateFormat.format(todo.updatedAt)}`}
            </p>

            <div className="mt-4">
                <DuplicateTodoButton id={todo.id} />
            </div>

            <TodoEditForm 
                key={todo.updatedAt.toISOString()}
                todo={{
                    id: todo.id,
                    title: todo.title,
                    note: todo.note,
                    status: todo.status,
                    priority: todo.priority,
                }}
            />

            <section aria-labelledby="attachments-heading" className="mt-12 border-t border-line pt-6">
                <h2 id="attachment-heading" className="font-display text-lg font-semibold">รูปแนบ</h2>
                <AttachmentUploadForm todoId={todo.id} />
                <Suspense fallback={<div className="mt-4 h-32 animate-pulse rounded-lg bg-paper" />}>
                    <AttachmentList todoId={todo.id} />
                </Suspense>
            </section>

            <section aria-labelledby="danger-heading" className="mt-12 border-t border-line pt-6">
                <h2 id="danger-heading" className="font-display text-lg font-semibold">ลบงานนี้</h2>
                <p className="mt-1 text-sm text-ink-soft">ลบแล้วกู้คืนไม่ได้</p>
                <div className="mt-4">
                    <DeleteTodoButton id={todo.id} title={todo.title} />
                </div>
            </section>
        </>
    )
}

function DetailSkeleton() {
    return (
        <div className="mt-4 space-y-4">
            <div className="h-10 w-2/3 animate-pulse rounded bg-paper" />
            <div className="h-10 animate-pulse rounded bg-paper" />
            <div className="h-36 animate-pulse rounded bg-paper" />
        </div>
    )
}