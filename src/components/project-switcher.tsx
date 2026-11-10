'use client'

import { useState, useTransition } from 'react'
import { switchProject } from '@/actions/project.action'

type Props = {
    projects: { id: string; name: string }[]
    currentId: string
}

export function ProjectSwitcher({ projects, currentId }: Props) {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    return (
        <div>
            <label htmlFor="project-switcher" className='sr-only'>project ที่เปิดอยู่</label>
            <select 
                id="project-switcher" 
                value={currentId} 
                disabled={isPending}
                onChange={(e) => {
                    const id = e.target.value
                    setError(null)
                    startTransition(async () => {
                        const result = await switchProject(id)
                        if (!result.ok) setError(result.error)
                    })
                }}
                className='max-w-44 truncate rounded-md border border-line bg-surface px-2 py-1 text-sm disabled:opacity-50'
            >
                {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                        {p.name}
                    </option>
                ))}
            </select>
            {error && <p role='alert' className='text-xs text-danger'>{error}</p>}
        </div>
    )
}