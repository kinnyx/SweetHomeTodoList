import Link from "next/link";
import { getSession } from "@/lib/session";
import { signOutAction } from "@/actions/auth.action";

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
            <Link href="/settings" className="text-ink-soft hover:text-ink">
                ตั้งค่า
            </Link>

            <form action={signOutAction}>
                <button type="submit" className="text-ink-soft underline hover:text-ink">
                    ออกจากระบบ
                </button>
            </form>
        </div>
    )
}