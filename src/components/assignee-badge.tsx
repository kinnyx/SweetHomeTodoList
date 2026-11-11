import type { UserSummary } from "@/types";
import { Avatar } from "./avatar";

export function AssigneeBadge({ assignee }: { assignee: UserSummary | null }) {
    if (!assignee) return null

    return (
        <span title={`ผู้รับผิดชอบ: ${assignee.name}`} className="inline-flex shrink-0">
            <span className="sr-only">ผู้รับผิดชอบ </span>
            <Avatar name={assignee.name} image={assignee.image} size="sm" />
        </span>
    )
}