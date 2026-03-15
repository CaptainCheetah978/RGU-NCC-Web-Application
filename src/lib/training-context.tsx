"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ClassSession, AttendanceRecord } from "@/types";
import { supabase } from "@/lib/supabase-client";
import { useAuth } from "@/lib/auth-context";
import { getAccessToken } from "@/lib/get-access-token";

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
}

const CLASS_COLUMNS = "id, title, date, time, instructor_id, description";
const ATTENDANCE_COLUMNS = "id, class_id, cadet_id, status, created_at";

const TrainingContext = createContext<TrainingContextType | undefined>(undefined);

let optimisticCounter = 0;
const generateOptimisticId = (scope = "id") =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `optimistic-${scope}-${Date.now()}-${++optimisticCounter}-${Math.random().toString(16).slice(2)}`;

async function fetchClasses(): Promise<ClassSession[]> {
    const { data, error } = await supabase.from("classes").select(CLASS_COLUMNS);
    if (error) throw error;
    return (
        data?.map((c) => ({
            id: c.id,
            title: c.title,
            date: c.date,
            time: c.time,
            instructorId: c.instructor_id,
            description: c.description,
            attendees: [],
        })) || []
    );
}

async function fetchAttendance(): Promise<AttendanceRecord[]> {
    const { data, error } = await supabase.from("attendance").select(ATTENDANCE_COLUMNS);
    if (error) throw error;
    return (
        data?.map((a) => ({
            id: a.id,
            classId: a.class_id,
            cadetId: a.cadet_id,
            status: a.status,
            timestamp: a.created_at,
        })) || []
    );
}

export function TrainingProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const classesQuery = useQuery({
        queryKey: ["classes"],
        queryFn: fetchClasses,
    });

    const attendanceQuery = useQuery({
        queryKey: ["attendance"],
        queryFn: fetchAttendance,
    });

    const addClassMutation = useMutation({
        mutationFn: async (cls: ClassSession) => {
            const { addClassAction } = await import("@/app/actions/class-actions");
            const token = await getAccessToken();
            const result = await addClassAction(
                {
                    id: cls.id,
                    title: cls.title,
                    date: cls.date,
                    time: cls.time,
                    instructorId: cls.instructorId,
                    description: cls.description,
                },
                token || ""
            );
            if (!result.success) throw new Error(result.error || "Failed to schedule class");
        },
        onMutate: async (cls: ClassSession) => {
            await queryClient.cancelQueries({ queryKey: ["classes"] });
            const previousClasses = queryClient.getQueryData<ClassSession[]>(["classes"]) || [];
            const optimisticClass: ClassSession = { ...cls, id: cls.id ?? generateOptimisticId("class") };
            queryClient.setQueryData<ClassSession[]>(["classes"], (old) => [...(old || []), optimisticClass]);
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
            const token = await getAccessToken();
            const result = await deleteClassAction(id, token || "");
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
                (old || []).filter((a) => a.classId !== id)
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
            const { data: existing, error: fetchError } = await supabase
                .from("attendance")
                .select("id")
                .eq("class_id", record.classId)
                .eq("cadet_id", record.cadetId)
                .single();

            if (fetchError && fetchError.code !== "PGRST116") throw fetchError;

            if (existing) {
                const { error } = await supabase.from("attendance").update({ status: record.status }).eq("id", existing.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from("attendance").insert({
                    class_id: record.classId,
                    cadet_id: record.cadetId,
                    status: record.status,
                    marked_by: user.id,
                });
                if (error) throw error;
            }
        },
        onMutate: async (record: AttendanceRecord) => {
            await queryClient.cancelQueries({ queryKey: ["attendance"] });
            const previousAttendance = queryClient.getQueryData<AttendanceRecord[]>(["attendance"]) || [];

            queryClient.setQueryData<AttendanceRecord[]>(["attendance"], (old) => {
                const list = [...(old || [])];
                const idx = list.findIndex(
                    (a) => a.classId === record.classId && a.cadetId === record.cadetId
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
        }),
        [
            classesQuery.data,
            attendanceQuery.data,
            addClassMutation,
            deleteClassMutation,
            queryClient,
            classesQuery.isLoading,
            attendanceQuery.isLoading,
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
