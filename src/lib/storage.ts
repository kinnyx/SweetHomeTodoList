import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { AllowedImageType } from './attachments'

export const ATTACHMENT_BUCKET = 'attachments'

const url = process.env.SUPABASE_URL
const secretKey = process.env.SUPABASE_SECRET_KEY

if (!url || !secretKey) {
    throw new Error('ยังไม่ได้ตั้งค่า SUPABASE_URL หรือ SUPABASE_SECRET_KEY ใน .env')
}

export const storage = createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
}).storage

export function detectImageType(bytes: Uint8Array): AllowedImageType | null {
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'

    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
        return 'image/png'
    }

    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return 'image/gif'

    const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end))

    if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp'

    return null
}