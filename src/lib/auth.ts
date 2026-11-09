import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";

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
        },
    },

    plugins: [nextCookies()],
})