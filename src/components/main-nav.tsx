'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"

const ITEMS = [
    { href: '/', label: 'รายการ' },
    { href: '/table', label: 'ตาราง' },
    { href: '/kanban', label: 'บอร์ด' },
]

const base = 'border-b-2 py-3'
const idle = 'border-transparent text-ink-soft hover:text-ink'
const active = 'border-ink text-ink'

export function MainNav() {
    const pathname = usePathname()

    return (
        <>
            {ITEMS.map((item) => {
                const isActive = pathname === item.href
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        aria-current={isActive ? 'page' : undefined}
                        className={`${base} ${isActive ? active : idle}`}
                    >
                        {item.label}
                    </Link>
                )
            })}
        </>
    )
}

export function MainNavFallback() {
    return (
        <>
            {ITEMS.map((item) => (
                <Link key={item.href} href={item.href} className={`${base} ${idle}`}>
                    {item.label}
                </Link>
            ))}
        </>
    )
}