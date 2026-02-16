"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Role } from "@/types";
import { supabase } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";

interface AuthContextType {
    user: User | null;
    login: (email: string) => Promise<void>;
    verifyOtp: (email: string, token: string) => Promise<void>;
    loginWithPassword: (email: string, pin: string) => Promise<void>;
    signupWithPassword: (email: string, pin: string, name: string, role: Role) => Promise<void>;
    logout: () => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const initializeAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                await fetchProfile(session.user.id);
            } else {
                setUser(null);
            }
            setIsLoading(false);
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                await fetchProfile(session.user.id);
            } else {
                setUser(null);
                // Only redirect if specifically logging out or session expired while on a protected route
                // We let the middleware or page components handle specific redirects
            }
            setIsLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId: string) => {
        try {
            let { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error && error.code === 'PGRST116') {
                // Profile not found, but user is authenticated. 
                // Attempt to create a default profile (self-healing)
                console.log("Profile missing, attempting to create default profile...");

                // Fetch the user email/metadata from auth to help populate
                const { data: { user: authUser } } = await supabase.auth.getUser();

                if (authUser) {
                    const isANO = authUser.email?.startsWith('ano_') || false;

                    const { data: newProfile, error: createError } = await supabase
                        .from('profiles')
                        .insert({
                            id: userId,
                            full_name: isANO ? 'Associate NCC Officer' : 'New User',
                            role: isANO ? Role.ANO : Role.CADET,
                            email: authUser.email,
                            updated_at: new Date().toISOString(),
                        })
                        .select()
                        .single();

                    if (!createError && newProfile) {
                        data = newProfile;
                        error = null;
                    } else {
                        console.error("Failed to auto-create profile:", createError);
                    }
                }
            } else if (error) {
                console.error('Error fetching profile:', error);
                return;
            }

            if (data) {
                // Map Supabase profile to our App User type
                const appUser: User = {
                    id: data.id,
                    name: data.full_name || 'Unknown User',
                    role: (data.role as Role) || Role.CADET,
                    regimentalNumber: data.regimental_number,
                    avatarUrl: data.avatar_url,
                };
                setUser(appUser);
            }
        } catch (error) {
            console.error('Unexpected error fetching profile:', error);
        }
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

    const verifyOtp = async (email: string, token: string) => {
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
            // Check if profile exists, if not maybe create it? 
            // The SQL trigger for creating profile on user creation is not set up yet.
            // We might need to manually ensure profile exists or depend on a trigger.
            // For now, let's assume manual profile creation or we add a check here.
            await fetchProfile(data.user.id);
            router.push("/dashboard");
        }
        setIsLoading(false);
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        router.push("/");
    };

    const loginWithPassword = async (email: string, pin: string) => {
        setIsLoading(true);
        try {
            // Salt/Pad the PIN to meet Supabase's 6-char requirement
            const securePassword = `${pin}-ncc-rgu`;

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password: securePassword,
            });

            if (error) {
                throw error;
            }

            if (data.user) {
                await fetchProfile(data.user.id);
                router.push("/dashboard");
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
                const { error: profileError } = await supabase.from('profiles').upsert({
                    id: data.user.id,
                    full_name: name,
                    role: role,
                    updated_at: new Date().toISOString(),
                });

                if (profileError) {
                    console.error("Profile creation error:", profileError);
                }

                await fetchProfile(data.user.id);
                router.push("/dashboard");
            }
        } catch (error) {
            console.error("Signup error:", error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, verifyOtp, loginWithPassword, signupWithPassword, logout, isLoading }}>
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
