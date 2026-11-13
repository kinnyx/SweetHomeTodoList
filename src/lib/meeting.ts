import type { Prisma } from "@/generated/prisma/client";
import { userSummarySelect } from "@/lib/todo-select";
import type { ChatMessage } from "@/types";

export const messageSelect = {
    id: true,
    body: true,
    createdAt: true,
    author: { select: userSummarySelect },
} satisfies Prisma.MeetingMessageSelect

type MessageRow = Prisma.MeetingMessageGetPayload<{ select: typeof messageSelect }>

export function toChatMessage(row: MessageRow): ChatMessage {
    return { ...row, createdAt: row.createdAt.toISOString() }
}