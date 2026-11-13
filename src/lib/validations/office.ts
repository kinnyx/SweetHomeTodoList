import { z } from "zod";

export const RoomSchema = z.enum(['MANAGER', 'WORK', 'MEETING', 'LOUNGE'])