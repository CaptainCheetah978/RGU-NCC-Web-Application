"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useMemo, useCallback } from "react";
import { ClassSession, Cadet, AttendanceRecord, Note, Role, User, Certificate, Announcement, ActivityLogEntry } from "@/types";
import { supabase } from "@/lib/supabase-client";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";

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
    addClass: (cls: ClassSession) => Promise<void>;
    deleteClass: (id: string) => Promise<void>;
    cadets: Cadet[];
    addCadet: (cadet: Cadet) => Promise<void>;
    updateCadet: (id: string, updates: Partial<Cadet>) => Promise<void>;
    deleteCadet: (id: string) => Promise<void>;
    attendance: AttendanceRecord[];
    markAttendance: (record: AttendanceRecord) => Promise<void>;
    notes: Note[];
    sendNote: (note: Note) => Promise<void>;
    markNoteAsRead: (id: string) => Promise<void>;
    forwardNoteToANO: (noteId: string, anoId: string) => Promise<void>;
    deleteNote: (id: string) => Promise<void>;
    getStats: (userId?: string) => DashboardStats;
    messageableUsers: (Cadet | User)[];
    markAllAsRead: (userId: string) => Promise<void>;
    getPersonalAttendance: (cadetId: string) => PersonalAttendanceEntry[];
    getAttendanceByClass: () => { className: string; present: number; absent: number; late: number; excused: number }[];
    certificates: Certificate[];
    addCertificate: (cert: Certificate) => Promise<void>;
    deleteCertificate: (id: string) => Promise<void>;
    getCertificates: (userId: string) => Certificate[];
    announcements: Announcement[];
    addAnnouncement: (announcement: Announcement) => Promise<void>;
    deleteAnnouncement: (id: string) => Promise<void>;
    activityLog: ActivityLogEntry[];
    logActivity: (action: string, userId: string, userName: string, targetName?: string) => void;
    getRecentActivities: (limit: number) => ActivityLogEntry[];
    isLoading: boolean;
    refreshData: () => Promise<void>;
    refreshAttendance: () => Promise<void>;
    refreshProfiles: () => Promise<void>;
    currentUserProfile: (User & Partial<Cadet>) | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Column selections — fetch only what we need instead of select('*')
const PROFILE_COLUMNS = 'id, full_name, role, regimental_number, wing, rank, avatar_url, enrollment_year, blood_group, gender, unit_name, unit_number, status';
const CLASS_COLUMNS = 'id, title, date, time, instructor_id, description';
const ATTENDANCE_COLUMNS = 'id, class_id, cadet_id, status, created_at';
const NOTE_COLUMNS = 'id, sender_id, recipient_id, subject, content, is_read, created_at, forwarded_to_ano, original_sender_id, original_sender_name';
const ANNOUNCEMENT_COLUMNS = 'id, title, content, author_id, priority, created_at';
const CERTIFICATE_COLUMNS = 'id, user_id, name, type, file_data, upload_date';
const ACTIVITY_COLUMNS = 'id, action, performed_by, performed_by_name, target_name, created_at';

export function DataProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [classes, setClasses] = useState<ClassSession[]>([]);
    const [cadets, setCadets] = useState<Cadet[]>([]);
    const [allProfiles, setAllProfiles] = useState<(User & Partial<Cadet>)[]>([]);
    // Keep a ref to allProfiles so async callbacks can access the latest value
    // without stale-closure issues and without adding it to their dependency arrays.
    const allProfilesRef = useRef<(User & Partial<Cadet>)[]>([]);
    useEffect(() => { allProfilesRef.current = allProfiles; }, [allProfiles]);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
    const [currentUserProfile, setCurrentUserProfile] = useState<(User & Partial<Cadet>) | null>(null);

    // --- Per-table refresh functions ---
    // These fetch only the specific table that changed, instead of all 7 every time.

    const refreshClasses = useCallback(async () => {
        const { data } = await supabase.from('classes').select(CLASS_COLUMNS);
        if (data) {
            setClasses(data.map(c => ({
                id: c.id,
                title: c.title,
                date: c.date,
                time: c.time,
                instructorId: c.instructor_id,
                description: c.description,
                attendees: []
            })));
        }
    }, []);

    const refreshProfiles = useCallback(async () => {
        const { data: profilesData } = await supabase.from('profiles').select(PROFILE_COLUMNS);
        if (profilesData) {
            const mappedProfiles = profilesData.map(p => ({
                id: p.id,
                name: p.full_name || 'Unknown',
                role: (p.role as Role) || Role.CADET,
                regimentalNumber: p.regimental_number,
                wing: p.wing,
                rank: p.rank,
                avatarUrl: p.avatar_url,
                enrollmentYear: p.enrollment_year,
                bloodGroup: p.blood_group,
                gender: p.gender,
                unitName: p.unit_name,
                unitNumber: p.unit_number,
                status: p.status || "active",
            }));

            setAllProfiles(mappedProfiles as (User & Partial<Cadet>)[]);
            setCadets(mappedProfiles.filter(u => u.role !== Role.ANO) as Cadet[]);

            if (user) {
                const myProfile = mappedProfiles.find(p => p.id === user.id);
                if (myProfile) {
                    setCurrentUserProfile(myProfile as (User & Partial<Cadet>));
                }
            }
        }
    }, [user]);

    const refreshAttendance = useCallback(async () => {
        const { data } = await supabase.from('attendance').select(ATTENDANCE_COLUMNS);
        if (data) {
            setAttendance(data.map(a => ({
                id: a.id,
                classId: a.class_id,
                cadetId: a.cadet_id,
                status: a.status,
                timestamp: a.created_at
            })));
        }
    }, []);

    const refreshNotes = useCallback(async () => {
        const { data: notesData } = await supabase.from('notes').select(NOTE_COLUMNS);
        // Reuse already-loaded profiles when available to avoid a redundant DB round-trip.
        // Fall back to fetching profiles only on initial load when allProfiles is empty.
        const profileMap = new Map<string, string>();
        if (allProfilesRef.current.length > 0) {
            allProfilesRef.current.forEach(p => profileMap.set(p.id, p.name));
        } else {
            const { data: profilesData } = await supabase.from('profiles').select('id, full_name');
            if (profilesData) {
                profilesData.forEach(p => profileMap.set(p.id, p.full_name || 'Unknown'));
            }
        }
        if (notesData) {
            setNotes(notesData.map(n => ({
                id: n.id,
                senderId: n.sender_id,
                senderName: profileMap.get(n.sender_id) || "Unknown",
                recipientId: n.recipient_id,
                recipientName: profileMap.get(n.recipient_id) || "Unknown",
                content: n.content,
                isRead: n.is_read,
                timestamp: n.created_at,
                subject: n.subject || "Note",
                forwardedToANO: n.forwarded_to_ano || false,
                originalSenderId: n.original_sender_id,
                originalSenderName: n.original_sender_name
            })));
        }
    }, []);

    const refreshAnnouncements = useCallback(async () => {
        const { data: announcementsData } = await supabase.from('announcements').select(ANNOUNCEMENT_COLUMNS);
        // Reuse already-loaded profiles when available to avoid a redundant DB round-trip.
        // Fall back to fetching profiles only on initial load when allProfiles is empty.
        const profileMap = new Map<string, string>();
        if (allProfilesRef.current.length > 0) {
            allProfilesRef.current.forEach(p => profileMap.set(p.id, p.name));
        } else {
            const { data: profilesData } = await supabase.from('profiles').select('id, full_name');
            if (profilesData) {
                profilesData.forEach(p => profileMap.set(p.id, p.full_name || 'Unknown'));
            }
        }
        if (announcementsData) {
            setAnnouncements(announcementsData.map(a => ({
                id: a.id,
                title: a.title,
                content: a.content,
                authorId: a.author_id,
                authorName: profileMap.get(a.author_id) || "Unknown",
                priority: a.priority?.toLowerCase() === 'urgent' ? 'urgent' : 'normal',
                createdAt: a.created_at
            })) as Announcement[]);
        }
    }, []);

    const refreshCertificates = useCallback(async () => {
        const { data } = await supabase.from('certificates').select(CERTIFICATE_COLUMNS);
        if (data) {
            setCertificates(data.map(c => ({
                id: c.id,
                userId: c.user_id,
                name: c.name,
                type: c.type,
                fileData: c.file_data,
                uploadDate: c.upload_date
            })) as Certificate[]);
        }
    }, []);

    const refreshActivity = useCallback(async () => {
        const { data } = await supabase
            .from('activity_log')
            .select(ACTIVITY_COLUMNS)
            .order('created_at', { ascending: false })
            .limit(100);
        if (data) {
            setActivityLog(data.map(a => ({
                id: a.id,
                action: a.action,
                performedBy: a.performed_by,
                performedByName: a.performed_by_name,
                targetName: a.target_name,
                timestamp: a.created_at
            })));
        }
    }, []);

    // Full refresh — used only on initial load
    const refreshData = useCallback(async () => {
        setIsLoading(true);
        try {
            await Promise.all([
                refreshClasses(),
                refreshProfiles(),
                refreshAttendance(),
                refreshNotes(),
                refreshAnnouncements(),
                refreshCertificates(),
                refreshActivity()
            ]);
        } catch (error) {
            console.error("Error loading data:", error);
            showToast("Failed to load data. Check your connection and try again.");
        } finally {
            setIsLoading(false);
        }
    }, [refreshClasses, refreshProfiles, refreshAttendance, refreshNotes, refreshAnnouncements, refreshCertificates, refreshActivity, showToast]);

    // Initial load + targeted Realtime subscriptions
    useEffect(() => {
        refreshData();

        // Targeted subscriptions: each table change only refreshes its own data
        const channel = supabase.channel('targeted-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, () => {
                refreshClasses();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
                refreshProfiles();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => {
                refreshAttendance();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, () => {
                refreshNotes();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => {
                refreshAnnouncements();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'certificates' }, () => {
                refreshCertificates();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_log' }, () => {
                refreshActivity();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [refreshData, refreshClasses, refreshProfiles, refreshAttendance, refreshNotes, refreshAnnouncements, refreshCertificates, refreshActivity]);

    // --- Actions (each calls only the relevant per-table refresh) ---

    const addClass = async (cls: ClassSession) => {
        // 1. Snapshot for rollback
        const previousClasses = [...classes];

        // 2. Optimistic Update
        setClasses(prev => [...prev, cls]);

        try {
            const { addClassAction } = await import("@/app/actions/class-actions");
            const { getAccessToken } = await import("@/lib/get-access-token");
            const token = await getAccessToken();
            
            const result = await addClassAction(
                { 
                    id: cls.id, 
                    title: cls.title, 
                    date: cls.date, 
                    time: cls.time, 
                    instructorId: cls.instructorId, 
                    description: cls.description 
                },
                token || ""
            );
            
            if (!result.success) throw new Error(result.error || "Failed to schedule class");
            
            // 3. Background Sync
            refreshClasses().catch(e => console.error("Background class refresh failed:", e));
        } catch (error) {
            // 4. Rollback
            setClasses(previousClasses);
            throw error;
        }
    };

    const deleteClass = async (id: string) => {
        // 1. Snapshot previous state for rollback
        const previousClasses = [...classes];
        const previousAttendance = [...attendance];

        // 2. Optimistic Update: Remove from local state immediately
        setClasses(prev => prev.filter(c => c.id !== id));
        setAttendance(prev => prev.filter((a: AttendanceRecord) => a.classId !== id));

        try {
            const { deleteClassAction } = await import("@/app/actions/class-actions");
            const { getAccessToken } = await import("@/lib/get-access-token");
            const token = await getAccessToken();

            const result = await deleteClassAction(id, token || "");
            if (!result.success) throw new Error(result.error || "Failed to delete class");

            // 3. Background Sync (No 'await' here to keep UI snappy)
            // We only refresh classes to ensure any server-side computed fields are sync'd
            // but we skip the massive attendance refresh because we filtered it locally.
            refreshClasses().catch(e => console.error("Background class refresh failed:", e));
        } catch (error) {
            // 4. Rollback on failure
            setClasses(previousClasses);
            setAttendance(previousAttendance);
            throw error;
        }
    };

    const addCadet = async (cadet: Cadet) => {
        const { error } = await supabase.from('profiles').insert({
            id: cadet.id,
            full_name: cadet.name,
            role: cadet.role,
            regimental_number: cadet.regimentalNumber,
            rank: cadet.rank,
            wing: cadet.wing,
            gender: cadet.gender,
            unit_number: cadet.unitNumber,
            unit_name: cadet.unitName,
            enrollment_year: cadet.enrollmentYear,
            blood_group: cadet.bloodGroup,
            access_pin: cadet.access_pin,
            status: cadet.status || 'active'
        });
        if (error) throw error;
        await refreshProfiles();
    };

    const updateCadet = async (id: string, updates: Partial<Cadet>) => {
        // Build payload with only defined fields so we never accidentally
        // overwrite existing DB values with null/undefined.
        const payload: Record<string, unknown> = {};
        if (updates.name !== undefined) payload.full_name = updates.name;
        if (updates.regimentalNumber !== undefined) payload.regimental_number = updates.regimentalNumber;
        // The edit form stores the rank selection in `role` (it drives the `role` column).
        // We also support a direct `rank` field for legacy callers.
        if (updates.role !== undefined) payload.role = updates.role;
        if (updates.rank !== undefined) payload.rank = updates.rank;
        if (updates.wing !== undefined) payload.wing = updates.wing;
        if (updates.gender !== undefined) payload.gender = updates.gender;
        if (updates.unitNumber !== undefined) payload.unit_number = updates.unitNumber;
        if (updates.unitName !== undefined) payload.unit_name = updates.unitName;
        if (updates.enrollmentYear !== undefined) payload.enrollment_year = updates.enrollmentYear;
        if (updates.bloodGroup !== undefined) payload.blood_group = updates.bloodGroup;
        if (updates.avatarUrl !== undefined) payload.avatar_url = updates.avatarUrl;
        if (updates.access_pin !== undefined) payload.access_pin = updates.access_pin;
        if (updates.status !== undefined) payload.status = updates.status;

        if (Object.keys(payload).length === 0) return; // Nothing to update

        const { updateProfileAction } = await import("@/app/actions/profile-actions");
        const { getAccessToken } = await import("@/lib/get-access-token");
        const token = await getAccessToken();
        const result = await updateProfileAction(id, payload, token || "");
        if (!result.success) throw new Error(result.error || "Failed to update profile");
        await refreshProfiles();
    };

    const deleteCadet = async (id: string) => {
        const { deleteCadetAction } = await import("@/app/actions/cadet-actions");
        const { getAccessToken } = await import("@/lib/get-access-token");
        const token = await getAccessToken();
        const result = await deleteCadetAction(id, token || "");
        if (!result.success) throw new Error(result.error || "Failed to delete cadet");
        await refreshProfiles();
        await refreshAttendance();
        await refreshNotes();
        await refreshCertificates();
    };

    const markAttendance = async (record: AttendanceRecord) => {
        const { markAttendanceAction } = await import("@/app/actions/attendance-actions");
        const { getAccessToken } = await import("@/lib/get-access-token");
        const token = await getAccessToken();
        const result = await markAttendanceAction(
            { classId: record.classId, cadetId: record.cadetId, status: record.status },
            token || ""
        );
        if (!result.success) throw new Error(result.error || "Failed to mark attendance");
        await refreshAttendance();
    };

    const sendNote = async (note: Note) => {
        const { sendNoteAction } = await import("@/app/actions/note-actions");
        const { getAccessToken } = await import("@/lib/get-access-token");
        const token = await getAccessToken();
        const result = await sendNoteAction(
            { recipientId: note.recipientId, subject: note.subject, content: note.content },
            token || ""
        );
        if (!result.success) throw new Error(result.error || "Failed to send note");
        await refreshNotes();
    };

    const markNoteAsRead = async (id: string) => {
        const { markNoteAsReadAction } = await import("@/app/actions/note-actions");
        const { getAccessToken } = await import("@/lib/get-access-token");
        const token = await getAccessToken();
        const result = await markNoteAsReadAction(id, token || "");
        if (!result.success) throw new Error(result.error || "Failed to mark note as read");
        await refreshNotes();
    };

    const deleteNote = async (id: string) => {
        const { deleteNoteAction } = await import("@/app/actions/note-actions");
        const { getAccessToken } = await import("@/lib/get-access-token");
        const token = await getAccessToken();
        const result = await deleteNoteAction(id, token || "");
        if (!result.success) throw new Error(result.error || "Failed to delete note");
        await refreshNotes();
    };

    const forwardNoteToANO = async (noteId: string, anoId: string) => {
        const { forwardNoteToANOAction } = await import("@/app/actions/note-actions");
        const { getAccessToken } = await import("@/lib/get-access-token");
        const token = await getAccessToken();
        const result = await forwardNoteToANOAction(noteId, anoId, token || "");
        if (!result.success) throw new Error(result.error || "Failed to forward note");
        await refreshNotes();
    };

    const markAllAsRead = async (_userId: string) => {
        const { markAllAsReadAction } = await import("@/app/actions/note-actions");
        const { getAccessToken } = await import("@/lib/get-access-token");
        const token = await getAccessToken();
        const result = await markAllAsReadAction(token || "");
        if (!result.success) throw new Error(result.error || "Failed to mark all as read");
        await refreshNotes();
    };

    const addAnnouncement = async (announcement: Announcement) => {
        const { addAnnouncementAction } = await import("@/app/actions/announcement-actions");
        const { getAccessToken } = await import("@/lib/get-access-token");
        const token = await getAccessToken();
        const result = await addAnnouncementAction(
            { title: announcement.title, content: announcement.content, priority: announcement.priority },
            token || ""
        );
        if (!result.success) throw new Error(result.error || "Failed to post announcement");
        await refreshAnnouncements();
    };

    const deleteAnnouncement = async (id: string) => {
        const { deleteAnnouncementAction } = await import("@/app/actions/announcement-actions");
        const { getAccessToken } = await import("@/lib/get-access-token");
        const token = await getAccessToken();
        const result = await deleteAnnouncementAction(id, token || "");
        if (!result.success) throw new Error(result.error || "Failed to delete announcement");
        await refreshAnnouncements();
    };

    const addCertificate = async (cert: Certificate) => {
        const { error } = await supabase.from('certificates').insert({
            user_id: cert.userId,
            name: cert.name,
            type: cert.type,
            file_data: cert.fileData,
            upload_date: cert.uploadDate
        });
        if (error) throw error;
        await refreshCertificates();
    };

    const deleteCertificate = async (id: string) => {
        const { deleteCertificateAction } = await import("@/app/actions/certificate-actions");
        const { getAccessToken } = await import("@/lib/get-access-token");
        const token = await getAccessToken();
        const result = await deleteCertificateAction(id, token || "");
        if (!result.success) throw new Error(result.error || "Failed to delete certificate");
        await refreshCertificates();
    };

    const getCertificates = useCallback((userId: string) => {
        return certificates.filter(c => c.userId === userId);
    }, [certificates]);

    // --- Getters & Helpers ---

    const messageableUsers = useMemo(() => {
        return allProfiles as (Cadet | User)[];
    }, [allProfiles]);

    const getPersonalAttendance = useCallback((cadetId: string): PersonalAttendanceEntry[] => {
        // Build a class-id → title map in O(N) so the subsequent .map() is O(1) per lookup
        // instead of O(N) each, avoiding an overall O(N*M) scan.
        const classMap = new Map(classes.map(c => [c.id, c.title]));
        return attendance
            .filter(a => a.cadetId === cadetId)
            .map(a => ({
                date: a.timestamp,
                className: classMap.get(a.classId) ?? "Unknown Class",
                status: a.status as AttendanceRecord["status"],
            }))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [attendance, classes]);

    const getAttendanceByClass = useCallback(() => {
        // Aggregate counts in a single O(M) pass over attendance records,
        // then do an O(N) pass over classes — total O(N+M) instead of O(N*M).
        const statsByClass = new Map<string, { present: number; absent: number; late: number; excused: number }>();
        for (const record of attendance) {
            if (!statsByClass.has(record.classId)) {
                statsByClass.set(record.classId, { present: 0, absent: 0, late: 0, excused: 0 });
            }
            const stats = statsByClass.get(record.classId)!;
            if (record.status === "PRESENT") stats.present++;
            else if (record.status === "ABSENT") stats.absent++;
            else if (record.status === "LATE") stats.late++;
            else if (record.status === "EXCUSED") stats.excused++;
        }
        return classes.map(cls => {
            const stats = statsByClass.get(cls.id) ?? { present: 0, absent: 0, late: 0, excused: 0 };
            return { className: cls.title, ...stats };
        }).slice(-8);
    }, [attendance, classes]);

    const getStats = useCallback((userId?: string): DashboardStats => {
        const totalCadets = cadets.length;
        // Only count attendance records for classes that still exist
        const classIds = new Set(classes.map(c => c.id));
        // When a userId is provided (personal profile), filter to that cadet's records only.
        // For the ANO dashboard overview (no userId), show unit-wide rate.
        const validAttendance = attendance.filter(a =>
            classIds.has(a.classId) && (!userId || a.cadetId === userId)
        );
        const totalAttendanceRecords = validAttendance.length;
        const presentCount = validAttendance.filter(a => a.status === "PRESENT").length;
        const attendanceRate = totalAttendanceRecords > 0
            ? `${Math.round((presentCount / totalAttendanceRecords) * 100)}%`
            : "0%";
        const activeClasses = classes.length;
        const unreadNotes = userId
            ? notes.filter(n => n.recipientId === userId && !n.isRead).length
            : 0;
        return { totalCadets, attendanceRate, activeClasses, unreadNotes };
    }, [cadets, classes, attendance, notes]);

    const logActivity = (action: string, userId: string, userName: string, targetName?: string) => {
        supabase.from('activity_log').insert({
            action,
            performed_by: userId,
            performed_by_name: userName,
            target_name: targetName || null
        }).then(({ error }) => {
            if (error) console.error("Failed to log activity:", error);
            // No manual refresh needed — Realtime subscription handles it
        });
    };

    const getRecentActivities = useCallback((limit: number) => {
        return activityLog.slice(0, limit);
    }, [activityLog]);

    return (
        <DataContext.Provider value={{
            classes, addClass, deleteClass,
            cadets, addCadet, updateCadet, deleteCadet,
            attendance, markAttendance,
            notes, sendNote, markNoteAsRead, forwardNoteToANO, deleteNote,
            getStats,
            messageableUsers,
            markAllAsRead,
            getPersonalAttendance,
            getAttendanceByClass,
            certificates, addCertificate, deleteCertificate, getCertificates,
            announcements, addAnnouncement, deleteAnnouncement,
            activityLog, logActivity, getRecentActivities,
            isLoading, refreshData, refreshAttendance, refreshProfiles,
            currentUserProfile
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
