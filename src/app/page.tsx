import Link from 'next/link'
import { Suspense } from 'react'
import { connection } from 'next/server'
import { db } from '@/lib/db'
import { TodoList } from '@/components/todo-list'
import { AddTodoForm } from '@/components/add-todo-form'
import { requireUser } from '@/lib/session'
import { accessibleTodos } from '@/lib/access'
import { getCurrentProject } from '@/lib/current-project'
import { AvatarStack } from '@/components/avatar-stack'
import { ProjectHeading, ProjectHeadingSkeleton } from '@/components/project-heading'
import { todoSelect } from '@/lib/todo-select'

export default function HomePage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <Suspense fallback={<ProjectHeadingSkeleton />}>
        <ProjectHeading />
      </Suspense>

      <AddTodoForm />
      
      <Suspense fallback={<TodoSkeleton />}>
        <TodosSection />
      </Suspense>
    </main>
  );
}

async function TodosSection() {
  await connection()
  const user = await requireUser()
  const project = await getCurrentProject(user.id)

  const todos = await db.todo.findMany({
    where: { ...accessibleTodos(user.id), projectId: project.id },
    select: todoSelect,
    orderBy: [{ priority: 'desc' },{ createdAt: 'asc' }],
  })

  if (todos.length === 0) {
    return <p className='mt-8 text-ink-soft'>ยังไม่มีงาน - เพิ่มงานแรกของคุณได้ในบทที่ 5</p>
  }

  return <TodoList todos={todos} />
}

function TodoSkeleton() {
  return (
    <div className='mt-8 space-y-2'>
      {[1, 2, 3].map((i) => (
        <div key={i} className='h-12 animate-pulse rounded-lg bg-paper' />
      ))}
    </div>
  )
}
