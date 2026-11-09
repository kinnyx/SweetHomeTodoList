import type { Priority } from "@/types";
import { PRIORITY_LABEL } from "@/lib/priority";

const tagStyle: Record<Priority, string> = {
  HIGH: 'bg-signal text-on-signal',
  MEDIUM: 'bg-line text-ink',
  LOW: 'bg-paper text-ink-soft',
}

export function PriorityTag({ priority }: { priority: Priority }) {
    return (
        <span
            className={`inline-flex shrink-0 items-center gap-1.5 py-0.5 pr-2.5 pl-3 font-display text-xs font-semibold [clip-path:polygon(7px_0,100%_0,100%_100%,7px_100%,0_50%)] ${tagStyle[priority]}`}
        >
            <span aria-hidden="true" className="size-1 rounded-full bg-current opacity-50" />
            <span className="sr-only">ความสำคัญ</span>
            {PRIORITY_LABEL[priority]}
        </span>
    )
}