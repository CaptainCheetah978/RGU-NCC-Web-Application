"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { getCallerSession } from "@/lib/server-auth";
import { Certificate, Role } from "@/types";

type ActionResult = { success: boolean; error?: string };

const ALLOWED_CERTIFICATE_TYPES: Certificate["type"][] = ["A", "B", "C", "Camp", "Award", "Other"];
const MAX_CERTIFICATE_NAME_LENGTH = 150;

export async function addCertificateAction(
    data: Pick<Certificate, "userId" | "name" | "type" | "fileData" | "uploadDate">,
    accessToken: string
): Promise<ActionResult> {
    const session = await getCallerSession(accessToken);
    if (!session) return { success: false, error: "Unauthorized." };

    const trimmedName = data.name?.trim() || "";
    if (!trimmedName) return { success: false, error: "Certificate name is required." };
    if (trimmedName.length > MAX_CERTIFICATE_NAME_LENGTH)
        return { success: false, error: `Certificate name must be ${MAX_CERTIFICATE_NAME_LENGTH} characters or fewer.` };
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
            const { error: profileError } = await supabaseAdmin
                .from("profiles")
                .select("id")
                .eq("id", data.userId)
                .single();
            if (profileError) {
                const code = (profileError as { code?: string }).code;
                if (code === "PGRST116") return { success: false, error: "User not found." };
                return { success: false, error: profileError.message };
            }
        }

        const { error } = await supabaseAdmin.from("certificates").insert({
            user_id: data.userId,
            name: trimmedName,
            type: data.type,
            file_data: data.fileData,
            upload_date: uploadDate.toISOString(),
        });
        if (error) return { success: false, error: error.message };
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
