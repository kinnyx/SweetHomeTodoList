import 'server-only'
import type { Prisma } from '@/generated/prisma/client'
import { db } from '@/lib/db'

export function accessibleTodos(userId: string): Prisma.TodoWhereInput {
    return { project: { members: { some: { userId } } } }
}

export async function findAccessibleTodo(userId: string, todoId: number) {
    return db.todo.findFirst({
        where: { id: todoId, ...accessibleTodos(userId) },
        select: { id: true, projectId: true },
    })
}

export async function getProjectRole(userId: string, projectId: string) {
    const membership = await db.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId } },
        select: { role: true },
    })
    return membership?.role ?? null
}