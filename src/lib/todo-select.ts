import type { Prisma } from "@/generated/prisma/client";

export const userSummarySelect = {
    id: true,
    name: true,
    image: true,
} satisfies Prisma.UserSelect

export const todoSelect = {
    id: true,
    title: true,
    note: true,
    status: true,
    priority: true,
    assignee: { select: userSummarySelect },
} satisfies Prisma.TodoSelect