import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import Form from 'next/form';
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { PAGE_SIZE_OPTIONS, buildTableHref, parseTableQuery, type TableQuery } from "@/lib/table-query";
import { TodoTable } from "@/components/todo-table";
import { connection } from "next/server";
import { requireUser } from "@/lib/session";
import { accessibleTodos } from "@/lib/access";
import { getCurrentProject } from "@/lib/current-project";
import { ProjectHeading, ProjectHeadingSkeleton } from '@/components/project-heading'
import { userSummarySelect } from "@/lib/todo-select";

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default function TablePage({ searchParams }: { searchParams: SearchParams }) {
    return (
        <main className="mx-auto max-w-4xl px-6 py-12">
            <Suspense fallback={<ProjectHeadingSkeleton />}>
                <ProjectHeading subtitle="ค้นหา เรียง และกรองงานทั้งหมด" />
            </Suspense>
            
            <Suspense fallback={<TableSkeleton />}>
                <TableSection searchParams={searchParams} />
            </Suspense>
        </main>
    )
}

async function TableSection({ searchParams }: { searchParams: SearchParams }) {
    await connection()
    const user = await requireUser()
    const query = parseTableQuery(await searchParams)
    const project = await getCurrentProject(user.id)
    const where = buildWhere(query, user.id, project.id)

    const [rows, total] = await db.$transaction([
        db.todo.findMany({
            where,
            orderBy: buildOrderBy(query),
            skip: (query.page - 1) * query.size,
            take: query.size,
            select: { id: true, title: true, note: true, status: true, priority: true, createdAt: true, updatedAt: true, assignee: { select: userSummarySelect }, },
        }),
        db.todo.count({ where }),
    ])

    const totalPages = Math.max(1, Math.ceil(total / query.size))

    return (
        <>
            <FilterForm query={query} />
            <TodoTable rows={rows} query={query} />
            <Pagination query={query} total={total} totalPages={totalPages} />
        </>
    )
}

function buildWhere(query: TableQuery, userId: string, projectId: string): Prisma.TodoWhereInput {
    return {
        ...accessibleTodos(userId),
        projectId,
        ...(query.q && { title: { contains: query.q, mode: 'insensitive' } }),
        ...(query.status !== 'all' && { status: query.status }),
        ...(query.priority !== 'ALL' && { priority: query.priority }),
    }
}

function buildOrderBy(query: TableQuery): Prisma.TodoOrderByWithRelationInput[] {
    let primary: Prisma.TodoOrderByWithRelationInput 

    switch (query.sort) {
        case 'title':
            primary = { title: query.order }
            break
        case 'priority':
            primary = { priority: query.order }
            break
        case 'updatedAt':
            primary = { updatedAt: query.order }
            break
        default:
            primary = { createdAt: query.order }
    }
    
    return [primary, { id: 'asc' }]
}

function FilterForm({ query }: { query: TableQuery }) {
    return (
        <Form
            key={JSON.stringify(query)}
            action="/table"
            className="mt-6 flex flex-wrap items-center gap-2"
        >
            <input 
                type="search" 
                name="q"
                defaultValue={query.q}
                placeholder="ค้นหาชื่องาน"
                aria-label="ค้นหาชื่องาน"
                className="min-w-48 flex-1 rounded-md border border-line px-3 py-2 text-sm"
            />
            <select 
                name="status"
                defaultValue={query.status}
                aria-label="สถานะ"
                className="rounded-md border border-line px-2 py-2 text-sm" 
            >
                <option value="all">ทุกสถานะ</option>
                <option value="TODO">ยังไม่เสร็จ</option>
                <option value="IN_PROGRESS">กำลังทำ</option>
                <option value="DONE">เสร็จแล้ว</option>
            </select>
            <select 
                name="priority"
                defaultValue={query.priority}
                aria-label="ความสำคัญ"
                className="rounded-md border border-line px-2 py-2 text-sm"
            >
                <option value="ALL">ทุกระดับ</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
            </select>
            <select 
                name="size"
                defaultValue={query.size}
                aria-label="จำนวนแถวต่อหน้า"
                className="rounded-md border border-line px-2 py-2 text-sm"
            >
                {PAGE_SIZE_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                        {n} แถว/หน้า
                    </option>
                ))}
            </select>

            <input type="hidden" name="sort" value={query.sort} />
            <input type="hidden" name="order" value={query.order} />

            <button
                type="submit"
                className="rounded-md bg-ink px-4 py-2 text-sm text-surface hover:bg-ink/85"
            >
                ค้นหา
            </button>
            <Link href="/table" className="px-2 text-sm text-ink-soft underline hover:text-ink">
                ล้าง
            </Link>
        </Form>
    )
}

function Pagination({
    query,
    total,
    totalPages,
}: {
    query: TableQuery
    total: number
    totalPages: number
}) {
    const from = total === 0 ? 0 : (query.page - 1) * query.size + 1
    const to = Math.min(query.page * query.size, total)

    return (
        <nav aria-label="เปลี่ยนหน้า" className="mt-4 flex items-center justify-between text-sm text-ink-soft">
            <p className="tabular-nums">
                แสดง {from}-{to} จาก {total} งาน
            </p>
            <div className="flex items-center gap-2">
                <PageLink href={buildTableHref(query, { page: query.page - 1 })} disabled={query.page <= 1}>
                    ก่อนหน้า
                </PageLink>
                <span className="tabular-nums">
                    หน้า {query.page} / {totalPages}
                </span>
                <PageLink href={buildTableHref(query, { page: query.page + 1 })} disabled={query.page >= totalPages}>
                    ถัดไป
                </PageLink>
            </div>
        </nav>
    )
}

function PageLink({ href, disabled, children }: { href: string; disabled: boolean; children: ReactNode }) {
    if (disabled) {
        return (
            <span aria-disabled="true" className="rounded-md border border-line px-3 py-1.5 text-ink-soft/40">
                {children}
            </span>
        )
    }
    return (
        <Link href={href} className="rounded-md border border-line px-3 py-1.5 hover:bg-paper">
            {children}
        </Link>
    )
}

function TableSkeleton() {
    return (
        <div className="mt-6 space-y-2">
            <div className="h-10 animate-pulse rounded-md bg-paper" />
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded bg-paper" />
            ))}
        </div>
    )
}