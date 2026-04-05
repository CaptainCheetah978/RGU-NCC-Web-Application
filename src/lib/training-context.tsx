"use client";

import { createContext, useCallback, useContext, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ClassSession, AttendanceRecord } from "@/types";
import { useAuth } from "@/lib/auth-context";
import { requireAccessToken } from "@/lib/require-access-token";
import { getClassesAction } from "@/app/actions/class-actions";
import { getAttendanceAction } from "@/app/actions/attendance-actions";

interface PersonalAttendanceEntry {
    date: string;
    className: string;
    status: AttendanceRecord["status"];
}

interface TrainingContextType {
    classes: ClassSession[];
    attendance: AttendanceRecord[];
    addClass: (cls: ClassSession) => Promise<void>;
    deleteClass: (id: string) => Promise<void>;
    markAttendance: (record: AttendanceRecord) => Promise<void>;
    getAttendanceByClass: () => { className: string; present: number; absent: number; late: number; excused: number }[];
    getPersonalAttendance: (cadetId: string) => PersonalAttendanceEntry[];
    refreshAttendance: () => Promise<void>;
    refreshClasses: () => Promise<void>;
    isLoading: boolean;
    error: unknown;
}

const TrainingContext = createContext<TrainingContextType | undefined>(undefined);

const generateOptimisticId = (scope = "id") =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `optimistic-${scope}-${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random()
            .toString(16)
            .slice(2)}`;

const getClassId = (record: Partial<AttendanceRecord> & { class_id?: string }) =>
    record.classId ?? record.class_id;
const getCadetIdFromAttendance = (record: Partial<AttendanceRecord> & { cadet_id?: string }) =>
    record.cadetId ?? record.cadet_id;

async function fetchClasses(): Promise<ClassSession[]> {
    const token = await requireAccessToken();
    const result = await getClassesAction(token);
    if (!result.success || !result.data) throw new Error(result.error || "Failed to fetch classes");
    return result.data.map((c) => ({
        id: c.id,
        title: c.title,
        date: c.date,
        time: c.time,
        instructorId: c.instructor_id,
        description: c.description ?? undefined,
        tag: c.tag || "Training",
        attendees: [],
    }));
}

async function fetchAttendance(): Promise<AttendanceRecord[]> {
    const token = await requireAccessToken();
    const result = await getAttendanceAction(token);
    if (!result.success || !result.data) throw new Error(result.error || "Failed to fetch attendance");

    const serverData: AttendanceRecord[] = result.data.map((a) => ({
        id: a.id,
        classId: a.class_id,
        cadetId: a.cadet_id,
        status: a.status as AttendanceRecord["status"],
        timestamp: a.created_at,
    }));

    if (typeof window !== "undefined") {
        const { getOfflineAttendanceQueue } = await import("@/lib/offline-sync");
        const queue = await getOfflineAttendanceQueue();
        queue.forEach(q => {
            const idx = serverData.findIndex(a => a.classId === q.classId && a.cadetId === q.cadetId);
            const record = { id: q.id, classId: q.classId, cadetId: q.cadetId, status: q.status, timestamp: q.timestamp };
            if (idx >= 0) serverData[idx] = record;
            else serverData.push(record);
        });
    }

    return serverData;
}

export function TrainingProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    
    // Background sync when back online
    useEffect(() => {
        if (typeof window === "undefined") return;
        
        const syncOfflineQueue = async () => {
            if (!navigator.onLine) return;
            const { getOfflineAttendanceQueue, clearOfflineQueue } = await import("@/lib/offline-sync");
            const queue = await getOfflineAttendanceQueue();
            if (queue.length === 0) return;

            try {
                const { markAttendanceAction } = await import("@/app/actions/attendance-actions");
                const token = await requireAccessToken();
                let allSuccess = true;
                for (const record of queue) {
                    const result = await markAttendanceAction(
                        { classId: record.classId, cadetId: record.cadetId, status: record.status, timestamp: record.timestamp },
                        token
                    );
                    if (!result.success) allSuccess = false;
                }
                
                if (allSuccess) {
                    await clearOfflineQueue();
                    await queryClient.invalidateQueries({ queryKey: ["attendance"] });
                    console.log("Offline sync complete: All records synced.");
                }
            } catch (e) {
                console.error("Failed to sync offline queue:", e);
            }
        };

        window.addEventListener('online', syncOfflineQueue);
        syncOfflineQueue(); // Try to sync on mount if online
        
        return () => window.removeEventListener('online', syncOfflineQueue);
    }, [queryClient]);

    const classesQuery = useQuery({
        queryKey: ["classes"],
        queryFn: fetchClasses,
        enabled: !!user,
        staleTime: 5 * 60 * 1000,      // 5 min — classes don't change often
        refetchOnWindowFocus: false,
    });

    const attendanceQuery = useQuery({
        queryKey: ["attendance"],
        queryFn: fetchAttendance,
        enabled: !!user,
        staleTime: 30 * 1000,           // 30s — attendance is more dynamic
        refetchOnWindowFocus: false,
    });

    const addClassMutation = useMutation({
        mutationFn: async (cls: ClassSession) => {
            const { addClassAction } = await import("@/app/actions/class-actions");
            const token = await requireAccessToken();
            const result = await addClassAction(
                {
                    id: cls.id,
                    title: cls.title,
                    date: cls.date,
                    time: cls.time,
                    instructorId: cls.instructorId,
                    description: cls.description,
                    tag: cls.tag,
                },
                token
            );
            if (!result.success) throw new Error(result.error || "Failed to schedule class");
        },
        onMutate: async (cls: ClassSession) => {
            await queryClient.cancelQueries({ queryKey: ["classes"] });
            const previousClasses = queryClient.getQueryData<ClassSession[]>(["classes"]) || [];
            const optimisticClass: ClassSession = { ...cls, id: cls.id ?? generateOptimisticId("class") };
            queryClient.setQueryData<ClassSession[]>(["classes"], (old) => {
                const withoutDuplicate = (old || []).filter((c) => c.id !== optimisticClass.id);
                return [...withoutDuplicate, optimisticClass];
            });
            return { previousClasses };
        },
        onError: (_error, _variables, context) => {
            if (context?.previousClasses) {
                queryClient.setQueryData(["classes"], context.previousClasses);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["classes"] });
        },
    });

    const deleteClassMutation = useMutation({
        mutationFn: async (id: string) => {
            const { deleteClassAction } = await import("@/app/actions/class-actions");
            const token = await requireAccessToken();
            const result = await deleteClassAction(id, token);
            if (!result.success) throw new Error(result.error || "Failed to delete class");
        },
        onMutate: async (id: string) => {
            await Promise.all([
                queryClient.cancelQueries({ queryKey: ["classes"] }),
                queryClient.cancelQueries({ queryKey: ["attendance"] }),
            ]);
            const previousClasses = queryClient.getQueryData<ClassSession[]>(["classes"]) || [];
            const previousAttendance = queryClient.getQueryData<AttendanceRecord[]>(["attendance"]) || [];

            queryClient.setQueryData<ClassSession[]>(["classes"], (old) => (old || []).filter((c) => c.id !== id));
            queryClient.setQueryData<AttendanceRecord[]>(["attendance"], (old) =>
                (old || []).filter((a) => getClassId(a) !== id)
            );

            return { previousClasses, previousAttendance };
        },
        onError: (_error, _variables, context) => {
            if (context?.previousClasses) queryClient.setQueryData(["classes"], context.previousClasses);
            if (context?.previousAttendance) queryClient.setQueryData(["attendance"], context.previousAttendance);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["classes"] });
            queryClient.invalidateQueries({ queryKey: ["attendance"] });
        },
    });

    const markAttendanceMutation = useMutation({
        mutationFn: async (record: AttendanceRecord) => {
            if (!user) throw new Error("Unauthorized");
            try {
                // If explicitly offline, bypass network
                if (typeof window !== "undefined" && !navigator.onLine) {
                    throw new Error("Failed to fetch");
                }
                const { markAttendanceAction } = await import("@/app/actions/attendance-actions");
                const token = await requireAccessToken();
                const result = await markAttendanceAction(
                    { classId: record.classId, cadetId: record.cadetId, status: record.status, timestamp: record.timestamp },
                    token
                );
                if (!result.success) throw new Error(result.error || "Server Action Failed");
            } catch (err: unknown) {
                const errorObj = err instanceof Error ? err : new Error(String(err));
                const isNetworkError = errorObj.message?.includes("fetch") || 
                                     errorObj.message?.includes("network") || 
                                     (typeof window !== "undefined" && !navigator.onLine);
                
                if (isNetworkError) {
                    const { queueAttendanceOffline } = await import("@/lib/offline-sync");
                    await queueAttendanceOffline({
                        id: `${record.classId}-${record.cadetId}`,
                        classId: record.classId,
                        cadetId: record.cadetId,
                        status: record.status,
                        timestamp: record.timestamp || new Date().toISOString()
                    });
                    return; // Fail gracefully by queuing locally
                }
                throw err;
            }
        },
        onMutate: async (record: AttendanceRecord) => {
            await queryClient.cancelQueries({ queryKey: ["attendance"] });
            const previousAttendance = queryClient.getQueryData<AttendanceRecord[]>(["attendance"]) || [];

            queryClient.setQueryData<AttendanceRecord[]>(["attendance"], (old) => {
                const list = [...(old || [])];
                const idx = list.findIndex(
                    (a) => getClassId(a) === record.classId && getCadetIdFromAttendance(a) === record.cadetId
                );
                const optimisticEntry: AttendanceRecord = {
                    id: record.id || generateOptimisticId("attendance"),
                    classId: record.classId,
                    cadetId: record.cadetId,
                    status: record.status,
                    timestamp: record.timestamp || new Date().toISOString(),
                };
                if (idx >= 0) {
                    list[idx] = { ...list[idx], ...optimisticEntry };
                } else {
                    list.push(optimisticEntry);
                }
                return list;
            });

            return { previousAttendance };
        },
        onError: (_error, _variables, context) => {
            if (context?.previousAttendance) {
                queryClient.setQueryData(["attendance"], context.previousAttendance);
            }
        },
        onSettled: () => {
            // Refetch immediately to ensure consistency
            queryClient.invalidateQueries({ queryKey: ["attendance"] });
        },
    });

    const getPersonalAttendance = useCallback(
        (cadetId: string): PersonalAttendanceEntry[] => {
            const classes = classesQuery.data || [];
            const attendance = attendanceQuery.data || [];
            const classMap = new Map(classes.map((c) => [c.id, c.title]));
            return attendance
                .filter((a) => a.cadetId === cadetId)
                .map((a) => ({
                    date: a.timestamp,
                    className: classMap.get(a.classId) ?? "Unknown Class",
                    status: a.status as AttendanceRecord["status"],
                }))
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        },
        [attendanceQuery.data, classesQuery.data]
    );

    const getAttendanceByClass = useCallback(() => {
        const classes = classesQuery.data || [];
        const attendance = attendanceQuery.data || [];
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
        return classes.map((cls) => {
            const stats = statsByClass.get(cls.id) ?? { present: 0, absent: 0, late: 0, excused: 0 };
            return { className: cls.title, ...stats };
        });
    }, [attendanceQuery.data, classesQuery.data]);

    const value: TrainingContextType = useMemo(
        () => ({
            classes: classesQuery.data || [],
            attendance: attendanceQuery.data || [],
            addClass: (cls) => addClassMutation.mutateAsync(cls),
            deleteClass: (id) => deleteClassMutation.mutateAsync(id),
            markAttendance: (record) => markAttendanceMutation.mutateAsync(record),
            getAttendanceByClass,
            getPersonalAttendance,
            refreshAttendance: () => queryClient.invalidateQueries({ queryKey: ["attendance"] }),
            refreshClasses: () => queryClient.invalidateQueries({ queryKey: ["classes"] }),
            isLoading: classesQuery.isLoading || attendanceQuery.isLoading,
            error: classesQuery.error || attendanceQuery.error,
        }),
        [
            classesQuery.data,
            attendanceQuery.data,
            addClassMutation,
            deleteClassMutation,
            queryClient,
            classesQuery.isLoading,
            attendanceQuery.isLoading,
            classesQuery.error,
            attendanceQuery.error,
            markAttendanceMutation,
            getAttendanceByClass,
            getPersonalAttendance,
        ]
    );

    return <TrainingContext.Provider value={value}>{children}</TrainingContext.Provider>;
}

export function useTrainingData() {
    const context = useContext(TrainingContext);
    if (!context) throw new Error("useTrainingData must be used within a TrainingProvider");
    return context;
}
