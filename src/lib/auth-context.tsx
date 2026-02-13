"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@/types";
import { MOCK_USERS } from "./mock-data";
import { useRouter } from "next/navigation";

interface AuthContextType {
    user: User | null;
    login: (userId: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check for persisted session
        const storedUserId = localStorage.getItem("ncc_app_user_id");
        if (storedUserId) {
            const foundUser = MOCK_USERS.find((u) => u.id === storedUserId);
            if (foundUser) {
                setUser(foundUser);
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (userId: string) => {
        setIsLoading(true);
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        const foundUser = MOCK_USERS.find((u) => u.id === userId);
        if (foundUser) {
            setUser(foundUser);
            localStorage.setItem("ncc_app_user_id", userId);
            router.push("/dashboard");
        }
        setIsLoading(false);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("ncc_app_user_id");
        router.push("/");
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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
