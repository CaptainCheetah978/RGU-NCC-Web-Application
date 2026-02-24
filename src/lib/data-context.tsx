"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
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
    forwardNoteToANO: (noteId: string, anoId: string, anoName: string) => Promise<void>;
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
    currentUserProfile: (User & Partial<Cadet>) | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Column selections — fetch only what we need instead of select('*')
const PROFILE_COLUMNS = 'id, full_name, role, regimental_number, wing, rank, avatar_url, enrollment_year, blood_group, gender, unit_name, unit_number, access_pin';
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
                access_pin: p.access_pin
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
        // We need profile names for sender/recipient lookup
        const { data: profilesData } = await supabase.from('profiles').select('id, full_name');
        const profileMap = new Map<string, string>();
        if (profilesData) {
            profilesData.forEach(p => profileMap.set(p.id, p.full_name || 'Unknown'));
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
        const { data: profilesData } = await supabase.from('profiles').select('id, full_name');
        const profileMap = new Map<string, string>();
        if (profilesData) {
            profilesData.forEach(p => profileMap.set(p.id, p.full_name || 'Unknown'));
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
    }, [refreshClasses, refreshProfiles, refreshAttendance, refreshNotes, refreshAnnouncements, refreshCertificates, refreshActivity]);

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
        const { error } = await supabase.from('classes').insert({
            title: cls.title,
            date: cls.date,
            time: cls.time,
            instructor_id: cls.instructorId,
            description: cls.description
        });
        if (error) throw error;
        await refreshClasses();
    };

    const deleteClass = async (id: string) => {
        const { error } = await supabase.from('classes').delete().eq('id', id);
        if (error) throw error;
        await refreshClasses();
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
            access_pin: cadet.access_pin
        });
        if (error) throw error;
        await refreshProfiles();
    };

    const updateCadet = async (id: string, updates: Partial<Cadet>) => {
        const { error } = await supabase.from('profiles').update({
            full_name: updates.name,
            regimental_number: updates.regimentalNumber,
            rank: updates.rank,
            wing: updates.wing,
            gender: updates.gender,
            unit_number: updates.unitNumber,
            unit_name: updates.unitName,
            enrollment_year: updates.enrollmentYear,
            blood_group: updates.bloodGroup,
            avatar_url: updates.avatarUrl,
            access_pin: updates.access_pin
        }).eq('id', id);
        if (error) throw error;
        await refreshProfiles();
    };

    const deleteCadet = async (id: string) => {
        const { error } = await supabase.from('profiles').delete().eq('id', id);
        if (error) throw error;
        await refreshProfiles();
    };

    const markAttendance = async (record: AttendanceRecord) => {
        const { data: existing, error: fetchError } = await supabase.from('attendance')
            .select('id')
            .eq('class_id', record.classId)
            .eq('cadet_id', record.cadetId)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

        if (existing) {
            const { error } = await supabase.from('attendance')
                .update({ status: record.status })
                .eq('id', existing.id);
            if (error) throw error;
        } else {
            const { error } = await supabase.from('attendance').insert({
                class_id: record.classId,
                cadet_id: record.cadetId,
                status: record.status,
                marked_by: user?.id
            });
            if (error) throw error;
        }
        await refreshAttendance();
    };

    const sendNote = async (note: Note) => {
        const { error } = await supabase.from('notes').insert({
            sender_id: user?.id,
            recipient_id: note.recipientId,
            subject: note.subject,
            content: note.content,
            is_read: false
        });
        if (error) throw error;
        await refreshNotes();
    };

    const markNoteAsRead = async (id: string) => {
        const { error } = await supabase.from('notes').update({ is_read: true }).eq('id', id);
        if (error) throw error;
        await refreshNotes();
    };

    const deleteNote = async (id: string) => {
        const { error } = await supabase.from('notes').delete().eq('id', id);
        if (error) throw error;
        await refreshNotes();
    };

    const forwardNoteToANO = async (noteId: string, anoId: string, anoName: string) => {
        const originalNote = notes.find(n => n.id === noteId);
        if (!originalNote) throw new Error("Note not found");

        const { error: insertError } = await supabase.from('notes').insert({
            sender_id: user?.id,
            recipient_id: anoId,
            subject: `[Forwarded] ${originalNote.subject}`,
            content: `[Forwarded from ${originalNote.senderName}]\n\n${originalNote.content}`,
            is_read: false,
            forwarded_to_ano: true,
            original_sender_id: originalNote.senderId,
            original_sender_name: originalNote.senderName
        });
        if (insertError) throw insertError;

        const { error: updateError } = await supabase.from('notes')
            .update({ forwarded_to_ano: true })
            .eq('id', noteId);
        if (updateError) throw updateError;

        await refreshNotes();
    };

    const markAllAsRead = async (userId: string) => {
        const { error } = await supabase.from('notes').update({ is_read: true }).eq('recipient_id', userId);
        if (error) throw error;
        await refreshNotes();
    };

    const addAnnouncement = async (announcement: Announcement) => {
        const { error } = await supabase.from('announcements').insert({
            title: announcement.title,
            content: announcement.content,
            author_id: user?.id,
            priority: announcement.priority.toUpperCase()
        });
        if (error) throw error;
        await refreshAnnouncements();
    };

    const deleteAnnouncement = async (id: string) => {
        const { error } = await supabase.from('announcements').delete().eq('id', id);
        if (error) throw error;
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
        const { error } = await supabase.from('certificates').delete().eq('id', id);
        if (error) throw error;
        await refreshCertificates();
    };

    const getCertificates = (userId: string) => {
        return certificates.filter(c => c.userId === userId);
    };

    // --- Getters & Helpers ---

    const messageableUsers = useMemo(() => {
        return allProfiles as (Cadet | User)[];
    }, [allProfiles]);

    const getPersonalAttendance = useCallback((cadetId: string): PersonalAttendanceEntry[] => {
        return attendance
            .filter(a => a.cadetId === cadetId)
            .map(a => {
                const cls = classes.find(c => c.id === a.classId);
                return {
                    date: a.timestamp,
                    className: cls?.title || "Unknown Class",
                    status: a.status as any,
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
        }).slice(-8);
    }, [attendance, classes]);

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
        return { totalCadets, attendanceRate, activeClasses, unreadNotes };
    };

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

    const getRecentActivities = (limit: number) => {
        return activityLog.slice(0, limit);
    };

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
            isLoading, refreshData,
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
