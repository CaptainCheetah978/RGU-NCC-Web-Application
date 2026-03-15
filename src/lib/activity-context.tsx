"use client";

import { createContext, useContext, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ActivityLogEntry } from "@/types";
import { supabase } from "@/lib/supabase-client";

const ACTIVITY_COLUMNS = "id, action, performed_by, performed_by_name, target_name, created_at";

interface ActivityContextType {
    activityLog: ActivityLogEntry[];
    logActivity: (action: string, userId: string, userName: string, targetName?: string) => Promise<void>;
    getRecentActivities: (limit: number) => ActivityLogEntry[];
    refreshActivity: () => Promise<void>;
    isLoading: boolean;
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export function ActivityProvider({ children }: { children: React.ReactNode }) {
    const queryClient = useQueryClient();

    const activityQuery = useQuery({
        queryKey: ["activity"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("activity_log")
                .select(ACTIVITY_COLUMNS)
                .order("created_at", { ascending: false })
                .limit(100);
            if (error) throw error;
            return (
                data?.map((a) => ({
                    id: a.id,
                    action: a.action,
                    performedBy: a.performed_by,
                    performedByName: a.performed_by_name,
                    targetName: a.target_name,
                    timestamp: a.created_at,
                })) || []
            );
        },
    });

    const logActivityMutation = useMutation({
        mutationFn: async ({ action, userId, userName, targetName }: { action: string; userId: string; userName: string; targetName?: string }) => {
            const { error } = await supabase.from("activity_log").insert({
                action,
                performed_by: userId,
                performed_by_name: userName,
                target_name: targetName || null,
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["activity"] });
        },
    });

    const value: ActivityContextType = useMemo(
        () => ({
            activityLog: activityQuery.data || [],
            logActivity: (action, userId, userName, targetName) =>
                logActivityMutation.mutateAsync({ action, userId, userName, targetName }),
            getRecentActivities: (limit) => (activityQuery.data || []).slice(0, limit),
            refreshActivity: () => queryClient.invalidateQueries({ queryKey: ["activity"] }),
            isLoading: activityQuery.isLoading,
        }),
        [activityQuery.data, activityQuery.isLoading, logActivityMutation, queryClient]
    );

    return <ActivityContext.Provider value={value}>{children}</ActivityContext.Provider>;
}

export function useActivityData() {
    const context = useContext(ActivityContext);
    if (!context) throw new Error("useActivityData must be used within an ActivityProvider");
    return context;
}
