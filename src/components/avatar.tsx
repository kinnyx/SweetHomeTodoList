const LEADING_VOWELS = 'เแโใไ'

function initialOf(name: string) {
    const chars = Array.from(name.trim())
    if (chars.length === 0) return '?'
    const first = LEADING_VOWELS.includes(chars[0]) && chars[1] ? chars[1] : chars[0]
    return first.toUpperCase() 
}

const sizes = {
    sm: 'size-6 text-[10px]',
    md: 'size-8 text-xs',
    lg: 'size-16 text-xl',
}

type AvatarProps = {
    name: string
    image: string | null | undefined
    size?: keyof typeof sizes
    decorative?: boolean
}

export function Avatar({ name, image, size = 'md', decorative = false }: AvatarProps) {
    const base = `${sizes[size]} shrink-0 rounded-full`

    if (image) {
        return (
            <img 
                src={image} 
                alt={decorative ? '' : name} 
                loading="lazy"
                className={`${base} bg-paper object-cover`}
            />
        )
    }

    return (
        <span
            role={decorative ? undefined : 'img'}
            aria-label={decorative ? undefined : name}
            aria-hidden={decorative || undefined}
            className={`${base} inline-flex items-center justify-center bg-line font-display font-semibold text-ink`}
        >
            {initialOf(name)}
        </span>
    )
}