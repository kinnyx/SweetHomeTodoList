import Link from 'next/link'
import type { Todo } from '@/types'
import { todoHref } from '@/lib/back-link'
import { PriorityTag } from '@/components/priority-tag'
import { StatusMark } from '@/components/status-mark'

type TodoItemProps = {
  todo: Todo
  onToggle: (id: number) => void
  onDelete: (id: number) => void
}

export function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  const isDone = todo.status === 'DONE'

  return (
    <li className="flex items-center gap-3 px-4 py-3 hover:bg-paper">
      {/* ✅ ปุ่มติ๊กเหลือแค่ช่องสี่เหลี่ยม
          p-2 -m-2 = ขยายพื้นที่กดให้ใหญ่ขึ้นรอบช่อง โดยไม่ดันตำแหน่ง — นิ้วกดโดนง่าย */}
      <button
        type="button"
        onClick={() => onToggle(todo.id)}
        aria-pressed={isDone}
        aria-label={isDone ? `ยกเลิกเสร็จ: ${todo.title}` : `ทำเครื่องหมายเสร็จ: ${todo.title}`}
        className="-m-2 rounded p-2"
      >
        <StatusMark status={todo.status} />
      </button>

      <Link href={todoHref(todo.id)} className="min-w-0 flex-1">
        <p className={isDone ? 'text-ink-soft line-through' : 'hover:underline'}>{todo.title}</p>
        {/* ✅ line-clamp-1 = รายละเอียดยาวแค่ไหนก็แสดงบรรทัดเดียว ที่เหลือดูในหน้ารายละเอียด */}
        {todo.note && <p className="line-clamp-1 text-sm text-ink-soft">{todo.note}</p>}
      </Link>

      <PriorityTag priority={todo.priority} />

      <button
        type="button"
        onClick={() => onDelete(todo.id)}
        aria-label={`ลบงาน ${todo.title}`}
        className="-mr-2 rounded p-2 text-ink-soft hover:bg-danger/10 hover:text-danger"
      >
        <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
          <path d="M4 4l8 8M12 4l-8 8" />
        </svg>
      </button>
    </li>
  )
}