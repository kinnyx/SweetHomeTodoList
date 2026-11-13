import Link from "next/link";
import { getSession } from "@/lib/session";
import { signOutAction } from "@/actions/auth.actions";
import { Avatar } from "./avatar";

export async function UserMenu() {
    const session = await getSession()

    if (!session) {
        return (
            <Link href="/sign-in" className="hover:underline">
                เข้าสู่ระบบ
            </Link>
        )
    }

    return (
        <div className="flex items-center gap-3">
            <Link href="/settings" className="flex items-center gap-2 text-ink-soft hover:text-ink">
                <Avatar name={session.user.name} image = {session.user.image} size="sm" decorative />
                <span>{session.user.name}</span>
            </Link>

            <form action={signOutAction}>
                <button type="submit" className="text-ink-soft underline hover:text-ink">
                    ออกจากระบบ
                </button>
            </form>
        </div>
    )
}