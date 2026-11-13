export type Priority = 'LOW' | 'MEDIUM' | 'HIGH'
export type Status = 'TODO' | 'IN_PROGRESS' | 'DONE'

export type UserSummary = {
    id: string
    name: string
    image: string | null
}

export type Todo = {
    id: number
    title: string
    note: string | null
    status: Status
    priority: Priority
    assignee: UserSummary | null
}

export type ChatMessage = {
    id: string
    body: string
    createdAt: string
    author: UserSummary | null
}

export type ProjectEvent = 
    | { type: 'chat'; message: ChatMessage }
    | { type: 'move' }
    | { type: 'kicked'; userId: string }