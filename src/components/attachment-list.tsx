import { db } from "@/lib/db";
import { ATTACHMENT_BUCKET, storage } from "@/lib/storage";
import { formatFileSize } from "@/lib/attachments";
import { DeleteAttachmentButton } from "./delete-attachment-button";
import { map } from "zod";

const SIGNED_URL_SECONDS = 60 * 60

export async function AttachmentList({ todoId }: { todoId: number }) {
    const attachments = await db.attachment.findMany({
        where: { todoId },
        select: { id: true, path: true, fileName: true, size: true },
        orderBy: { createdAt: 'asc' },
    })

    if (attachments.length === 0) {
        return <p className="mt-4 text-sm text-ink-soft">ยังไม่มีรูปแนบ</p>
    }

    const { data: signed } = await storage
        .from(ATTACHMENT_BUCKET)
        .createSignedUrls(
            attachments.map((a) => a.path),
            SIGNED_URL_SECONDS
        )

    const urlByPath = new Map(signed?.map((s) => [s.path, s.signedUrl]) ?? [])

    return (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {attachments.map((a) => {
                const url = urlByPath.get(a.path)
                return (
                    <li key={a.id} className="overflow-hidden rounded-lg border border-line bg-surface">
                        {url ? (
                            <a href={url} target="_blank" rel="noopener noreferrer" className="block">
                                <img
                                    src={url}
                                    alt={a.fileName}
                                    loading="lazy"
                                    className="aspect-square w-full object-cover"
                                />
                            </a>
                        ) : (
                            <div className="flex aspect-square items-center justify-center text-xs text-ink-soft">
                                โหลดรูปไม่ได้
                            </div>
                        )}
                        <div className="flex items-center gap-2 px-2 py-1.5">
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-xs" title={a.fileName}>{a.fileName}</p>
                                <p className="text-xs text-ink-soft">{formatFileSize(a.size)}</p>
                            </div>
                            <DeleteAttachmentButton id={a.id} fileName={a.fileName} />
                        </div>
                    </li>
                )
            })}
        </ul>
    )
}