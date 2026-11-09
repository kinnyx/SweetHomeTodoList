export type Priority = 'LOW' | 'MEDIUM' | 'HIGH'
export type Status = 'TODO' | 'IN_PROGRESS' | 'DONE'

export type Todo = {
    id: number
    title: string
    note: string | null
    status: Status
    priority: Priority
}