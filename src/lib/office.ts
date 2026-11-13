export type RoomKey = 'MANAGER' | 'WORK' | 'MEETING' | 'LOUNGE'
export type Point = { x: number; y: number }
type Rect = { x: number; y: number; w: number; h: number }

type RoomConfig = {
    label: string
    hint: string
    ownerOnly: boolean
    area: Rect
    door: Point
    seats: Point[]
}

// เส้นกลางทางเดินแนวนอน - ทุกการเดินข้ามห้องผ่านเส้นนี้
export const HALL_Y = 50

export const ROOMS: Record<RoomKey, RoomConfig> = {
    MANAGER: {
        label: 'ห้องผู้จัดการ',
        hint: 'ภาพรวมทีมและงานที่ยังไม่มีคนรับ',
        ownerOnly: true,
        area: { x: 0, y: 0, w: 38, h: 46 },
        door: { x: 19, y: 46 },
        seats: [{ x: 13, y: 18 }, { x: 25, y: 18 }, { x: 13, y: 36 }, { x: 25, y: 36 }],
    },
    WORK: {
        label: 'ห้องทำงาน',
        hint: 'ใครกำลังทำงานอะไรอยู่',
        ownerOnly: false,
        area: { x: 42, y: 0, w: 58, h: 46 },
        door: { x: 71, y: 46 },
        seats: [
            { x: 52, y: 16 }, { x: 64, y: 16 }, { x: 76, y: 16 }, { x: 88, y: 16 },
            { x: 52, y: 36 }, { x: 64, y: 36 }, { x: 76, y: 36 }, { x: 88, y: 36 },
        ],
    },
    MEETING: {
        label: 'ห้องประชุม',
        hint: 'คุยงานและจดบันทึกการประชุม',
        ownerOnly: false,
        area: { x: 0, y: 54, w: 38, h: 46 },
        door: { x: 19, y: 54 },
        seats: [
            { x: 8, y: 72 }, { x: 30, y: 72 }, { x: 8, y: 88 },
            { x: 30, y: 88 }, { x: 19, y: 66 }, { x: 19, y: 94 },
        ],
    },
    LOUNGE: {
        label: 'มุมพัก',
        hint: 'ยังไม่ได้ทำงานอะไร',
        ownerOnly: false,
        area: { x: 42, y: 54, w: 58, h: 46 },
        door: { x: 71, y: 54 },
        seats: [
            { x: 52, y: 70 }, { x: 64, y: 70 }, { x: 76, y: 70 }, { x: 88, y: 70 },
            { x: 52, y: 90 }, { x: 64, y: 90 }, { x: 76, y: 90 }, { x: 88, y: 90 },
        ],
    },
}

export const ROOM_ORDER: RoomKey[] = ['MANAGER', 'WORK', 'MEETING', 'LOUNGE']

export const FURNITURE: Rect[] = [
    { x: 9, y: 25, w: 20, h: 4 }, // โต๊ะผู้จัดการ
    { x: 47, y: 24, w: 46, h: 5 }, // โต๊ะทำงานยาว
    { x: 13, y: 75, w: 12, h: 10 }, // โต๊ะประชุม
    { x: 47, y: 78, w: 46, h: 4 }, // โซฟา
]

export function seatOf(room: RoomKey, index: number): Point {
    const seats = ROOMS[room].seats
    const base = seats[index % seats.length]
    const lap = Math.floor(index / seats.length)
    return { x: base.x + lap * 3, y: base.y + lap * 3 }
}

export function walkPath(from: Point, fromRoom: RoomKey, to: Point, toRoom: RoomKey): Point[] {
    if (fromRoom === toRoom) return [from, to]
    const a = ROOMS[fromRoom].door
    const b = ROOMS[toRoom].door
    return [from, a, { x: a.x, y: HALL_Y }, { x: b.x, y: HALL_Y }, b, to]
}