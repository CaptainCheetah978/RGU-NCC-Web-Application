export enum Role {
    ANO = "ANO", // Associate NCC Officer (Super Admin)
    SUO = "SUO", // Senior Under Officer (Admin)
    UO = "UO",   // Under Officer (Moderator)
    SGT = "SGT", // Sergeant (Moderator)
    CPL = "CPL", // Corporal (User)
    LCPL = "LCPL", // Lance Corporal (User)
    CADET = "CADET", // Cadet (User)
}

export interface User {
    id: string;
    name: string;
    role: Role;
    regimentalNumber?: string;
    avatarUrl?: string;
}

export interface Cadet extends User {
    rank: Role;
    unit: string;
    platoon: string;
    enrollmentYear: number;
}

export interface ClassSession {
    id: string;
    title: string;
    date: string;
    time: string;
    instructorId: string;
    attendees: string[]; // Cadet IDs
    description?: string;
}

export interface AttendanceRecord {
    id: string;
    classId: string;
    cadetId: string;
    status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
    timestamp: string;
}
