"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { ClassSession, Cadet, AttendanceRecord, Note, Role } from "@/types";

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
        if (storedCadets) setCadets(JSON.parse(storedCadets));

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

    return (
        <DataContext.Provider value={{
            classes, addClass, deleteClass,
            cadets, addCadet, updateCadet, deleteCadet,
            attendance, markAttendance,
            notes, sendNote, markNoteAsRead, forwardNoteToANO, deleteNote,
            getStats
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
