export enum Role {
    ANO = 'ANO',
    CTO = 'CTO',
    CSUO = 'CSUO', // Formerly SUO
    CJUO = 'CJUO', // Formerly UO
    CWO = 'CWO',
    CSM = 'CSM',
    CQMS = 'CQMS',
    SGT = 'SGT',
    CPL = 'CPL',
    LCPL = 'LCPL',
    CADET = 'CADET'
}

/**
 * Normalizes legacy rank strings (e.g. UO, SUO) from the database to their
 * current enum-compatible equivalents (CJUO, CSUO).
 */
export function normalizeRole(role: string | null | undefined): Role {
    if (!role) return Role.CADET;
    const r = role.toUpperCase();
    if (r === 'UO') return Role.CJUO;
    if (r === 'SUO') return Role.CSUO;
    if (r === 'WO' || r === 'CWO') return Role.CWO;
    // Check if it's already a valid Role enum value
    if (Object.values(Role).includes(r as Role)) return r as Role;
    return Role.CADET;
}

/**
 * Normalizes legacy gender/classification strings from the database 
 * to their official NCC equivalents (SD/SW).
 */
export function normalizeGender(gender: string | null | undefined): Gender {
    if (!gender) return Gender.SD;
    const g = gender.toUpperCase();
    if (g === 'SD' || g === 'MALE') return Gender.SD;
    if (g === 'SW' || g === 'FEMALE') return Gender.SW;
    return Gender.SD;
}

export enum Wing {
    ARMY = "Army",
    AIR = "Air",
    NAVY = "Navy",
}

export enum Gender {
    SD = "SD",
    SW = "SW",
}

export interface User {
    id: string;
    name: string;
    role: Role;
    regimentalNumber?: string;
    avatarUrl?: string;
    unitId?: string;
    unitName?: string;
    unitNumber?: string;
}

export interface Cadet extends User {
    rank: Role;
    wing: Wing;
    gender: Gender;
    battalion?: string;
    unitNumber: string;
    unitName?: string;
    enrollmentYear: number;
    bloodGroup?: string;
    status: "active" | "alumni";
}

export interface ClassSession {
    id: string;
    title: string;
    date: string;
    time: string;
    instructorId: string;
    attendees: string[]; // Cadet IDs
    description?: string;
    tag?: string;
}

export interface AttendanceRecord {
    id: string;
    classId: string;
    cadetId: string;
    status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
    timestamp: string;
}

export interface Note {
    id: string;
    senderId: string;
    senderName: string;
    recipientId: string;
    recipientName: string;
    subject: string;
    content: string;
    timestamp: string;
    isRead: boolean;
    forwardedToANO?: boolean;
    originalSenderId?: string; // For forwarded notes
    originalSenderName?: string;
}

export interface Certificate {
    id: string;
    userId: string;
    name: string;
    type: "A" | "B" | "C" | "Camp" | "Award" | "Other";
    fileData: string; // base64
    uploadDate: string;
}

export interface Announcement {
    id: string;
    title: string;
    content: string;
    authorId: string;
    authorName: string;
    priority: "normal" | "urgent";
    createdAt: string;
    expiresAt?: string;
}

export interface ActivityLogEntry {
    id: string;
    action: string;
    performedBy: string;
    performedByName: string;
    targetName?: string;
    timestamp: string;
}
