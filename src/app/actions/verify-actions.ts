"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";

export interface VerifyResult {
    found: boolean;
    error?: string;
    person?: {
        name: string;
        role: string;
        regimentalNumber?: string;
        wing?: string;
        unitNumber?: string;
        unitName?: string;
        bloodGroup?: string;
        enrollmentYear?: string;
        avatarUrl?: string;
    };
}

export async function verifyCadetById(id: string): Promise<VerifyResult> {
    if (!id || typeof id !== 'string' || id.length < 10) {
        return { found: false, error: "Invalid Cadet ID format." };
    }

    try {
        const { data, error } = await supabaseAdmin
            .from("profiles")
            .select("full_name, role, regimental_number, wing, unit_number, unit_name, blood_group, enrollment_year, avatar_url")
            .eq("id", id)
            .single();

        if (error || !data) {
            return { found: false, error: "Identity not found in database." };
        }

        return {
            found: true,
            person: {
                name: data.full_name || "Unknown",
                role: data.role || "CADET",
                regimentalNumber: data.regimental_number || undefined,
                wing: data.wing || undefined,
                unitNumber: data.unit_number || undefined,
                unitName: data.unit_name || undefined,
                bloodGroup: data.blood_group || undefined,
                enrollmentYear: data.enrollment_year?.toString() || undefined,
                avatarUrl: data.avatar_url || undefined,
            },
        };
    } catch {
        return { found: false, error: "Database connection failed." };
    }
}

import { jwtVerify } from "jose";

const getSecret = () => {
    const secret = process.env.JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!secret) {
        throw new Error("CRITICAL: JWT Security Secret is missing from environment. Production verification is disabled to prevent spoofing.");
    }
    return new TextEncoder().encode(secret);
};

export async function verifyCadetByToken(token: string): Promise<VerifyResult> {
    if (!token || typeof token !== "string") {
        return { found: false, error: "Invalid QR Token format." };
    }

    try {
        // jwtVerify validates both the signature AND the `exp` claim automatically
        const { payload } = await jwtVerify(token, getSecret(), {
            algorithms: ["HS256"],
        });

        const cadetId = payload.sub;
        if (!cadetId) {
            return { found: false, error: "Malformed Token Identity." };
        }

        // Token is valid and fresh. Complete verification by fetching user details.
        return await verifyCadetById(cadetId);
    } catch (error) {
        const err = error as Error & { code?: string };
        console.error("JWT Verification failed:", err.code || err.message);
        
        if (err.code === "ERR_JWT_EXPIRED") {
            return { 
                found: false, 
                error: "QR Code Expired. This code changes every 30 seconds to prevent screenshots. Please ask the cadet to show their live ID again." 
            };
        }
        
        return { found: false, error: "Invalid or Corrupted QR Security Signature." };
    }
}
