import { z } from "zod";

export const CreateTodoSchema = z.object({
    title: z.string().trim().min(1, 'กรุณากรอกชื่องาน').max(255, 'ชื่องานยาวเกิน 255 ตัวอักษร'),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH'], { error: 'เลือกระดับความสำคัญ' }),

    note: z
        .string()
        .trim()
        .max(500, 'รายละเอียดยาวเกิน 500 ตัวอักษร')
        .nullish()
        .transform((v) => v || null),
})

export const TodoIdSchema = z.number().int().positive()

export const StatusSchema = z.enum(['TODO', 'IN_PROGRESS', 'DONE'])

export const UpdateTodoSchema = z.object({
    title: z.string().trim().min(1, 'กรุณากรอกชื่องาน').max(255, 'ชื่องานยาวเกิน 255 ตัวอักษร'),
    note: z
        .string()
        .trim()
        .max(5000, 'รายละเอียดยาวเกิน 5,000 ตัวอักษร')
        .nullish()
        .transform((v) => v || null),
    status: StatusSchema,
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH'], { error: 'เลือกระดับความสำคัญ' }),
    assigneeId: z.string().max(50).nullish().transform((v) => v || null),
})