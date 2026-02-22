"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { ClassSession, Cadet, AttendanceRecord, Note, Role, User, Certificate, Announcement, ActivityLogEntry } from "@/types";
import { supabase } from "@/lib/supabase-client";
import { useAuth } from "@/lib/auth-context";

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
    // Attendance insights
    getPersonalAttendance: (cadetId: string) => PersonalAttendanceEntry[];
    getAttendanceByClass: () => { className: string; present: number; absent: number; late: number; excused: number }[];
    // Certificates
    certificates: Certificate[];
    addCertificate: (cert: Certificate) => Promise<void>;
    deleteCertificate: (certId: string) => Promise<void>;
    getCertificates: (userId: string) => Certificate[];
    // Announcements
    announcements: Announcement[];
    addAnnouncement: (announcement: Announcement) => Promise<void>;
    deleteAnnouncement: (id: string) => Promise<void>;
    // Activity Log
    activityLog: ActivityLogEntry[];
    // logActivity is now likely handled by database triggers or server-side, but keeping for compatibility if needed or manual logging
    logActivity: (action: string, userId: string, userName: string, targetName?: string) => void;
    getRecentActivities: (limit: number) => ActivityLogEntry[];
    isLoading: boolean;
    refreshData: () => Promise<void>;
    currentUserProfile: (User & Partial<Cadet>) | null; // New field
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
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

    const refreshData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [
                { data: classesData },
                { data: profilesData },
                { data: attendanceData },
                { data: notesData },
                { data: announcementsData },
                { data: certificatesData },
                { data: activityData }
            ] = await Promise.all([
                supabase.from('classes').select('*'),
                supabase.from('profiles').select('*'),
                supabase.from('attendance').select('*'),
                supabase.from('notes').select('*'),
                supabase.from('announcements').select('*'),
                supabase.from('certificates').select('*'),
                supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(100)
            ]);

            if (classesData) {
                const mappedClasses = classesData.map(c => ({
                    id: c.id,
                    title: c.title,
                    date: c.date,
                    time: c.time,
                    instructorId: c.instructor_id,
                    description: c.description,
                    attendees: []
                }));
                setClasses(mappedClasses);
            }

            // Create a lookup map for profiles
            const profileMap = new Map<string, { name: string; role: Role }>();
            if (profilesData) {
                profilesData.forEach(p => {
                    profileMap.set(p.id, {
                        name: p.full_name || 'Unknown',
                        role: (p.role as Role) || Role.CADET
                    });
                });

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

                // Filter out ANOs for the "Cadets" list
                const mappedCadets = mappedProfiles.filter(u => u.role !== Role.ANO) as Cadet[];
                setCadets(mappedCadets);

                // Set Current User Profile separately (so ANOs can see themselves)
                if (user) {
                    const myProfile = mappedProfiles.find(p => p.id === user.id);
                    if (myProfile) {
                        setCurrentUserProfile(myProfile as (User & Partial<Cadet>));
                    }
                }
            }

            if (attendanceData) {
                const mappedAttendance = attendanceData.map(a => ({
                    id: a.id,
                    classId: a.class_id,
                    cadetId: a.cadet_id,
                    status: a.status,
                    timestamp: a.created_at
                }));
                setAttendance(mappedAttendance);
            }

            if (notesData) {
                const mappedNotes = notesData.map(n => {
                    const sender = profileMap.get(n.sender_id);
                    const recipient = profileMap.get(n.recipient_id);
                    return {
                        id: n.id,
                        senderId: n.sender_id,
                        senderName: sender ? sender.name : "Unknown",
                        recipientId: n.recipient_id,
                        recipientName: recipient ? recipient.name : "Unknown",
                        content: n.content,
                        isRead: n.is_read,
                        timestamp: n.created_at,
                        subject: n.subject || "Note",
                        forwardedToANO: n.forwarded_to_ano || false,
                        originalSenderId: n.original_sender_id,
                        originalSenderName: n.original_sender_name
                    };
                });
                setNotes(mappedNotes);
            }

            if (activityData) {
                const mappedActivity = activityData.map(a => ({
                    id: a.id,
                    action: a.action,
                    performedBy: a.performed_by,
                    performedByName: a.performed_by_name,
                    targetName: a.target_name,
                    timestamp: a.created_at
                }));
                setActivityLog(mappedActivity);
            }

            if (announcementsData) {
                const mappedAnnouncements = announcementsData.map(a => {
                    const author = profileMap.get(a.author_id);
                    return {
                        id: a.id,
                        title: a.title,
                        content: a.content,
                        authorId: a.author_id,
                        authorName: author ? author.name : "Unknown",
                        priority: a.priority?.toLowerCase() === 'urgent' ? 'urgent' : 'normal',
                        createdAt: a.created_at
                    };
                });
                setAnnouncements(mappedAnnouncements as Announcement[]);
            }

            if (certificatesData) {
                const mappedCertificates = certificatesData.map(c => ({
                    id: c.id,
                    userId: c.user_id,
                    name: c.name,
                    type: c.type,
                    fileData: c.file_data,
                    uploadDate: c.upload_date
                }));
                setCertificates(mappedCertificates as Certificate[]);
            }

        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // Initial load
    useEffect(() => {
        refreshData();

        // Set up Realtime subscriptions
        const channels = supabase.channel('custom-all-channel')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public' },
                () => {
                    // Simple strategy: Just refresh everything on any change
                    // In a bigger app, we would handle specific events
                    refreshData();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channels);
        };
    }, [refreshData]);

    // --- Actions ---

    const addClass = async (cls: ClassSession) => {
        const { error } = await supabase.from('classes').insert({
            title: cls.title,
            date: cls.date,
            time: cls.time,
            instructor_id: cls.instructorId, // user.id
            description: cls.description
        });
        if (error) throw error;
        await refreshData();
    };

    const deleteClass = async (id: string) => {
        const { error } = await supabase.from('classes').delete().eq('id', id);
        if (error) throw error;
        await refreshData();
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
        await refreshData();
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
            // access_pin is usually handled separately for security/audit, but allowing it here if needed
            access_pin: updates.access_pin
        }).eq('id', id);
        if (error) throw error;
        await refreshData();
    };

    const deleteCadet = async (id: string) => {
        const { error } = await supabase.from('profiles').delete().eq('id', id);
        if (error) throw error;
        await refreshData();
    };

    const markAttendance = async (record: AttendanceRecord) => {
        // Upsert to handle toggle
        // First check if exists
        const { data: existing, error: fetchError } = await supabase.from('attendance')
            .select('id')
            .eq('class_id', record.classId)
            .eq('cadet_id', record.cadetId)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError; // PGRST116 is "no rows found"

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
        await refreshData();
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
        await refreshData();
    };

    const markNoteAsRead = async (id: string) => {
        const { error } = await supabase.from('notes').update({ is_read: true }).eq('id', id);
        if (error) throw error;
        await refreshData();
    };

    const deleteNote = async (id: string) => {
        const { error } = await supabase.from('notes').delete().eq('id', id);
        if (error) throw error;
        await refreshData();
    };

    const forwardNoteToANO = async (noteId: string, anoId: string, anoName: string) => {
        // Find the original note
        const originalNote = notes.find(n => n.id === noteId);
        if (!originalNote) throw new Error("Note not found");

        // Insert a new note to ANO with forward context
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

        // Mark the original note as forwarded
        const { error: updateError } = await supabase.from('notes')
            .update({ forwarded_to_ano: true })
            .eq('id', noteId);
        if (updateError) throw updateError;

        await refreshData();
    };

    const markAllAsRead = async (userId: string) => {
        const { error } = await supabase.from('notes').update({ is_read: true }).eq('recipient_id', userId);
        if (error) throw error;
        await refreshData();
    };

    const addAnnouncement = async (announcement: Announcement) => {
        const { error } = await supabase.from('announcements').insert({
            title: announcement.title,
            content: announcement.content,
            author_id: user?.id,
            priority: announcement.priority.toUpperCase()
        });
        if (error) throw error;
        await refreshData();
    };

    const deleteAnnouncement = async (id: string) => {
        const { error } = await supabase.from('announcements').delete().eq('id', id);
        if (error) throw error;
        await refreshData();
    };

    // Stubs for certificates (table not made yet)
    const addCertificate = async (cert: Certificate) => {
        const { error } = await supabase.from('certificates').insert({
            user_id: cert.userId,
            name: cert.name,
            type: cert.type,
            file_data: cert.fileData,
            upload_date: cert.uploadDate
        });
        if (error) throw error;
    };

    const deleteCertificate = async (id: string) => {
        const { error } = await supabase.from('certificates').delete().eq('id', id);
        if (error) throw error;
    };

    const getCertificates = (userId: string) => {
        return certificates.filter(c => c.userId === userId);
    };

    // --- Getters & Helpers ---

    const messageableUsers = useMemo(() => {
        // Include ALL profiles (cadets + ANOs + SUOs) so anyone can receive notes
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

    // Log activity to database
    const logActivity = (action: string, userId: string, userName: string, targetName?: string) => {
        supabase.from('activity_log').insert({
            action,
            performed_by: userId,
            performed_by_name: userName,
            target_name: targetName || null
        }).then(({ error }) => {
            if (error) console.error("Failed to log activity:", error);
            else refreshData();
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
            currentUserProfile // Added to provider
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
