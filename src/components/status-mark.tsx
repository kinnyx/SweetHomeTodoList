import type { Status } from "@/types";

export function StatusMark({ status }: { status: Status }) {
    return (
        <span
            aria-hidden="true"
            className={`flex size-5 shrink-0 items-center justify-center rounded-[5px] border-2 ${
                status === 'DONE'
                    ? 'border-done bg-done text-surface'
                    : status === 'IN_PROGRESS'
                        ? 'border-progress'
                        : 'border-line'
            }`}
        >
            {status === 'DONE' && (
                <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path d="M3 8.5l3 3 7-7" />
                </svg>
            )}
            {status === 'IN_PROGRESS' && <span className="size-2 rounded-[2px] bg-progress" />}
        </span>
    )
}