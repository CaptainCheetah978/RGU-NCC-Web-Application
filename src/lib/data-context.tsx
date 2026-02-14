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
    // Lazy initialization functions to read from localStorage synchronously on first render
    const [classes, setClasses] = useState<ClassSession[]>(() => {
        if (typeof window === 'undefined') return [];
        const stored = localStorage.getItem("ncc_classes");
        return stored ? JSON.parse(stored) : [];
    });

    const [cadets, setCadets] = useState<Cadet[]>(() => {
        if (typeof window === 'undefined') return [];
        const stored = localStorage.getItem("ncc_cadets");
        let initialCadets: Cadet[] = stored ? JSON.parse(stored) : [];

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

    const [extraUserData, setExtraUserData] = useState<Record<string, any>>(() => {
        if (typeof window === 'undefined') return {};
        const stored = localStorage.getItem("ncc_extra_user_data");
        return stored ? JSON.parse(stored) : {};
    });

    // Sync to localStorage on changes - these will now safely wait for initialization
    useEffect(() => { localStorage.setItem("ncc_classes", JSON.stringify(classes)); }, [classes]);
    useEffect(() => { localStorage.setItem("ncc_cadets", JSON.stringify(cadets)); }, [cadets]);
    useEffect(() => { localStorage.setItem("ncc_attendance", JSON.stringify(attendance)); }, [attendance]);
    useEffect(() => { localStorage.setItem("ncc_notes", JSON.stringify(notes)); }, [notes]);
    useEffect(() => { localStorage.setItem("ncc_extra_user_data", JSON.stringify(extraUserData)); }, [extraUserData]);

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
