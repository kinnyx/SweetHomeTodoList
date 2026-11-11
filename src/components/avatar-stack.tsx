import { Avatar } from "./avatar";

type Member = { id: string; name: string; image: string | null }

export function AvatarStack({ members, max = 5 }: { members: Member[]; max?: number }) {
    const shown = members.slice(0, max)
    const rest = members.length - shown.length

    return (
        <div className="flex items-center">
            <ul className="flex -space-x-2" aria-label={`สมาชิก ${members.length} คน`}>
                {shown.map((m) => (
                    <li key={m.id} title={m.name} className="rounded-full ring-2 ring-paper">
                        <Avatar name={m.name} image={m.image} />
                    </li>
                ))}
            </ul>
            {rest > 0 && <span className="ml-2 text-sm text-ink-soft">+{rest}</span>}
        </div>
    )
}