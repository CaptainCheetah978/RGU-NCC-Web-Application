"use server";

import { SignJWT } from "jose";
import { getCallerSession } from "@/lib/server-auth";
import { Permissions } from "@/lib/permissions";

const TOKEN_ISSUER = "ncc-digital-id";
const TOKEN_AUDIENCE = "ncc-verifier";

const getSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("CRITICAL: JWT_SECRET is missing. Configure a dedicated signing secret; never use the Supabase service-role key.");
    }
    return new TextEncoder().encode(secret);
};

export async function generateVerificationToken(
    cadetId: string,
    accessToken?: string,
    mode: "live" | "card" = "live",
) {
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

        const jwt = await new SignJWT({ sub: cadetId, typ: "ncc-id", mode })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuer(TOKEN_ISSUER)
            .setAudience(TOKEN_AUDIENCE)
            .setIssuedAt()
            .setExpirationTime(mode === "card" ? "1y" : "30s")
            .setJti(crypto.randomUUID())
            .sign(getSecret());

        return { token: jwt };
    } catch (error) {
        console.error("JWT Generation Error:", error);
        return { error: "Failed to generate security token" };
    }
}
