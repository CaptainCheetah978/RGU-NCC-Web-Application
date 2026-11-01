"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, Role, normalizeRole, UnitBranding } from "@/types";
import { supabase } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { ensureUserProfileAction, getProfileByIdAction } from "@/app/actions/profile-actions";
import { getUnitBrandingAction } from "@/app/actions/unit-actions";

interface AuthContextType {
    user: User | null;
    login: (email: string) => Promise<void>;
    verifyOtp: (email: string, token: string, skipRedirect?: boolean) => Promise<void>;
    loginWithPassword: (email: string | string[], pin: string) => Promise<void>;
    signupWithPassword: (email: string, pin: string, name: string, role: Role) => Promise<void>;
    logout: () => Promise<void>;
    resetPin: (email: string) => Promise<void>;
    updatePin: (newPin: string) => Promise<void>;
    isLoading: boolean;
    unitBranding: UnitBranding | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [unitBranding, setUnitBranding] = useState<UnitBranding | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    // Track whether user has been loaded at least once — prevents transient
    // null states during token refreshes from triggering login redirects.
    const userLoadedRef = React.useRef(false);
    // Prevent concurrent profile fetches (e.g., loginWithPassword + onAuthStateChange racing)
    const isFetchingRef = React.useRef(false);

    const fetchProfile = useCallback(async (userId: string, timeoutMs = 8000, retries = 1): Promise<User | null> => {
        // Prevent concurrent fetches — if already in progress, wait for it
        if (isFetchingRef.current) return null;
        isFetchingRef.current = true;

        // Race against a timeout so login never spins forever on a slow connection
        try {
            let data: Record<string, unknown> | null = null;

            // Prefer the authenticated browser client for the caller's own
            // profile. This keeps login independent of server-only
            // service-role configuration when RLS permits self reads.
            try {
                const { data: clientProfile, error: clientProfileError } = await supabase
                    .from("profiles")
                    .select("id, full_name, role, regimental_number, avatar_url, unit_id, unit_number")
                    .eq("id", userId)
                    .maybeSingle();

                if (!clientProfileError && clientProfile) {
                    data = clientProfile as Record<string, unknown>;
                }
            } catch (clientError) {
                console.warn("Authenticated profile read failed; trying server profile action:", clientError);
            }

            if (!data) try {
                // RACE AGAINST TIMEOUT
                const timeoutPromise = new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('Profile fetch timed out')), timeoutMs)
                );

                // BYPASS RLS LOOP: Call the server action instead of the client-side select.
                // This ensures we always get the profile, even if RLS recursion is broken.
                const profileResult = await Promise.race([
                    getProfileByIdAction(userId),
                    timeoutPromise
                ]);
                
                if (!profileResult && retries > 0) {
                    throw new Error("Empty profile result"); // Trigger retry
                }
                
                data = (profileResult as Record<string, unknown> | null) ?? null;
            } catch (firstError) {
                // First attempt failed — retry once
                if (retries > 0) {
                    console.warn('Profile fetch attempt failed, retrying...', firstError);
                    await new Promise(r => setTimeout(r, 1500)); 
                    data = (await getProfileByIdAction(userId)) as Record<string, unknown> | null;
                } else {
                    throw firstError;
                }
            }

            if (!data) {
                // Profile not found, but user is authenticated.
                // Attempt to create a default profile (self-healing)
                try {
                    const { data: { session: activeSession } } = await supabase.auth.getSession();
                    if (activeSession?.access_token) {
                        data = await ensureUserProfileAction(activeSession.access_token);
                    }
                } catch (createError) {
                    console.error("Failed to auto-create profile via action:", createError);
                }
            }

            if (data) {
                // Map Supabase profile to our App User type
                const profileData = data as Record<string, unknown>;
                const appUser: User = {
                    id: profileData.id as string,
                    name: (profileData.full_name as string) || 'Unknown User',
                    role: normalizeRole(profileData.role as string),
                    regimentalNumber: profileData.regimental_number as string | undefined,
                    avatarUrl: profileData.avatar_url as string | undefined,
                    unitId: profileData.unit_id as string | undefined,
                    unitNumber: profileData.unit_number as string | undefined,
                    unitBranding: profileData.unit as UnitBranding | undefined,
                };
                setUser(appUser);
                // Keep global branding in sync with the logged-in user's unit
                if (appUser.unitBranding) {
                    setUnitBranding(appUser.unitBranding);
                }
                userLoadedRef.current = true;
                return appUser;
            }
        } catch (error) {
            console.error('Unexpected error fetching profile:', error);
        } finally {
            isFetchingRef.current = false;
        }
        return null;
    }, []);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_OUT') {
                userLoadedRef.current = false;
                isFetchingRef.current = false;
                setUser(null);
                setIsLoading(false);
                window.location.replace('/');
                return;
            }

            if (userLoadedRef.current && (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN')) {
                setIsLoading(false);
                return;
            }

            if (isFetchingRef.current) return;

            if (session?.user) {
                await fetchProfile(session.user.id);
            } else {
                setUser(null);
                if (!unitBranding) {
                    const branding = await getUnitBrandingAction();
                    setUnitBranding(branding);
                }
            }
            setIsLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [fetchProfile, unitBranding]);

    const login = async (email: string) => {
        setIsLoading(true);
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                shouldCreateUser: false, // Only allow existing users to sign in? Or true for new ones?
                // For this ERP, maybe we want true, but roles default to CADET
            }
        });

        if (error) {
            console.error("Login error:", error);
            setIsLoading(false);
            throw error;
        }
        // OTP sent, UI should show OTP input
        setIsLoading(false);
    };

    const verifyOtp = async (email: string, token: string, skipRedirect: boolean = false) => {
        setIsLoading(true);
        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'email',
        });

        if (error) {
            setIsLoading(false);
            throw error;
        }

        if (data.user) {
            const fetchedUser = await fetchProfile(data.user.id);
            if (!skipRedirect) {
                if (fetchedUser) {
                    router.push("/dashboard");
                } else {
                    throw new Error("Login succeeded but your profile could not be loaded. Please contact your ANO.");
                }
            }
        }
        setIsLoading(false);
    };

    const logout = async () => {
        try {
            // 'global' scope invalidates the server-side token, not just local storage.
            // The redirect is handled by the SIGNED_OUT event in onAuthStateChange above,
            // so we don't race the redirect against any pending realtime events here.
            await supabase.auth.signOut({ scope: 'global' });
        } catch (error) {
            console.error("Error signing out:", error);
            // If signOut itself fails, force a hard redirect anyway
            window.location.replace('/');
        }
    };


    const loginWithPassword = async (emails: string | string[], pin: string) => {
        setIsLoading(true);
        try {
            const securePassword = `${pin}-ncc-auth`;
            const candidateEmails = Array.isArray(emails) ? emails : [emails];
            let lastError: unknown = new Error("Invalid credentials.");

            for (const email of candidateEmails) {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password: securePassword,
                });

                if (data.user) {
                    const fetchedUser = await fetchProfile(data.user.id);
                    if (!fetchedUser) throw new Error("Login succeeded but your profile could not be loaded. Please contact your ANO.");
                    router.push("/dashboard");
                    return;
                }

                lastError = error || lastError;

                const { data: legacyData, error: legacyError } = await supabase.auth.signInWithPassword({
                    email,
                    password: pin,
                });

                if (legacyData.user) {
                    const fetchedLegacyUser = await fetchProfile(legacyData.user.id);
                    if (!fetchedLegacyUser) throw new Error("Login succeeded but your profile could not be loaded. Please contact your ANO.");
                    await supabase.auth.updateUser({ password: securePassword });
                    router.push("/dashboard");
                    return;
                }

                lastError = legacyError || lastError;
            }

            throw lastError;
        } catch (error) {
            console.error("Login error:", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const signupWithPassword = async (email: string, pin: string, name: string, role: Role) => {
        setIsLoading(true);
        try {
            // Salt/Pad the PIN to meet Supabase's 6-char requirement
            const securePassword = `${pin}-ncc-auth`;

            const { data, error } = await supabase.auth.signUp({
                email,
                password: securePassword,
                options: {
                    data: {
                        full_name: name,
                        role: role,
                    }
                }
            });

            if (error) throw error;

            if (data.user) {
                const { data: { session: activeSession } } = await supabase.auth.getSession();
                if (activeSession?.access_token) {
                    // Use server action (admin client) to create the profile, bypassing RLS
                    await ensureUserProfileAction(activeSession.access_token);
                }
                const fetchedUser = await fetchProfile(data.user.id);
                if (!fetchedUser) throw new Error("Signup succeeded but your profile could not be loaded. Please contact your ANO.");
                router.push("/dashboard");
            }
        } catch (error) {
            console.error("Signup error:", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const resetPin = async (email: string) => {
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: { shouldCreateUser: false }
        });
        if (error) throw error;
    };

    const updatePin = async (newPin: string) => {
        const securePassword = `${newPin}-ncc-auth`;
        const { error } = await supabase.auth.updateUser({ password: securePassword });
        if (error) throw error;
    };

    return (
        <AuthContext.Provider value={{ user, login, verifyOtp, loginWithPassword, signupWithPassword, logout, resetPin, updatePin, isLoading, unitBranding }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
