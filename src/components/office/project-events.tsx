'use client'

import { createContext, useCallback, useContext, useEffect, useRef, type ReactNode } from "react"
import type { ProjectEvent } from "@/types"

type Listener = (event: ProjectEvent) => void
type Subscribe = (Listener: Listener) => () => void

const ProjectEventsContext = createContext<Subscribe | null>(null)

export function ProjectEventsProvider({ projectId, children }: { projectId: string; children: ReactNode }) {
    const listeners = useRef(new Set<Listener>())

    useEffect(() => {
        //EventSource = ตัวรับ SSE ของ browser - ส่ง cookie login ไปเอง และต่อใหม่เองเมื่อหลุด
        const source = new EventSource(`/api/projects/${projectId}/events`)
        const forward = (e: MessageEvent<string>) => {
            const event = JSON.parse(e.data) as ProjectEvent
            listeners.current.forEach((listener) => listener(event))
        }
        source.addEventListener('chat', forward)
        source.addEventListener('move', forward)
        return () => source.close()
    }, [projectId])

    const subscribe = useCallback<Subscribe>((listener) => {
        listeners.current.add(listener)
        return () => {
            listeners.current.delete(listener)
        }
    }, [])

    return <ProjectEventsContext value={subscribe}>{children}</ProjectEventsContext>
}

// ใช้ใน component ใดก็ได้ที่อยู่ข้างใน Provider
export function useProjectEvent(listener: Listener) {
    const subscribe = useContext(ProjectEventsContext)
    // เก็บ listener ล่าสุดใน ref - ไม่ต้องเลิกสมัครแล้วสมัครใหม่ทุกครั้งที่ component วาดใหม่
    const latest = useRef(listener)
    useEffect(() => {
        latest.current = listener
    })
    useEffect(() => subscribe?.((event) => latest.current(event)), [subscribe])
}