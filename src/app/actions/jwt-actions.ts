"use server";

import { SignJWT } from "jose";
import { getCallerSession } from "@/lib/server-auth";
import { Permissions } from "@/lib/permissions";

const getSecret = () => {
    const secret = process.env.JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!secret) {
        throw new Error("CRITICAL: JWT Security Secret is missing from environment. Production verification is disabled to prevent spoofing.");
    }
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
        const isAdmin = Permissions.CAN_MANAGE_USERS.has(caller.role);

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
