import { z } from "zod";

export const SignUpSchema = z.object({
    name: z.string().trim().min(1, 'กรุณากรอกชื่อ').max(100, 'ชื่อยาวเกินไป'),
    email: z.email('รูปแบบอีเมลไม่ถูกต้อง'),
    password: z.string().min(8, 'รหัสผ่านอย่างน้อย 8 ตัวอักษร').max(128, 'รหัสผ่านยาวเกินไป'),
})

export const SignInSchema = z.object({
    email: z.email('รูปแบบอีเมลไม่ถูกต้อง'),
    password: z.string().min(1, 'กรุณากรอกรหัสผ่าน'),
})

export const UpdateProfileSchema = z.object({
    name: z.string().trim().min(1, 'กรุณากรอกชื่อ').max(100, 'ชื่อยาวเกินไป')
})