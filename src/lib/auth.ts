import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";
import { AVATAR_BUCKET, storage } from "./storage";

export const auth = betterAuth({
    database: prismaAdapter(db, { provider: 'postgresql' }),

    emailAndPassword: {
        enabled: true,
        minPasswordLength: 8,
    },

    databaseHooks: {
        user: {
            create: {
                after: async (user) => {
                    await db.project.create({
                        data: {
                            name: 'งานส่วนตัว',
                            isPersonal: true,
                            members: { create: { userId: user.id, role: 'OWNER' } },
                        },
                    })
                },
            },
            delete: {
                before: async (user) => {
                    const { data: files } = await storage.from(AVATAR_BUCKET).list(`users/${user.id}`)
                    if (files && files.length > 0) {
                        await storage.from(AVATAR_BUCKET).remove(files.map((f) => `users/${user.id}/${f.name}`))
                    }
                }
            }
        },
    },

    plugins: [nextCookies()],
})