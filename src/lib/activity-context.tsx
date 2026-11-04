"use client";

import { createContext, useContext, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ActivityLogEntry } from "@/types";
import { getActivityLogAction, logActivityAction } from "@/app/actions/activity-actions";
import { getAccessToken } from "@/lib/get-access-token";
import { useAuth } from "@/lib/auth-context";

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
    const { user } = useAuth();

    const activityQuery = useQuery({
        queryKey: ["activity"],
        queryFn: async () => {
            const token = await getAccessToken();
            if (!token) return [];
            const result = await getActivityLogAction(token);
            if (!result.success) throw new Error(result.error || "Failed to fetch activity log");
            return (
                result.data?.map((a) => ({
                    id: a.id,
                    action: a.action,
                    performedBy: a.performed_by,
                    performedByName: a.performed_by_name,
                    targetName: a.target_name,
                    timestamp: a.created_at,
                })) || []
            );
        },
        enabled: !!user,
    });

    const logActivityMutation = useMutation({
        mutationFn: async ({ action, targetName }: { action: string; userId: string; userName: string; targetName?: string }) => {
            const token = await getAccessToken();
            if (!token) throw new Error("Not authenticated");
            const result = await logActivityAction({ action, targetName }, token);
            if (!result.success) throw new Error(result.error);
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
