"use server";

import { SignJWT } from "jose";
import { getCallerSession } from "@/lib/server-auth";

const getSecret = () => {
    // In production, use a dedicated JWT_SECRET.
    // Fallback to SUPABASE_SERVICE_ROLE_KEY to avoid breaking existing deployments without extra setup.
    const secret = process.env.JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "fallback_dev_secret_only";
    return new TextEncoder().encode(secret);
};

export async function generateVerificationToken(cadetId: string, accessToken?: string) {
    if (!cadetId) {
        return { error: "Missing cadet ID" };
    }

    try {
        // Essential Security Check: Ensure the user requesting the token IS the cadet,
        // or has admin/ANO rights. We verify the session server-side.
        const caller = await getCallerSession(accessToken);
        if (!caller) {
            return { error: "Unauthorized" };
        }

        const isOwner = caller.userId === cadetId;
        const isAdmin = ["ANO", "SUO"].includes(caller.role);

        if (!isOwner && !isAdmin) {
            return { error: "Forbidden: Cannot generate token for another user" };
        }

        // Generate a cryptographically secure token valid for 30 seconds
        const jwt = await new SignJWT({ sub: cadetId })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime("30s")
            .setJti(crypto.randomUUID()) // Unique nonce
            .sign(getSecret());

        return { token: jwt };
    } catch (error) {
        console.error("JWT Generation Error:", error);
        return { error: "Failed to generate security token" };
    }
}
