"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { ClassSession, Cadet, AttendanceRecord, Note, Role, User, Certificate, Announcement, ActivityLogEntry } from "@/types";
import { MOCK_USERS } from "@/lib/mock-data";

interface DashboardStats {
    totalCadets: number;
    attendanceRate: string;
    activeClasses: number;
    unreadNotes: number;
}

interface PersonalAttendanceEntry {
    date: string;
    className: string;
    status: AttendanceRecord["status"];
}

interface DataContextType {
    classes: ClassSession[];
    addClass: (cls: ClassSession) => void;
    deleteClass: (id: string) => void;
    cadets: Cadet[];
    addCadet: (cadet: Cadet) => void;
    updateCadet: (id: string, updates: Partial<Cadet>) => void;
    deleteCadet: (id: string) => void;
    attendance: AttendanceRecord[];
    markAttendance: (record: AttendanceRecord) => void;
    notes: Note[];
    sendNote: (note: Note) => void;
    markNoteAsRead: (id: string) => void;
    forwardNoteToANO: (noteId: string, anoId: string, anoName: string) => void;
    deleteNote: (id: string) => void;
    getStats: (userId?: string) => DashboardStats;
    messageableUsers: (Cadet | User)[];
    updateUser: (userId: string, updates: Partial<Cadet | User>) => void;
    markAllAsRead: (userId: string) => void;
    // Attendance insights
    getPersonalAttendance: (cadetId: string) => PersonalAttendanceEntry[];
    getAttendanceByClass: () => { className: string; present: number; absent: number; late: number; excused: number }[];
    // Certificates
    certificates: Certificate[];
    addCertificate: (cert: Certificate) => void;
    deleteCertificate: (certId: string) => void;
    getCertificates: (userId: string) => Certificate[];
    // Announcements
    announcements: Announcement[];
    addAnnouncement: (announcement: Announcement) => void;
    deleteAnnouncement: (id: string) => void;
    // Activity Log
    activityLog: ActivityLogEntry[];
    logActivity: (action: string, userId: string, userName: string, targetName?: string) => void;
    getRecentActivities: (limit: number) => ActivityLogEntry[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
    // Lazy initialization functions to read from localStorage synchronously on first render
    const [classes, setClasses] = useState<ClassSession[]>(() => {
        if (typeof window === 'undefined') return [];
        const stored = localStorage.getItem("ncc_classes");
        return stored ? JSON.parse(stored) : [];
    });

    const [cadets, setCadets] = useState<Cadet[]>(() => {
        if (typeof window === 'undefined') return [];
        const stored = localStorage.getItem("ncc_cadets");
        const initialCadets: Cadet[] = stored ? JSON.parse(stored) : [];

        // Always ensure login cadets (except ANO) are in the list
        const loginCadets = MOCK_USERS.filter(u => u.role !== Role.ANO) as Cadet[];

        // Merge login cadets that don't already exist in the registry (by ID)
        loginCadets.forEach(loginCdt => {
            if (!initialCadets.find(c => c.id === loginCdt.id)) {
                initialCadets.push(loginCdt);
            }
        });

        return initialCadets;
    });

    const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
        if (typeof window === 'undefined') return [];
        const stored = localStorage.getItem("ncc_attendance");
        return stored ? JSON.parse(stored) : [];
    });

    const [notes, setNotes] = useState<Note[]>(() => {
        if (typeof window === 'undefined') return [];
        const stored = localStorage.getItem("ncc_notes");
        return stored ? JSON.parse(stored) : [];
    });

    const [extraUserData, setExtraUserData] = useState<Record<string, Partial<Cadet | User>>>(() => {
        if (typeof window === 'undefined') return {};
        const stored = localStorage.getItem("ncc_extra_user_data");
        return stored ? JSON.parse(stored) : {};
    });

    const [certificates, setCertificates] = useState<Certificate[]>(() => {
        if (typeof window === 'undefined') return [];
        const stored = localStorage.getItem("ncc_certificates");
        return stored ? JSON.parse(stored) : [];
    });

    const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
        if (typeof window === 'undefined') return [];
        const stored = localStorage.getItem("ncc_announcements");
        return stored ? JSON.parse(stored) : [];
    });

    const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>(() => {
        if (typeof window === 'undefined') return [];
        const stored = localStorage.getItem("ncc_activity_log");
        return stored ? JSON.parse(stored) : [];
    });

    // Sync to localStorage on changes
    useEffect(() => { localStorage.setItem("ncc_classes", JSON.stringify(classes)); }, [classes]);
    useEffect(() => { localStorage.setItem("ncc_cadets", JSON.stringify(cadets)); }, [cadets]);
    useEffect(() => { localStorage.setItem("ncc_attendance", JSON.stringify(attendance)); }, [attendance]);
    useEffect(() => { localStorage.setItem("ncc_notes", JSON.stringify(notes)); }, [notes]);
    useEffect(() => { localStorage.setItem("ncc_extra_user_data", JSON.stringify(extraUserData)); }, [extraUserData]);
    useEffect(() => { localStorage.setItem("ncc_certificates", JSON.stringify(certificates)); }, [certificates]);
    useEffect(() => { localStorage.setItem("ncc_announcements", JSON.stringify(announcements)); }, [announcements]);
    useEffect(() => { localStorage.setItem("ncc_activity_log", JSON.stringify(activityLog)); }, [activityLog]);

    // Activity logging helper
    const logActivity = useCallback((action: string, userId: string, userName: string, targetName?: string) => {
        const entry: ActivityLogEntry = {
            id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            action,
            performedBy: userId,
            performedByName: userName,
            targetName,
            timestamp: new Date().toISOString(),
        };
        setActivityLog(prev => [entry, ...prev].slice(0, 200)); // keep last 200 entries
    }, []);

    const getRecentActivities = useCallback((limit: number) => {
        return activityLog.slice(0, limit);
    }, [activityLog]);

    // Class management
    const addClass = (cls: ClassSession) => {
        setClasses(prev => [...prev, cls]);
    };

    const deleteClass = (id: string) => {
        setClasses(prev => prev.filter(c => c.id !== id));
    };

    // Cadet management
    const addCadet = (cadet: Cadet) => {
        setCadets(prev => [...prev, cadet]);
    };

    const updateCadet = (id: string, updates: Partial<Cadet>) => {
        setCadets(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    };

    const deleteCadet = (id: string) => {
        setCadets(prev => prev.filter(c => c.id !== id));
    };

    // Attendance management
    const markAttendance = (record: AttendanceRecord) => {
        setAttendance(prev => {
            const filtered = prev.filter(r => !(r.classId === record.classId && r.cadetId === record.cadetId));
            return [...filtered, record];
        });
    };

    // Notes management
    const sendNote = (note: Note) => {
        setNotes(prev => [...prev, note]);
    };

    const markNoteAsRead = (id: string) => {
        setNotes(prev => prev.map(note =>
            note.id === id ? { ...note, isRead: true } : note
        ));
    };

    const forwardNoteToANO = (noteId: string, anoId: string, anoName: string) => {
        const originalNote = notes.find(n => n.id === noteId);
        if (!originalNote) return;

        const forwardedNote: Note = {
            ...originalNote,
            id: `fwd-${Date.now()}`,
            recipientId: anoId,
            recipientName: anoName,
            timestamp: new Date().toISOString(),
            isRead: false,
            forwardedToANO: true,
            originalSenderId: originalNote.senderId,
            originalSenderName: originalNote.senderName,
        };

        setNotes(prev => [
            ...prev.map(n => n.id === noteId ? { ...n, forwardedToANO: true } : n),
            forwardedNote
        ]);
    };

    const deleteNote = (id: string) => {
        setNotes(prev => prev.filter(n => n.id !== id));
    };

    const markAllAsRead = (userId: string) => {
        setNotes(prev => prev.map(note =>
            note.recipientId === userId ? { ...note, isRead: true } : note
        ));
    };

    const updateUser = (userId: string, updates: Partial<Cadet | User>) => {
        if (cadets.find(c => c.id === userId)) {
            setCadets(prev => prev.map(c => c.id === userId ? { ...c, ...updates } : c));
        } else {
            setExtraUserData(prev => ({ ...prev, [userId]: { ...prev[userId], ...updates } }));
        }
    };

    // Certificates
    const addCertificate = (cert: Certificate) => {
        setCertificates(prev => [...prev, cert]);
    };

    const deleteCertificate = (certId: string) => {
        setCertificates(prev => prev.filter(c => c.id !== certId));
    };

    const getCertificates = useCallback((userId: string) => {
        return certificates.filter(c => c.userId === userId);
    }, [certificates]);

    // Announcements
    const addAnnouncement = (announcement: Announcement) => {
        setAnnouncements(prev => [announcement, ...prev]);
    };

    const deleteAnnouncement = (id: string) => {
        setAnnouncements(prev => prev.filter(a => a.id !== id));
    };

    // Attendance insights
    const getPersonalAttendance = useCallback((cadetId: string): PersonalAttendanceEntry[] => {
        return attendance
            .filter(a => a.cadetId === cadetId)
            .map(a => {
                const cls = classes.find(c => c.id === a.classId);
                return {
                    date: a.timestamp,
                    className: cls?.title || "Unknown Class",
                    status: a.status,
                };
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [attendance, classes]);

    const getAttendanceByClass = useCallback(() => {
        return classes.map(cls => {
            const records = attendance.filter(a => a.classId === cls.id);
            return {
                className: cls.title,
                present: records.filter(r => r.status === "PRESENT").length,
                absent: records.filter(r => r.status === "ABSENT").length,
                late: records.filter(r => r.status === "LATE").length,
                excused: records.filter(r => r.status === "EXCUSED").length,
            };
        }).slice(-8); // last 8 classes for the chart
    }, [attendance, classes]);

    // Computed statistics
    const getStats = (userId?: string): DashboardStats => {
        const totalCadets = cadets.length;

        const totalAttendanceRecords = attendance.length;
        const presentCount = attendance.filter(a => a.status === "PRESENT").length;
        const attendanceRate = totalAttendanceRecords > 0
            ? `${Math.round((presentCount / totalAttendanceRecords) * 100)}%`
            : "0%";

        const activeClasses = classes.length;

        const unreadNotes = userId
            ? notes.filter(n => n.recipientId === userId && !n.isRead).length
            : 0;

        return {
            totalCadets,
            attendanceRate,
            activeClasses,
            unreadNotes,
        };
    };

    // List of users who can receive notes (Cadets + Officers)
    const messageableUsers = useMemo(() => {
        const anos = [
            {
                id: "ano-1",
                name: "ANO",
                role: Role.ANO,
                regimentalNumber: "NCC/ANO/2024/001",
                pin: "0324",
            }
        ];

        const cadetsList = cadets.filter(c => c.id !== "ano-1");

        const mergedAnos = anos.map(a => ({
            ...a,
            ...(extraUserData[a.id] || {})
        }));

        const mergedCadets = cadetsList.map(c => ({
            ...c,
            ...(extraUserData[c.id] || {})
        }));

        return [...mergedAnos, ...mergedCadets];
    }, [cadets, extraUserData]);

    return (
        <DataContext.Provider value={{
            classes, addClass, deleteClass,
            cadets, addCadet, updateCadet, deleteCadet,
            attendance, markAttendance,
            notes, sendNote, markNoteAsRead, forwardNoteToANO, deleteNote,
            getStats,
            messageableUsers,
            updateUser,
            markAllAsRead,
            getPersonalAttendance,
            getAttendanceByClass,
            certificates, addCertificate, deleteCertificate, getCertificates,
            announcements, addAnnouncement, deleteAnnouncement,
            activityLog, logActivity, getRecentActivities,
        }}>
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error("useData must be used within a DataProvider");
    }
    return context;
}
