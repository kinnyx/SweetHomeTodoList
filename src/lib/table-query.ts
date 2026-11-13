import { z } from "zod";

export const PAGE_SIZE_OPTIONS = [10, 20, 50]

export const TableQuerySchema = z.object({
    q: z.string().trim().max(100).catch(''),
    status: z.enum(['all', 'TODO', 'IN_PROGRESS', 'DONE']).catch('all'),
    priority: z.enum(['ALL', 'LOW', 'MEDIUM', 'HIGH']).catch('ALL'),
    sort: z.enum(['title', 'priority', 'createdAt', 'updatedAt']).catch('createdAt'),
    order: z.enum(['asc', 'desc']).catch('desc'),
    page: z.coerce.number().int().min(1).catch(1),
    size: z.coerce.number().int().refine((n) => PAGE_SIZE_OPTIONS.includes(n)).catch(10),
    mine: z.enum(['0', '1']).catch('0'),
})

export type TableQuery = z.infer<typeof TableQuerySchema>

const DEFAULTS: TableQuery = {
    q: '',
    status: 'all',
    priority: 'ALL',
    sort: 'createdAt',
    order: 'desc',
    page: 1,
    size: 10,
    mine: '0',
}

export function parseTableQuery(raw: Record<string, string | string[] | undefined>): TableQuery {
    return TableQuerySchema.parse(raw)
}

export function buildTableHref(current: TableQuery, changes: Partial<TableQuery>): string {
    const next = { ...current, ...changes }
    const params = new URLSearchParams()

    for (const key of Object.keys(next) as (keyof TableQuery)[]) {
        if (next[key] !== DEFAULTS[key]) params.set(key, String(next[key]))
    }

    const qs = params.toString()
    return qs ? `/table?${qs}` : '/table'
}