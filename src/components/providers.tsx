"use client";

import { AuthProvider } from "@/lib/auth-context";
import { CadetProvider } from "@/lib/cadet-context";
import { CommunicationProvider } from "@/lib/communication-context";
import { TrainingProvider } from "@/lib/training-context";
import { ActivityProvider } from "@/lib/activity-context";
import { ThemeProvider } from "@/lib/theme-context";
import { ToastProvider } from "@/lib/toast-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <ToastProvider>
                <QueryClientProvider client={queryClient}>
                    <AuthProvider>
                        <CadetProvider>
                            <TrainingProvider>
                                <CommunicationProvider>
                                    <ActivityProvider>{children}</ActivityProvider>
                                </CommunicationProvider>
                            </TrainingProvider>
                        </CadetProvider>
                    </AuthProvider>
                </QueryClientProvider>
            </ToastProvider>
        </ThemeProvider>
    );
}
