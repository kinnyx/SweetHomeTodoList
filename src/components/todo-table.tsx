import Link from "next/link";
import type { Priority, Status, UserSummary } from "@/types";
import { PriorityTag } from "./priority-tag";
import { buildTableHref, type TableQuery } from "@/lib/table-query";
import { todoHref } from "@/lib/back-link";
import { DoneToggle } from "./done-toggle";
import { Avatar } from "./avatar";

export type TodoRow = {
    id: number
    title: string
    note: string | null
    status: Status
    priority: Priority
    assignee: UserSummary | null
    createdAt: Date
    updatedAt: Date
}

const dateFormat = new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Bangkok',
})

export function TodoTable({ rows, query }: { rows: TodoRow[]; query: TableQuery }) {
    if (rows.length === 0) {
        return <p className="mt-6 text-ink-soft">ไม่พบงานที่ตรงกับเงื่อนไข</p>
    }

    return (
        <div className="mt-6 overflow-x-auto rounded-lg border border-line">
            <table className="w-full text-left text-sm">
                <thead className="bg-paper text-ink-soft">
                    <tr>
                        <th scope="col" className="w-16 px-4 py-3 font-medium">สถานะ</th>
                        <SortHeader label="ชื่องาน" column="title" query={query} />
                        <th scope="col" className="px-4 py-3 font-medium">ผู้รับผิดชอบ</th>
                        <SortHeader label="ความสำคัญ" column="priority" query={query} />
                        <SortHeader label="สร้างเมื่อ" column="createdAt" query={query} />
                        <SortHeader label="แก้ไขล่าสุด" column="updatedAt" query={query} />
                    </tr>
                </thead>
                <tbody className="divide-y divide-line">
                    {rows.map((row) => (
                        <tr key={row.id} className="hover:bg-paper">
                            <td className="px-4 py-3">
                                <DoneToggle id={row.id} done={row.status === 'DONE'} title={row.title} />
                            </td>
                            <td className="px-4 py-3">
                                <Link
                                    href={todoHref(row.id, 'table')}
                                    className={row.status === 'DONE' ? 'text-ink-soft line-through' : 'hover:underline'}
                                >
                                    {row.title}
                                </Link>
                                {row.note && <p className="line-clamp-1 text-xs text-ink-soft">{row.note}</p>}
                            </td>
                            <td className="px-4 py-3">
                                {row.assignee ? (
                                    <span className="flex items-center gap-2 whitespace-nowrap">
                                        {/* ✅ ในตารางมีที่พอ แสดงทั้งรูปและชื่อ — รูปจึงเป็น decorative */}
                                        <Avatar name={row.assignee.name} image={row.assignee.image} size="sm" decorative />
                                        {row.assignee.name}
                                    </span>
                                ) : (
                                    <span className="text-ink-soft">—</span>
                                )}
                            </td>
                            <td className="px-4 py-3">
                                <PriorityTag priority={row.priority} />
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 tabular-nums text-ink-soft">
                                {dateFormat.format(row.createdAt)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 tabular-nums text-ink-soft">
                                {dateFormat.format(row.updatedAt)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

function SortHeader({
    label,
    column,
    query,
}: {
    label: string
    column: TableQuery['sort']
    query: TableQuery
}) {
    const isActive = query.sort === column
    const nextOrder = isActive && query.order === 'asc' ? 'desc' : 'asc'

    return (
        <th
            scope="col"
            aria-sort={isActive ? (query.order === 'asc' ? 'ascending' : 'descending') : 'none'}
            className="px-4 py-3 font-medium"
        >
            <Link
                href={buildTableHref(query, { sort: column, order: nextOrder, page: 1 })}
                className="inline-flex items-center gap-1 hover:text-ink"
            >
                {label}
                <span aria-hidden="true" className={isActive ? '' : 'text-ink-soft/40'}>
                    {isActive ? (query.order === 'asc' ? '▲' : '▼') : '↕'}
                </span>
            </Link>
        </th>
    )
}