"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { jwtVerify } from "jose";

const TOKEN_ISSUER = "ncc-digital-id";
const TOKEN_AUDIENCE = "ncc-verifier";

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
        avatarUrl?: string;
    };
}

async function getPublicProfile(id: string): Promise<VerifyResult> {
    try {
        const { data, error } = await supabaseAdmin
            .from("profiles")
            .select("full_name, role, regimental_number, wing, unit_number, unit_name, avatar_url, status")
            .eq("id", id)
            .single();

        if (error || !data || data.status === "alumni" || data.status === "inactive") {
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
                avatarUrl: data.avatar_url || undefined,
            },
        };
    } catch {
        return { found: false, error: "Database connection failed." };
    }
}

const getSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("CRITICAL: JWT_SECRET is missing.");
    }
    return new TextEncoder().encode(secret);
};

export async function verifyCadetByToken(token: string): Promise<VerifyResult> {
    if (!token || typeof token !== "string") {
        return { found: false, error: "Invalid QR Token format." };
    }

    try {
        // jwtVerify validates the signature, expiry, issuer, and audience.
        const { payload } = await jwtVerify(token, getSecret(), {
            algorithms: ["HS256"],
            issuer: TOKEN_ISSUER,
            audience: TOKEN_AUDIENCE,
        });

        const cadetId = payload.sub;
        if (!cadetId || payload.typ !== "ncc-id" || (payload.mode !== "live" && payload.mode !== "card")) {
            return { found: false, error: "Malformed Token Identity." };
        }

        return await getPublicProfile(cadetId);
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
