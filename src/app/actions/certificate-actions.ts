"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { getCallerSession } from "@/lib/server-auth";
import { Certificate, Role } from "@/types";

type ActionResult = { success: boolean; error?: string };

const ALLOWED_CERTIFICATE_TYPES: Certificate["type"][] = ["A", "B", "C", "Camp", "Award", "Other"];

export async function addCertificateAction(
    data: Pick<Certificate, "userId" | "name" | "type" | "fileData" | "uploadDate">,
    accessToken: string
): Promise<ActionResult> {
    const session = await getCallerSession(accessToken);
    if (!session) return { success: false, error: "Unauthorized." };

    if (!data.name?.trim()) return { success: false, error: "Certificate name is required." };
    if (!ALLOWED_CERTIFICATE_TYPES.includes(data.type)) return { success: false, error: "Invalid certificate type." };
    if (session.role !== Role.ANO && data.userId !== session.userId) {
        return { success: false, error: "Forbidden: you can only upload your own certificates." };
    }

    try {
        const { error } = await supabaseAdmin.from("certificates").insert({
            user_id: data.userId,
            name: data.name.trim(),
            type: data.type,
            file_data: data.fileData,
            upload_date: data.uploadDate,
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
