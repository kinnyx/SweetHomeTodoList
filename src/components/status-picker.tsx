import type { Status } from "@/types";

const OPTIONS: { value: string; label: string }[] = [
    { value: 'TODO', label: 'ต้องทำ' },
    { value: 'IN_PROGRESS', label: 'กำลังทำ' },
    { value: 'DONE', label: 'เสร็จแล้ว' },
]

export function StatusPicker({ defaultValue }: { defaultValue: string }) {
    return (
        <fieldset>
            <legend className="text-sm font-medium">สถานะ</legend>
            <div className="mt-2 inline-flex rounded-lg border border-line bg-paper p-1">
                {OPTIONS.map((opt) => (
                    <label 
                        key={opt.value}
                        className="cursor-pointer rounded-md px-4 py-1.5 text-sm text-ink-soft has-checked:bg-surface has-checked:text-ink has-checked:shadow-sm has-focus-visible:outline-2 has-focus-visible:outline-progress"
                    >
                        <input 
                        type="radio"
                        name="status"
                        value={opt.value}
                        defaultChecked={defaultValue === opt.value}
                        className="sr-only" 
                        />
                        {opt.label}
                    </label>
                ))}
            </div>
        </fieldset>
    )
}