"use client";

import { AuthProvider } from "@/lib/auth-context";
import { DataProvider } from "@/lib/data-context";
import { ThemeProvider } from "@/lib/theme-context";
import { ToastProvider } from "@/lib/toast-context";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <ToastProvider>
                <AuthProvider>
                    <DataProvider>{children}</DataProvider>
                </AuthProvider>
            </ToastProvider>
        </ThemeProvider>
    );
}
