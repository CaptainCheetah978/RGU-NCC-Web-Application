"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { getCallerSession } from "@/lib/server-auth";
import { Certificate, Role } from "@/types";
import { CertificateRow } from "@/app/actions/profile-actions";

type ActionResult = { success: boolean; error?: string };

const ALLOWED_CERTIFICATE_TYPES: Certificate["type"][] = ["A", "B", "C", "Camp", "Award", "Other"];
const CERTIFICATE_NAME_MAX_LENGTH = 150;

export async function addCertificateAction(
    data: Pick<Certificate, "userId" | "name" | "type" | "fileData" | "uploadDate">,
    accessToken: string
): Promise<ActionResult> {
    const session = await getCallerSession(accessToken);
    if (!session) return { success: false, error: "Unauthorized." };

    const trimmedName = data.name?.trim() || "";
    if (!trimmedName) return { success: false, error: "Certificate name is required." };
    if (trimmedName.length > CERTIFICATE_NAME_MAX_LENGTH)
        return { success: false, error: `Certificate name must be ${CERTIFICATE_NAME_MAX_LENGTH} characters or fewer.` };
    if (!ALLOWED_CERTIFICATE_TYPES.includes(data.type)) return { success: false, error: "Invalid certificate type." };
    if (!data.fileData?.trim()) return { success: false, error: "Certificate file data is required." };

    if (!data.uploadDate) return { success: false, error: "Upload date is required." };
    const uploadDate = new Date(data.uploadDate);
    const uploadTimestamp = uploadDate.getTime();
    if (Number.isNaN(uploadTimestamp)) return { success: false, error: "Invalid upload date." };
    if (uploadTimestamp > Date.now()) return { success: false, error: "Upload date cannot be in the future." };
    if (session.role !== Role.ANO && data.userId !== session.userId) {
        return { success: false, error: "Forbidden: you can only upload your own certificates." };
    }

    try {
        if (session.role === Role.ANO) {
            const { error: profileError, count } = await supabaseAdmin
                .from("profiles")
                .select("id", { count: "exact", head: true })
                .eq("id", data.userId);
            if (profileError) {
                const code = (profileError as { code?: string }).code;
                if (code === "PGRST116") return { success: false, error: "User not found." };
                return { success: false, error: profileError.message };
            }
            if (!count) return { success: false, error: "User not found." };
        }

        const insertPayload: Record<string, unknown> = {
            user_id: data.userId,
            name: trimmedName,
            type: data.type,
            file_data: data.fileData,
            upload_date: uploadDate.toISOString(),
        };
        if (session.unitId) insertPayload.unit_id = session.unitId;

        let insertError;
        const { error } = await supabaseAdmin.from("certificates").insert(insertPayload);
        insertError = error;
        if (insertError && (insertError.message?.includes("unit_id") || insertError.code === '42703')) {
            delete insertPayload.unit_id;
            const { error: retry } = await supabaseAdmin.from("certificates").insert(insertPayload);
            insertError = retry;
        }
        if (insertError) return { success: false, error: insertError.message };
        return { success: true };
    } catch (e: unknown) {
        return {
            success: false,
            error: e instanceof Error ? e.message : "Unknown error",
        };
    }
}

export async function deleteCertificateAction(
    certificateId: string,
    accessToken: string
): Promise<ActionResult> {
    const session = await getCallerSession(accessToken);
    if (!session) return { success: false, error: "Unauthorized." };

    // Owner can delete their own; ANO can delete anyone's
    if (session.role !== Role.ANO) {
        const { data: cert } = await supabaseAdmin
            .from("certificates")
            .select("user_id")
            .eq("id", certificateId)
            .single();
        if (!cert || cert.user_id !== session.userId)
            return {
                success: false,
                error: "Forbidden: you can only delete your own certificates.",
            };
    }

    try {
        const { error } = await supabaseAdmin
            .from("certificates")
            .delete()
            .eq("id", certificateId);
        if (error) return { success: false, error: error.message };
        return { success: true };
    } catch (e: unknown) {
        return {
            success: false,
            error: e instanceof Error ? e.message : "Unknown error",
        };
    }
}

// ── Get Certificates ─────────────────────────────────────────────────────────

/**
 * Fetches all certificates for the caller's unit.
 */
export async function getCertificatesAction(accessToken: string): Promise<{ success: boolean; data?: CertificateRow[]; error?: string }> {
    const session = await getCallerSession(accessToken);
    if (!session) return { success: false, error: "Unauthorized." };

    try {
        // Multi-tenancy: fetch only certificates for caller's unit
        let data, error;
        if (session.unitId) {
            const result = await supabaseAdmin
                .from("certificates")
                .select("id, user_id, name, type, file_data, upload_date")
                .eq("unit_id", session.unitId);
            data = result.data; error = result.error;
        }

        // If no unitId or unit_id column error, fetch all
        if (!session.unitId || (error && (error.message?.includes("unit_id") || error.code === '42703'))) {
            const result = await supabaseAdmin
                .from("certificates")
                .select("id, user_id, name, type, file_data, upload_date");
            data = result.data; error = result.error;
        }

        if (error) return { success: false, error: error.message };
        return { success: true, data: data || [] };
    } catch (e: unknown) {
        return {
            success: false,
            error: e instanceof Error ? e.message : "Unknown error",
        };
    }
}
