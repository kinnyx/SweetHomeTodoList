// 📌 [จุดประสงค์]: ชื่อที่ผู้ใช้เห็นของแต่ละระดับความสำคัญ
// ✅ ค่าใน DB ยังเป็น HIGH / MEDIUM / LOW — เปลี่ยนแค่ที่แสดงผล
//    เหมือนตั้ง DisplayMember ต่างจาก ValueMember ใน ComboBox
import type { Priority } from '@/types'

export const PRIORITY_LABEL: Record<Priority, string> = {
  HIGH: 'ด่วน',
  MEDIUM: 'ปกติ',
  LOW: 'ไม่รีบ',
}

// ✅ ลำดับที่แสดงในตัวเลือก — ด่วนขึ้นก่อน
export const PRIORITY_ORDER: Priority[] = ['HIGH', 'MEDIUM', 'LOW']