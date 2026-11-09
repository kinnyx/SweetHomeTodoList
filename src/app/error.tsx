// 📌 [จุดประสงค์]: หน้าที่แสดงเมื่อ page.tsx พัง (เช่น ต่อ DB ไม่ได้)
//    เหมือน Try...Catch ครอบทั้งหน้า แทนที่ผู้ใช้จะเห็นหน้าขาวหรือ error ยาว ๆ
// ⚠️ [ข้อควรระวัง]: ต้องเป็น Client Component เสมอ เพราะมีปุ่มให้กด "ลองใหม่"
'use client'

type ErrorProps = {
  // ✅ digest = รหัสอ้างอิง error ที่ไปหาใน log ของ server ได้
  error: Error & { digest?: string }
  // ✅ reset = ฟังก์ชันที่ Next.js ส่งมาให้ สั่งวาดหน้าใหม่อีกครั้ง
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <h1 className="font-display text-3xl font-semibold">งานของฉัน</h1>

      <div className="mt-8 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3">
        <p className="font-medium text-danger">เชื่อมต่อฐานข้อมูลไม่ได้</p>
        {/* ✅ บอกผู้ใช้ว่าทำอะไรต่อได้ ไม่ใช่แค่บอกว่าพัง */}
        <p className="mt-1 text-sm text-ink-soft">
          ตรวจสอบว่าฐานข้อมูลทำงานอยู่ แล้วกดลองใหม่
        </p>
        {/* 🔒 [Security]: ไม่แสดง error.message ให้ผู้ใช้เห็น
            เพราะอาจมีรายละเอียดภายใน เช่น ชื่อ host หรือ connection string
            บน production Next.js ซ่อนข้อความจริงให้อยู่แล้ว เหลือแค่ digest */}
        {error.digest && (
          <p className="mt-2 text-xs text-ink-soft">รหัสอ้างอิง: {error.digest}</p>
        )}
      </div>

      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-md bg-ink px-4 py-2 text-sm text-surface hover:bg-ink/85"
      >
        ลองใหม่
      </button>
    </main>
  )
}