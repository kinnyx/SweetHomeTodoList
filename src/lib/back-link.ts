import { z } from "zod";

export const FromSchema = z.enum(['list', 'table', 'kanban']).catch('list')
export type From = z.infer<typeof FromSchema>

export const BACK_LINKS: Record<From, { href: string; label: string }> = {
    list: { href: '/', label: 'กลับไปรายการ' },
    table: { href: '/table', label: 'กลับไปตาราง' },
    kanban: { href: '/kanban', label: 'กลับไปบอร์ด' },
}

export function todoHref(id: number, from: From = 'list') {
    return from === 'list' ? `/todos/${id}` : `/todos/${id}?from=${from}`
}