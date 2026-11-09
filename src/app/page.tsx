import { Suspense } from 'react'
import { connection } from 'next/server'
import { db } from '@/lib/db'
import { TodoList } from '@/components/todo-list'
import { AddTodoForm } from '@/components/add-todo-form'
import { requireUser } from '@/lib/session'
import { accessibleTodos } from '@/lib/access'
import { getCurrentProject } from '@/lib/current-project'

export default function HomePage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <Suspense fallback={<div className="h-10 w-48 animate-pulse rounded bg-paper" />}>
        <ProjectHeading />
      </Suspense>

      <AddTodoForm />
      
      <Suspense fallback={<TodoSkeleton />}>
        <TodosSection />
      </Suspense>
    </main>
  );
}

async function ProjectHeading() {
  await connection()
  const user = await requireUser()
  const project = await getCurrentProject(user.id)
  return <h1 className='font-display text-3xl font-semibold'>{project.name}</h1>
}

async function TodosSection() {
  await connection()
  const user = await requireUser()
  const project = await getCurrentProject(user.id)

  const todos = await db.todo.findMany({
    where: { ...accessibleTodos(user.id), projectId: project.id },
    select: { id: true, title: true, status: true, priority: true, note: true },
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
