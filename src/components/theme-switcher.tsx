'use client'

import { useSyncExternalStore } from "react"
import { useTheme } from "next-themes"

const OPTIONS = [
    { value: 'light', label: 'สว่าง' },
    { value: 'dark', label: 'มืด' },
    { value: 'system', label: 'ตามเครื่อง' },
] as const

const subscribe = () => () => {}
function useIsClient() {
    return useSyncExternalStore(subscribe, () => true, () => false)
}

export function ThemeSwitcher() {
    const { theme, setTheme } = useTheme()
    const isClient = useIsClient()

    return (
        <fieldset className="mt-4">
            <legend className="text-sm font-medium">ธีม</legend>
            <div className="mt-2 inline-flex rounded-lg border border-line bg-paper p-1">
                {OPTIONS.map((opt) => (
                    <label 
                        key={opt.value}
                        className="cursor-pointer rounded-md px-4 py-1.5 text-sm text-ink-soft has-checked:bg-surface has-checked:text-ink has-checked:shadow-sm has-focus-visible:outline-2 has-focus-visible:outline-progress"
                    >
                        <input 
                            type="radio" 
                            name="theme"
                            value={opt.value}
                            checked={isClient && theme === opt.value}
                            onChange={() => setTheme(opt.value)}
                            className="sr-only"
                        />
                        {opt.label}
                    </label>
                ))}
            </div>
            <p className="mt-2 text-xs text-ink-soft">จำค่าไว้ในเบาว์เซอร์นี้</p>
        </fieldset>
    )
}