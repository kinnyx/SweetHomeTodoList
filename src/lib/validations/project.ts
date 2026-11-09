import { z } from "zod";

export const ProjectIdSchema = z.string().min(1).max(50)

export const ProjectNameSchema = z.object({
    name: z.string().trim().min(1, 'กรุณาตั้งชื่อ Project').max(100, 'ชื่อยาวเกิน 100 ตัวอักษร'),
})

export const InviteSchema = z.object({
    email: z.string().trim().toLowerCase().pipe(z.email('รูปแบบอีเมลไม่ถูกต้อง')),
})