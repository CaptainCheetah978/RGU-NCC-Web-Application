"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Role } from "@/types";
import { supabase } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { ensureUserProfileAction, getProfileByIdAction } from "@/app/actions/profile-actions";

interface AuthContextType {
    user: User | null;
    login: (email: string) => Promise<void>;
    verifyOtp: (email: string, token: string, skipRedirect?: boolean) => Promise<void>;
    loginWithPassword: (email: string, pin: string) => Promise<void>;
    signupWithPassword: (email: string, pin: string, name: string, role: Role) => Promise<void>;
    logout: () => Promise<void>;
    resetPin: (email: string) => Promise<void>;
    updatePin: (newPin: string) => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    // Track whether user has been loaded at least once — prevents transient
    // null states during token refreshes from triggering login redirects.
    const userLoadedRef = React.useRef(false);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_OUT') {
                userLoadedRef.current = false;
                setUser(null);
                setIsLoading(false);
                // Hard redirect — clears all React state and re-renders from scratch
                window.location.replace('/');
                return;
            }

            // Skip redundant profile fetch if user is already loaded and this
            // is just a background token refresh.
            if (userLoadedRef.current && event === 'TOKEN_REFRESHED') {
                return;
            }

            if (session?.user) {
                // Don't flash loading spinner for background auth events —
                // only the initial load should show the spinner.
                await fetchProfile(session.user.id);
            } else {
                setUser(null);
            }
            setIsLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId: string, timeoutMs = 12000, retries = 1): Promise<User | null> => {
        // Race against a timeout so login never spins forever on a slow connection
        try {
            let data;
            try {
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
                
                data = profileResult;
            } catch (firstError) {
                // First attempt failed — retry once
                if (retries > 0) {
                    console.warn('Profile fetch attempt failed, retrying...', firstError);
                    await new Promise(r => setTimeout(r, 1500)); 
                    data = await getProfileByIdAction(userId);
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
                const appUser: User = {
                    id: data.id,
                    name: data.full_name || 'Unknown User',
                    role: (data.role as Role) || Role.CADET,
                    regimentalNumber: data.regimental_number,
                    avatarUrl: data.avatar_url,
                    unitId: data.unit_id,
                    unitName: data.unit_name,
                    unitNumber: data.unit_number,
                };
                setUser(appUser);
                userLoadedRef.current = true;
                return appUser;
            }
        } catch (error) {
            console.error('Unexpected error fetching profile:', error);
        }
        return null;
    };

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


    const loginWithPassword = async (email: string, pin: string) => {
        setIsLoading(true);
        try {
            // 1. Try with the SECURE padded PIN first (New accounts)
            const securePassword = `${pin}-ncc-rgu`;

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password: securePassword,
            });

            if (data.user) {
                // Success!
                const fetchedUser = await fetchProfile(data.user.id);
                if (!fetchedUser) throw new Error("Login succeeded but your profile could not be loaded. Please contact your ANO.");
                router.push("/dashboard");
                return;
            }

            // 2. If that failed, try with the RAW PIN (Legacy accounts created before fix)
            if (error) {
                // Secure login failed — try with the RAW PIN (Legacy accounts created before fix)

                const { data: legacyData } = await supabase.auth.signInWithPassword({
                    email,
                    password: pin, // Try raw PIN (e.g., '0324')
                });

                if (legacyData.user) {
                    // Fetch the profile FIRST while the newly-minted session is definitely valid
                    const fetchedLegacyUser = await fetchProfile(legacyData.user.id);
                    if (!fetchedLegacyUser) throw new Error("Login succeeded but your profile could not be loaded. Please contact your ANO.");

                    // Automatically upgrade their password to the secure format
                    // Doing this *after* fetching profile prevents JWT rotation race conditions
                    await supabase.auth.updateUser({ password: securePassword });

                    router.push("/dashboard");
                    return;
                }

                // If both failed, throw original error
                throw error;
            }
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
            const securePassword = `${pin}-ncc-rgu`;

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
        const securePassword = `${newPin}-ncc-rgu`;
        const { error } = await supabase.auth.updateUser({ password: securePassword });
        if (error) throw error;
    };

    return (
        <AuthContext.Provider value={{ user, login, verifyOtp, loginWithPassword, signupWithPassword, logout, resetPin, updatePin, isLoading }}>
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
