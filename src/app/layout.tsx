import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Suspense } from 'react'
import Link from 'next/link'
import { Chakra_Petch, IBM_Plex_Sans_Thai_Looped } from 'next/font/google'
import { MainNav, MainNavFallback } from '@/components/main-nav'
import { UserMenu } from '@/components/user-menu'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

// ✅ next/font ดาวน์โหลด font มาเก็บในโปรเจกต์ตอน build
//    ผู้ใช้ไม่ต้องโหลดจาก Google ตอนเปิดหน้า เร็วกว่าและไม่ส่งข้อมูลไป Google
// ✅ subsets: ['thai', 'latin'] = เอาเฉพาะตัวอักษรที่ใช้ ไฟล์จะเล็กลง
const display = Chakra_Petch({
  subsets: ['thai', 'latin'],
  weight: ['500', '600', '700'],
  variable: '--font-chakra',
  display: 'swap',
})

const body = IBM_Plex_Sans_Thai_Looped({
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-looped',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ใบงาน',
  description: 'จัดการงานประจำวันแบบรายการ ตาราง และบอร์ด',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // ✅ lang="th" สำคัญมาก: browser ตัดคำภาษาไทยตอนขึ้นบรรทัดใหม่ได้ถูก
    //    (ภาษาไทยไม่มีเว้นวรรคระหว่างคำ) และ screen reader อ่านด้วยเสียงภาษาไทย
    <html lang="th" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <ThemeProvider>
          <header className="border-b border-line bg-surface">
            <div className="mx-auto flex max-w-5xl items-center gap-6 px-6 text-sm">
              <Link href="/" className="py-3 font-display text-lg font-bold">
                ใบงาน
              </Link>
              <nav aria-label="เมนูหลัก" className="flex gap-5">
                <Suspense fallback={<MainNavFallback />}>
                  <MainNav />
                </Suspense>
              </nav>
              <div className="ml-auto">
                <Suspense fallback={null}>
                  <UserMenu />
                </Suspense>
              </div>
            </div>
          </header>
          {children}
        </ThemeProvider>        
      </body>
    </html>
  )
}