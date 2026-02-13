"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { ClassSession, Cadet, AttendanceRecord, Role } from "@/types";
import { MOCK_CLASSES, MOCK_USERS } from "./mock-data";

interface DataContextType {
    classes: ClassSession[];
    addClass: (cls: ClassSession) => void;
    deleteClass: (id: string) => void;
    cadets: Cadet[];
    addCadet: (cadet: Cadet) => void;
    attendance: AttendanceRecord[];
    markAttendance: (record: AttendanceRecord) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
    const [classes, setClasses] = useState<ClassSession[]>([]);
    const [cadets, setCadets] = useState<Cadet[]>([]);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

    // Load initial data
    useEffect(() => {
        // Check localStorage or fallback to MOCK
        const storedClasses = localStorage.getItem("ncc_classes");
        if (storedClasses) setClasses(JSON.parse(storedClasses));
        else setClasses(MOCK_CLASSES);

        const storedCadets = localStorage.getItem("ncc_cadets");
        if (storedCadets) setCadets(JSON.parse(storedCadets));
        else {
            // Filter cadets from MOCK_USERS for initial state
            const initialCadets = MOCK_USERS.filter(u =>
                u.role === Role.CADET || u.role === Role.CPL || u.role === Role.LCPL
            ) as Cadet[];
            setCadets(initialCadets);
        }

        const storedAttendance = localStorage.getItem("ncc_attendance");
        if (storedAttendance) setAttendance(JSON.parse(storedAttendance));
    }, []);

    // Sync to localStorage on changes
    useEffect(() => {
        if (classes.length > 0) localStorage.setItem("ncc_classes", JSON.stringify(classes));
    }, [classes]);

    useEffect(() => {
        if (cadets.length > 0) localStorage.setItem("ncc_cadets", JSON.stringify(cadets));
    }, [cadets]);

    useEffect(() => {
        if (attendance.length > 0) localStorage.setItem("ncc_attendance", JSON.stringify(attendance));
    }, [attendance]);

    const addClass = (cls: ClassSession) => {
        setClasses(prev => [...prev, cls]);
    };

    const deleteClass = (id: string) => {
        setClasses(prev => prev.filter(c => c.id !== id));
    }

    const addCadet = (cadet: Cadet) => {
        setCadets(prev => [...prev, cadet]);
    };

    const markAttendance = (record: AttendanceRecord) => {
        setAttendance(prev => {
            // Remove existing record if any for same cadet+class
            const filtered = prev.filter(r => !(r.classId === record.classId && r.cadetId === record.cadetId));
            return [...filtered, record];
        });
    };

    return (
        <DataContext.Provider value={{ classes, addClass, deleteClass, cadets, addCadet, attendance, markAttendance }}>
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
