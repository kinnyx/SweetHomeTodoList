export const MAX_FILE_SIZE = 5 * 1024 * 1024
export const MAX_FILES_PER_TODO = 10

export const ALLOWED_IMAGE_TYPES = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif' : 'gif',
} as const

export type AllowedImageType = keyof typeof ALLOWED_IMAGE_TYPES

export function formatFileSize(bytes: number) {
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
    return `${(bytes / 1024 /1024).toFixed(1)} MB`
}