'use client'

import { useActionState, useState, type ChangeEvent } from 'react'
import { removeAvatar, uploadAvatar, type AvatarFormState } from '@/actions/profile.actions'
import { Avatar } from './avatar'
import { ActionButton } from './action-button'

const initialState: AvatarFormState = { error: null }
const MAX_DIMENSION = 512

// 📌 [จุดประสงค์]: ย่อรูปใน browser ก่อนส่ง — ด้านยาวไม่เกิน 512px แปลงเป็น WEBP
// ✅ ผลพลอยได้ด้านความเป็นส่วนตัว: การวาดใหม่ลง canvas ตัดข้อมูลแฝงในรูปทิ้งหมด
//    รูปจากมือถือมักมีพิกัด GPS ตอนถ่าย (EXIF) — ถ้าอัปโหลดตรง ๆ ใครเปิดรูปก็รู้ว่าถ่ายที่ไหน
async function resizeImage(file: File): Promise<File> {
  // ✅ createImageBitmap หมุนรูปตามแนวที่ถ่ายให้เอง (รูปมือถือแนวตั้งไม่กลายเป็นแนวนอน)
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return file // browser เก่ามาก — ส่งไฟล์เดิมไปให้ server ตรวจตามปกติ

  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close() // ✅ คืนหน่วยความจำของรูปต้นฉบับ

  // ✅ toBlob ใช้ callback แบบเก่า — ห่อด้วย Promise ให้ใช้ await ได้
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/webp', 0.85)
  )
  if (!blob) return file

  const baseName = file.name.replace(/\.[^.]+$/, '')
  return new File([blob], `${baseName}.webp`, { type: 'image/webp' })
}

export function AvatarForm({ name, image }: { name: string; image: string | null }) {
  const [state, formAction, isPending] = useActionState(uploadAvatar, initialState)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeNote, setResizeNote] = useState<string | null>(null)

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget
    const file = input.files?.[0]
    setResizeNote(null)
    if (!file) return

    setIsResizing(true)
    try {
      const resized = await resizeImage(file)
      // 📌 แทนไฟล์ในช่อง input ด้วยไฟล์ที่ย่อแล้ว
      //    input.files แก้ตรง ๆ ไม่ได้ ต้องสร้างรายการไฟล์ใหม่ผ่าน DataTransfer
      //    (กลไกเดียวกับตอนลากไฟล์มาวางในหน้าเว็บ)
      const dt = new DataTransfer()
      dt.items.add(resized)
      input.files = dt.files
      setResizeNote(`ย่อเหลือ ${Math.round(resized.size / 1024)} KB`)
    } catch {
      // ✅ ย่อไม่ได้ (เช่น ไฟล์ไม่ใช่รูป) — ปล่อยไฟล์เดิม server จะบอก error ที่ถูกต้องเอง
    } finally {
      setIsResizing(false)
    }
  }

  return (
    <div className="mt-4 flex items-start gap-4">
      <Avatar name={name} image={image} size="lg" />

      <div className="min-w-0 flex-1 space-y-2">
        <form action={formAction} className="flex flex-wrap items-center gap-2">
          <label htmlFor="avatar" className="sr-only">เลือกรูปโปรไฟล์</label>
          <input
            id="avatar"
            name="avatar"
            type="file"
            required
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="text-sm text-ink-soft file:mr-3 file:rounded-md file:border file:border-line file:bg-surface file:px-3 file:py-1.5 file:text-ink hover:file:bg-paper"
          />
          <button
            type="submit"
            // ✅ ห้ามกดระหว่างย่อ — ไม่งั้นจะส่งไฟล์ต้นฉบับขนาดใหญ่ไป
            disabled={isPending || isResizing}
            className="rounded-md bg-ink px-3 py-1.5 text-sm text-surface hover:bg-ink/85 disabled:bg-ink-soft"
          >
            {isResizing ? 'กำลังย่อรูป…' : isPending ? 'กำลังอัปโหลด…' : image ? 'เปลี่ยนรูป' : 'อัปโหลดรูป'}
          </button>
        </form>

        <p aria-live="polite" className="text-xs text-ink-soft">
          {resizeNote ?? 'JPG, PNG หรือ WEBP รูปสี่เหลี่ยมจัตุรัสจะดูดีที่สุด'}
        </p>
        {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}

        {image && (
          <ActionButton
            action={removeAvatar}
            label="ลบรูป"
            pendingLabel="กำลังลบ…"
            confirmText="ลบรูปโปรไฟล์?"
            variant="danger"
          />
        )}
      </div>
    </div>
  )
}