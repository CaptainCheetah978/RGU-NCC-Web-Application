"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { ClassSession, Cadet, AttendanceRecord, Note, Role, User } from "@/types";
import { MOCK_USERS } from "@/lib/mock-data";

interface DashboardStats {
    totalCadets: number;
    attendanceRate: string;
    activeClasses: number;
    unreadNotes: number;
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
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
    const [classes, setClasses] = useState<ClassSession[]>([]);
    const [cadets, setCadets] = useState<Cadet[]>([]);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);

    // Load initial data from localStorage only (NO MOCK DATA)
    useEffect(() => {
        const storedClasses = localStorage.getItem("ncc_classes");
        if (storedClasses) setClasses(JSON.parse(storedClasses));

        const storedCadets = localStorage.getItem("ncc_cadets");
        let initialCadets: Cadet[] = [];

        if (storedCadets) {
            initialCadets = JSON.parse(storedCadets);
        }

        // Always ensure login cadets (except ANO) are in the list
        const loginCadets = MOCK_USERS.filter(u => u.role !== Role.ANO) as Cadet[];

        // Merge login cadets that don't already exist in the registry (by ID)
        loginCadets.forEach(loginCdt => {
            if (!initialCadets.find(c => c.id === loginCdt.id)) {
                initialCadets.push(loginCdt);
            }
        });

        // Update name for Roshni if it was still old in storage
        const roshni = initialCadets.find(c => c.id === "cdt-1");
        if (roshni) roshni.name = "Cdt. Roshni";

        setCadets(initialCadets);

        const storedAttendance = localStorage.getItem("ncc_attendance");
        if (storedAttendance) setAttendance(JSON.parse(storedAttendance));

        const storedNotes = localStorage.getItem("ncc_notes");
        if (storedNotes) setNotes(JSON.parse(storedNotes));
    }, []);

    // Sync to localStorage on changes
    useEffect(() => {
        localStorage.setItem("ncc_classes", JSON.stringify(classes));
    }, [classes]);

    useEffect(() => {
        localStorage.setItem("ncc_cadets", JSON.stringify(cadets));
    }, [cadets]);

    useEffect(() => {
        localStorage.setItem("ncc_attendance", JSON.stringify(attendance));
    }, [attendance]);

    useEffect(() => {
        localStorage.setItem("ncc_notes", JSON.stringify(notes));
    }, [notes]);

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

    const updateUser = (userId: string, updates: Partial<Cadet | User>) => {
        // If it's a cadet in our list
        if (cadets.find(c => c.id === userId)) {
            setCadets(prev => prev.map(c => c.id === userId ? { ...c, ...updates } : c));
        } else {
            // It might be the ANO or a user not in registry, storage it specifically
            const key = `user_ext_${userId}`;
            const existing = localStorage.getItem(key);
            const data = existing ? JSON.parse(existing) : {};
            localStorage.setItem(key, JSON.stringify({ ...data, ...updates }));

            // Force a refresh of messageableUsers by triggering a dummy state if needed, 
            // but for simple photo persistence, we can rely on how messageableUsers is memoized.
            // Let's add an 'extraUserData' state for better Reactivity
            setExtraUserData(prev => ({ ...prev, [userId]: { ...prev[userId], ...updates } }));
        }
    };

    const [extraUserData, setExtraUserData] = useState<Record<string, any>>({});

    useEffect(() => {
        // Load extra user data (like ANO's photo/PIN overrides)
        const stored = localStorage.getItem("ncc_extra_user_data");
        if (stored) setExtraUserData(JSON.parse(stored));
    }, []);

    useEffect(() => {
        localStorage.setItem("ncc_extra_user_data", JSON.stringify(extraUserData));
    }, [extraUserData]);

    // Computed statistics
    const getStats = (userId?: string): DashboardStats => {
        const totalCadets = cadets.length;

        // Calculate attendance rate
        const totalAttendanceRecords = attendance.length;
        const presentCount = attendance.filter(a => a.status === "PRESENT").length;
        const attendanceRate = totalAttendanceRecords > 0
            ? `${Math.round((presentCount / totalAttendanceRecords) * 100)}%`
            : "0%";

        const activeClasses = classes.length;

        // Count unread notes for specific user
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
        // Start with mock ANO if not in cadets
        const anos = [
            {
                id: "ano-1",
                name: "ANO",
                role: Role.ANO,
                regimentalNumber: "NCC/ANO/2024/001",
                pin: "0324",
            }
        ];

        // Filter out any duplicates if ANO was somehow added to cadets
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
            updateUser
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
