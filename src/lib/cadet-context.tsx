"use client";

import { createContext, useContext, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Cadet, Certificate, Role, User, AttendanceRecord, Note, Wing, Gender, normalizeRole } from "@/types";
import { useAuth } from "@/lib/auth-context";
import { getAccessToken } from "@/lib/get-access-token";
import { requireAccessToken } from "@/lib/require-access-token";
import { getProfilesAction, updateProfileAction } from "@/app/actions/profile-actions";
import { deleteCadetAction } from "@/app/actions/cadet-actions";
import { getCertificatesAction, addCertificateAction, deleteCertificateAction } from "@/app/actions/certificate-actions";

const getCadetId = (record: Partial<AttendanceRecord> & { cadet_id?: string }) =>
    record.cadetId ?? record.cadet_id;
const getCertificateUserId = (record: Partial<Certificate> & { user_id?: string }) =>
    record.userId ?? record.user_id;

interface CadetContextType {
    cadets: Cadet[];
    allProfiles: (User & Partial<Cadet>)[];
    currentUserProfile: (User & Partial<Cadet>) | null;
    addCadet: (cadet: Cadet) => Promise<void>;
    updateCadet: (id: string, updates: Partial<Cadet>) => Promise<void>;
    deleteCadet: (id: string) => Promise<void>;
    certificates: Certificate[];
    addCertificate: (cert: Certificate) => Promise<void>;
    deleteCertificate: (id: string) => Promise<void>;
    getCertificates: (userId: string) => Certificate[];
    messageableUsers: (Cadet | User)[];
    refreshProfiles: () => Promise<void>;
    refreshCertificates: () => Promise<void>;
    isLoading: boolean;
    error: unknown;
}

const CadetContext = createContext<CadetContextType | undefined>(undefined);

async function fetchProfiles(): Promise<(User & Partial<Cadet>)[]> {
    const token = await requireAccessToken();
    const result = await getProfilesAction(token);
    
    if (!result.success || !result.data) throw new Error(result.error || "Failed to fetch profiles");

    return result.data.map((p) => ({
        id: p.id,
        name: p.full_name || "Unknown",
        role: normalizeRole(p.role),
        regimentalNumber: p.regimental_number ?? undefined,
        wing: p.wing as Wing ?? undefined,
        rank: normalizeRole(p.rank ?? p.role as string),
        avatarUrl: p.avatar_url ?? undefined,
        enrollmentYear: p.enrollment_year ?? undefined,
        bloodGroup: p.blood_group ?? undefined,
        gender: p.gender as Gender ?? undefined,
        unitName: p.unit_name ?? undefined,
        unitNumber: p.unit_number ?? undefined,
        status: (p.status as "active" | "alumni") || "active",
    }));
}

async function fetchCertificates(): Promise<Certificate[]> {
    const token = await requireAccessToken();
    const result = await getCertificatesAction(token);
    
    if (!result.success || !result.data) throw new Error(result.error || "Failed to fetch certificates");

    return result.data.map((c) => ({
        id: c.id,
        userId: c.user_id,
        name: c.name,
        type: c.type as Certificate["type"],
        fileData: c.file_data,
        uploadDate: c.upload_date,
    }));
}

export function CadetProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const profilesQuery = useQuery({
        queryKey: ["profiles"],
        queryFn: fetchProfiles,
        enabled: !!user,
        staleTime: 5 * 60 * 1000,      // 5 min — profile roster is stable
        refetchOnWindowFocus: false,
    });

    const certificatesQuery = useQuery({
        queryKey: ["certificates"],
        queryFn: fetchCertificates,
        enabled: !!user,
        staleTime: 5 * 60 * 1000,      // 5 min — certificates change rarely
        refetchOnWindowFocus: false,
    });

    const addCadetMutation = useMutation({
        mutationFn: async (cadet: Cadet) => {
            const token = await getAccessToken();
            if (!token) throw new Error("Not authenticated");
            const result = await updateProfileAction(cadet.id, {
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
                status: cadet.status || "active",
            }, token);
            if (!result.success) throw new Error(result.error || "Failed to add cadet profile");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["profiles"] });
        },
    });

    const updateCadetMutation = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Cadet> }) => {
            const payload: Record<string, unknown> = {};
            if (updates.name !== undefined) payload.full_name = updates.name;
            if (updates.regimentalNumber !== undefined) payload.regimental_number = updates.regimentalNumber;
            if (updates.role !== undefined) payload.role = updates.role;
            if (updates.rank !== undefined) payload.rank = updates.rank;
            if (updates.wing !== undefined) payload.wing = updates.wing;
            if (updates.gender !== undefined) payload.gender = updates.gender;
            if (updates.unitNumber !== undefined) payload.unit_number = updates.unitNumber;
            if (updates.unitName !== undefined) payload.unit_name = updates.unitName;
            if (updates.enrollmentYear !== undefined) payload.enrollment_year = updates.enrollmentYear;
            if (updates.bloodGroup !== undefined) payload.blood_group = updates.bloodGroup;
            if (updates.avatarUrl !== undefined) payload.avatar_url = updates.avatarUrl;
            if (updates.status !== undefined) payload.status = updates.status;
            if (Object.keys(payload).length === 0) return;

            const token = await getAccessToken();
            const result = await updateProfileAction(id, payload, token || "");
            if (!result.success) throw new Error(result.error || "Failed to update profile");
        },
        onMutate: async ({ id, updates }) => {
            await queryClient.cancelQueries({ queryKey: ["profiles"] });
            const previousProfiles = queryClient.getQueryData<(User & Partial<Cadet>)[]>(["profiles"]) || [];
            
            // Map keys correctly for optimistic update
            const mappedUpdates: Partial<User & Partial<Cadet>> = { ...updates };
            
            queryClient.setQueryData<(User & Partial<Cadet>)[]>(["profiles"], (old) =>
                (old || []).map((p) => (p.id === id ? { ...p, ...mappedUpdates } : p))
            );
            return { previousProfiles };
        },
        onError: (_error, _variables, context) => {
            if (context?.previousProfiles) {
                queryClient.setQueryData(["profiles"], context.previousProfiles);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["profiles"] });
        },
    });

    const deleteCadetMutation = useMutation({
        mutationFn: async (id: string) => {
            const token = await getAccessToken();
            const result = await deleteCadetAction(id, token || "");
            if (!result.success) throw new Error(result.error || "Failed to delete cadet");
        },
        onMutate: async (id: string) => {
            await Promise.all([
                queryClient.cancelQueries({ queryKey: ["profiles"] }),
                queryClient.cancelQueries({ queryKey: ["attendance"] }),
                queryClient.cancelQueries({ queryKey: ["certificates"] }),
                queryClient.cancelQueries({ queryKey: ["notes"] }),
            ]);

            const previousProfiles = queryClient.getQueryData<(User & Partial<Cadet>)[]>(["profiles"]) || [];
            const previousAttendance = queryClient.getQueryData<AttendanceRecord[]>(["attendance"]) || [];
            const previousCertificates = queryClient.getQueryData<Certificate[]>(["certificates"]) || [];
            const previousNotes = queryClient.getQueryData<Note[]>(["notes"]) || [];

            queryClient.setQueryData<(User & Partial<Cadet>)[]>(["profiles"], (old) =>
                (old || []).filter((p) => p.id !== id)
            );
            queryClient.setQueryData<AttendanceRecord[]>(["attendance"], (old) =>
                (old || []).filter((a) => getCadetId(a) !== id)
            );
            queryClient.setQueryData<Certificate[]>(["certificates"], (old) =>
                (old || []).filter((c) => getCertificateUserId(c) !== id)
            );
            queryClient.setQueryData<Note[]>(["notes"], (old) =>
                (old || []).filter((n) => n.senderId !== id && n.recipientId !== id)
            );

            return { previousProfiles, previousAttendance, previousCertificates, previousNotes };
        },
        onError: (_error, _variables, context) => {
            if (context?.previousProfiles) queryClient.setQueryData(["profiles"], context.previousProfiles);
            if (context?.previousAttendance) queryClient.setQueryData(["attendance"], context.previousAttendance);
            if (context?.previousCertificates) queryClient.setQueryData(["certificates"], context.previousCertificates);
            if (context?.previousNotes) queryClient.setQueryData(["notes"], context.previousNotes);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["profiles"] });
            queryClient.invalidateQueries({ queryKey: ["attendance"] });
            queryClient.invalidateQueries({ queryKey: ["certificates"] });
            queryClient.invalidateQueries({ queryKey: ["notes"] });
        },
    });

    const addCertificateMutation = useMutation({
        mutationFn: async (cert: Certificate) => {
            const token = await getAccessToken();
            if (!token) throw new Error("Missing access token");
            const result = await addCertificateAction(
                {
                    userId: cert.userId,
                    name: cert.name,
                    type: cert.type,
                    fileData: cert.fileData,
                    uploadDate: cert.uploadDate,
                },
                token
            );
            if (!result.success) throw new Error(result.error || "Failed to add certificate");
        },
        onMutate: async (cert: Certificate) => {
            await queryClient.cancelQueries({ queryKey: ["certificates"] });
            const previous = queryClient.getQueryData<Certificate[]>(["certificates"]) || [];
            queryClient.setQueryData<Certificate[]>(["certificates"], (old) => [
                ...(old || []),
                cert,
            ]);
            return { previous };
        },
        onError: (_err: unknown, _vars: Certificate, context: { previous?: Certificate[] } | undefined) => {
            if (context?.previous) queryClient.setQueryData(["certificates"], context.previous);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["certificates"] });
        },
    });

    const deleteCertificateMutation = useMutation({
        mutationFn: async (id: string) => {
            const token = await getAccessToken();
            const result = await deleteCertificateAction(id, token || "");
            if (!result.success) throw new Error(result.error || "Failed to delete certificate");
        },
        onMutate: async (id: string) => {
            await queryClient.cancelQueries({ queryKey: ["certificates"] });
            const previous = queryClient.getQueryData<Certificate[]>(["certificates"]) || [];
            queryClient.setQueryData<Certificate[]>(["certificates"], (old) =>
                (old || []).filter((c) => c.id !== id)
            );
            return { previous };
        },
        onError: (_err: unknown, _vars: string, context: { previous?: Certificate[] } | undefined) => {
            if (context?.previous) queryClient.setQueryData(["certificates"], context.previous);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["certificates"] });
        },
    });

    const currentUserProfile = useMemo(() => {
        const profiles = profilesQuery.data || [];
        if (!user) return null;
        return (profiles.find((p) => p.id === user.id) as User & Partial<Cadet>) || null;
    }, [profilesQuery.data, user]);

    const cadets = useMemo(
        () => (profilesQuery.data || []).filter((p) => p.role !== Role.ANO) as Cadet[],
        [profilesQuery.data]
    );

    const messageableUsers = useMemo(() => (profilesQuery.data || []) as (Cadet | User)[], [profilesQuery.data]);

    const value: CadetContextType = useMemo(
        () => ({
            cadets,
            allProfiles: (profilesQuery.data || []) as (User & Partial<Cadet>)[],
            currentUserProfile,
            addCadet: (c) => addCadetMutation.mutateAsync(c),
            updateCadet: (id, updates) => updateCadetMutation.mutateAsync({ id, updates }),
            deleteCadet: (id) => deleteCadetMutation.mutateAsync(id),
            certificates: certificatesQuery.data || [],
            addCertificate: (cert) => addCertificateMutation.mutateAsync(cert),
            deleteCertificate: (id) => deleteCertificateMutation.mutateAsync(id),
            getCertificates: (userId) => (certificatesQuery.data || []).filter((c) => c.userId === userId),
            messageableUsers,
            refreshProfiles: () => queryClient.invalidateQueries({ queryKey: ["profiles"] }),
            refreshCertificates: () => queryClient.invalidateQueries({ queryKey: ["certificates"] }),
            isLoading: profilesQuery.isLoading || certificatesQuery.isLoading,
            error: profilesQuery.error || certificatesQuery.error,
        }),
        [
            cadets,
            profilesQuery.data,
            certificatesQuery.data,
            addCadetMutation,
            updateCadetMutation,
            deleteCadetMutation,
            addCertificateMutation,
            deleteCertificateMutation,
            messageableUsers,
            queryClient,
            profilesQuery.isLoading,
            certificatesQuery.isLoading,
            profilesQuery.error,
            certificatesQuery.error,
            currentUserProfile,
        ]
    );

    return <CadetContext.Provider value={value}>{children}</CadetContext.Provider>;
}

export function useCadetData() {
    const context = useContext(CadetContext);
    if (!context) throw new Error("useCadetData must be used within a CadetProvider");
    return context;
}
