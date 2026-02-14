export enum Role {
    ANO = "ANO", // Associate NCC Officer (Super Admin)
    SUO = "SUO", // Senior Under Officer (Admin)
    UO = "UO",   // Under Officer (Moderator)
    SGT = "SGT", // Sergeant (Moderator)
    CPL = "CPL", // Corporal (User)
    LCPL = "LCPL", // Lance Corporal (User)
    CADET = "CADET", // Cadet (User)
}

export enum Wing {
    ARMY = "Army",
    AIR = "Air",
    NAVY = "Navy",
}

export enum Gender {
    MALE = "Male",
    FEMALE = "Female",
}

export interface User {
    id: string;
    name: string;
    role: Role;
    regimentalNumber?: string;
    avatarUrl?: string;
    pin?: string;
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
